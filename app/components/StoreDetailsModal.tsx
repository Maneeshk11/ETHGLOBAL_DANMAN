"use client";

import { useState, useEffect } from "react";
import { Address } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  ExternalLink,
  Store,
  Coins,
  Users,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import TokenSwapModal from "./TokenSwapModal";
import { 
  getAllProductsFromStore, 
  purchaseProductFromStore, 
  waitForTransaction,
  formatPrice,
  Product 
} from "../../lib/storeService";
import { useAccount } from "wagmi";

interface StoreInfo {
  name: string;
  description: string;
  isActive: boolean;
  tokenAddress: Address;
  tokenBalance?: bigint;
  tokenTotalSupply?: bigint;
  createdAt?: bigint;
}

interface StoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeAddress: Address;
  ownerAddress: Address;
  storeInfo?: {
    name: string;
    description: string;
    isActive: boolean;
    tokenAddress: Address;
  };
}

export default function StoreDetailsModal({
  isOpen,
  onClose,
  storeAddress,
  ownerAddress,
  storeInfo,
}: StoreDetailsModalProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<StoreInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Swap modal state
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  
  // Purchase state
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchasingProductId, setPurchasingProductId] = useState<bigint | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState<{[key: string]: number}>({});
  const [purchaseTxHash, setPurchaseTxHash] = useState<string | null>(null);

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Load detailed store information when modal opens
  useEffect(() => {
    if (isOpen && storeAddress) {
      loadDetailedStoreInfo();
      loadProducts();
    }
  }, [isOpen, storeAddress]);

  const loadDetailedStoreInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get detailed store info - but gracefully handle RPC limitations
      const { getStoreInfoByAddress } = await import("../../lib/storeService");
      const info = await getStoreInfoByAddress(storeAddress);
      console.log("✅ Successfully loaded detailed store info:", info);
      setDetailedInfo(info);
    } catch (err) {
      console.warn(
        "⚠️ Could not load detailed store info due to RPC limitations:",
        err
      );
      setError(
        "Some store details unavailable due to RPC provider limitations"
      );

      // Use the basic info we already have as fallback
      if (storeInfo) {
        setDetailedInfo({
          name: storeInfo.name,
          description: storeInfo.description,
          isActive: storeInfo.isActive,
          tokenAddress: storeInfo.tokenAddress,
          // Don't try to get tokenBalance or tokenTotalSupply that might fail
        });
      } else {
        // If no basic info either, create minimal fallback
        setDetailedInfo({
          name: "Store Details",
          description: "Store information limited due to RPC constraints",
          isActive: true,
          tokenAddress: "0x0000000000000000000000000000000000000000" as Address,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    setProductError(null);

    try {
      console.log("🛒 Loading products for store:", storeAddress);
      const storeProducts = await getAllProductsFromStore(storeAddress);
      setProducts(storeProducts);
      console.log(`✅ Loaded ${storeProducts.length} products`);
    } catch (err) {
      console.error("❌ Failed to load products:", err);
      setProductError("Failed to load products from this store");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handlePurchase = async (product: Product, quantity: number) => {
    if (!address || quantity <= 0) return;

    setIsPurchasing(true);
    setPurchasingProductId(product.id);
    setPurchaseTxHash(null);

    try {
      console.log("🛒 Purchasing product:", {
        productId: product.id.toString(),
        quantity,
        price: product.price.toString(),
        totalCost: (product.price * BigInt(quantity)).toString(),
      });

      const hash = await purchaseProductFromStore(
        storeAddress,
        product.id,
        BigInt(quantity),
        address
      );

      setPurchaseTxHash(hash);
      
      // Wait for transaction confirmation
      await waitForTransaction(hash as `0x${string}`);
      
      // Reload products to update stock
      await loadProducts();
      
      console.log("✅ Purchase completed successfully!");
    } catch (err) {
      console.error("❌ Purchase failed:", err);
    } finally {
      setIsPurchasing(false);
      setPurchasingProductId(null);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setPurchaseQuantity(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity),
    }));
  };

  const getQuantity = (productId: string): number => {
    return purchaseQuantity[productId] || 1;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBigInt = (value: bigint | undefined) => {
    if (!value) return "N/A";
    return value.toString();
  };

  const formatDate = (timestamp: bigint | undefined) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {detailedInfo?.name || storeInfo?.name || "Store Details"}
          </DialogTitle>
          <DialogDescription>
            {detailedInfo?.description ||
              storeInfo?.description ||
              "Store information and details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center gap-3">
            <Badge
              variant={
                detailedInfo?.isActive || storeInfo?.isActive
                  ? "default"
                  : "secondary"
              }
              className={`${
                detailedInfo?.isActive || storeInfo?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {detailedInfo?.isActive || storeInfo?.isActive
                ? "Active"
                : "Inactive"}
            </Badge>
            {error && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                Limited Info
              </Badge>
            )}
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="token">Token</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Store Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Store Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Contract Address:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {formatAddress(storeAddress)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(storeAddress)}
                          className="h-6 w-6 p-0"
                          aria-label="Copy contract address"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://sepolia.etherscan.io/address/${storeAddress}`,
                              "_blank"
                            )
                          }
                          className="h-6 w-6 p-0"
                          aria-label="Open contract on Etherscan"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Owner:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {formatAddress(ownerAddress)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(ownerAddress)}
                          className="h-6 w-6 p-0"
                          aria-label="Copy owner address"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://sepolia.etherscan.io/address/${ownerAddress}`,
                              "_blank"
                            )
                          }
                          className="h-6 w-6 p-0"
                          aria-label="Open owner on Etherscan"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {detailedInfo?.createdAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Created:
                        </span>
                        <span className="text-sm">
                          {formatDate(detailedInfo.createdAt)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Token Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Token Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailedInfo?.tokenAddress &&
                    detailedInfo.tokenAddress !==
                      "0x0000000000000000000000000000000000000000" ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Token Address:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {formatAddress(detailedInfo.tokenAddress)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(detailedInfo.tokenAddress)
                              }
                              className="h-6 w-6 p-0"
                              aria-label="Copy token address"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://sepolia.etherscan.io/address/${detailedInfo.tokenAddress}`,
                                  "_blank"
                                )
                              }
                              className="h-6 w-6 p-0"
                              aria-label="Open token on Etherscan"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                        {detailedInfo.tokenBalance && (
                            <Badge variant="outline" className="text-xs">
                              Balance: {formatBigInt(detailedInfo.tokenBalance)}
                            </Badge>
                        )}
                        {detailedInfo.tokenTotalSupply && (
                            <Badge variant="outline" className="text-xs">
                              Supply:{" "}
                              {(
                                Number(detailedInfo.tokenTotalSupply) /
                                10 ** 24
                              ).toFixed(2)}
                            </Badge>
                        )}
                        {!detailedInfo.tokenBalance &&
                          !detailedInfo.tokenTotalSupply && (
                              <span className="text-xs text-muted-foreground">
                                Limited token data due to RPC constraints
                              </span>
                            )}
                            </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Token information not available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="token" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Token Details</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Sepolia
                      </Badge>
                      {detailedInfo?.tokenAddress &&
                        detailedInfo.tokenAddress !==
                          "0x0000000000000000000000000000000000000000" && (
                          <Button
                            onClick={() => setIsSwapModalOpen(true)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Swap Tokens
                          </Button>
                        )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Swap between store tokens and PYUSD using Uniswap V2
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading token details...
                      </p>
                    </div>
                  ) : detailedInfo?.tokenAddress &&
                    detailedInfo.tokenAddress !==
                      "0x0000000000000000000000000000000000000000" ? (
                    <div className="space-y-4">
                      {/* Token Information Display */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Token Address:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {formatAddress(detailedInfo.tokenAddress)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(detailedInfo.tokenAddress)
                              }
                              className="h-6 w-6 p-0"
                              aria-label="Copy token address"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://sepolia.etherscan.io/address/${detailedInfo.tokenAddress}`,
                                  "_blank"
                                )
                              }
                              className="h-6 w-6 p-0"
                              aria-label="Open token on Etherscan"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {detailedInfo.tokenBalance && (
                            <Badge variant="outline" className="text-xs">
                              Balance: {formatBigInt(detailedInfo.tokenBalance)}
                            </Badge>
                          )}
                          {detailedInfo.tokenTotalSupply && (
                            <Badge variant="outline" className="text-xs">
                              Supply:{" "}
                              {(
                                Number(detailedInfo.tokenTotalSupply) /
                                10 ** 24
                              ).toFixed(2)}
                            </Badge>
                          )}
                          {!detailedInfo.tokenBalance &&
                            !detailedInfo.tokenTotalSupply && (
                              <span className="text-xs text-muted-foreground">
                                Limited token data due to RPC constraints
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Coins className="h-6 w-6 text-muted-foreground" />
                      </div>
                    <p className="text-muted-foreground">
                        Token information not available
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This store may not have a token configured yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                      Products ({products.length})
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadProducts}
                      disabled={isLoadingProducts}
                    >
                      {isLoadingProducts ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Refresh"
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Browse and purchase products from this store using PYUSD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading products...</p>
                    </div>
                  ) : productError ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-red-600 mb-2">{productError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadProducts}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">No products available</p>
                      <p className="text-sm text-muted-foreground">
                        This store hasn't added any products yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {products.map((product) => {
                        const productIdStr = product.id.toString();
                        const quantity = getQuantity(productIdStr);
                        const totalPrice = product.price * BigInt(quantity);
                        const isCurrentlyPurchasing = isPurchasing && purchasingProductId === product.id;
                        
                        return (
                          <Card key={productIdStr} className="border-2 border-border/50">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {/* Product Info */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">{product.name}</h4>
                                    <Badge variant={product.isActive ? "default" : "secondary"}>
                                      {product.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {product.stock === BigInt(0) && (
                                      <Badge variant="destructive">Out of Stock</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {product.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Price: </span>
                                      <span className="font-medium">
                                        {formatPrice(product.price)} PYUSD
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Stock: </span>
                                      <span className="font-medium">
                                        {product.stock.toString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Purchase Controls */}
                                {product.isActive && product.stock > BigInt(0) && address ? (
                                  <div className="flex flex-col gap-2 min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(productIdStr, quantity - 1)}
                                        disabled={quantity <= 1 || isCurrentlyPurchasing}
                                        className="w-8 h-8 p-0"
                                      >
                                        -
                                      </Button>
                                      <span className="w-12 text-center text-sm">
                                        {quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateQuantity(productIdStr, quantity + 1)}
                                        disabled={BigInt(quantity) >= product.stock || isCurrentlyPurchasing}
                                        className="w-8 h-8 p-0"
                                      >
                                        +
                                      </Button>
                                    </div>
                                    <div className="text-center text-sm">
                                      <span className="text-muted-foreground">Total: </span>
                                      <span className="font-medium">
                                        {formatPrice(totalPrice)} PYUSD
                                      </span>
                                    </div>
                                    <Button
                                      onClick={() => handlePurchase(product, quantity)}
                                      disabled={isCurrentlyPurchasing}
                                      size="sm"
                                      className="w-full"
                                    >
                                      {isCurrentlyPurchasing ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          Purchasing...
                                        </>
                                      ) : (
                                        <>
                                          <ShoppingCart className="h-4 w-4 mr-2" />
                                          Buy Now
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ) : !address ? (
                                  <div className="min-w-[200px] text-center text-sm text-muted-foreground">
                                    Connect wallet to purchase
                                  </div>
                                ) : (
                                  <div className="min-w-[200px] text-center text-sm text-muted-foreground">
                                    {!product.isActive && "Product inactive"}
                                    {product.stock === BigInt(0) && "Out of stock"}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Purchase Transaction Status */}
                  {purchaseTxHash && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Purchase in progress...</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {purchaseTxHash.slice(0, 10)}...{purchaseTxHash.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics tab removed */}
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://sepolia.etherscan.io/address/${storeAddress}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Etherscan
              </Button>
              <Button>Shop Now</Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Token Swap Modal */}
      {detailedInfo?.tokenAddress &&
        detailedInfo.tokenAddress !==
          "0x0000000000000000000000000000000000000000" && (
          <TokenSwapModal
            isOpen={isSwapModalOpen}
            onClose={() => setIsSwapModalOpen(false)}
            storeTokenAddress={detailedInfo.tokenAddress}
          />
        )}
    </Dialog>
  );
}

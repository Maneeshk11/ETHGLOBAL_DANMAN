"use client";

import { useAccount } from "wagmi";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletHeader } from "../components/WalletHeader";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CreateProductModal } from "../components/CreateProductModal";
// Token functionality removed - now focuses on product management
import { Address } from "viem";
import {
  getOwnerStores,
  createStoreViaFactory,
} from "../../lib/retailFactoryService";
import {
  initializeStoreAtAddress,
  getStoreInfoByAddress,
  StoreInfo,
  getAllProductsFromStore,
  Product,
  getUserTokenBalance,
} from "../../lib/storeService";
import { toast } from "sonner";
import StoreInitializationModal from "../components/StoreInitializationModal";
import ProductCreationModal from "../components/ProductCreationModal";

export default function DashboardPage() {
  const { isConnected, isConnecting, address } = useAccount();
  const router = useRouter();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Products state
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Store management state
  const [userStores, setUserStores] = useState<Address[]>([]);
  const [selectedStore, setSelectedStore] = useState<Address | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [isLoadingStoreInfo, setIsLoadingStoreInfo] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState<bigint | null>(null);
  const [isLoadingUserBalance, setIsLoadingUserBalance] = useState(false);

  // Store creation modal state
  const [showInitModal, setShowInitModal] = useState(false);

  // Product creation modal state
  const [showProductModal, setShowProductModal] = useState(false);

  const handleSignup = () => {
    router.push("/onboarding");
  };

  const handleProductSuccess = (productId: number) => {
    console.log("Product created successfully:", productId);
    // Refresh the product list and balances if a store is selected
    if (selectedStore) {
      loadStoreProducts();
      loadUserTokenBalance(selectedStore);
    }
  };

  const loadUserStores = async () => {
    if (!address) return;

    try {
      setIsLoadingStores(true);
      const stores = await getOwnerStores(address);
      setUserStores(stores);

      // Auto-select first store if none selected
      if (stores.length > 0 && !selectedStore) {
        setSelectedStore(stores[0]);
      }

      console.log(`📋 User has ${stores.length} stores:`, stores);
    } catch (error) {
      console.error("Error loading user stores:", error);
      toast.error("Failed to load your stores");
    } finally {
      setIsLoadingStores(false);
    }
  };

  const handleCreateNewStore = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    // Open modal to collect store data first
    setShowInitModal(true);
  };

  const loadStoreInfo = async (storeAddress: Address) => {
    try {
      setIsLoadingStoreInfo(true);
      console.log("📊 Loading store info for:", storeAddress);
      const info = await getStoreInfoByAddress(storeAddress);
      setStoreInfo(info);
      console.log("✅ Store info loaded:", info);
    } catch (error) {
      console.error("❌ Error loading store info:", error);
      toast.error("Failed to load store information");
      setStoreInfo(null);
    } finally {
      setIsLoadingStoreInfo(false);
    }
  };

  const loadUserTokenBalance = async (storeAddress: Address) => {
    if (!address) return;

    try {
      setIsLoadingUserBalance(true);
      console.log("💰 Loading user token balance for store:", storeAddress);
      const balance = await getUserTokenBalance(storeAddress, address);
      setUserTokenBalance(balance);
      console.log("✅ User token balance loaded:", balance.toString());
    } catch (error) {
      console.error("❌ Error loading user token balance:", error);
      // Don't show error toast for balance - it's not critical
      setUserTokenBalance(null);
    } finally {
      setIsLoadingUserBalance(false);
    }
  };

  const handleStoreInitialized = async (storeAddress: Address) => {
    // Refresh stores and select the new one
    await loadUserStores();
    setSelectedStore(storeAddress);
  };

  const loadStoreProducts = async () => {
    if (!selectedStore) return;

    setIsLoadingProducts(true);
    try {
      const products = await getAllProductsFromStore(selectedStore);
      setStoreProducts(products);
    } catch (error) {
      console.error("Failed to load store products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Load user stores when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadUserStores();
    }
  }, [isConnected, address]);

  // Load store info when selectedStore changes
  useEffect(() => {
    if (selectedStore) {
      loadStoreInfo(selectedStore);
      loadStoreProducts();
      loadUserTokenBalance(selectedStore);
    } else {
      setStoreInfo(null);
      setStoreProducts([]);
      setUserTokenBalance(null);
    }
  }, [selectedStore, address]);

  // Product creation success is handled in the modal callback

  // Show login interface when not connected
  if (!isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header without wallet info */}
        <WalletHeader title="Block Bazaar" />

        {/* Login Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Welcome to Block Bazaar
                </CardTitle>
                <CardDescription>
                  Connect your wallet or create an account to get started with
                  your retail token business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-3">
                  {/* Connect Wallet Button */}
                  <div className="flex justify-center">
                    <DynamicWidget />
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  {/* Signup Button */}
                  <Button
                    onClick={handleSignup}
                    variant="outline"
                    className="w-full"
                  >
                    Sign Up for Block Bazaar
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>New to crypto? No problem!</p>
                  <p>Our onboarding will guide you through the process.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Show connecting state
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-background">
        <WalletHeader title="Block Bazaar Dashboard" />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p>Connecting wallet...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard content for connected users
  return (
    <div className="min-h-screen bg-background">
      {/* Header with wallet info */}
      <WalletHeader title="Block Bazaar Dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Store Selector */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Current Store</CardTitle>
                  <CardDescription>
                    Select a store to manage or create a new one
                  </CardDescription>
                </div>
                <Button onClick={handleCreateNewStore} size="sm">
                  + New Store
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Select
                    value={selectedStore || ""}
                    onValueChange={(value) => {
                      const storeAddress = value as Address;
                      setSelectedStore(storeAddress);
                    }}
                    disabled={isLoadingStores || userStores.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingStores
                            ? "Loading stores..."
                            : userStores.length === 0
                            ? "No stores found - create your first store"
                            : "Select a store"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {userStores.map((storeAddress, index) => (
                        <SelectItem key={storeAddress} value={storeAddress}>
                          <div className="flex items-center gap-2">
                            <span>Store #{index + 1}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {storeAddress.slice(0, 6)}...
                              {storeAddress.slice(-4)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedStore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/address/${selectedStore}`,
                        "_blank"
                      )
                    }
                  >
                    View on Explorer
                  </Button>
                )}
              </div>
              {selectedStore && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Selected Store:
                  </p>
                  <p className="font-mono text-sm">{selectedStore}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Success messages are now handled by toast notifications */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Store Details Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              {selectedStore && storeInfo && !isLoadingStoreInfo ? (
                <>
                  <CardTitle className="flex items-center gap-2">
                    🏪 {storeInfo.name}
                    {storeInfo.isActive ? (
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{storeInfo.description}</CardDescription>
                </>
              ) : selectedStore && isLoadingStoreInfo ? (
                <>
                  <CardTitle>🔄 Loading Store Details...</CardTitle>
                  <CardDescription>
                    Fetching information for your selected store
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle>Welcome to Your Block Bazaar! 🎉</CardTitle>
                  <CardDescription>
                    Select a store above to view its details, or create your
                    first store to get started.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {selectedStore && storeInfo && !isLoadingStoreInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Store Token
                      </div>
                      <div className="font-mono text-xs mt-1 break-all">
                        {storeInfo.tokenAddress}
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Your Token Balance
                      </div>
                      <div className="text-lg font-semibold">
                        {isLoadingUserBalance ? (
                          <span className="text-muted-foreground">
                            Loading...
                          </span>
                        ) : userTokenBalance !== null ? (
                          <>
                            {(Number(userTokenBalance) / 10 ** 18).toFixed(2)}{" "}
                            tokens
                          </>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </div>
                    </div>
                    {storeInfo.tokenTotalSupply && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Total Token Supply
                        </div>
                        <div className="text-lg font-semibold">
                          {(
                            Number(storeInfo.tokenTotalSupply) /
                            10 ** 18
                          ).toFixed(2)}{" "}
                          tokens
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Store Token Reserve
                      </div>
                      <div className="text-lg font-semibold">
                        {(Number(storeInfo.tokenBalance) / 10 ** 18).toFixed(2)}{" "}
                        tokens
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Available for distribution
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        Created
                      </div>
                      <div className="text-sm">
                        {new Date(
                          Number(storeInfo.createdAt) * 1000
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => setShowProductModal(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      🛒 Add Product
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://sepolia.etherscan.io/address/${selectedStore}`,
                          "_blank"
                        )
                      }
                      size="sm"
                    >
                      View on Explorer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://sepolia.etherscan.io/address/${storeInfo.tokenAddress}`,
                          "_blank"
                        )
                      }
                      size="sm"
                    >
                      View Token
                    </Button>
                  </div>
                </div>
              ) : selectedStore ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setIsProductModalOpen(true)}>
                    Add New Product
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select a store from the dropdown above to manage products
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoadingProducts ? "..." : storeProducts.length}
              </div>
              <p className="text-muted-foreground text-sm">
                {storeProducts.length === 0
                  ? "No products added yet"
                  : "Products in store"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-500">
                {selectedStore ? "Active" : "No Store Selected"}
              </div>
              <p className="text-muted-foreground text-sm">
                {selectedStore
                  ? "Store is ready for business"
                  : "Select or create a store"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {storeProducts.filter((product) => product.isActive).length}
              </div>
              <p className="text-muted-foreground text-sm">
                Products available for sale
              </p>
            </CardContent>
          </Card>

          {/* Store Products */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Store Products</CardTitle>
              <CardDescription>
                {selectedStore
                  ? `Products available in your ${
                      storeInfo?.name || "selected"
                    } store`
                  : "Select a store to view its products"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedStore ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please select a store to view its products.</p>
                  <p className="text-sm">
                    Use the dropdown above to choose a store or create a new
                    one.
                  </p>
                </div>
              ) : isLoadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading products...</span>
                </div>
              ) : storeProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No products in this store yet.</p>
                  <p className="text-sm">
                    Click &quot;🛒 Add Product&quot; to add your first product!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {storeProducts.map((product) => (
                    <Card
                      key={product.id.toString()}
                      className="border-green-500/20"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {product.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Price:</span>
                          <span className="font-semibold">
                            {(Number(product.price) / 10 ** 18).toFixed(3)}{" "}
                            tokens
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Stock:</span>
                          <span>{product.stock.toString()} units</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <span
                            className={
                              product.isActive
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Product ID: {product.id.toString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Product Modal */}
      {selectedStore && (
        <CreateProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSuccess={handleProductSuccess}
          storeAddress={selectedStore}
          storeName={storeInfo?.name}
        />
      )}

      {/* Store Creation Modal */}
      <StoreInitializationModal
        isOpen={showInitModal}
        onClose={() => setShowInitModal(false)}
        onSuccess={handleStoreInitialized}
        walletAddress={address!}
      />

      {/* Product Creation Modal */}
      {selectedStore && (
        <ProductCreationModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSuccess={() => {
            // Refresh product list after adding a new product
            loadStoreProducts();
            toast.success("Product added to your store!");
          }}
          storeAddress={selectedStore}
          walletAddress={address!}
          storeInfo={storeInfo || undefined}
        />
      )}
    </div>
  );
}

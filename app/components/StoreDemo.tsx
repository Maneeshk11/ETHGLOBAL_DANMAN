"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getStoreInfo,
  getStoreOwner,
  getContractTokenBalance,
  getTotalRevenue,
  getNextProductId,
  addProduct,
  getProduct,
  formatPrice,
  parsePrice,
  waitForTransaction,
  type StoreInfo,
  type Product,
} from "../../lib/storeService";
import { toast } from "sonner";

export default function StoreDemo() {
  const { address, isConnected } = useAccount();
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const [productId, setProductId] = useState<string>("");
  const [productDetails, setProductDetails] = useState<Product | null>(null);

  // Product list states
  const [totalProductCount, setTotalProductCount] = useState<number>(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load store info and products on component mount
  useEffect(() => {
    loadStoreInfo();
    loadAllProducts();
  }, []);

  const loadStoreInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const info = await getStoreInfo();
      setStoreInfo(info);

      console.log("Store Info:", info);
    } catch (err) {
      console.error("Error loading store info:", err);
      setError("Failed to load store info. Store might not be initialized.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      setLoadingProducts(true);
      setError(null);

      const startTime = performance.now();

      // Get the next product ID to determine total count
      const nextId = await getNextProductId();
      const count = Number(nextId) - 1; // Total products = nextId - 1
      setTotalProductCount(count);

      if (count === 0) {
        setAllProducts([]);
        console.log("📦 No products to load");
        return;
      }

      console.log(`📦 Loading ${count} products in parallel...`);

      // Create array of promises to fetch all products simultaneously
      const productPromises = [];
      for (let i = 1; i <= count; i++) {
        productPromises.push(
          getProduct(BigInt(i))
            .then((product) => ({ success: true, product, id: i }))
            .catch((err) => ({ success: false, error: err, id: i }))
        );
      }

      // Execute all promises in parallel
      const results = await Promise.all(productPromises);

      // Process results and extract successful products
      const products: Product[] = [];
      let failedCount = 0;

      results.forEach((result) => {
        if (result.success && "product" in result) {
          products.push(result.product);
          console.log(`✅ Loaded product ${result.id}:`, result.product);
        } else if (!result.success && "error" in result) {
          failedCount++;
          console.warn(`❌ Failed to load product ${result.id}:`, result.error);
        }
      });

      setAllProducts(products);

      const endTime = performance.now();
      const loadTime = (endTime - startTime).toFixed(2);

      console.log(
        `🎉 Loaded ${products.length} products successfully in ${loadTime}ms${
          failedCount > 0 ? ` (${failedCount} failed)` : ""
        }`
      );

      if (failedCount > 0) {
        toast.warning(`Loaded ${products.length} products`, {
          description: `${failedCount} products failed to load`,
        });
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const price = parsePrice(productForm.price);
      const stock = BigInt(productForm.stock);

      const hash = await addProduct(
        productForm.name,
        productForm.description,
        price,
        stock,
        address
      );

      console.log("Add product transaction:", hash);

      // Show loading toast with transaction hash
      const loadingToast = toast.loading(
        `Adding product "${productForm.name}"...`,
        {
          description: `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
          duration: Infinity,
        }
      );

      // Wait for transaction confirmation
      try {
        console.log("⏳ Waiting for transaction confirmation...");
        const receipt = await waitForTransaction(hash as `0x${string}`);
        console.log("✅ Transaction confirmed!", receipt);

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(`Product "${productForm.name}" added successfully!`, {
          description: `Transaction confirmed in block ${receipt.blockNumber}`,
          action: {
            label: "View on Explorer",
            onClick: () =>
              window.open(`https://sepolia.etherscan.io/tx/${hash}`, "_blank"),
          },
        });

        // Clear form and refresh products list
        setProductForm({ name: "", description: "", price: "", stock: "" });

        // Refresh the products list to show the new product
        loadAllProducts();
      } catch (confirmError) {
        console.error("❌ Transaction confirmation failed:", confirmError);

        // Dismiss loading toast and show error
        toast.dismiss(loadingToast);

        // Check if it's a revert error for more specific messaging
        const errorMessage =
          confirmError instanceof Error
            ? confirmError.message
            : String(confirmError);
        const isRevertError =
          errorMessage.includes("reverted") ||
          errorMessage.includes("execution failed");

        toast.error(
          isRevertError ? "Contract execution failed" : "Transaction failed",
          {
            description: isRevertError
              ? "The transaction was mined but the smart contract execution was reverted. Check the contract requirements."
              : errorMessage,
            action: {
              label: "View on Explorer",
              onClick: () =>
                window.open(
                  `https://sepolia.etherscan.io/tx/${hash}`,
                  "_blank"
                ),
            },
          }
        );
      }
    } catch (err) {
      console.error("Error adding product:", err);

      // Show error toast for transaction submission failure
      toast.error("Failed to submit transaction", {
        description: err instanceof Error ? err.message : String(err),
      });

      setError(`Failed to add product: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const id = BigInt(productId);
      const product = await getProduct(id);
      setProductDetails(product);

      console.log("Product Details:", product);
    } catch (err) {
      console.error("Error getting product:", err);
      setError(`Failed to get product: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Demo</CardTitle>
          <CardDescription>
            Please connect your wallet to interact with the store contract
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Store Contract Demo</CardTitle>
          <CardDescription>
            Test your store contract functions on Sepolia:
            0x85d6F0f1b61992d18AF39ebd520b5209418900a3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={loadStoreInfo} disabled={loading}>
              {loading ? "Loading..." : "Refresh Store Info"}
            </Button>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {storeInfo && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <h3 className="font-bold">Store Information:</h3>
                <p>
                  <strong>Name:</strong> {storeInfo.name}
                </p>
                <p>
                  <strong>Description:</strong> {storeInfo.description}
                </p>
                <p>
                  <strong>Token Address:</strong> {storeInfo.tokenAddress}
                </p>
                <p>
                  <strong>Token Balance:</strong>{" "}
                  {storeInfo.tokenBalance.toString()}
                </p>
                <p>
                  <strong>Active:</strong> {storeInfo.isActive ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(
                    Number(storeInfo.createdAt) * 1000
                  ).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Product */}
      <Card>
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
          <CardDescription>Add a new product to your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                placeholder="Product Name"
              />
            </div>
            <div>
              <Label htmlFor="productPrice">Price (ETH)</Label>
              <Input
                id="productPrice"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: e.target.value })
                }
                placeholder="0.1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="productDescription">Description</Label>
            <Textarea
              id="productDescription"
              value={productForm.description}
              onChange={(e) =>
                setProductForm({ ...productForm, description: e.target.value })
              }
              placeholder="Product description"
            />
          </div>

          <div>
            <Label htmlFor="productStock">Stock Quantity</Label>
            <Input
              id="productStock"
              type="number"
              value={productForm.stock}
              onChange={(e) =>
                setProductForm({ ...productForm, stock: e.target.value })
              }
              placeholder="100"
            />
          </div>

          <Button onClick={handleAddProduct} disabled={loading}>
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </CardContent>
      </Card>

      {/* Get Product */}
      <Card>
        <CardHeader>
          <CardTitle>Get Product Details</CardTitle>
          <CardDescription>Look up product information by ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Product ID (0, 1, 2...)"
            />
            <Button onClick={handleGetProduct} disabled={loading}>
              {loading ? "Loading..." : "Get Product"}
            </Button>
          </div>

          {productDetails && (
            <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              <h3 className="font-bold">Product Details:</h3>
              <p>
                <strong>ID:</strong> {productDetails.id.toString()}
              </p>
              <p>
                <strong>Name:</strong> {productDetails.name}
              </p>
              <p>
                <strong>Description:</strong> {productDetails.description}
              </p>
              <p>
                <strong>Price:</strong> {formatPrice(productDetails.price)} ETH
              </p>
              <p>
                <strong>Stock:</strong> {productDetails.stock.toString()}
              </p>
              <p>
                <strong>Active:</strong>{" "}
                {productDetails.isActive ? "Yes" : "No"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Products Display */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({totalProductCount})</CardTitle>
          <CardDescription>
            Complete list of products in the store
            {loadingProducts && " (Loading...)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading products...</span>
            </div>
          ) : allProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No products found in the store.</p>
              <p className="text-sm">
                Add your first product using the form above!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allProducts.map((product) => (
                <div
                  key={product.id.toString()}
                  className="border rounded-lg p-4 bg-muted/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{product.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-background px-2 py-1 rounded">
                        ID: {product.id.toString()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    {product.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Price:</span>{" "}
                      <span className="font-mono">
                        {formatPrice(product.price)} ETH
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Stock:</span>{" "}
                      <span className="font-mono">
                        {product.stock.toString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Refresh button */}
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadAllProducts}
                  disabled={loadingProducts}
                >
                  🔄 Refresh Products
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

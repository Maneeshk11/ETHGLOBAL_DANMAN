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

  // Load store info on component mount
  useEffect(() => {
    loadStoreInfo();
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

        // Clear form
        setProductForm({ name: "", description: "", price: "", stock: "" });
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
    </div>
  );
}

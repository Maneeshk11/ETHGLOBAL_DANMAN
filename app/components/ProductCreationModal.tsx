"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Address } from "viem";
import { addProductToStore, StoreInfo } from "../../lib/storeService";
import { toast } from "sonner";

interface ProductData {
  name: string;
  description: string;
  price: string; // Price in store tokens as string for input handling
  stock: string; // Stock quantity as string for input handling
}

interface ProductCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback to refresh product list
  storeAddress: Address;
  walletAddress: Address;
  storeInfo?: StoreInfo; // Optional store info to show token details
}

export default function ProductCreationModal({
  isOpen,
  onClose,
  onSuccess,
  storeAddress,
  walletAddress,
  storeInfo,
}: ProductCreationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductData>({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const handleInputChange = (field: keyof ProductData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
      !formData.stock
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate price
    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Price must be a positive number");
      return;
    }

    // Validate stock
    const stockValue = parseInt(formData.stock);
    if (isNaN(stockValue) || stockValue <= 0 || !Number.isInteger(stockValue)) {
      toast.error("Stock must be a positive integer");
      return;
    }

    try {
      setLoading(true);

      const addProductToast = toast.loading("Adding product to store...", {
        description: "Submitting transaction to blockchain...",
        duration: Infinity,
      });

      console.log("🛒 Adding product to store:", {
        storeAddress,
        name: formData.name,
        description: formData.description,
        price: priceValue,
        stock: stockValue,
      });

      // Convert price from store tokens to wei (18 decimals)
      const priceInWei = BigInt(Math.floor(priceValue * 1e18));
      const stockQuantity = BigInt(stockValue);

      await addProductToStore(
        storeAddress,
        formData.name,
        formData.description,
        priceInWei,
        stockQuantity,
        walletAddress
      );

      toast.dismiss(addProductToast);
      toast.success("Product added successfully! 🎉", {
        description: `${formData.name} is now available in your store`,
        action: {
          label: "View on Etherscan",
          onClick: () =>
            window.open(
              `https://sepolia.etherscan.io/address/${storeAddress}`,
              "_blank"
            ),
        },
      });

      console.log("✅ Product added successfully");

      // Reset form and close modal
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
      });

      onSuccess(); // Refresh parent component
      onClose();
    } catch (error) {
      console.error("❌ Product creation failed:", error);

      toast.error("Failed to add product", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>🛒 Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your store
            {storeInfo ? ` "${storeInfo.name}"` : ""}. Set the price, stock, and
            details.
          </DialogDescription>
        </DialogHeader>

        {storeInfo && (
          <div className="p-3 bg-muted/50 rounded-lg mb-4">
            <div className="text-sm font-medium mb-1">
              💰 Store Token Information
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Token: {storeInfo.name} Token</div>
              <div>
                Your Balance:{" "}
                {(Number(storeInfo.tokenBalance) / 10 ** 6).toFixed(2)} tokens
              </div>
              {storeInfo.tokenTotalSupply && (
                <div>
                  Total Supply:{" "}
                  {(Number(storeInfo.tokenTotalSupply) / 10 ** 18).toFixed(2)}{" "}
                  tokens
                </div>
              )}
              <div className="text-amber-600">
                ⚠️ Customers will pay with your store tokens, not ETH
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name */}
          <div>
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Amazing Product"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Give your product a clear, descriptive name
            </p>
          </div>

          {/* Product Description */}
          <div>
            <Label htmlFor="productDescription">Description *</Label>
            <Textarea
              id="productDescription"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Detailed description of your product..."
              rows={3}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Describe what makes this product special
            </p>
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productPrice">
                Price ({storeInfo ? `${storeInfo.name} Tokens` : "Store Tokens"}
                ) *
              </Label>
              <Input
                id="productPrice"
                type="number"
                step="0.001"
                min="0.001"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="5.0"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Price per unit in{" "}
                {storeInfo ? `${storeInfo.name} tokens` : "your store's tokens"}
              </p>
            </div>
            <div>
              <Label htmlFor="productStock">Stock Quantity *</Label>
              <Input
                id="productStock"
                type="number"
                min="1"
                step="1"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="100"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                How many units available
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="sm:flex-1">
              {loading ? "Adding Product..." : "Add Product 🛒"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

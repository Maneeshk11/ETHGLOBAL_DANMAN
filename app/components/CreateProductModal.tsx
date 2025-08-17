"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Address } from "viem";
import { addProductToStore } from "../../lib/storeService";
import { toast } from "sonner";

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (productId: number) => void;
  storeAddress: Address;
  storeName?: string;
}

interface ProductData {
  name: string;
  description: string;
  price: string;
  stock: string;
}

export function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
  storeAddress,
  storeName,
}: CreateProductModalProps) {
  const { address } = useAccount();
  const [productData, setProductData] = useState<ProductData>({
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    if (
      !productData.name ||
      !productData.description ||
      !productData.price ||
      !productData.stock
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (parseFloat(productData.price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    if (parseInt(productData.stock) <= 0) {
      setError("Stock must be greater than 0");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Convert price to tokens (assuming token has 18 decimals)
      const priceInTokens = BigInt(
        Math.floor(parseFloat(productData.price) * 10 ** 18)
      );
      const stockAmount = BigInt(parseInt(productData.stock));

      const txHash = await addProductToStore(
        storeAddress,
        productData.name,
        productData.description,
        priceInTokens,
        stockAmount,
        address
      );

      toast.success("Product added successfully! 🎉", {
        description: `${productData.name} has been added to your store`,
        action: {
          label: "View Transaction",
          onClick: () =>
            window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank"),
        },
      });

      if (onSuccess) {
        onSuccess(1); // We don't get the product ID back, so using 1 as placeholder
      }

      onClose();

      // Reset form
      setProductData({
        name: "",
        description: "",
        price: "",
        stock: "",
      });
    } catch (error) {
      console.error("Product creation failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create product"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: keyof ProductData, value: string) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-purple-900/95 to-pink-900/95 border border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            🛒 Add New Product
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Add a new product to {storeName ? `"${storeName}"` : "your store"}.
            Set the price in store tokens and specify the initial stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productName" className="text-white">
                Product Name *
              </Label>
              <Input
                id="productName"
                value={productData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Premium Coffee Blend"
                className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400"
                disabled={isCreating}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="productDescription" className="text-white">
                Description *
              </Label>
              <Textarea
                id="productDescription"
                value={productData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your product..."
                className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400 min-h-[100px]"
                disabled={isCreating}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="productPrice" className="text-white">
                  Price (in store tokens) *
                </Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={productData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="10.5"
                  className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={isCreating}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="productStock" className="text-white">
                  Initial Stock *
                </Label>
                <Input
                  id="productStock"
                  type="number"
                  min="1"
                  value={productData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  placeholder="100"
                  className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400"
                  disabled={isCreating}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isCreating ? "Adding Product..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

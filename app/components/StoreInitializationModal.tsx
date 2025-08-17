"use client";

import { useState } from "react";
import { Address } from "viem";
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
import { initializeStoreAtAddress } from "../../lib/storeService";
import { createStoreViaFactory } from "../../lib/retailFactoryService";
import {
  getUniswapV2RouterAddress,
  getPyusdTokenAddress,
} from "../../lib/contracts";
import { toast } from "sonner";

interface StoreInitData {
  storeName: string;
  tokenSymbol: string;
}

interface StoreInitializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (storeAddress: Address) => void;
  walletAddress: Address;
}

export default function StoreInitializationModal({
  isOpen,
  onClose,
  onSuccess,
  walletAddress,
}: StoreInitializationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StoreInitData>({
    storeName: "",
    tokenSymbol: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.storeName || !formData.tokenSymbol) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create store via factory
      const step1Toast = toast.loading("Creating store contract...", {
        description: "Step 1: Creating store via factory...",
        duration: Infinity,
      });

      console.log("🏭 Step 1: Creating store via factory...");
      const { storeAddress } = await createStoreViaFactory(walletAddress);

      toast.dismiss(step1Toast);
      toast.success("Store contract created! 🎉", {
        description: `Store created at ${storeAddress}`,
      });

      console.log("✅ Step 1 complete. Store address:", storeAddress);

      // Step 2: Initialize store with collected data
      const step2Toast = toast.loading("Initializing store...", {
        description: "Step 2: Setting up your store details...",
        duration: Infinity,
      });

      // Smart defaults for simplified form
      const storeDescription = `Welcome to ${formData.storeName}! Your one-stop shop for quality products.`;
      const tokenName = `${formData.storeName} Token`;
      const initialSupply = BigInt(25) * BigInt(10 ** 18); // 25 tokens (all go to liquidity pool)
      const pyusdLiquidity = BigInt(20) * BigInt(10 ** 6); // 20 PYUSD for liquidity

      const uniswapRouter = getUniswapV2RouterAddress();
      const pyusdToken = getPyusdTokenAddress();

      console.log("🔧 Step 2: Initializing store with data:", {
        storeAddress,
        storeName: formData.storeName,
        storeDescription,
        tokenName,
        tokenSymbol: formData.tokenSymbol,
        initialSupply: initialSupply.toString(),
        pyusdLiquidity: pyusdLiquidity.toString(),
        uniswapRouter,
        pyusdToken,
      });

      const txHash = await initializeStoreAtAddress(
        storeAddress,
        formData.storeName,
        storeDescription,
        tokenName,
        formData.tokenSymbol,
        initialSupply,
        uniswapRouter,
        pyusdToken,
        pyusdLiquidity,
        walletAddress
      );

      toast.dismiss(step2Toast);
      toast.success("Store fully ready! 🎉", {
        description: `Your store "${formData.storeName}" is now ready to use`,
        action: {
          label: "View on Explorer",
          onClick: () =>
            window.open(
              `https://sepolia.etherscan.io/address/${storeAddress}`,
              "_blank"
            ),
        },
      });

      console.log("✅ Step 2 complete. Store fully initialized:", txHash);

      // Reset form and close modal
      setFormData({
        storeName: "",
        tokenSymbol: "",
      });

      onSuccess(storeAddress);
      onClose();
    } catch (error) {
      console.error("❌ Store creation/initialization failed:", error);
      toast.error("Store creation failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof StoreInitData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>🏪 Create New Store</DialogTitle>
          <DialogDescription>
            Create your store with just a name and token symbol. We&apos;ll
            handle all the technical setup for you!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Simplified Store Creation */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) =>
                    handleInputChange("storeName", e.target.value)
                  }
                  placeholder="My Awesome Store"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give your store a unique name
                </p>
              </div>
              <div>
                <Label htmlFor="tokenSymbol">Token Symbol *</Label>
                <Input
                  id="tokenSymbol"
                  value={formData.tokenSymbol}
                  onChange={(e) =>
                    handleInputChange(
                      "tokenSymbol",
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="STORE"
                  required
                  disabled={loading}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  3-5 letter symbol for your token
                </p>
              </div>
            </div>

            {/* Smart Defaults Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <h5 className="text-sm font-medium mb-2">
                🚀 What we&apos;ll set up for you:
              </h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Auto-generated store description</li>
                <li>• 25 initial tokens (all go to Uniswap liquidity pool)</li>
                <li>• PYUSD trading pair with 20 PYUSD liquidity</li>
                <li>• Ready-to-trade token on Uniswap V2</li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.storeName || !formData.tokenSymbol}
              className="flex-1"
            >
              {loading ? "Creating Store..." : "🚀 Create Store"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { createToken, CreateTokenParams } from "../../lib/contractService";
import { Address } from "viem";

interface TokenConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (tokenConfig: TokenConfig, tokenAddress?: Address) => void;
}

export interface TokenConfig {
  tokenName: string;
  tokenSymbol: string;
  initialSupply: number;
  tokenValue: number;
}

export function TokenConfigurationModal({
  isOpen,
  onClose,
  onSubmit,
}: TokenConfigurationModalProps) {
  const { address } = useAccount();
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    tokenName: "",
    tokenSymbol: "",
    initialSupply: 10000,
    tokenValue: 1.0,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const createTokenParams: CreateTokenParams = {
        name: tokenConfig.tokenName,
        symbol: tokenConfig.tokenSymbol,
        initialSupply: tokenConfig.initialSupply,
        tokenValue: tokenConfig.tokenValue,
      };

      const tokenAddress = await createToken(createTokenParams, address);

      if (onSubmit) {
        onSubmit(tokenConfig, tokenAddress);
      }

      onClose();

      // Reset form
      setTokenConfig({
        tokenName: "",
        tokenSymbol: "",
        initialSupply: 10000,
        tokenValue: 1.0,
      });
    } catch (error) {
      console.error("Token creation failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create token"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (
    field: keyof TokenConfig,
    value: string | number
  ) => {
    setTokenConfig((prev) => ({
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
      <DialogContent className="sm:max-w-[425px] backdrop-blur-md bg-black/90 border-purple-500/30 shadow-2xl shadow-purple-500/20">
        <DialogHeader>
          <DialogTitle className="text-white">Create Your Token</DialogTitle>
          <DialogDescription className="text-gray-300">
            Configure your shop&apos;s token details. This will create a new
            token on the blockchain.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tokenName" className="text-white">
                Token Name
              </Label>
              <Input
                id="tokenName"
                value={tokenConfig.tokenName}
                onChange={(e) => handleInputChange("tokenName", e.target.value)}
                placeholder="e.g., JoeCoffee Token"
                className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400"
                disabled={isCreating}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tokenSymbol" className="text-white">
                Token Symbol
              </Label>
              <Input
                id="tokenSymbol"
                value={tokenConfig.tokenSymbol}
                onChange={(e) =>
                  handleInputChange("tokenSymbol", e.target.value.toUpperCase())
                }
                placeholder="e.g., JCT (3-5 characters)"
                maxLength={5}
                className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400"
                disabled={isCreating}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="initialSupply" className="text-white">
                Initial Token Supply
              </Label>
              <Input
                id="initialSupply"
                type="number"
                value={tokenConfig.initialSupply}
                onChange={(e) =>
                  handleInputChange(
                    "initialSupply",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="e.g., 10000"
                min="1"
                className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400"
                disabled={isCreating}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tokenValue" className="text-white">
                Token Value (USD)
              </Label>
              <Input
                id="tokenValue"
                type="number"
                step="0.01"
                value={tokenConfig.tokenValue}
                onChange={(e) =>
                  handleInputChange(
                    "tokenValue",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="e.g., 1.00"
                min="0.01"
                className="bg-black/40 border-purple-500/30 text-white placeholder:text-gray-400"
                disabled={isCreating}
                required
              />
              <p className="text-xs text-gray-400">
                This is for display purposes only and not stored on-chain
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-purple-500/50 text-white hover:bg-purple-500/20"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isCreating || !address}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Token...
                </>
              ) : (
                "Create Token"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

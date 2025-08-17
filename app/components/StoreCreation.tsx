"use client";

import { useState } from "react";
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
  createAndInitializeStore,
  createStoreViaFactory,
  getOwnerStores,
  waitForTransaction,
} from "../../lib/retailFactoryService";
import { initializeStoreAtAddress } from "../../lib/storeService";
import {
  getUniswapV2RouterAddress,
  getPyusdTokenAddress,
} from "../../lib/contracts";
import { toast } from "sonner";

export default function StoreCreation() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [userStores, setUserStores] = useState<Address[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // Store creation form
  const [storeForm, setStoreForm] = useState({
    storeName: "",
    storeDescription: "",
    tokenName: "",
    tokenSymbol: "",
    tokenDecimals: 6,
    initialTokenSupply: "",
  });

  const loadUserStores = async () => {
    if (!address) return;

    try {
      setLoadingStores(true);
      const stores = await getOwnerStores(address);
      setUserStores(stores);
      console.log(`📋 User has ${stores.length} stores:`, stores);
    } catch (error) {
      console.error("Error loading user stores:", error);
      toast.error("Failed to load your stores");
    } finally {
      setLoadingStores(false);
    }
  };

  const handleCreateStore = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (
      !storeForm.storeName ||
      !storeForm.storeDescription ||
      !storeForm.tokenName ||
      !storeForm.tokenSymbol ||
      !storeForm.initialTokenSupply
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const initialSupply = BigInt(storeForm.initialTokenSupply);

      console.log("🚀 Starting complete store creation process...");

      // Show loading toast
      const loadingToast = toast.loading("Creating your store...", {
        description: "Step 1: Creating store via factory...",
        duration: Infinity,
      });

      // Complete store creation workflow
      const result = await createAndInitializeStore(
        address, // owner address
        storeForm.storeName,
        storeForm.storeDescription,
        storeForm.tokenName,
        storeForm.tokenSymbol,
        storeForm.tokenDecimals,
        initialSupply,
        address // wallet address
      );

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Store created successfully! 🎉", {
        description: `Your store is ready at ${result.storeAddress}`,
        action: {
          label: "View on Explorer",
          onClick: () =>
            window.open(
              `https://sepolia.etherscan.io/address/${result.storeAddress}`,
              "_blank"
            ),
        },
      });

      console.log("🎉 Store creation complete:", result);

      // Clear form and refresh stores
      setStoreForm({
        storeName: "",
        storeDescription: "",
        tokenName: "",
        tokenSymbol: "",
        tokenDecimals: 6,
        initialTokenSupply: "",
      });

      // Refresh user's stores list
      await loadUserStores();
    } catch (error) {
      console.error("❌ Store creation failed:", error);
      toast.error("Store creation failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepByStep = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create store via factory
      console.log("🏭 Step 1: Creating store via factory...");
      const step1Toast = toast.loading(
        "Step 1: Creating store via factory...",
        {
          duration: Infinity,
        }
      );

      const { storeAddress, txHash: createTxHash } =
        await createStoreViaFactory(address);

      toast.dismiss(step1Toast);
      toast.success("Step 1 Complete: Store created via factory", {
        description: `Store address: ${storeAddress}`,
      });

      console.log("✅ Step 1 complete. Store address:", storeAddress);

      // Step 2: Initialize the store
      console.log("🔧 Step 2: Initializing store...");
      const step2Toast = toast.loading("Step 2: Initializing store data...", {
        duration: Infinity,
      });

      const initialSupply = BigInt(storeForm.initialTokenSupply || "1000"); // Using 6 decimals as standard

      // Get default liquidity values and addresses
      const uniswapRouter = getUniswapV2RouterAddress();
      const pyusdToken = getPyusdTokenAddress();
      const pyusdLiquidity = BigInt(20); // Contract handles decimals internally

      const initTxHash = await initializeStoreAtAddress(
        storeAddress,
        storeForm.storeName || "My Store",
        storeForm.storeDescription || "A great store",
        storeForm.tokenName || "Store Token",
        storeForm.tokenSymbol || "STORE",
        initialSupply,
        uniswapRouter,
        pyusdToken,
        pyusdLiquidity,
        address
      );

      // Wait for initialization confirmation
      await waitForTransaction(initTxHash as `0x${string}`);

      toast.dismiss(step2Toast);
      toast.success("Step 2 Complete: Store initialized! 🎉", {
        description: `Your store is fully ready at ${storeAddress}`,
        action: {
          label: "View on Explorer",
          onClick: () =>
            window.open(
              `https://sepolia.etherscan.io/address/${storeAddress}`,
              "_blank"
            ),
        },
      });

      console.log("🎉 Both steps complete!");
      await loadUserStores();
    } catch (error) {
      console.error("❌ Step-by-step creation failed:", error);
      toast.error("Store creation failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Your Store</CardTitle>
          <CardDescription>
            Connect your wallet to create a new store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please connect your wallet to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>🏭 Create New Store via Factory</CardTitle>
          <CardDescription>
            Create a new store contract through the retail factory. Ownership
            will be automatically transferred to your address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeForm.storeName}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, storeName: e.target.value })
                }
                placeholder="My Awesome Store"
              />
            </div>
            <div>
              <Label htmlFor="tokenName">Token Name</Label>
              <Input
                id="tokenName"
                value={storeForm.tokenName}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, tokenName: e.target.value })
                }
                placeholder="Store Token"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="storeDescription">Store Description</Label>
            <Textarea
              id="storeDescription"
              value={storeForm.storeDescription}
              onChange={(e) =>
                setStoreForm({ ...storeForm, storeDescription: e.target.value })
              }
              placeholder="A brief description of your store..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tokenSymbol">Token Symbol</Label>
              <Input
                id="tokenSymbol"
                value={storeForm.tokenSymbol}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, tokenSymbol: e.target.value })
                }
                placeholder="STORE"
              />
            </div>
            <div>
              <Label htmlFor="tokenDecimals">Token Decimals</Label>
              <Input
                id="tokenDecimals"
                type="number"
                value={storeForm.tokenDecimals}
                onChange={(e) =>
                  setStoreForm({
                    ...storeForm,
                    tokenDecimals: parseInt(e.target.value) || 18,
                  })
                }
                placeholder="18"
              />
            </div>
            <div>
              <Label htmlFor="initialSupply">Initial Supply</Label>
              <Input
                id="initialSupply"
                value={storeForm.initialTokenSupply}
                onChange={(e) =>
                  setStoreForm({
                    ...storeForm,
                    initialTokenSupply: e.target.value,
                  })
                }
                placeholder="1000"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleCreateStore}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating..." : "🚀 Create Store (Complete Workflow)"}
            </Button>
            <Button
              onClick={handleStepByStep}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? "Processing..." : "📋 Step-by-Step Creation"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User's Stores */}
      <Card>
        <CardHeader>
          <CardTitle>Your Stores ({userStores.length})</CardTitle>
          <CardDescription>Stores you own through the factory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={loadUserStores}
              disabled={loadingStores}
              variant="outline"
              size="sm"
            >
              {loadingStores ? "Loading..." : "🔄 Refresh Stores"}
            </Button>
          </div>

          {userStores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No stores found.</p>
              <p className="text-sm">
                Create your first store using the form above!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {userStores.map((storeAddress, index) => (
                <div
                  key={storeAddress}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">Store #{index + 1}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {storeAddress}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/address/${storeAddress}`,
                        "_blank"
                      )
                    }
                  >
                    View on Explorer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

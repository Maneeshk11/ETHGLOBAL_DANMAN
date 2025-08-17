"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { getAllStoresWithInfo } from "../lib/retailFactoryService";
import { Address } from "viem";
import StoreDetailsModal from "./components/StoreDetailsModal";

type StoreWithInfo = {
  owner: Address;
  store: Address;
  storeInfo?: {
    name: string;
    description: string;
    isActive: boolean;
    tokenAddress: Address;
  };
};

export default function Home() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [allStores, setAllStores] = useState<StoreWithInfo[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  // Modal state
  const [selectedStore, setSelectedStore] = useState<StoreWithInfo | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRetailLogin = () => {
    router.push("/dashboard");
  };

  const loadAllStores = async () => {
    try {
      setIsLoadingStores(true);
      console.log("🏪 Loading all retail stores...");
      const stores = await getAllStoresWithInfo();
      setAllStores(stores);
      console.log(`✅ Loaded ${stores.length} stores`);
    } catch (error) {
      console.error("❌ Failed to load stores:", error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Load stores on component mount
  useEffect(() => {
    loadAllStores();
  }, []);

  const handleVisitStore = (store: StoreWithInfo) => {
    setSelectedStore(store);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStore(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Navigation Header - Fixed */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border flex-shrink-0">
          <div className="flex flex-col space-x-4">
            <span className="text-2xl font-bold">Block Bazaar</span>
            <span className="text-sm text-muted-foreground">
              The Decentralized Retail Marketplace
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {!isConnected && (
              <Button
                variant="outline"
                onClick={handleRetailLogin}
                className="text-sm h-10 px-4"
              >
                Retail Login
              </Button>
            )}
            <div className="[&_button]:text-sm [&_button]:h-10">
              <DynamicWidget />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="stores" className="w-full h-full flex flex-col">
            {/* Tab Navigation - Fixed */}
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0 mx-6">
              <TabsTrigger value="stores">Browse Stores</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <TabsContent value="stores" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <span className="text-xl font-semibold">
                      Browse Retail Stores
                    </span>
                    <span className="text-muted-foreground">
                      Discover retail stores and explore their tokens
                    </span>
                  </div>
                  {/* All Stores */}
                  <div className="mt-8">
                    {isLoadingStores ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p className="mt-2 text-muted-foreground">
                          Loading stores...
                        </p>
                      </div>
                    ) : allStores.length > 0 ? (
                      <div className="grid gap-4">
                        {allStores.map((store, index) => {
                          const hasRealInfo =
                            store.storeInfo?.tokenAddress !==
                            "0x0000000000000000000000000000000000000000";

                          return (
                            <Card
                              key={`${store.store}-${index}`}
                              className="border-2 border-border/50 hover:border-purple-500/50 transition-colors"
                            >
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">
                                    {store.storeInfo?.name || "Unnamed Store"}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                    {hasRealInfo ? (
                                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                        ✓ Loaded
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                        ⚠ Basic Info
                                      </span>
                                    )}
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        store.storeInfo?.isActive
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {store.storeInfo?.isActive
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                                <CardDescription>
                                  {store.storeInfo?.description ||
                                    "No description available"}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Store Address:
                                    </span>
                                    <span className="font-mono text-xs">
                                      {store.store.slice(0, 6)}...
                                      {store.store.slice(-4)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      Owner:
                                    </span>
                                    <span className="font-mono text-xs">
                                      {store.owner.slice(0, 6)}...
                                      {store.owner.slice(-4)}
                                    </span>
                                  </div>
                                  {store.storeInfo?.tokenAddress &&
                                    store.storeInfo.tokenAddress !==
                                      "0x0000000000000000000000000000000000000000" && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                          Token Address:
                                        </span>
                                        <span className="font-mono text-xs">
                                          {store.storeInfo.tokenAddress.slice(
                                            0,
                                            6
                                          )}
                                          ...
                                          {store.storeInfo.tokenAddress.slice(
                                            -4
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  {!hasRealInfo && (
                                    <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                      ⚠️ Limited info due to RPC constraints.
                                      Full details may be available when
                                      visiting the store.
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  className="w-full mt-4"
                                  onClick={() => {
                                    handleVisitStore(store);
                                  }}
                                >
                                  Visit Store
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="border-dashed border-2">
                        <CardContent className="text-center py-8">
                          <p className="text-muted-foreground">
                            No stores found
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Be the first to create a store!
                          </p>
                          {isConnected && (
                            <Button
                              onClick={handleRetailLogin}
                              className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              Create Your Store
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-xl font-semibold">
                      Your Token Portfolio
                    </span>
                    <span className="text-muted-foreground">
                      View and manage your retail tokens
                    </span>
                  </div>

                  {/* Wallet Connection Status */}
                  {!isConnected ? (
                    /* Disconnected State */
                    <div className="border border-border rounded-lg p-4 text-center bg-gradient-to-br from-muted/30 to-muted/10">
                      <div className="space-y-2">
                        <div className="w-8 h-8 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                          <div className="text-lg">🔗</div>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">
                            Connect Your Wallet
                          </h3>
                          <p className="text-muted-foreground text-xs max-w-xs mx-auto mt-1">
                            Connect to view your portfolio
                          </p>
                        </div>
                        <div>
                          <DynamicWidget />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Connected State */
                    <div className="space-y-6">
                      {/* Wallet Status */}
                      <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-green-700 dark:text-green-400">
                              Wallet Connected
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                          </div>
                          <DynamicWidget />
                        </div>
                      </div>

                      {/* Token Portfolio Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg text-center">
                          <div className="text-2xl font-bold">$0.00</div>
                          <div className="text-sm text-muted-foreground">
                            Total Value
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg text-center">
                          <div className="text-2xl font-bold">0</div>
                          <div className="text-sm text-muted-foreground">
                            Active Shops
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-lg text-center">
                          <div className="text-2xl font-bold">0</div>
                          <div className="text-sm text-muted-foreground">
                            Total Tokens
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Token Holdings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Token Holdings</h3>
                    {isConnected ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="space-y-4">
                          <div className="w-12 h-12 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                          </div>
                          <div>
                            <p className="font-medium">No tokens found</p>
                            <p className="text-sm">
                              Start discovering shops to earn your first tokens!
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Explore Shops
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border border-dashed border-muted-foreground/30 rounded-lg">
                        <p>Connect your wallet to view token holdings</p>
                      </div>
                    )}
                  </div>

                  {/* Add more content for demo */}
                  {isConnected && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Recent Transactions
                      </h3>
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="space-y-4">
                          <div className="w-12 h-12 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                          </div>
                          <div>
                            <p className="font-medium">No transactions yet</p>
                            <p className="text-sm">
                              Your transaction history will appear here
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Settings</h2>
                  <p className="text-muted-foreground">
                    Manage your account and preferences
                  </p>

                  {/* Wallet Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Wallet Connection</h3>
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Wallet</p>
                          <p className="text-sm text-muted-foreground">
                            Connect your wallet to view details
                          </p>
                        </div>
                        <DynamicWidget />
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Preferences</h3>
                    <div className="space-y-3">
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">
                              Receive updates about your tokens
                            </p>
                          </div>
                          <input type="checkbox" className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Dark Mode</p>
                            <p className="text-sm text-muted-foreground">
                              Toggle dark theme
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            defaultChecked
                          />
                        </div>
                      </div>
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-muted-foreground">
                              Get notified of new token releases
                            </p>
                          </div>
                          <input type="checkbox" className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account</h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Export Transaction History
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Clear Cache
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        View Privacy Policy
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Terms of Service
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                      >
                        Disconnect All Wallets
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>

      {selectedStore && (
        <StoreDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          storeAddress={selectedStore.store}
          ownerAddress={selectedStore.owner}
          storeInfo={selectedStore.storeInfo}
        />
      )}
    </div>
  );
}

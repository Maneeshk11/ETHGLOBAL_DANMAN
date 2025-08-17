"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

export default function Home() {
  const { isConnected, address } = useAccount();
  const router = useRouter();

  const handleRetailLogin = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Navigation Header - Fixed */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border flex-shrink-0">
          <div className="flex flex-col space-x-4">
            <span className="text-2xl font-bold">Token Shop</span>
            <span className="text-sm text-muted-foreground">
              Buy & Discover Retail Tokens
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
          <Tabs defaultValue="discover" className="w-full h-full flex flex-col">
            {/* Tab Navigation - Fixed */}
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0 mx-6">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <TabsContent value="discover" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    Discover Retail Shops
                  </h2>
                  <p className="text-muted-foreground">
                    Search for retail shops and explore their tokens
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter shop name or address"
                      className="w-full border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      Search Shops
                    </Button>
                  </div>

                  {/* Featured Shops */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Featured Shops</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Coffee Corner</span>
                          <span className="text-sm text-muted-foreground">
                            50 COFFEE
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Premium coffee shop downtown
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Tech Store</span>
                          <span className="text-sm text-muted-foreground">
                            100 TECH
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Latest gadgets and electronics
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Fashion Hub</span>
                          <span className="text-sm text-muted-foreground">
                            75 FASHION
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Trendy clothing and accessories
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Book Nook</span>
                          <span className="text-sm text-muted-foreground">
                            30 BOOK
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Cozy bookstore with rare finds
                        </p>
                      </div>
                      {/* Add more dummy shops for scrolling demo */}
                      <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Fitness Zone</span>
                          <span className="text-sm text-muted-foreground">
                            80 FIT
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Premium gym equipment and supplements
                        </p>
                      </div>
                      <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Art Gallery</span>
                          <span className="text-sm text-muted-foreground">
                            45 ART
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Local artists and unique pieces
                        </p>
                      </div>
                    </div>
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
    </div>
  );
}

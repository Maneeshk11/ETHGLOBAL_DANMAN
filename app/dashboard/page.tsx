"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WalletHeader } from "../components/WalletHeader";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  TokenConfigurationModal,
  TokenConfig,
} from "../components/TokenConfigurationModal";
import { getAllTokensInfo, TokenInfo } from "../../lib/contractService";
import { Address } from "viem";
import StoreDemo from "../components/StoreDemo";

export default function DashboardPage() {
  const { isConnected, isConnecting, address } = useAccount();
  const router = useRouter();
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [tokenCreationSuccess, setTokenCreationSuccess] =
    useState<Address | null>(null);

  const handleSignup = () => {
    router.push("/onboarding");
  };

  const handleTokenSubmit = (
    tokenConfig: TokenConfig,
    tokenAddress?: Address
  ) => {
    console.log("Token created successfully:", tokenConfig, tokenAddress);
    if (tokenAddress) {
      setTokenCreationSuccess(tokenAddress);
      // Refresh tokens list
      loadUserTokens();
    }
  };

  const loadUserTokens = async () => {
    if (!address) return;

    setIsLoadingTokens(true);
    try {
      const tokens = await getAllTokensInfo(address);
      setUserTokens(tokens);
    } catch (error) {
      console.error("Failed to load user tokens:", error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // Load user tokens when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadUserTokens();
    }
  }, [isConnected, address]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (tokenCreationSuccess) {
      const timer = setTimeout(() => {
        setTokenCreationSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [tokenCreationSuccess]);

  // Show login interface when not connected
  if (!isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header without wallet info */}
        <WalletHeader title="Token Shop" />

        {/* Login Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Welcome to Token Shop
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
                    <ConnectButton />
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
                    Sign Up for Token Shop
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
        <WalletHeader title="Token Shop Dashboard" />
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
      <WalletHeader title="Token Shop Dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {tokenCreationSuccess && (
          <div className="mb-6 p-4 rounded-md bg-green-500/20 border border-green-500/30 text-green-400">
            <p className="font-medium">Token created successfully! 🎉</p>
            <p className="text-sm text-green-300">
              Contract Address: {tokenCreationSuccess}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Welcome Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Welcome to Your Token Shop! 🎉</CardTitle>
              <CardDescription>
                You&apos;ve successfully connected your wallet. Create and
                manage tokens for your retail business.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => setIsTokenModalOpen(true)}>
                  Create New Token
                </Button>
                <Button variant="outline" onClick={loadUserTokens}>
                  Refresh Tokens
                </Button>
                <Button variant="outline">Analytics</Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoadingTokens ? "..." : userTokens.length}
              </div>
              <p className="text-muted-foreground text-sm">
                {userTokens.length === 0
                  ? "No tokens created yet"
                  : "Tokens deployed"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shop Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-500">
                {userTokens.length > 0 ? "Active" : "Setup Needed"}
              </div>
              <p className="text-muted-foreground text-sm">
                {userTokens.length > 0
                  ? "Ready to serve customers"
                  : "Create your first token"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {userTokens
                  .reduce(
                    (total, token) => total + parseFloat(token.totalSupply),
                    0
                  )
                  .toLocaleString()}
              </div>
              <p className="text-muted-foreground text-sm">
                Total reward tokens available
              </p>
            </CardContent>
          </Card>

          {/* Your Tokens */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Your Tokens</CardTitle>
              <CardDescription>
                Tokens you&apos;ve created on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTokens ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading tokens...</span>
                </div>
              ) : userTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tokens created yet.</p>
                  <p className="text-sm">
                    Click &quot;Create New Token&quot; to get started!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userTokens.map((token) => (
                    <Card key={token.address} className="border-purple-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{token.name}</CardTitle>
                        <CardDescription>{token.symbol}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Supply:</span>
                          <span>
                            {parseFloat(token.totalSupply).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Your Balance:</span>
                          <span>
                            {parseFloat(token.balance).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {token.address}
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

      {/* Token Configuration Modal */}
      <TokenConfigurationModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSubmit={handleTokenSubmit}
      />

      {/* Store Demo */}
      <StoreDemo />
    </div>
  );
}

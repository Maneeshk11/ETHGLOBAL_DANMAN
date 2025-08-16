"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface WalletHeaderProps {
  title?: string;
  showTitle?: boolean;
}

export function WalletHeader({
  title = "Token Shop",
  showTitle = true,
}: WalletHeaderProps) {
  const { address, isConnected } = useAccount();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {showTitle && (
            <div className="flex items-center space-x-4">
              <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
            </div>
          )}

          <div className="flex items-center space-x-3">
            {isConnected && address && (
              <div className="flex items-center space-x-2 bg-muted/80 px-3 py-2 rounded-lg border">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono hidden sm:inline">
                  {formatAddress(address)}
                </span>
                <span className="text-sm font-mono sm:hidden">
                  {address.slice(0, 4)}...
                </span>
                <button
                  onClick={() => copyToClipboard(address)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-background"
                  title="Copy full address"
                >
                  📋
                </button>
              </div>
            )}

            {/* RainbowKit Connect Button */}
            <div className="scale-90 sm:scale-100">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useAccount } from "wagmi";
import { useEffect } from "react";

interface WalletConnectionProps {
  onConnect?: () => void;
}

export function WalletConnection({ onConnect }: WalletConnectionProps) {
  const { isConnected } = useAccount();

  // Auto-advance when wallet is connected
  useEffect(() => {
    if (isConnected && onConnect) {
      // Small delay to let user see the success message
      const timer = setTimeout(() => {
        onConnect();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isConnected, onConnect]);

  return (
    <div id="wallet-connection" className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        <span className="text-lg font-semibold">Connect Your Wallet</span>
        <span className="text-sm text-muted-foreground">
          Connect your wallet to create and manage your shop tokens on the
          blockchain.
        </span>
      </div>
      <div className="flex flex-col items-center space-y-4">
        <DynamicWidget />

        {isConnected && (
          <div className="text-center space-y-2">
            <span className="text-sm text-green-500 mb-2">
              ✓ Wallet connected successfully!
            </span>
            <span className="text-xs text-muted-foreground">
              Proceeding to shop setup...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

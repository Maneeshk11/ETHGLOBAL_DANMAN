"use client";

import { useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount } from "wagmi";
import { getWalletConnection } from "../../lib/walletPersistence";

export function WalletAutoConnect() {
  const { setShowAuthFlow, primaryWallet } = useDynamicContext();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Only try to auto-connect if not already connected
    if (!isConnected && !primaryWallet) {
      const storedConnection = getWalletConnection();

      if (storedConnection) {
        console.log(
          "🔄 Attempting to auto-reconnect wallet:",
          storedConnection.address
        );

        // Small delay to ensure Dynamic Labs is fully initialized
        const timeoutId = setTimeout(() => {
          try {
            // Try to trigger reconnection by showing auth flow briefly
            setShowAuthFlow(true);

            // Hide the auth flow after a brief moment to make it less intrusive
            setTimeout(() => {
              setShowAuthFlow(false);
            }, 500);
          } catch (error) {
            console.warn("Failed to auto-reconnect:", error);
          }
        }, 2000); // Longer delay to ensure everything is loaded

        return () => clearTimeout(timeoutId);
      }
    }
  }, [isConnected, primaryWallet, setShowAuthFlow]);

  // This component doesn't render anything
  return null;
}

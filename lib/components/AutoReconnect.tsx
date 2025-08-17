"use client";

import { useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount } from "wagmi";
import {
  getWalletConnection,
  clearWalletConnection,
} from "../walletPersistence";

export function AutoReconnect() {
  const { user } = useDynamicContext();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Monitor session and clear expired stored connections
    const storedConnection = getWalletConnection();

    if (storedConnection) {
      // Check if the stored connection is expired (older than 24 hours)
      const isExpired =
        Date.now() - storedConnection.timestamp > 24 * 60 * 60 * 1000;

      if (isExpired) {
        console.log("🧹 Clearing expired wallet connection");
        clearWalletConnection();
      } else {
        console.log(
          "📋 Valid stored connection found, Dynamic should auto-reconnect"
        );
      }
    }
  }, []);

  // Clean up storage when user manually disconnects
  useEffect(() => {
    if (!isConnected && !user) {
      const storedConnection = getWalletConnection();
      if (storedConnection) {
        console.log("👋 User disconnected, clearing stored connection");
        clearWalletConnection();
      }
    }
  }, [isConnected, user]);

  return null; // This component doesn't render anything
}

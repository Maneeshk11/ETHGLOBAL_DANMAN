import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  saveWalletConnection,
  clearWalletConnection,
  getWalletConnection,
} from "./walletPersistence";

export function useWalletPersistence() {
  const { isConnected, isConnecting, address, chainId } = useAccount();
  const { user, primaryWallet } = useDynamicContext();
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Save wallet connection state to localStorage whenever it changes
  useEffect(() => {
    if (isConnected && address) {
      saveWalletConnection({
        isConnected: true,
        address,
        chainId: chainId || 11155111, // Default to Sepolia
        timestamp: Date.now(),
      });
      console.log("💾 Wallet connection saved to localStorage");
    }
  }, [isConnected, address, chainId]);

  // Clear storage when disconnected
  useEffect(() => {
    if (!isConnected && !isConnecting && !user && hasCheckedStorage) {
      clearWalletConnection();
      console.log("🗑️ Wallet connection cleared from localStorage");
    }
  }, [isConnected, isConnecting, user, hasCheckedStorage]);

  // Check stored connection on mount for debugging
  useEffect(() => {
    const storedConnection = getWalletConnection();
    if (storedConnection) {
      console.log("📋 Found stored wallet connection:", {
        address: storedConnection.address,
        chainId: storedConnection.chainId,
        isExpired:
          Date.now() - storedConnection.timestamp > 24 * 60 * 60 * 1000,
      });
    } else {
      console.log("📋 No stored wallet connection found");
    }
    setHasCheckedStorage(true);
  }, []); // Only run once on mount

  return {
    isConnected,
    isConnecting,
    address,
    chainId,
    hasStoredConnection: !!getWalletConnection(),
    user,
    primaryWallet,
  };
}

import { useEffect } from "react";
import { useAccount } from "wagmi";
import {
  getWalletConnection,
  saveWalletConnection,
  clearWalletConnection,
} from "./walletPersistence";

export function useWalletPersistence() {
  const { isConnected, isConnecting, address, chainId } = useAccount();

  // Save wallet connection state to localStorage whenever it changes
  useEffect(() => {
    if (isConnected && address) {
      saveWalletConnection({
        isConnected: true,
        address,
        chainId: chainId || 11155111, // Default to Sepolia
        timestamp: Date.now(),
      });
    } else if (!isConnected) {
      clearWalletConnection();
    }
  }, [isConnected, address, chainId]);

  // Check for stored connection on mount
  useEffect(() => {
    const storedConnection = getWalletConnection();
    if (storedConnection && !isConnected) {
      console.log("Found stored wallet connection:", storedConnection.address);
      // Note: Dynamic Labs should handle auto-reconnection automatically
      // This is just for logging and debugging
    }
  }, []); // Only run on mount

  return {
    isConnected,
    isConnecting,
    address,
    chainId,
    hasStoredConnection: !!getWalletConnection(),
  };
}

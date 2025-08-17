import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getWalletConnection,
  saveWalletConnection,
  clearWalletConnection,
} from "./walletPersistence";

export function useWalletPersistence() {
  const { isConnected, isConnecting, address, chainId } = useAccount();
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Save wallet connection state to localStorage whenever it changes
  useEffect(() => {
    if (isConnected && address) {
      saveWalletConnection({
        isConnected: true,
        address,
        chainId: chainId || 11155111, // Default to Sepolia
        timestamp: Date.now(),
      });
      console.log("💾 Wallet connection saved to localStorage:", address);
    } else if (!isConnected && !isConnecting) {
      // Only clear if we're not in the process of connecting
      setTimeout(() => {
        if (!isConnected) {
          clearWalletConnection();
          console.log("🧹 Cleared wallet connection from localStorage");
        }
      }, 2000); // Give some time for potential reconnection
    }
  }, [isConnected, isConnecting, address, chainId]);

  // Attempt reconnection on mount if we have stored connection and no current connection
  useEffect(() => {
    if (
      !hasAttemptedReconnect &&
      !isConnected &&
      !isConnecting &&
      !primaryWallet
    ) {
      const storedConnection = getWalletConnection();

      if (storedConnection) {
        console.log(
          "🔄 Found stored wallet connection, attempting to reconnect...",
          storedConnection.address
        );

        setHasAttemptedReconnect(true);

        // Attempt to trigger reconnection after Dynamic Labs is initialized
        const timeoutId = setTimeout(() => {
          try {
            // First, try to connect to the previously connected wallet
            if (window.ethereum) {
              console.log("🔌 Attempting to reconnect to wallet...");

              // Try to reconnect by requesting accounts (this often triggers auto-connect)
              window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then((accounts: string[]) => {
                  if (accounts.length > 0) {
                    console.log(
                      "✅ Successfully reconnected to wallet:",
                      accounts[0]
                    );
                  }
                })
                .catch((error: any) => {
                  console.log(
                    "ℹ️ Auto-reconnect not available, user will need to connect manually"
                  );
                  // Don't show error as this is expected behavior in many cases
                });
            }
          } catch (error) {
            console.log("ℹ️ Auto-reconnect not available:", error);
          }
        }, 1500); // Give Dynamic Labs time to initialize

        return () => clearTimeout(timeoutId);
      } else {
        setHasAttemptedReconnect(true);
      }
    }
  }, [hasAttemptedReconnect, isConnected, isConnecting, primaryWallet]);

  return {
    isConnected,
    isConnecting,
    address,
    chainId,
    hasStoredConnection: !!getWalletConnection(),
    hasAttemptedReconnect,
  };
}

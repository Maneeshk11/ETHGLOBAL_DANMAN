// Wallet persistence utilities
const WALLET_CONNECTION_KEY = "block-bazaar-wallet-connection";

export interface WalletConnectionState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  timestamp: number;
}

export const saveWalletConnection = (state: WalletConnectionState) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(WALLET_CONNECTION_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to save wallet connection state:", error);
    }
  }
};

export const getWalletConnection = (): WalletConnectionState | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(WALLET_CONNECTION_KEY);
      if (stored) {
        const state = JSON.parse(stored) as WalletConnectionState;
        // Check if the connection is still valid (within 24 hours)
        const isExpired = Date.now() - state.timestamp > 24 * 60 * 60 * 1000;
        if (!isExpired) {
          return state;
        } else {
          // Clear expired connection
          localStorage.removeItem(WALLET_CONNECTION_KEY);
        }
      }
    } catch (error) {
      console.warn("Failed to load wallet connection state:", error);
    }
  }
  return null;
};

export const clearWalletConnection = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(WALLET_CONNECTION_KEY);
    } catch (error) {
      console.warn("Failed to clear wallet connection state:", error);
    }
  }
};

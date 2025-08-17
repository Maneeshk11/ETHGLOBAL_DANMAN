"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createConfig, http } from "wagmi";
import { arbitrum, mainnet, sepolia, arbitrumSepolia } from "wagmi/chains";
import { LOCAL_CHAIN } from "../lib/contracts";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const queryClient = new QueryClient();

// Create Wagmi config for Dynamic
export const config = createConfig({
  chains: [
    sepolia, // Always include Sepolia first since contracts are deployed there
    LOCAL_CHAIN, // Add local chain for development
    mainnet,
    arbitrum,
    arbitrumSepolia,
  ],
  transports: {
    [sepolia.id]: http(),
    [LOCAL_CHAIN.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  // Enable persistence and auto-connect
  ssr: false, // Disable SSR for wallet connections
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: "6f1b3b27-8d20-4360-bf9b-20c025ef505b",
        walletConnectors: [EthereumWalletConnectors],
        initialAuthenticationMode: "connect-only",
        // Enable auto-connect to persist wallet connections
        appName: "Block Bazaar",
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

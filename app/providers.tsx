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
    [sepolia.id]: http("https://rpc.ankr.com/eth_sepolia", {
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [LOCAL_CHAIN.id]: http("http://127.0.0.1:8545"),
    [mainnet.id]: http("https://rpc.ankr.com/eth"),
    [arbitrum.id]: http("https://rpc.ankr.com/arbitrum"),
    [arbitrumSepolia.id]: http("https://rpc.ankr.com/arbitrum_sepolia"),
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

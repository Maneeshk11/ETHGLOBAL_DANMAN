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

// Simple Wagmi config with defaults
export const config = createConfig({
  chains: [sepolia, LOCAL_CHAIN, mainnet, arbitrum, arbitrumSepolia],
  transports: {
    [sepolia.id]: http(),
    [LOCAL_CHAIN.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: "6f1b3b27-8d20-4360-bf9b-20c025ef505b",
        walletConnectors: [EthereumWalletConnectors],
        initialAuthenticationMode: "connect-only",
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

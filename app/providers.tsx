"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { metaMaskWallet, coinbaseWallet } from "@rainbow-me/rainbowkit/wallets";
import { arbitrum, mainnet, sepolia, arbitrumSepolia } from "wagmi/chains";
import { LOCAL_CHAIN } from "../lib/contracts";
import { geminiWallet } from "../lib/geminiWallet";

const queryClient = new QueryClient();

export const config = getDefaultConfig({
  appName: "Token Shop",
  projectId: "temp-project-id", // Minimal project ID for MetaMask/Coinbase only
  chains: [
    LOCAL_CHAIN, // Add local chain first for development
    mainnet,
    arbitrum,
    arbitrumSepolia,
    ...(process.env.NODE_ENV === "development" ? [sepolia] : []),
  ],
  wallets: [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        () => geminiWallet({ appName: "Token Shop" }),
      ],
    },
  ],
  ssr: false, // Disable SSR to prevent WalletConnect indexedDB errors
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#0E76FD",
            accentColorForeground: "white",
            borderRadius: "large",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

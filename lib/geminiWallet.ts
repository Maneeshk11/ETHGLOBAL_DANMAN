import { Wallet, WalletDetailsParams } from "@rainbow-me/rainbowkit";
import { type CreateConnectorFn, createConnector } from "wagmi";
import { gemini } from "@wagmi/connectors";

export interface GeminiWalletOptions {
  appName: string;
  appIcon?: string;
}

export const geminiWallet = ({
  appName,
  appIcon,
}: GeminiWalletOptions): Wallet => {
  return {
    id: "gemini",
    name: "Gemini Wallet",
    shortName: "Gemini",
    rdns: "com.gemini.wallet",
    iconUrl: "./geminiWallet.svg",
    iconAccent: "#1FC4DF",
    iconBackground: "#1FC4DF",
    installed: true,
    downloadUrls: {
      browserExtension: "https://keys.gemini.com",
      mobile: "https://keys.gemini.com",
      qrCode: "https://keys.gemini.com",
    },
    mobile: {
      getUri: (uri: string) => uri,
    },
    qrCode: {
      getUri: (uri: string) => uri,
      instructions: {
        learnMoreUrl: "https://keys.gemini.com",
        steps: [
          {
            description:
              "Download the Gemini app from your device's app store and create or import your wallet.",
            step: "install",
            title: "Install Gemini Wallet App",
          },
          {
            description:
              "Open the Gemini app and tap the WalletConnect or scan QR code option in the settings.",
            step: "create",
            title: "Open Gemini App",
          },
          {
            description:
              "Scan this QR code with your Gemini app to connect your wallet to this dApp.",
            step: "scan",
            title: "Scan QR Code",
          },
        ],
      },
    },
    extension: {
      instructions: {
        learnMoreUrl: "https://keys.gemini.com",
        steps: [
          {
            description:
              "Gemini Wallet is primarily a mobile app. Download it from your device's app store.",
            step: "install",
            title: "Download Gemini Mobile App",
          },
          {
            description:
              "Use WalletConnect to connect your mobile Gemini wallet to this web application.",
            step: "create",
            title: "Use WalletConnect",
          },
          {
            description:
              "Scan the QR code that appears with your Gemini mobile app to establish the connection.",
            step: "refresh",
            title: "Scan QR Code",
          },
        ],
      },
    },
    createConnector: (walletDetails: WalletDetailsParams) => {
      const connector: CreateConnectorFn = gemini({
        appMetadata: {
          name: appName,
          icons: appIcon ? [appIcon] : undefined,
        },
      });

      return createConnector((config) => ({
        ...connector(config),
        ...walletDetails,
      }));
    },
  };
};

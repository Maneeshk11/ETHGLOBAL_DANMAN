# Wallet Setup Guide

## Current Setup

Your onboarding page now supports:

- ✅ **MetaMask** (works with browser extension)
- ✅ **Coinbase Wallet** (works with browser extension and mobile)

## To Add WalletConnect Support

1. **Get a WalletConnect Project ID:**

   - Visit: https://cloud.reown.com/sign-in
   - Create a free account
   - Create a new project
   - Select "WalletKit" as SDK
   - Select "Javascript" as platform
   - Add your domains:
     - `localhost:3000` (for development)
     - Your production domain
   - Copy your Project ID

2. **Add to your app:**

   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_real_project_id_here" > .env.local
   ```

3. **Update providers.tsx:**

   ```typescript
   import { walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'

   // Add to wallets array:
   {
     groupName: 'Other',
     wallets: [walletConnectWallet],
   }

   // Use environment variable:
   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'temp-project-id'
   ```

## To Add Gemini Wallet Support

1. **Install wagmi Gemini connector:**

   ```bash
   # It's already available in wagmi 2.16.3+
   ```

2. **Create custom Gemini wallet:**

   ```typescript
   // app/gemini-wallet.ts
   import { Wallet } from "@rainbow-me/rainbowkit";
   import { gemini } from "wagmi/connectors";

   export const geminiWallet = (): Wallet => ({
     id: "gemini",
     name: "Gemini Wallet",
     // ... wallet configuration
     createConnector: () =>
       gemini({
         appMetadata: {
           name: "Token Shop",
           url: "https://your-domain.com",
           icons: ["https://your-domain.com/icon.png"],
         },
       }),
   });
   ```

3. **Add to providers.tsx:**

   ```typescript
   import { geminiWallet } from "./gemini-wallet";

   // Add to Popular group:
   wallets: [metaMaskWallet, coinbaseWallet, geminiWallet];
   ```

## Current Status

- ✅ No console errors
- ✅ MetaMask and Coinbase wallets visible
- ✅ Dark cyberpunk theme working
- ✅ Onboarding flow complete

## Next Steps

1. Test wallet connections with MetaMask/Coinbase
2. Get WalletConnect Project ID for broader wallet support
3. Add Gemini support if needed
4. Implement actual token creation functionality

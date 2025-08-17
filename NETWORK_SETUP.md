# Network Setup for Gemini Wallet

## Issue

You're getting a chain mismatch error because your Gemini wallet is connected to Sepolia testnet (Chain ID: 11155111) but your app expects Anvil local network (Chain ID: 31337).

## Solution 1: Add Anvil Local Network to Gemini Wallet

### Step 1: Start Anvil

Make sure your local Anvil node is running:

```bash
anvil
```

### Step 2: Add Network to Gemini Wallet

1. Open your Gemini wallet
2. Go to Settings → Networks
3. Add a new network with these details:
   - **Network Name**: Anvil Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: (leave empty)

### Step 3: Switch to Anvil Network

1. In your Gemini wallet, switch to the "Anvil Local" network
2. Refresh your dApp page
3. Reconnect your wallet

### Step 4: Get Test ETH

Your Anvil instance comes with pre-funded test accounts. You can:

1. Import one of the Anvil test accounts into Gemini, or
2. Send ETH from an Anvil account to your Gemini address

To send ETH from Anvil to your Gemini address:

```bash
# Replace YOUR_GEMINI_ADDRESS with your actual address
cast send YOUR_GEMINI_ADDRESS --value 10ether --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Solution 2: Deploy Contract to Sepolia (Alternative)

If you prefer to use Sepolia testnet:

1. Deploy your contract to Sepolia testnet
2. Update the contract address in `/lib/contracts.ts` for Sepolia
3. Get Sepolia ETH from a faucet

## Current Status

- ✅ Your app supports both Anvil (31337) and Sepolia (11155111)
- ✅ Contract address `0x85d6F0f1b61992d18AF39ebd520b5209418900a3` is configured for Sepolia
- ❌ Wallet is on wrong network for local development

## Next Steps

1. Follow Solution 1 to use local development, OR
2. Follow Solution 2 to use Sepolia testnet
3. Ensure you have sufficient ETH for gas fees on the chosen network

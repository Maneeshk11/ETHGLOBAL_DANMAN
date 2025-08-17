# Smart Contract Integration Setup

## 🚀 Your Block Bazaar is now ready to connect to your deployed contract!

### What's Been Set Up

1. **Contract Service** (`lib/contractService.ts`)

   - Functions to create tokens
   - Functions to fetch user tokens
   - Functions to get token information
   - Transaction handling and error management

2. **Contract Configuration** (`lib/contracts.ts`)

   - Local Anvil chain configuration (Chain ID: 31337)
   - Contract addresses and ABIs
   - Token factory and ERC20 interfaces

3. **Updated Components**
   - TokenConfigurationModal now creates real tokens on-chain
   - Dashboard displays user's created tokens
   - Success notifications for token creation

### ⚙️ Configuration Needed

**Update your contract address in `lib/contracts.ts`:**

```typescript
export const CONTRACT_ADDRESSES = {
  TOKEN_FACTORY: "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE" as Address,
};
```

**If your contract ABI is different, update `TOKEN_FACTORY_ABI` in the same file.**

### 🔧 Prerequisites

1. **Foundry Anvil running locally:**

   ```bash
   anvil
   ```

2. **Your contract deployed to Anvil**
3. **MetaMask configured for local network:**
   - Network Name: Anvil Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

### 🎯 How It Works

1. **Connect Wallet**: Users connect MetaMask to the local network
2. **Create Token**: Click "Create New Token" button opens modal
3. **Fill Details**: Enter token name, symbol, supply, and value
4. **Deploy**: Submits transaction to your contract
5. **Success**: Shows success message and displays the new token
6. **View Tokens**: Dashboard automatically loads and displays all user tokens

### 🧪 Testing

1. Start your development server: `pnpm dev`
2. Make sure Anvil is running with your deployed contract
3. Connect MetaMask to local network
4. Try creating a token through the UI
5. Check the dashboard for your created tokens

### 🔍 Expected Contract Interface

The code expects your contract to have these functions:

```solidity
function createToken(
    string memory name,
    string memory symbol,
    uint256 initialSupply,
    address owner
) external returns (address);

function getTokensForOwner(address owner) external view returns (address[] memory);

event TokenCreated(
    address indexed tokenAddress,
    address indexed owner,
    string name,
    string symbol
);
```

### 🐛 Troubleshooting

- **"No ethereum provider found"**: Make sure MetaMask is installed and connected
- **Transaction fails**: Check if your contract is deployed and the address is correct
- **Network errors**: Ensure MetaMask is connected to the local Anvil network
- **ABI errors**: Verify your contract ABI matches the expected interface

### 📝 Next Steps

1. Update the contract address with your deployed address
2. Test the token creation flow
3. Customize the ABI if your contract interface is different
4. Add more functionality as needed

Your Block Bazaar is now ready for blockchain integration! 🎉

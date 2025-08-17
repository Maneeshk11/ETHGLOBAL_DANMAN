// Contract configuration for multiple networks
import { Address } from "viem";
import { sepolia } from "viem/chains";

// Local development chain configuration (Foundry Anvil)
export const LOCAL_CHAIN = {
  id: 31337,
  name: "Anvil Local",
  network: "anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
} as const;

// Supported chains
export const SUPPORTED_CHAINS = {
  LOCAL: LOCAL_CHAIN,
  SEPOLIA: sepolia,
} as const;

// Contract addresses by network
export const CONTRACT_ADDRESSES: Record<
  number,
  {
    TOKEN_FACTORY: Address;
    STORE_CONTRACT: Address;
    RETAIL_FACTORY: Address;
  }
> = {
  [LOCAL_CHAIN.id]: {
    TOKEN_FACTORY: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address, // Default Anvil address
    STORE_CONTRACT: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address, // Local store for testing
    RETAIL_FACTORY: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as Address, // Local retail factory
  },
  [sepolia.id]: {
    TOKEN_FACTORY: "0x85d6F0f1b61992d18AF39ebd520b5209418900a3" as Address, // Legacy - can be updated later
    STORE_CONTRACT: "0x85d6F0f1b61992d18AF39ebd520b5209418900a3" as Address, // Your actual store contract
    RETAIL_FACTORY: "0x935c367772E914C160A728b389baa6A031cC2149" as Address, // Your deployed retail factory
  },
};

// Get contract address for current network
export const getContractAddress = (
  chainId: number,
  contractName: "TOKEN_FACTORY" | "STORE_CONTRACT" | "RETAIL_FACTORY"
) => {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`Contract addresses not configured for chain ${chainId}`);
  }
  return addresses[contractName];
};

// Get current chain configuration
export const getCurrentChain = () => {
  // Always use Sepolia since that's where your contract is deployed
  return sepolia;
};

// Get Uniswap V2 Router address for current chain
export const getUniswapV2RouterAddress = (): Address => {
  const chainId = getCurrentChain().id;
  const address = UNISWAP_V2_ROUTER_ADDRESSES[chainId];
  if (!address) {
    throw new Error(
      `Uniswap V2 Router address not configured for chain ${chainId}`
    );
  }
  return address;
};

// Get PYUSD token address for current chain
export const getPyusdTokenAddress = (): Address => {
  const chainId = getCurrentChain().id;
  const address = PYUSD_TOKEN_ADDRESSES[chainId];
  if (!address) {
    throw new Error(`PYUSD token address not configured for chain ${chainId}`);
  }
  return address;
};

// Store Contract Address (single instance for testing)
export const STORE_CONTRACT_ADDRESS =
  "0x85d6F0f1b61992d18AF39ebd520b5209418900a3" as Address;

// Uniswap V2 Router and PYUSD addresses by network
export const UNISWAP_V2_ROUTER_ADDRESSES: Record<number, Address> = {
  [LOCAL_CHAIN.id]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" as Address, // Local (using mainnet address for testing)
  [sepolia.id]: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3" as Address, // Sepolia Uniswap V2 Router
};

export const PYUSD_TOKEN_ADDRESSES: Record<number, Address> = {
  [LOCAL_CHAIN.id]: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9" as Address, // Local PYUSD
  [sepolia.id]: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9" as Address, // Sepolia PYUSD
};

// Token Factory Contract ABI (legacy - keeping for now)
export const TOKEN_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "initialSupply",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "createToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "getTokensForOwner",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "symbol",
        type: "string",
      },
    ],
    name: "TokenCreated",
    type: "event",
  },
] as const;

// ERC20 Token ABI (for interacting with created tokens)
export const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

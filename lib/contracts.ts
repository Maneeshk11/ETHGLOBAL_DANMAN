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
  }
> = {
  [LOCAL_CHAIN.id]: {
    TOKEN_FACTORY: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address, // Default Anvil address
    STORE_CONTRACT: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address, // Local store for testing
  },
  [sepolia.id]: {
    TOKEN_FACTORY: "0x85d6F0f1b61992d18AF39ebd520b5209418900a3" as Address, // Legacy - can be updated later
    STORE_CONTRACT: "0x85d6F0f1b61992d18AF39ebd520b5209418900a3" as Address, // Your actual store contract
  },
};

// Get contract address for current network
export const getContractAddress = (
  chainId: number,
  contractName: "TOKEN_FACTORY" | "STORE_CONTRACT"
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

// Store Contract Address (single instance for testing)
export const STORE_CONTRACT_ADDRESS =
  "0x85d6F0f1b61992d18AF39ebd520b5209418900a3" as Address;

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

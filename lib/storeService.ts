import {
  createPublicClient,
  createWalletClient,
  custom,
  parseEther,
  formatEther,
  Address,
  parseUnits,
  decodeEventLog,
  http,
} from "viem";
import {
  getContractAddress,
  getCurrentChain,
  STORE_CONTRACT_ADDRESS,
  LOCAL_CHAIN,
} from "./contracts";
import { sepolia } from "viem/chains";
import { STORE_CONTRACT_ABI } from "./storeABI";

// TypeScript interfaces for the contract data structures
export interface Product {
  id: bigint;
  name: string;
  description: string;
  price: bigint;
  stock: bigint;
  isActive: boolean;
}

export interface Purchase {
  productId: bigint;
  buyer: Address;
  quantity: bigint;
  totalPrice: bigint;
  timestamp: bigint;
}

export interface StoreInfo {
  name: string;
  description: string;
  tokenAddress: Address;
  tokenBalance: bigint;
  isActive: boolean;
  createdAt: bigint;
}

// Create a public client for reading from the blockchain
export const getPublicClient = () => {
  const currentChain = getCurrentChain();

  if (typeof window !== "undefined" && window.ethereum) {
    return createPublicClient({
      chain: currentChain,
      transport: custom(window.ethereum),
    });
  }

  // Fallback to HTTP transport for SSR
  const rpcUrl = currentChain.rpcUrls.default.http[0]; // Use the current chain's RPC URL

  return createPublicClient({
    chain: currentChain,
    transport: http(rpcUrl),
  });
};

// Create a wallet client for writing to the blockchain
export const getWalletClient = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return createWalletClient({
      chain: getCurrentChain(),
      transport: custom(window.ethereum),
    });
  }
  throw new Error("No ethereum provider found");
};

// Get the current chain ID from the wallet or default
export const getCurrentChainId = async (): Promise<number> => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const chainId = await (
        window.ethereum as unknown as {
          request: (args: { method: string }) => Promise<string>;
        }
      ).request({
        method: "eth_chainId",
      });
      return parseInt(chainId as string, 16);
    } catch (error) {
      console.warn("Could not get chain ID from wallet, using default");
    }
  }
  return getCurrentChain().id;
};

// Get the store contract address for the current network
export const getStoreContractAddress = async (): Promise<Address> => {
  const chainId = await getCurrentChainId();

  // For now, use the single store instance
  if (chainId === 11155111) {
    // Sepolia
    return STORE_CONTRACT_ADDRESS;
  }

  // Fallback to dynamic lookup for other networks
  return getContractAddress(chainId, "STORE_CONTRACT");
};

/**
 * Wait for a transaction to be confirmed and get the receipt
 * Throws an error if the transaction reverted
 */
export async function waitForTransaction(hash: `0x${string}`) {
  try {
    const publicClient = getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Check if transaction was successful (status: "success") or reverted (status: "reverted")
    if (receipt.status === "reverted") {
      console.error("Transaction reverted:", receipt);
      throw new Error(
        `Transaction failed with status: ${receipt.status}. The contract execution was reverted.`
      );
    }

    console.log(
      `Transaction confirmed successfully with status: ${receipt.status}`
    );
    return receipt;
  } catch (error) {
    console.error("Error waiting for transaction:", error);
    throw error;
  }
}

// ===== STORE MANAGEMENT FUNCTIONS =====

/**
 * Initialize the store with basic information and token
 */
export async function initializeStore(
  storeName: string,
  storeDescription: string,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: number,
  initialTokenSupply: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();
    const contractAddress = await getStoreContractAddress();

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "initializeStore",
      args: [
        storeName,
        storeDescription,
        tokenName,
        tokenSymbol,
        tokenDecimals,
        initialTokenSupply,
      ],
      account: walletAddress,
    });

    return hash;
  } catch (error) {
    console.error("Error initializing store:", error);
    throw error;
  }
}

/**
 * Get store information
 */
export async function getStoreInfo(): Promise<StoreInfo> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "getStoreInfo",
    });

    return result as StoreInfo;
  } catch (error) {
    console.error("Error getting store info:", error);
    throw error;
  }
}

/**
 * Get store owner address
 */
export async function getStoreOwner(): Promise<Address> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "owner",
    });

    return result as Address;
  } catch (error) {
    console.error("Error getting store owner:", error);
    throw error;
  }
}

/**
 * Get store token address
 */
export async function getStoreTokenAddress(): Promise<Address> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "storeToken",
    });

    return result as Address;
  } catch (error) {
    console.error("Error getting store token address:", error);
    throw error;
  }
}

/**
 * Get contract's token balance
 */
export async function getContractTokenBalance(): Promise<bigint> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "getContractTokenBalance",
    });

    return result as bigint;
  } catch (error) {
    console.error("Error getting contract token balance:", error);
    throw error;
  }
}

/**
 * Get total revenue
 */
export async function getTotalRevenue(): Promise<bigint> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "totalRevenue",
    });

    return result as bigint;
  } catch (error) {
    console.error("Error getting total revenue:", error);
    throw error;
  }
}

// ===== PRODUCT MANAGEMENT FUNCTIONS =====

/**
 * Add a new product to the store
 */
export async function addProduct(
  name: string,
  description: string,
  price: bigint,
  stock: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();
    const contractAddress = await getStoreContractAddress();
    const currentChainId = await getCurrentChainId();

    // Detailed logging for debugging
    console.log("🔍 WALLET CLIENT DEBUG INFO:");
    console.log("Current Chain ID:", currentChainId);
    console.log("Wallet Address:", walletAddress);
    console.log("Contract Address:", contractAddress);
    console.log("Wallet Client Chain:", walletClient.chain);
    console.log("Wallet Client Chain ID:", walletClient.chain?.id);
    console.log("Wallet Client Transport:", walletClient.transport);
    console.log("Function Args:", {
      name,
      description,
      price: price.toString(),
      stock: stock.toString(),
      priceInEth: price / BigInt(10 ** 18), // Show price in ETH for readability
    });

    // Additional validation logging
    console.log("📋 INPUT VALIDATION:");
    console.log("Name length:", name.length);
    console.log("Description length:", description.length);
    console.log("Price is positive:", price > BigInt(0));
    console.log("Stock is positive:", stock > BigInt(0));

    // Check if wallet chain matches expected chain
    if (walletClient.chain?.id !== currentChainId) {
      console.warn("⚠️ CHAIN MISMATCH DETECTED:");
      console.warn("Wallet Chain ID:", walletClient.chain?.id);
      console.warn("Expected Chain ID:", currentChainId);
    }

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "addProduct",
      args: [name, description, price, stock],
      account: walletAddress,
    });

    console.log("✅ Transaction submitted successfully:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Error adding product:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      cause: error instanceof Error ? error.cause : undefined,
    });
    throw error;
  }
}

/**
 * Get product details by ID
 */
export async function getProduct(productId: bigint): Promise<Product> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "getProduct",
      args: [productId],
    });

    return result as Product;
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
}

/**
 * Update product information
 */
export async function updateProduct(
  productId: bigint,
  price: bigint,
  stock: bigint,
  isActive: boolean,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();
    const contractAddress = await getStoreContractAddress();

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "updateProduct",
      args: [productId, price, stock, isActive],
      account: walletAddress,
    });

    return hash;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

/**
 * Get next product ID
 */
export async function getNextProductId(): Promise<bigint> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "nextProductId",
    });

    return result as bigint;
  } catch (error) {
    console.error("Error getting next product ID:", error);
    throw error;
  }
}

// ===== CUSTOMER & TOKEN FUNCTIONS =====

/**
 * Get customer token balance
 */
export async function getCustomerTokenBalance(
  customerAddress: Address
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "getCustomerTokenBalance",
      args: [customerAddress],
    });

    return result as bigint;
  } catch (error) {
    console.error("Error getting customer token balance:", error);
    throw error;
  }
}

/**
 * Distribute tokens to customers
 */
export async function distributeTokens(
  customers: Address[],
  amounts: bigint[],
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();
    const contractAddress = await getStoreContractAddress();

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "distributeTokens",
      args: [customers, amounts],
      account: walletAddress,
    });

    return hash;
  } catch (error) {
    console.error("Error distributing tokens:", error);
    throw error;
  }
}

/**
 * Withdraw tokens from contract
 */
export async function withdrawTokens(
  amount: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();
    const contractAddress = await getStoreContractAddress();

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "withdrawTokens",
      args: [amount],
      account: walletAddress,
    });

    return hash;
  } catch (error) {
    console.error("Error withdrawing tokens:", error);
    throw error;
  }
}

// ===== PURCHASE FUNCTIONS =====

/**
 * Purchase a product
 */
export async function purchaseProduct(
  productId: bigint,
  quantity: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();
    const contractAddress = await getStoreContractAddress();

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "purchaseProduct",
      args: [productId, quantity],
      account: walletAddress,
    });

    return hash;
  } catch (error) {
    console.error("Error purchasing product:", error);
    throw error;
  }
}

/**
 * Get purchase history
 */
export async function getPurchaseHistory(): Promise<Purchase[]> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = await getStoreContractAddress();

    const result = await publicClient.readContract({
      address: contractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "getPurchaseHistory",
    });

    return result as Purchase[];
  } catch (error) {
    console.error("Error getting purchase history:", error);
    throw error;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format token amount from wei to readable format
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18
): string {
  return formatEther(amount);
}

/**
 * Parse token amount from readable format to wei
 */
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Format price from wei to ETH
 */
export function formatPrice(priceInWei: bigint): string {
  return formatEther(priceInWei);
}

/**
 * Parse price from ETH to wei
 */
export function parsePrice(priceInEth: string): bigint {
  return parseEther(priceInEth);
}

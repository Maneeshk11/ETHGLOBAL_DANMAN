import {
  createWalletClient,
  custom,
  parseEther,
  formatEther,
  Address,
  parseUnits,
  decodeEventLog,
} from "viem";
import {
  getContractAddress,
  getCurrentChain,
  STORE_CONTRACT_ADDRESS,
} from "./contracts";
import { STORE_CONTRACT_ABI } from "./storeABI";
import { getPublicClient } from "./retailFactoryService";

// ERC-20 ABI for approve and transfer functions
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

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
  tokenTotalSupply?: bigint; // Optional: total supply of store token
  isActive: boolean;
  createdAt: bigint;
}

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
 * Approve PYUSD spending for a contract
 */
export async function approvePyusdSpending(
  pyusdTokenAddress: Address,
  spenderAddress: Address,
  amount: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();

    console.log("💰 Approving PYUSD spending:", {
      token: pyusdTokenAddress,
      spender: spenderAddress,
      amount: amount.toString(),
      from: walletAddress,
    });

    const hash = await walletClient.writeContract({
      address: pyusdTokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress, amount],
      account: walletAddress,
    });

    console.log("✅ PYUSD approval transaction submitted:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Error approving PYUSD spending:", error);
    throw error;
  }
}

/**
 * Transfer PYUSD to a contract
 */
export async function transferPyusdToContract(
  pyusdTokenAddress: Address,
  contractAddress: Address,
  amount: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();

    console.log("💸 Transferring PYUSD to contract:", {
      token: pyusdTokenAddress,
      to: contractAddress,
      amount: amount.toString(),
      from: walletAddress,
    });

    const hash = await walletClient.writeContract({
      address: pyusdTokenAddress,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [contractAddress, amount],
      account: walletAddress,
    });

    console.log("✅ PYUSD transfer transaction submitted:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Error transferring PYUSD:", error);
    throw error;
  }
}

/**
 * Check PYUSD balance of an address
 */
export async function getPyusdBalance(
  pyusdTokenAddress: Address,
  accountAddress: Address
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();

    const balance = await publicClient.readContract({
      address: pyusdTokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [accountAddress],
    });

    return balance as bigint;
  } catch (error) {
    console.error("❌ Error getting PYUSD balance:", error);
    throw error;
  }
}

/**
 * Get total supply of store's token
 */
export async function getStoreTokenTotalSupply(
  storeAddress: Address
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();

    // First get the token address from the store
    const tokenAddress = (await publicClient.readContract({
      address: storeAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "storeToken",
    })) as Address;

    console.log("🪙 Getting total supply for token:", tokenAddress);

    // Then get the total supply from the token contract
    const totalSupply = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "totalSupply",
    });

    return totalSupply as bigint;
  } catch (error) {
    console.error("❌ Error getting store token total supply:", error);
    throw error;
  }
}

/**
 * Check PYUSD allowance
 */
export async function getPyusdAllowance(
  pyusdTokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();

    const allowance = await publicClient.readContract({
      address: pyusdTokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [ownerAddress, spenderAddress],
    });

    return allowance as bigint;
  } catch (error) {
    console.error("❌ Error getting PYUSD allowance:", error);
    throw error;
  }
}

/**
 * Get product by ID from a specific store
 */
export async function getProductFromStore(
  storeAddress: Address,
  productId: bigint
): Promise<Product> {
  try {
    const publicClient = getPublicClient();

    const result = await publicClient.readContract({
      address: storeAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "getProduct",
      args: [productId],
    });

    return result as Product;
  } catch (error) {
    console.error(
      `Error getting product ${productId} from store:`,
      storeAddress,
      error
    );
    throw error;
  }
}

/**
 * Get next product ID from a specific store
 */
export async function getNextProductIdFromStore(
  storeAddress: Address
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();

    const result = await publicClient.readContract({
      address: storeAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "nextProductId",
    });

    return result as bigint;
  } catch (error) {
    console.error(
      "Error getting next product ID from store:",
      storeAddress,
      error
    );
    throw error;
  }
}

/**
 * Get all products from a specific store
 */
export async function getAllProductsFromStore(
  storeAddress: Address
): Promise<Product[]> {
  try {
    console.log("🛒 Loading all products from store:", storeAddress);
    const startTime = performance.now();

    // Get the next product ID to know how many products exist
    const nextId = await getNextProductIdFromStore(storeAddress);
    const totalProducts = Number(nextId) - 1;

    console.log(`📊 Store has ${totalProducts} products to load`);

    if (totalProducts <= 0) {
      console.log("📭 No products found in store");
      return [];
    }

    // Create array of product IDs to fetch (1 to totalProducts)
    const productIds = Array.from({ length: totalProducts }, (_, i) =>
      BigInt(i + 1)
    );

    // Fetch all products in parallel for better performance
    const productPromises = productIds.map(async (id) => {
      try {
        const product = await getProductFromStore(storeAddress, id);
        return { success: true, product, id };
      } catch (error) {
        console.error(`Failed to load product ${id}:`, error);
        return { success: false, error, id };
      }
    });

    const results = await Promise.all(productPromises);
    const endTime = performance.now();

    console.log(
      `⚡ Loaded ${totalProducts} products in ${(endTime - startTime).toFixed(
        2
      )}ms`
    );

    // Filter successful results and return products
    const products = results
      .filter((result) => result.success && "product" in result)
      .map((result) => (result as { success: true; product: Product }).product);

    console.log(`✅ Successfully loaded ${products.length} products`);
    return products;
  } catch (error) {
    console.error("❌ Error loading products from store:", storeAddress, error);
    throw error;
  }
}

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
 * Now includes Uniswap V2 integration for liquidity provision
 * Based on actual contract: all initial supply goes to liquidity pool
 */
export async function initializeStore(
  storeName: string,
  storeDescription: string,
  tokenName: string,
  tokenSymbol: string,
  initialTokenSupply: bigint,
  uniswapV2Router: Address,
  pyusdToken: Address,
  pyusdLiquidity: bigint,
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
        initialTokenSupply,
        uniswapV2Router,
        pyusdToken,
        pyusdLiquidity,
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
 * Initialize a specific store contract with basic information and token
 * This version allows you to specify the exact store contract address
 * Now includes Uniswap V2 integration for liquidity provision
 * Based on actual contract: all initial supply goes to liquidity pool
 */
export async function initializeStoreAtAddress(
  storeContractAddress: Address,
  storeName: string,
  storeDescription: string,
  tokenName: string,
  tokenSymbol: string,
  initialTokenSupply: bigint,
  uniswapV2Router: Address,
  pyusdToken: Address,
  pyusdLiquidity: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();

    console.log("🔧 Initializing store at address:", storeContractAddress);
    console.log("Store details:", {
      storeName,
      storeDescription,
      tokenName,
      tokenSymbol,
      initialTokenSupply: initialTokenSupply.toString(),
      uniswapV2Router,
      pyusdToken,
      pyusdLiquidity: pyusdLiquidity.toString(),
    });

    // Additional validation logging
    console.log("🔍 Contract address validation:");
    console.log("- Store Contract:", storeContractAddress);
    console.log("- Uniswap V2 Router:", uniswapV2Router);
    console.log("- PYUSD Token:", pyusdToken);
    console.log("- Wallet Address:", walletAddress);

    // Check if any address is zero
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    if (storeContractAddress === zeroAddress)
      console.error("❌ Store contract address is zero!");
    if (uniswapV2Router === zeroAddress)
      console.error("❌ Uniswap router address is zero!");
    if (pyusdToken === zeroAddress)
      console.error("❌ PYUSD token address is zero!");
    if (walletAddress === zeroAddress)
      console.error("❌ Wallet address is zero!");

    // Step 1: Check user's PYUSD balance
    console.log("💰 Checking PYUSD balance...");
    const userPyusdBalance = await getPyusdBalance(pyusdToken, walletAddress);
    console.log(`User PYUSD balance: ${userPyusdBalance.toString()}`);

    if (userPyusdBalance < pyusdLiquidity) {
      throw new Error(
        `Insufficient PYUSD balance. Required: ${pyusdLiquidity.toString()}, Available: ${userPyusdBalance.toString()}`
      );
    }

    // Step 2: Check current allowance
    console.log("🔍 Checking current PYUSD allowance...");
    const currentAllowance = await getPyusdAllowance(
      pyusdToken,
      walletAddress,
      storeContractAddress
    );
    console.log(`Current allowance: ${currentAllowance.toString()}`);

    // Step 3: Approve PYUSD spending if needed
    if (currentAllowance < pyusdLiquidity) {
      console.log("📝 Approving PYUSD spending...");
      const approvalHash = await approvePyusdSpending(
        pyusdToken,
        storeContractAddress,
        pyusdLiquidity,
        walletAddress
      );

      // Wait for approval to be confirmed
      console.log("⏳ Waiting for approval confirmation...");
      await waitForTransaction(approvalHash as `0x${string}`);
      console.log("✅ PYUSD approval confirmed");
    } else {
      console.log("✅ Sufficient allowance already exists");
    }

    // Step 4: Try to simulate the store initialization transaction (PYUSD transfer happens inside initializeStore)
    try {
      const publicClient = getPublicClient();
      console.log(
        "🔍 Simulating store initialization transaction (includes PYUSD transfer)..."
      );

      await publicClient.simulateContract({
        address: storeContractAddress,
        abi: STORE_CONTRACT_ABI,
        functionName: "initializeStore",
        args: [
          storeName,
          storeDescription,
          tokenName,
          tokenSymbol,
          initialTokenSupply,
          uniswapV2Router,
          pyusdToken,
          pyusdLiquidity,
        ],
        account: walletAddress,
      });

      console.log("✅ Transaction simulation successful");
    } catch (simulationError) {
      console.error("❌ Transaction simulation failed:", simulationError);
      throw new Error(
        `Transaction would fail: ${
          simulationError instanceof Error
            ? simulationError.message
            : String(simulationError)
        }`
      );
    }

    // Step 5: Initialize the store (contract will pull PYUSD from wallet)
    console.log("🏪 Initializing store...");
    const hash = await walletClient.writeContract({
      address: storeContractAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "initializeStore",
      args: [
        storeName,
        storeDescription,
        tokenName,
        tokenSymbol,
        initialTokenSupply,
        uniswapV2Router,
        pyusdToken,
        pyusdLiquidity,
      ],
      account: walletAddress,
    });

    console.log("🔧 Store initialization transaction submitted:", hash);
    return hash;
  } catch (error) {
    console.error(
      "❌ Error initializing store at address:",
      storeContractAddress
    );
    console.error("Full error details:", error);

    // Try to extract more specific error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      if ("cause" in error) {
        console.error("Error cause:", error.cause);
      }
      if ("data" in error) {
        console.error(
          "Error data:",
          (error as unknown as { data: unknown }).data
        );
      }
    }

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
 * Get store information for a specific store address
 */
export async function getStoreInfoByAddress(
  storeAddress: Address
): Promise<StoreInfo> {
  try {
    const publicClient = getPublicClient();

    // Get basic store info
    const storeInfo = (await publicClient.readContract({
      address: storeAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "getStoreInfo",
    })) as StoreInfo;

    // Get token total supply - skip if RPC doesn't support it
    try {
      const tokenTotalSupply = await getStoreTokenTotalSupply(storeAddress);
      return {
        ...storeInfo,
        tokenTotalSupply,
      };
    } catch (totalSupplyError) {
      console.warn(
        "Could not get token total supply (skipping due to RPC limitations):",
        totalSupplyError
      );
      // Return store info without total supply if it fails
      return storeInfo;
    }
  } catch (error) {
    console.error("Error getting store info for address:", storeAddress, error);
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
 * Add a new product to a specific store
 */
export async function addProductToStore(
  storeAddress: Address,
  name: string,
  description: string,
  price: bigint,
  stock: bigint,
  walletAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();

    console.log("📦 Adding product to store:", {
      storeAddress,
      contractAddress: storeAddress,
      name,
      description,
      price: price.toString(),
      stock: stock.toString(),
      walletAddress,
    });

    const hash = await walletClient.writeContract({
      address: storeAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "addProduct",
      args: [name, description, price, stock],
      account: walletAddress,
    });

    console.log("🔧 Product addition transaction submitted:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Error adding product to store:", storeAddress, error);
    throw error;
  }
}

/**
 * Add a new product to the store (legacy function for single store)
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

/**
 * Get user's token balance for a specific store token
 */
export async function getUserTokenBalance(
  storeAddress: Address,
  userAddress: Address
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();

    // First get the store's token address
    const tokenAddress = (await publicClient.readContract({
      address: storeAddress,
      abi: STORE_CONTRACT_ABI,
      functionName: "storeToken",
    })) as Address;

    // Then get the user's balance of that token using ERC20 balanceOf
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [userAddress],
    });

    return balance as bigint;
  } catch (error) {
    console.error("Error getting user token balance:", error);
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

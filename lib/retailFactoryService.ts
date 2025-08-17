import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  Address,
  decodeEventLog,
} from "viem";
import { getCurrentChain, getContractAddress } from "./contracts";
import { initializeStoreAtAddress, waitForTransaction } from "./storeService";
import { getUniswapV2RouterAddress, getPyusdTokenAddress } from "./contracts";

// Get retail factory address based on current chain
const getRetailFactoryAddress = async (): Promise<Address> => {
  // For now, we'll use the current chain ID detection
  // You might want to make this more dynamic based on wallet connection
  const chainId = getCurrentChain().id;
  return getContractAddress(chainId, "RETAIL_FACTORY");
};

// Retail Factory ABI - you'll need to update this with your actual ABI
export const RETAIL_FACTORY_ABI = [
  {
    type: "function",
    name: "createStore",
    inputs: [],
    outputs: [
      {
        name: "storeAddress",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getStoresByOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address[]",
        internalType: "address[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "storeToOwner",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "StoreDeployed",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "store",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
] as const;

// Create clients
export const getPublicClient = () => {
  const currentChain = getCurrentChain();

  if (typeof window !== "undefined" && window.ethereum) {
    return createPublicClient({
      chain: currentChain,
      transport: custom(window.ethereum),
    });
  }

  const rpcUrl = currentChain.rpcUrls.default.http[0];
  return createPublicClient({
    chain: currentChain,
    transport: http(rpcUrl),
  });
};

export const getWalletClient = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return createWalletClient({
      chain: getCurrentChain(),
      transport: custom(window.ethereum),
    });
  }
  throw new Error("No ethereum provider found");
};

/**
 * Create a new store via the retail factory
 */
export async function createStoreViaFactory(
  walletAddress: Address
): Promise<{ storeAddress: Address; txHash: string }> {
  try {
    const walletClient = getWalletClient();
    const factoryAddress = await getRetailFactoryAddress();

    console.log("🏭 Creating store via Retail Factory...");
    console.log("Caller/Owner:", walletAddress);
    console.log("Factory Address:", factoryAddress);

    const hash = await walletClient.writeContract({
      address: factoryAddress,
      abi: RETAIL_FACTORY_ABI,
      functionName: "createStore",
      args: [], // No arguments needed based on your ABI
      account: walletAddress,
    });

    console.log("🏭 Store creation transaction submitted:", hash);

    // Wait for transaction confirmation
    const publicClient = getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "reverted") {
      throw new Error("Store creation transaction reverted");
    }

    console.log("🏭 Store creation confirmed in block:", receipt.blockNumber);

    // Parse the StoreDeployed event to get the store address
    let storeAddress: Address =
      "0x0000000000000000000000000000000000000000" as Address;

    for (const log of receipt.logs) {
      try {
        // Check if this log is from our factory contract
        if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
          // Parse the StoreDeployed event
          const decodedLog = decodeEventLog({
            abi: RETAIL_FACTORY_ABI,
            eventName: "StoreDeployed",
            topics: log.topics,
            data: log.data,
          });

          if (decodedLog.eventName === "StoreDeployed") {
            storeAddress = decodedLog.args.store;
            console.log("🏭 Extracted store address from event:", storeAddress);
            console.log("🏭 Store owner:", decodedLog.args.owner);
            break;
          }
        }
      } catch (parseError) {
        // Log parsing failed, continue to next log
        console.warn("Failed to parse log:", parseError);
      }
    }

    if (storeAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Failed to extract store address from transaction logs");
    }

    return {
      storeAddress,
      txHash: hash,
    };
  } catch (error) {
    console.error("❌ Error creating store via factory:", error);
    throw error;
  }
}

/**
 * Get all stores owned by an address
 */
export async function getOwnerStores(
  ownerAddress: Address
): Promise<Address[]> {
  try {
    const publicClient = getPublicClient();
    const factoryAddress = await getRetailFactoryAddress();

    const stores = await publicClient.readContract({
      address: factoryAddress,
      abi: RETAIL_FACTORY_ABI,
      functionName: "getStoresByOwner",
      args: [ownerAddress],
    });

    console.log(`📋 Found ${stores.length} stores for owner ${ownerAddress}`);
    return stores as Address[];
  } catch (error) {
    console.error("❌ Error getting owner stores:", error);
    throw error;
  }
}

/**
 * Get the owner of a specific store
 */
export async function getStoreOwner(storeAddress: Address): Promise<Address> {
  try {
    const publicClient = getPublicClient();
    const factoryAddress = await getRetailFactoryAddress();

    const owner = await publicClient.readContract({
      address: factoryAddress,
      abi: RETAIL_FACTORY_ABI,
      functionName: "storeToOwner",
      args: [storeAddress],
    });

    console.log(`📊 Store ${storeAddress} is owned by: ${owner}`);
    return owner as Address;
  } catch (error) {
    console.error("❌ Error getting store owner:", error);
    throw error;
  }
}

/**
 * Complete store setup: Create via factory + Initialize store data
 */
export async function createAndInitializeStore(
  ownerAddress: Address,
  storeName: string,
  storeDescription: string,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: number,
  initialTokenSupply: bigint,
  walletAddress: Address
): Promise<{
  storeAddress: Address;
  createTxHash: string;
  initTxHash: string;
}> {
  try {
    console.log("🚀 Starting complete store creation process...");

    // Step 1: Create store via factory
    const { storeAddress, txHash: createTxHash } = await createStoreViaFactory(
      walletAddress
    );

    console.log("✅ Step 1 complete: Store created at", storeAddress);

    // Step 2: Initialize the store with data
    console.log("🔧 Step 2: Initializing store data...");

    // Get default liquidity values and addresses
    const uniswapRouter = getUniswapV2RouterAddress();
    const pyusdToken = getPyusdTokenAddress();
    const pyusdLiquidity = BigInt(20) * BigInt(10 ** 6); // 20 PYUSD

    const initTxHash = await initializeStoreAtAddress(
      storeAddress,
      storeName,
      storeDescription,
      tokenName,
      tokenSymbol,
      initialTokenSupply,
      uniswapRouter,
      pyusdToken,
      pyusdLiquidity,
      walletAddress
    );

    console.log("🎉 Store creation and initialization complete!");

    return {
      storeAddress,
      createTxHash,
      initTxHash,
    };
  } catch (error) {
    console.error("❌ Error in complete store creation process:", error);
    throw error;
  }
}

// Re-export commonly used functions for convenience
export { waitForTransaction };

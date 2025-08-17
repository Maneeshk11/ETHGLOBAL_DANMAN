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
  TOKEN_FACTORY_ABI,
  ERC20_ABI,
} from "./contracts";

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

// Interface for token creation parameters
export interface CreateTokenParams {
  name: string;
  symbol: string;
  initialSupply: number;
  tokenValue: number; // USD value (for frontend display only)
}

// Interface for token information
export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  totalSupply: string;
  balance: string;
}

/**
 * Create a new token using the factory contract
 */
export async function createToken(
  params: CreateTokenParams,
  walletAddress: Address
): Promise<Address> {
  try {
    const walletClient = getWalletClient();
    const publicClient = getPublicClient();
    const chainId = await getCurrentChainId();
    const tokenFactoryAddress = getContractAddress(chainId, "TOKEN_FACTORY");

    // Convert initial supply to wei (assuming 18 decimals)
    const supplyInWei = parseUnits(params.initialSupply.toString(), 18);

    // Call the createToken function
    const hash = await walletClient.writeContract({
      address: tokenFactoryAddress,
      abi: TOKEN_FACTORY_ABI,
      functionName: "createToken",
      args: [params.name, params.symbol, supplyInWei, walletAddress],
      account: walletAddress,
    });

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Parse the TokenCreated event to get the token address
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: TOKEN_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "TokenCreated") {
          return decoded.args.tokenAddress as Address;
        }
      } catch {
        // Continue if this log doesn't match our event
        continue;
      }
    }

    throw new Error("Token creation event not found");
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

/**
 * Get all tokens created by a specific owner
 */
export async function getTokensForOwner(
  ownerAddress: Address
): Promise<Address[]> {
  try {
    const publicClient = getPublicClient();
    const chainId = await getCurrentChainId();
    const tokenFactoryAddress = getContractAddress(chainId, "TOKEN_FACTORY");

    const tokens = (await publicClient.readContract({
      address: tokenFactoryAddress,
      abi: TOKEN_FACTORY_ABI,
      functionName: "getTokensForOwner",
      args: [ownerAddress],
    })) as Address[];

    return tokens;
  } catch (error) {
    console.error("Error fetching tokens for owner:", error);
    throw error;
  }
}

/**
 * Get detailed information about a token
 */
export async function getTokenInfo(
  tokenAddress: Address,
  ownerAddress: Address
): Promise<TokenInfo> {
  try {
    const publicClient = getPublicClient();
    const [name, symbol, totalSupply, balance] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "name",
      }) as Promise<string>,
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      }) as Promise<string>,
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "totalSupply",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [ownerAddress],
      }) as Promise<bigint>,
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      totalSupply: formatEther(totalSupply),
      balance: formatEther(balance),
    };
  } catch (error) {
    console.error("Error fetching token info:", error);
    throw error;
  }
}

/**
 * Get detailed information for all tokens owned by an address
 */
export async function getAllTokensInfo(
  ownerAddress: Address
): Promise<TokenInfo[]> {
  try {
    const tokenAddresses = await getTokensForOwner(ownerAddress);

    const tokensInfo = await Promise.all(
      tokenAddresses.map((address) => getTokenInfo(address, ownerAddress))
    );

    return tokensInfo;
  } catch (error) {
    console.error("Error fetching all tokens info:", error);
    throw error;
  }
}

/**
 * Transfer tokens to another address
 */
export async function transferToken(
  tokenAddress: Address,
  toAddress: Address,
  amount: string,
  fromAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();

    // Convert amount to wei
    const amountInWei = parseEther(amount);

    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [toAddress, amountInWei],
      account: fromAddress,
    });

    return hash;
  } catch (error) {
    console.error("Error transferring token:", error);
    throw error;
  }
}

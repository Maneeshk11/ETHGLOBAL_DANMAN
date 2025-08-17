import { Address, formatUnits, parseUnits } from "viem";
import { getWalletClient } from "./storeService";
import { getPublicClient } from "./retailFactoryService";
import {
  getUniswapV2RouterAddress,
  getPyusdTokenAddress,
  ERC20_ABI,
} from "./contracts";

// Uniswap V2 Router ABI - focusing on the functions we need
export const UNISWAP_V2_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsIn",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [{ internalType: "uint256[]", name: "amounts", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Extended ERC20 ABI for token operations needed for swapping
export const ERC20_EXTENDED_ABI = [
  ...ERC20_ABI,
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOutMin: bigint;
  recipient: Address;
  deadline: bigint;
}

export interface SwapQuote {
  amountOut: bigint;
  priceImpact: number;
  path: Address[];
}

/**
 * Get token information including name, symbol, decimals, and balance
 */
export async function getTokenInfo(tokenAddress: Address, userAddress: Address) {
  try {
    const publicClient = getPublicClient();

    const [name, symbol, decimals, balance] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "name",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_EXTENDED_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }),
    ]);

    return {
      address: tokenAddress,
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
      balance: balance as bigint,
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    throw error;
  }
}

/**
 * Get a quote for swapping tokens
 */
export async function getSwapQuote(
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint
): Promise<SwapQuote> {
  try {
    const publicClient = getPublicClient();
    const routerAddress = getUniswapV2RouterAddress();

    // Create the swap path (direct swap for now)
    const path = [tokenIn, tokenOut];

    // Get the expected output amount
    const amounts = (await publicClient.readContract({
      address: routerAddress,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [amountIn, path],
    })) as bigint[];

    const amountOut = amounts[amounts.length - 1];

    // Calculate price impact (simplified)
    // This is a basic calculation - in production you'd want more sophisticated price impact calculation
    const priceImpact = 0.5; // Placeholder - should be calculated based on pool reserves

    return {
      amountOut,
      priceImpact,
      path,
    };
  } catch (error) {
    console.error("Error getting swap quote:", error);
    throw error;
  }
}

/**
 * Check if user has sufficient allowance for the router
 */
export async function checkTokenAllowance(
  tokenAddress: Address,
  userAddress: Address,
  spenderAddress: Address
): Promise<bigint> {
  try {
    const publicClient = getPublicClient();

    const allowance = (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_EXTENDED_ABI,
      functionName: "allowance",
      args: [userAddress, spenderAddress],
    })) as bigint;

    return allowance;
  } catch (error) {
    console.error("Error checking token allowance:", error);
    throw error;
  }
}

/**
 * Approve token spending for the router
 */
export async function approveToken(
  tokenAddress: Address,
  spenderAddress: Address,
  amount: bigint,
  userAddress: Address
): Promise<string> {
  try {
    const walletClient = getWalletClient();

    console.log("🔒 Approving token spending:", {
      token: tokenAddress,
      spender: spenderAddress,
      amount: amount.toString(),
      user: userAddress,
    });

    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_EXTENDED_ABI,
      functionName: "approve",
      args: [spenderAddress, amount],
      account: userAddress,
    });

    console.log("✅ Token approval submitted:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Error approving token:", error);
    throw error;
  }
}

/**
 * Execute a token swap using Uniswap V2
 */
export async function executeSwap(params: SwapParams): Promise<string> {
  try {
    const walletClient = getWalletClient();
    const routerAddress = getUniswapV2RouterAddress();

    // Create the swap path
    const path = [params.tokenIn, params.tokenOut];

    console.log("🔄 Executing token swap:", {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn.toString(),
      amountOutMin: params.amountOutMin.toString(),
      recipient: params.recipient,
      deadline: params.deadline.toString(),
      path,
    });

    const hash = await walletClient.writeContract({
      address: routerAddress,
      abi: UNISWAP_V2_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [
        params.amountIn,
        params.amountOutMin,
        path,
        params.recipient,
        params.deadline,
      ],
      account: params.recipient,
    });

    console.log("✅ Swap transaction submitted:", hash);
    return hash;
  } catch (error) {
    console.error("❌ Error executing swap:", error);
    throw error;
  }
}

/**
 * Get user's PYUSD balance
 */
export async function getPyusdBalance(userAddress: Address): Promise<bigint> {
  try {
    const pyusdAddress = getPyusdTokenAddress();
    const tokenInfo = await getTokenInfo(pyusdAddress, userAddress);
    return tokenInfo.balance;
  } catch (error) {
    console.error("Error getting PYUSD balance:", error);
    throw error;
  }
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  displayDecimals: number = 4
): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  return num.toFixed(displayDecimals);
}

/**
 * Parse token amount from string to bigint
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Calculate deadline for swap (current time + minutes)
 */
export function getSwapDeadline(minutesFromNow: number = 20): bigint {
  const now = Math.floor(Date.now() / 1000);
  return BigInt(now + minutesFromNow * 60);
}

/**
 * Calculate minimum amount out with slippage tolerance
 */
export function calculateMinAmountOut(
  amountOut: bigint,
  slippagePercent: number = 0.5
): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100)); // Convert to basis points
  const slippageAmount = (amountOut * slippageBps) / BigInt(10000);
  return amountOut - slippageAmount;
}

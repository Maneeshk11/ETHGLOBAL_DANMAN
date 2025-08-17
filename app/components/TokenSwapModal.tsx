"use client";

import { useState, useEffect } from "react";
import { Address } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAccount } from "wagmi";
import {
  getTokenInfo,
  getSwapQuote,
  checkTokenAllowance,
  approveToken,
  executeSwap,
  formatTokenAmount,
  parseTokenAmount,
  getSwapDeadline,
  calculateMinAmountOut,
  getPyusdBalance,
} from "../../lib/uniswapV2";
import {
  getPyusdTokenAddress,
  getUniswapV2RouterAddress,
} from "../../lib/contracts";
import { waitForTransaction } from "../../lib/storeService";

interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
}

interface SwapQuote {
  amountOut: bigint;
  priceImpact: number;
  path: Address[];
}

interface TokenSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeTokenAddress: Address;
}

type SwapDirection = "store-to-pyusd" | "pyusd-to-store";

export default function TokenSwapModal({
  isOpen,
  onClose,
  storeTokenAddress,
}: TokenSwapModalProps) {
  const { address } = useAccount();

  // Token information
  const [storeToken, setStoreToken] = useState<TokenInfo | null>(null);
  const [pyusdToken, setPyusdToken] = useState<TokenInfo | null>(null);

  // Swap state
  const [swapDirection, setSwapDirection] = useState<SwapDirection>(
    "store-to-pyusd"
  );
  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5);

  // UI state
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isGettingQuote, setIsGettingQuote] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  // Check allowances
  const [needsApproval, setNeedsApproval] = useState(false);
  const [allowanceChecked, setAllowanceChecked] = useState(false);

  // Load token information
  useEffect(() => {
    if (isOpen && address) {
      loadTokenInformation();
    }
  }, [isOpen, address, storeTokenAddress]);

  // Get quote when input amount changes
  useEffect(() => {
    if (inputAmount && !isNaN(parseFloat(inputAmount)) && parseFloat(inputAmount) > 0) {
      getQuote();
    } else {
      setOutputAmount("");
      setQuote(null);
    }
  }, [inputAmount, swapDirection, storeToken, pyusdToken]);

  // Check allowance when quote is available
  useEffect(() => {
    if (quote && address && !allowanceChecked) {
      checkAllowance();
    }
  }, [quote, address, swapDirection]);

  const loadTokenInformation = async () => {
    if (!address) return;

    setIsLoadingTokens(true);
    setError(null);

    try {
      const pyusdAddress = getPyusdTokenAddress();

      const [storeTokenInfo, pyusdTokenInfo] = await Promise.all([
        getTokenInfo(storeTokenAddress, address),
        getTokenInfo(pyusdAddress, address),
      ]);

      setStoreToken(storeTokenInfo);
      setPyusdToken(pyusdTokenInfo);
    } catch (err) {
      console.error("Error loading token information:", err);
      setError("Failed to load token information");
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const getQuote = async () => {
    if (!storeToken || !pyusdToken || !inputAmount) return;

    setIsGettingQuote(true);
    setError(null);

    try {
      const fromToken = swapDirection === "store-to-pyusd" ? storeToken : pyusdToken;
      const toToken = swapDirection === "store-to-pyusd" ? pyusdToken : storeToken;
      
      const amountIn = parseTokenAmount(inputAmount, fromToken.decimals);
      
      // Check if user has sufficient balance
      if (amountIn > fromToken.balance) {
        setError(`Insufficient ${fromToken.symbol} balance`);
        setOutputAmount("");
        setQuote(null);
        return;
      }

      const swapQuote = await getSwapQuote(
        fromToken.address,
        toToken.address,
        amountIn
      );

      setQuote(swapQuote);
      setOutputAmount(
        formatTokenAmount(swapQuote.amountOut, toToken.decimals, 6)
      );
      setAllowanceChecked(false); // Reset allowance check when quote changes
    } catch (err) {
      console.error("Error getting quote:", err);
      setError("Failed to get swap quote. Pool may not exist.");
      setOutputAmount("");
      setQuote(null);
    } finally {
      setIsGettingQuote(false);
    }
  };

  const checkAllowance = async () => {
    if (!address || !quote || !storeToken || !pyusdToken) return;

    try {
      const routerAddress = getUniswapV2RouterAddress();
      const fromToken = swapDirection === "store-to-pyusd" ? storeToken : pyusdToken;
      const amountIn = parseTokenAmount(inputAmount, fromToken.decimals);

      const allowance = await checkTokenAllowance(
        fromToken.address,
        address,
        routerAddress
      );

      setNeedsApproval(allowance < amountIn);
      setAllowanceChecked(true);
    } catch (err) {
      console.error("Error checking allowance:", err);
      setError("Failed to check token allowance");
    }
  };

  const handleApprove = async () => {
    if (!address || !storeToken || !pyusdToken) return;

    setIsApproving(true);
    setError(null);

    try {
      const routerAddress = getUniswapV2RouterAddress();
      const fromToken = swapDirection === "store-to-pyusd" ? storeToken : pyusdToken;
      const amountIn = parseTokenAmount(inputAmount, fromToken.decimals);

      // Approve a bit more than needed to avoid frequent approvals
      const approvalAmount = amountIn * BigInt(2);

      const hash = await approveToken(
        fromToken.address,
        routerAddress,
        approvalAmount,
        address
      );

      setTxHash(hash);
      setTxStatus("pending");

      // Wait for approval transaction
      await waitForTransaction(hash as `0x${string}`);
      
      setTxStatus("success");
      setNeedsApproval(false);
      
      // Refresh allowance
      await checkAllowance();
    } catch (err) {
      console.error("Error approving token:", err);
      setError("Failed to approve token. Please try again.");
      setTxStatus("error");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!address || !quote || !storeToken || !pyusdToken) return;

    setIsSwapping(true);
    setError(null);

    try {
      const fromToken = swapDirection === "store-to-pyusd" ? storeToken : pyusdToken;
      const amountIn = parseTokenAmount(inputAmount, fromToken.decimals);
      const minAmountOut = calculateMinAmountOut(quote.amountOut, slippage);
      const deadline = getSwapDeadline(20); // 20 minutes from now

      const hash = await executeSwap({
        tokenIn: fromToken.address,
        tokenOut: swapDirection === "store-to-pyusd" ? pyusdToken.address : storeToken.address,
        amountIn,
        amountOutMin: minAmountOut,
        recipient: address,
        deadline,
      });

      setTxHash(hash);
      setTxStatus("pending");

      // Wait for swap transaction
      await waitForTransaction(hash as `0x${string}`);
      
      setTxStatus("success");
      
      // Refresh token balances
      await loadTokenInformation();
      
      // Reset form
      setInputAmount("");
      setOutputAmount("");
      setQuote(null);
    } catch (err) {
      console.error("Error executing swap:", err);
      setError("Swap failed. Please try again.");
      setTxStatus("error");
    } finally {
      setIsSwapping(false);
    }
  };

  const handleDirectionToggle = () => {
    setSwapDirection(prev => 
      prev === "store-to-pyusd" ? "pyusd-to-store" : "store-to-pyusd"
    );
    setInputAmount("");
    setOutputAmount("");
    setQuote(null);
    setAllowanceChecked(false);
    setNeedsApproval(false);
  };

  const handleMaxClick = () => {
    if (!storeToken || !pyusdToken) return;
    
    const token = swapDirection === "store-to-pyusd" ? storeToken : pyusdToken;
    const maxAmount = formatTokenAmount(token.balance, token.decimals, 6);
    setInputAmount(maxAmount);
  };

  const handleClose = () => {
    setInputAmount("");
    setOutputAmount("");
    setQuote(null);
    setError(null);
    setTxHash(null);
    setTxStatus("idle");
    setAllowanceChecked(false);
    setNeedsApproval(false);
    onClose();
  };

  const isSwapDisabled = !quote || needsApproval || isSwapping || isApproving || 
    !inputAmount || parseFloat(inputAmount) <= 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Token Swap
          </DialogTitle>
          <DialogDescription>
            Swap between store tokens and PYUSD using Uniswap V2
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoadingTokens ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading tokens...</span>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* From Token */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">From</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {swapDirection === "store-to-pyusd" 
                          ? storeToken?.symbol || "STORE"
                          : "PYUSD"
                        }
                      </Badge>
                      {storeToken && pyusdToken && (
                        <span className="text-xs text-muted-foreground">
                          Balance: {formatTokenAmount(
                            swapDirection === "store-to-pyusd" 
                              ? storeToken.balance 
                              : pyusdToken.balance,
                            swapDirection === "store-to-pyusd" 
                              ? storeToken.decimals 
                              : pyusdToken.decimals,
                            4
                          )}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMaxClick}
                      className="h-6 px-2 text-xs"
                    >
                      MAX
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Swap Direction Toggle */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDirectionToggle}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              {/* To Token */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">To</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {swapDirection === "store-to-pyusd" 
                        ? "PYUSD"
                        : storeToken?.symbol || "STORE"
                      }
                    </Badge>
                    {storeToken && pyusdToken && (
                      <span className="text-xs text-muted-foreground">
                        Balance: {formatTokenAmount(
                          swapDirection === "store-to-pyusd" 
                            ? pyusdToken.balance 
                            : storeToken.balance,
                          swapDirection === "store-to-pyusd" 
                            ? pyusdToken.decimals 
                            : storeToken.decimals,
                          4
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={outputAmount}
                      readOnly
                      className="text-lg bg-muted"
                    />
                    {isGettingQuote && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quote Info */}
              {quote && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price Impact:</span>
                        <span className={quote.priceImpact > 5 ? "text-red-500" : ""}>
                          ~{quote.priceImpact.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Slippage:</span>
                        <span>{slippage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Minimum received:</span>
                        <span>
                          {quote && formatTokenAmount(
                            calculateMinAmountOut(quote.amountOut, slippage),
                            swapDirection === "store-to-pyusd" 
                              ? pyusdToken?.decimals || 18
                              : storeToken?.decimals || 18,
                            6
                          )} {swapDirection === "store-to-pyusd" ? "PYUSD" : storeToken?.symbol}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Transaction Status */}
              {txHash && txStatus !== "idle" && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  {txStatus === "pending" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                  {txStatus === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {txStatus === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {txStatus === "pending" && "Transaction pending..."}
                      {txStatus === "success" && "Transaction successful!"}
                      {txStatus === "error" && "Transaction failed"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {needsApproval && allowanceChecked && (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Approving...
                      </>
                    ) : (
                      `Approve ${swapDirection === "store-to-pyusd" ? storeToken?.symbol : "PYUSD"}`
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleSwap}
                  disabled={isSwapDisabled}
                  className="w-full"
                >
                  {isSwapping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Swapping...
                    </>
                  ) : (
                    "Swap Tokens"
                  )}
                </Button>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                onClick={loadTokenInformation}
                disabled={isLoadingTokens}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTokens ? "animate-spin" : ""}`} />
                Refresh Balances
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

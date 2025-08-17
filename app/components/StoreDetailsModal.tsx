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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Store, Coins, Users, Package } from "lucide-react";

interface StoreInfo {
  name: string;
  description: string;
  isActive: boolean;
  tokenAddress: Address;
  tokenBalance?: bigint;
  tokenTotalSupply?: bigint;
  createdAt?: bigint;
}

interface StoreDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeAddress: Address;
  ownerAddress: Address;
  storeInfo?: {
    name: string;
    description: string;
    isActive: boolean;
    tokenAddress: Address;
  };
}

export default function StoreDetailsModal({
  isOpen,
  onClose,
  storeAddress,
  ownerAddress,
  storeInfo,
}: StoreDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<StoreInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Load detailed store information when modal opens
  useEffect(() => {
    if (isOpen && storeAddress) {
      loadDetailedStoreInfo();
    }
  }, [isOpen, storeAddress]);

  const loadDetailedStoreInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get detailed store info - but gracefully handle RPC limitations
      const { getStoreInfoByAddress } = await import("../../lib/storeService");
      const info = await getStoreInfoByAddress(storeAddress);
      console.log("✅ Successfully loaded detailed store info:", info);
      setDetailedInfo(info);
    } catch (err) {
      console.warn(
        "⚠️ Could not load detailed store info due to RPC limitations:",
        err
      );
      setError(
        "Some store details unavailable due to RPC provider limitations"
      );

      // Use the basic info we already have as fallback
      if (storeInfo) {
        setDetailedInfo({
          name: storeInfo.name,
          description: storeInfo.description,
          isActive: storeInfo.isActive,
          tokenAddress: storeInfo.tokenAddress,
          // Don't try to get tokenBalance or tokenTotalSupply that might fail
        });
      } else {
        // If no basic info either, create minimal fallback
        setDetailedInfo({
          name: "Store Details",
          description: "Store information limited due to RPC constraints",
          isActive: true,
          tokenAddress: "0x0000000000000000000000000000000000000000" as Address,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBigInt = (value: bigint | undefined) => {
    if (!value) return "N/A";
    return value.toString();
  };

  const formatDate = (timestamp: bigint | undefined) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {detailedInfo?.name || storeInfo?.name || "Store Details"}
          </DialogTitle>
          <DialogDescription>
            {detailedInfo?.description ||
              storeInfo?.description ||
              "Store information and details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center gap-3">
            <Badge
              variant={
                detailedInfo?.isActive || storeInfo?.isActive
                  ? "default"
                  : "secondary"
              }
              className={`${
                detailedInfo?.isActive || storeInfo?.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {detailedInfo?.isActive || storeInfo?.isActive
                ? "Active"
                : "Inactive"}
            </Badge>
            {error && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                Limited Info
              </Badge>
            )}
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">{error}</p>
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="token">Token</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Store Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Store Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Contract Address:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {formatAddress(storeAddress)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(storeAddress)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Owner:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {formatAddress(ownerAddress)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(ownerAddress)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {detailedInfo?.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Created:
                        </span>
                        <span className="text-sm">
                          {formatDate(detailedInfo.createdAt)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Token Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Token Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailedInfo?.tokenAddress &&
                    detailedInfo.tokenAddress !==
                      "0x0000000000000000000000000000000000000000" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Token Address:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {formatAddress(detailedInfo.tokenAddress)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(detailedInfo.tokenAddress)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {detailedInfo.tokenBalance && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Store Balance:
                            </span>
                            <span className="text-sm font-medium">
                              {formatBigInt(detailedInfo.tokenBalance)}
                            </span>
                          </div>
                        )}
                        {detailedInfo.tokenTotalSupply && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              Total Supply:
                            </span>
                            <span className="text-sm font-medium">
                              {formatBigInt(detailedInfo.tokenTotalSupply)}
                            </span>
                          </div>
                        )}
                        {!detailedInfo.tokenBalance &&
                          !detailedInfo.tokenTotalSupply && (
                            <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                              💡 Token balance and supply info may be limited
                              due to RPC constraints
                            </div>
                          )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Token information not available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="token" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Token Details</CardTitle>
                  <CardDescription>
                    Detailed information about the store token
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading token details...
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Token management and trading features will be available
                      here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products
                  </CardTitle>
                  <CardDescription>
                    Products available in this store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Product listing and management features will be available
                    here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Analytics
                  </CardTitle>
                  <CardDescription>
                    Store performance and customer analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Analytics and insights will be available here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://sepolia.etherscan.io/address/${storeAddress}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Etherscan
              </Button>
              <Button>Shop Now</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

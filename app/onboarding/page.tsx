"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

// Import step components
import { WalletConnection } from "./components/WalletConnection";
import { ShopInformation } from "./components/ShopInformation";
import { ShopDetails } from "./components/ShopDetails";
import { ProgressIndicator } from "./components/ProgressIndicator";

const TOTAL_STEPS = 3; // Reduced from 4 to 3

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Redirect to dashboard
    router.push("/dashboard");
  };

  const handleWalletConnect = () => {
    handleNext();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <WalletConnection onConnect={handleWalletConnect} />;
      case 2:
        return <ShopInformation />;
      case 3:
        return <ShopDetails />;
      default:
        return <WalletConnection onConnect={handleWalletConnect} />;
    }
  };

  const isNextDisabled = currentStep === 1 && !isConnected;
  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <div className="w-full relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cyberpunk Background Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url('/background-pattern.svg')`,
          backgroundRepeat: "repeat",
          backgroundSize: "400px 400px",
          animation: "backgroundFloat 20s ease-in-out infinite",
        }}
      />

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-md bg-black/40 border-purple-500/30 shadow-2xl shadow-purple-500/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome to Block Bazaar!
            </CardTitle>
            <CardDescription className="text-gray-300">
              Set up your retail shop to start generating tokens for your
              customers
            </CardDescription>
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
            />
          </CardHeader>

          <CardContent>
            <div className="min-h-[300px]">{renderCurrentStep()}</div>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="w-full sm:w-auto border-purple-500/50 text-white hover:bg-purple-500/20"
              >
                Back
              </Button>

              {!isLastStep ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleComplete}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSS for background animation */}
      <style jsx>{`
        @keyframes backgroundFloat {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-10px, -10px) scale(1.02);
          }
          66% {
            transform: translate(10px, -5px) scale(0.98);
          }
        }
      `}</style>
    </div>
  );
}

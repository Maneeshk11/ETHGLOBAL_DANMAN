import type { Metadata } from "next";
import { Fira_Code, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { AutoReconnect } from "../lib/components/AutoReconnect";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Block Bazaar",
  description:
    "Discover and trade retail tokens in the decentralized marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${firaCode.variable} ${playfairDisplay.variable} antialiased font-sans`}
      >
        <Providers>
          <AutoReconnect />
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "DKE Financial Platform",
  description: "Dues and budget management for Delta Kappa Epsilon chapters",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} dark h-full`}>
        <body className="min-h-full bg-background text-foreground antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

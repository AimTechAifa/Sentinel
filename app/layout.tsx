import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { NavigationProgressProvider } from "@/components/layout/NavigationProgress";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Sentinel — Release Command Center",
  description: "AI-powered release command center for software engineering teams",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <NavigationProgressProvider>{children}</NavigationProgressProvider>
      </body>
    </html>
  );
}

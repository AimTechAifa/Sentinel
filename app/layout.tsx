import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { NavigationProgressProvider } from "@/components/layout/NavigationProgress";
import { MuiThemeProvider } from "@/components/providers/MuiThemeProvider";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Sentinel — Release Management",
  description: "AI-powered release command center for software engineering teams",
  icons: {
    icon: "/sentinel-logo.png",
    apple: "/sentinel-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <MuiThemeProvider>
          <NavigationProgressProvider>{children}</NavigationProgressProvider>
        </MuiThemeProvider>
      </body>
    </html>
  );
}

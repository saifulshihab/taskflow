import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Plan work, track tasks, keep the trail.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Suspense
            fallback={
              <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
                Loading…
              </div>
            }
          >
            <AuthGuard>{children}</AuthGuard>
          </Suspense>
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

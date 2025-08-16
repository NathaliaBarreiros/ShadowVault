import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/AuthProvider"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { CDPProvider } from "@/components/providers/CDPProvider"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "ShadowVault - Secure Password Manager",
  description: "Revolutionary password manager with AI-powered security and cross-chain access",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans antialiased">
        <CDPProvider>
          <AuthProvider>
            <TooltipProvider>
              <AuthGuard>
                {children}
              </AuthGuard>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </CDPProvider>
      </body>
    </html>
  )
}

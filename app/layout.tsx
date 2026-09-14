import type { Metadata } from "next"
import "./globals.css"

import { TooltipProvider } from "@/components/ui/tooltip"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "MFITZ — LLM Self-Hosting Capacity Planner",
  description:
    "Estimate GPU VRAM, KV-cache memory, concurrency, and inference throughput for self-hosted LLMs before you buy hardware. Free, client-side, no data leaves your browser.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <TooltipProvider>
          <SiteHeader />
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}

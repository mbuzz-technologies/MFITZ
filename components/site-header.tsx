"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Gauge, Menu } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const NAV_LINKS = [
  { href: "/calculator", label: "Calculator" },
  { href: "/reverse", label: "Reverse Lookup" },
  { href: "/compare", label: "Compare" },
  { href: "/gpus", label: "GPUs" },
  { href: "/models", label: "Models" },
  { href: "/docs", label: "Docs" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Gauge className="h-4 w-4" />
          </span>
          Ballast
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent",
                  active && "text-foreground bg-accent"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation menu">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-border px-4 py-2 flex flex-col gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

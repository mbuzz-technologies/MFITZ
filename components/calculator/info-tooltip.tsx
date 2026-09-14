"use client"

import { Info } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger type="button" className="inline-flex align-middle text-muted-foreground hover:text-foreground transition-colors">
        <Info className="h-3.5 w-3.5" />
        <span className="sr-only">More information</span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

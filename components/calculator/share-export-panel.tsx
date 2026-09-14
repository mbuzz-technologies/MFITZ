"use client"

import * as React from "react"
import { Link2, Download, Printer, Check } from "lucide-react"

import { CalculatorState } from "@/lib/types/calculator"
import { CalculatorResults } from "@/lib/calculations/engine"
import { encodeUrlState } from "@/lib/utils/url-state"
import { downloadJson, printReport } from "@/lib/export"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function ShareExportPanel({ state, results }: { state: CalculatorState; results: CalculatorResults }) {
  const [copied, setCopied] = React.useState(false)
  const [shareUrl, setShareUrl] = React.useState("")

  React.useEffect(() => {
    setShareUrl(typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}${encodeUrlState(state)}` : "")
  }, [state])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API unavailable — the input itself is already selectable
    }
  }

  function exportJson() {
    downloadJson(`ballast-config-${state.model}-${Date.now()}.json`, {
      generatedBy: "Ballast — LLM self-hosting capacity planner",
      generatedAt: new Date().toISOString(),
      configuration: state,
      results: {
        gpu: results.gpu,
        model: results.model,
        modelMemoryGiB: results.modelMemory.estimatedGiB,
        kvCachePerRequestGiB: results.kvPerRequestTypical.typicalGiB,
        vramTypical: results.vramTypical,
        vramWorstCase: results.vramWorstCase,
        fitStatus: results.fitStatus,
        concurrency: results.concurrency,
        performance: results.performance,
        multiGpu: results.multiGpu,
      },
      disclaimer:
        "Estimates only. Real-world results vary with inference framework, CUDA/kernel implementation, batching, context usage, KV precision, memory fragmentation, and GPU topology.",
    })
  }

  return (
    <Card className="no-print">
      <CardHeader>
        <CardTitle>Share &amp; export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} className="text-xs" />
          <Button size="sm" variant="outline" onClick={copyLink} title="Copy shareable link">
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" className="flex-1" onClick={exportJson}>
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button size="sm" variant="secondary" className="flex-1" onClick={printReport}>
            <Printer className="h-4 w-4" />
            Print report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

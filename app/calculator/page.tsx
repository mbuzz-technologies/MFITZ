/**
 * Main calculator page: configuration panel (left) → results dashboard
 * (right). Configuration is mirrored into the URL query string so any
 * setup — including custom GPU/model entries — can be shared or bookmarked.
 */

"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { CalculatorState } from "@/lib/types/calculator"
import { decodeUrlState, encodeUrlState } from "@/lib/utils/url-state"
import { useCalculatorResults } from "@/lib/hooks/use-calculator-results"

import { GpuConfigPanel } from "@/components/calculator/gpu-config-panel"
import { ModelConfigPanel } from "@/components/calculator/model-config-panel"
import { InferenceConfigPanel } from "@/components/calculator/inference-config-panel"
import { ResultsDashboard } from "@/components/calculator/results-dashboard"
import { QuickPresets } from "@/components/calculator/quick-presets"
import { SaveLoadPanel } from "@/components/calculator/save-load-panel"
import { ShareExportPanel } from "@/components/calculator/share-export-panel"
import { ModeToggle } from "@/components/calculator/mode-toggle"

export default function CalculatorPage() {
  return (
    <Suspense fallback={null}>
      <Calculator />
    </Suspense>
  )
}

function Calculator() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<CalculatorState>(() => decodeUrlState(searchParams.toString()))

  useEffect(() => {
    const encoded = encodeUrlState(state)
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${encoded}`)
  }, [state])

  const results = useCalculatorResults(state)

  function update<K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  return (
    <main className="container py-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Capacity calculator</h1>
          <p className="text-sm text-muted-foreground">Configure hardware, model, and inference settings — results update live.</p>
        </div>
        <ModeToggle mode={state.mode} onChange={(mode) => update("mode", mode)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
        <div className="space-y-4 no-print">
          <GpuConfigPanel state={state} update={update} />
          <ModelConfigPanel state={state} update={update} />
          <InferenceConfigPanel state={state} update={update} />
          <QuickPresets onSelect={setState} />
          <SaveLoadPanel state={state} onLoad={setState} />
          <ShareExportPanel state={state} results={results} />
        </div>

        <ResultsDashboard state={state} results={results} />
      </div>
    </main>
  )
}

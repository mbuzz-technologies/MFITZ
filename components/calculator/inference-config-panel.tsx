"use client"

import { SlidersHorizontal } from "lucide-react"

import { CalculatorState, KV_PRECISIONS } from "@/lib/types/calculator"
import { contextPresets } from "@/lib/presets"
import { formatPct } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfoTooltip } from "@/components/calculator/info-tooltip"

type Updater = <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => void

export function InferenceConfigPanel({ state, update }: { state: CalculatorState; update: Updater }) {
  const advanced = state.mode === "advanced"

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <CardTitle>Inference</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="context-select">Context length</Label>
            <InfoTooltip text="Maximum sequence length (prompt + generation) the model is configured to handle. Longer contexts need more KV cache and slow down generation." />
          </div>
          <Select value={String(state.contextTokens)} onValueChange={(v) => update("contextTokens", Number(v))}>
            <SelectTrigger id="context-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contextPresets.map((p) => (
                <SelectItem key={p.label} value={String(p.tokens)}>
                  {p.label} tokens
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Label>Average context utilization</Label>
              <InfoTooltip text="Real workloads rarely fill the entire context window. This scales the 'typical' KV-cache estimate; the 'worst case' estimate always assumes 100%." />
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">{formatPct(state.averageUtilization)}</span>
          </div>
          <Slider
            value={[state.averageUtilization]}
            min={0.1}
            max={1}
            step={0.05}
            onValueChange={([v]) => update("averageUtilization", v)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="kv-precision-select">KV-cache precision</Label>
            <InfoTooltip text="The numeric precision used to store cached keys/values. Lower precision reduces KV-cache memory, usually with a smaller quality impact than weight quantization." />
          </div>
          <Select value={state.kvPrecision} onValueChange={(v) => update("kvPrecision", v as CalculatorState["kvPrecision"])}>
            <SelectTrigger id="kv-precision-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KV_PRECISIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="concurrency-input">Target concurrent requests</Label>
            <InfoTooltip text="How many requests you want in flight at once. Drives the total KV-cache budget alongside recommended sustainable concurrency below." />
          </div>
          <Input
            id="concurrency-input"
            type="number"
            min={1}
            value={state.concurrentRequests}
            onChange={(e) => update("concurrentRequests", Math.max(1, Number(e.target.value)))}
          />
        </div>

        {advanced && (
          <div className="space-y-5 rounded-md border border-dashed border-border p-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label>KV-cache overhead</Label>
                  <InfoTooltip text="Allocator fragmentation and padding on top of the raw architecture-aware KV-cache calculation." />
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{formatPct(state.kvCacheOverheadPct)}</span>
              </div>
              <Slider
                value={[state.kvCacheOverheadPct]}
                min={0}
                max={0.5}
                step={0.01}
                onValueChange={([v]) => update("kvCacheOverheadPct", v)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label>System / framework overhead</Label>
                  <InfoTooltip text="VRAM reserved by the CUDA context, inference server runtime, and general memory fragmentation — modeled as a percentage of total VRAM." />
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{formatPct(state.systemOverheadPct)}</span>
              </div>
              <Slider
                value={[state.systemOverheadPct]}
                min={0}
                max={0.4}
                step={0.01}
                onValueChange={([v]) => update("systemOverheadPct", v)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label>Concurrency safety margin</Label>
                  <InfoTooltip text="How far below the theoretical maximum concurrency to recommend running sustainably, to leave headroom for fragmentation and bursty request sizes." />
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{formatPct(state.safetyMarginPct)}</span>
              </div>
              <Slider
                value={[state.safetyMarginPct]}
                min={0}
                max={0.6}
                step={0.05}
                onValueChange={([v]) => update("safetyMarginPct", v)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

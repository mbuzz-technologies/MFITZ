"use client"

import { Cpu } from "lucide-react"

import { CalculatorState, GpuSpec, GPU_CUSTOM_ID } from "@/lib/types/calculator"
import { gpuDatabase } from "@/lib/presets"
import { customGpuSchema } from "@/lib/validation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { InfoTooltip } from "@/components/calculator/info-tooltip"

type Updater = <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => void

const GPU_COUNT_OPTIONS = [1, 2, 4, 8, 16]

export function GpuConfigPanel({ state, update }: { state: CalculatorState; update: Updater }) {
  const gpusByManufacturer = Object.values(gpuDatabase).reduce<Record<string, GpuSpec[]>>((acc, gpu) => {
    ;(acc[gpu.manufacturer] ??= []).push(gpu)
    return acc
  }, {})

  const isCustom = state.gpu === GPU_CUSTOM_ID
  const validation = customGpuSchema.safeParse(state.customGpu)
  const fieldError = (field: string) =>
    !validation.success ? validation.error.issues.find((i) => i.path[0] === field)?.message : undefined

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Cpu className="h-4 w-4 text-primary" />
        <CardTitle>Hardware</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="gpu-select">GPU model</Label>
          <Select value={state.gpu} onValueChange={(v) => update("gpu", v)}>
            <SelectTrigger id="gpu-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(gpusByManufacturer).map(([manufacturer, gpus]) => (
                <SelectGroup key={manufacturer}>
                  <SelectLabel>{manufacturer}</SelectLabel>
                  {gpus.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} — {g.vramGiB} GiB, {g.memoryBandwidthGBs.toLocaleString()} GB/s
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              <SelectGroup>
                <SelectLabel>Other</SelectLabel>
                <SelectItem value={GPU_CUSTOM_ID}>Custom GPU…</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {isCustom && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-dashed border-border p-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="custom-gpu-name">Name</Label>
              <Input
                id="custom-gpu-name"
                value={state.customGpu.name}
                onChange={(e) => update("customGpu", { ...state.customGpu, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-gpu-vram">VRAM (GiB)</Label>
              <Input
                id="custom-gpu-vram"
                type="number"
                min={1}
                value={state.customGpu.vramGiB}
                onChange={(e) => update("customGpu", { ...state.customGpu, vramGiB: Number(e.target.value) })}
              />
              {fieldError("vramGiB") && <p className="text-xs text-destructive">{fieldError("vramGiB")}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-gpu-bw">Bandwidth (GB/s)</Label>
              <Input
                id="custom-gpu-bw"
                type="number"
                min={1}
                value={state.customGpu.memoryBandwidthGBs}
                onChange={(e) => update("customGpu", { ...state.customGpu, memoryBandwidthGBs: Number(e.target.value) })}
              />
              {fieldError("memoryBandwidthGBs") && <p className="text-xs text-destructive">{fieldError("memoryBandwidthGBs")}</p>}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="gpu-count">Number of GPUs</Label>
            <InfoTooltip text="Multiple GPUs add up their VRAM linearly, but throughput scales sub-linearly due to interconnect/communication overhead between GPUs." />
          </div>
          <Select value={String(state.gpuCount)} onValueChange={(v) => update("gpuCount", Number(v))}>
            <SelectTrigger id="gpu-count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GPU_COUNT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} GPU{n > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

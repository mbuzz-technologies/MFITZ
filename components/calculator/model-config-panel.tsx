"use client"

import { BrainCircuit } from "lucide-react"

import { CalculatorState, MODEL_CUSTOM_ID, QUANTIZATION_FORMATS, QuantizationPresets } from "@/lib/types/calculator"
import { modelDatabase } from "@/lib/presets"
import { customModelSchema } from "@/lib/validation"
import { formatParams } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfoTooltip } from "@/components/calculator/info-tooltip"
import { Badge } from "@/components/ui/badge"

type Updater = <K extends keyof CalculatorState>(key: K, value: CalculatorState[K]) => void

export function ModelConfigPanel({ state, update }: { state: CalculatorState; update: Updater }) {
  const isCustom = state.model === MODEL_CUSTOM_ID
  const selectedModel = modelDatabase[state.model]
  const validation = customModelSchema.safeParse(state.customModel)
  const fieldError = (field: string) =>
    !validation.success ? validation.error.issues.find((i) => i.path[0] === field)?.message : undefined

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <BrainCircuit className="h-4 w-4 text-primary" />
        <CardTitle>Model</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="model-select">Model / preset</Label>
          <Select value={state.model} onValueChange={(v) => update("model", v)}>
            <SelectTrigger id="model-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(modelDatabase).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} {m.isMoE ? "(MoE)" : ""} — {formatParams(m.parameters)} params
                </SelectItem>
              ))}
              <SelectItem value={MODEL_CUSTOM_ID}>Custom model…</SelectItem>
            </SelectContent>
          </Select>
          {selectedModel?.isMoE && !isCustom && (
            <p className="text-xs text-muted-foreground">
              MoE: {formatParams(selectedModel.activeParameters ?? selectedModel.parameters)} active of{" "}
              {formatParams(selectedModel.parameters)} total params ({selectedModel.experts} experts,{" "}
              {selectedModel.expertsPerToken} routed per token). All expert weights stay resident in VRAM; only the
              active ones are used for compute/performance estimates.
            </p>
          )}
        </div>

        {isCustom && (
          <div className="space-y-3 rounded-md border border-dashed border-border p-3">
            <div className="space-y-1.5">
              <Label htmlFor="custom-model-name">Name</Label>
              <Input
                id="custom-model-name"
                value={state.customModel.name}
                onChange={(e) => update("customModel", { ...state.customModel, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="custom-model-params">Total parameters</Label>
                <Input
                  id="custom-model-params"
                  type="number"
                  min={1}
                  value={state.customModel.parameters}
                  onChange={(e) => update("customModel", { ...state.customModel, parameters: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-model-layers">Layers</Label>
                <Input
                  id="custom-model-layers"
                  type="number"
                  min={1}
                  value={state.customModel.layers}
                  onChange={(e) => update("customModel", { ...state.customModel, layers: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-model-heads">Attention heads</Label>
                <Input
                  id="custom-model-heads"
                  type="number"
                  min={1}
                  value={state.customModel.attentionHeads}
                  onChange={(e) => update("customModel", { ...state.customModel, attentionHeads: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="custom-model-kv-heads">KV heads</Label>
                  <InfoTooltip text="Grouped-query / multi-query attention models share KV heads across several attention heads — fewer KV heads means a smaller KV cache. Equal to attention heads for plain multi-head attention." />
                </div>
                <Input
                  id="custom-model-kv-heads"
                  type="number"
                  min={1}
                  value={state.customModel.kvHeads}
                  onChange={(e) => update("customModel", { ...state.customModel, kvHeads: Number(e.target.value) })}
                />
                {fieldError("kvHeads") && <p className="text-xs text-destructive">{fieldError("kvHeads")}</p>}
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="custom-model-head-dim">Head dimension</Label>
                <Input
                  id="custom-model-head-dim"
                  type="number"
                  min={1}
                  value={state.customModel.headDimension}
                  onChange={(e) => update("customModel", { ...state.customModel, headDimension: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="custom-model-moe">Mixture-of-Experts</Label>
                <InfoTooltip text="MoE models keep all expert weights resident in VRAM (total parameters) but only route a subset of experts per token (active parameters), which drives compute/performance estimates instead." />
              </div>
              <Switch
                id="custom-model-moe"
                checked={state.customModel.isMoE}
                onCheckedChange={(checked) => update("customModel", { ...state.customModel, isMoE: checked })}
              />
            </div>

            {state.customModel.isMoE && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-model-active-params">Active parameters per token</Label>
                <Input
                  id="custom-model-active-params"
                  type="number"
                  min={1}
                  value={state.customModel.activeParameters}
                  onChange={(e) => update("customModel", { ...state.customModel, activeParameters: Number(e.target.value) })}
                />
                {fieldError("activeParameters") && <p className="text-xs text-destructive">{fieldError("activeParameters")}</p>}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="quantization-select">Quantization</Label>
            <InfoTooltip text="Lower precision shrinks memory footprint and (heuristically) speeds up inference, at the cost of output quality. INT4 is the most common self-hosting choice." />
          </div>
          <Select value={state.quantization} onValueChange={(v) => update("quantization", v as CalculatorState["quantization"])}>
            <SelectTrigger id="quantization-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUANTIZATION_FORMATS.map((q) => (
                <SelectItem key={q} value={q}>
                  {q} — {QuantizationPresets[q].bitsPerParameter}-bit, {QuantizationPresets[q].expectedMemoryReduction} smaller
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUANTIZATION_FORMATS.map((q) => (
              <Badge key={q} variant={q === state.quantization ? "default" : "outline"} className="cursor-pointer" onClick={() => update("quantization", q)}>
                {q}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

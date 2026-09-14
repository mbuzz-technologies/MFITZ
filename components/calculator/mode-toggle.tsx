import { CalculatorMode } from "@/lib/types/calculator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ModeToggle({ mode, onChange }: { mode: CalculatorMode; onChange: (mode: CalculatorMode) => void }) {
  return (
    <Tabs value={mode} onValueChange={(v) => onChange(v as CalculatorMode)}>
      <TabsList>
        <TabsTrigger value="simple">Simple</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

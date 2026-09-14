import { CalculatorState } from "@/lib/types/calculator"
import { useCasePresets } from "@/lib/presets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickPresets({ onSelect }: { onSelect: (state: CalculatorState) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick-start presets</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {Object.entries(useCasePresets).map(([label, preset]) => (
          <Button key={label} variant="outline" size="sm" className="h-auto justify-start whitespace-normal py-2 text-left text-xs" onClick={() => onSelect(preset)}>
            {label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

"use client"

import { useMemo } from "react"
import { CalculatorState } from "@/lib/types/calculator"
import { computeCalculatorResults, CalculatorResults } from "@/lib/calculations/engine"

export function useCalculatorResults(state: CalculatorState): CalculatorResults {
  return useMemo(() => computeCalculatorResults(state), [state])
}

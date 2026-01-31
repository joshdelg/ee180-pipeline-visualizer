import { Card, CardContent } from "@/components/ui/card"
import { PipelineGrid } from "@/components/pipeline-grid"
import type { PipelineInstruction } from "@/lib/pipeline-types"

// Hardcoded data for UI design validation
const HARDCODED_INSTRUCTIONS: PipelineInstruction[] = [
  { text: "add r1,r2,r3", index: 0 },
  { text: "sub r4,r1,r3", index: 1 },
  { text: "and r6,r1,r7", index: 2 },
  { text: "or r8,r1,r9", index: 3 },
  { text: "xor r10,r1,r11", index: 4 },
]

const HARDCODED_CYCLES = 9

export function VisualizationPanel() {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <PipelineGrid
          instructions={HARDCODED_INSTRUCTIONS}
          cycleCount={HARDCODED_CYCLES}
        />
      </CardContent>
    </Card>
  )
}

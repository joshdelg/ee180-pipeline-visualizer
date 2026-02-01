import { Card, CardContent } from "@/components/ui/card"
import { ParseErrors } from "@/components/parse-errors"
import { PipelineGrid } from "@/components/pipeline-grid"
import type { ParsedInstruction } from "@/lib/pipeline-types"
import { simulate } from "@/lib/pipeline-simulator"
import type { ParseError } from "@/lib/mips-parser"

interface VisualizationPanelProps {
  instructions: ParsedInstruction[]
  parseErrors: ParseError[]
}

export function VisualizationPanel({
  instructions,
  parseErrors,
}: VisualizationPanelProps) {
  const snapshots = simulate(instructions)

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <ParseErrors errors={parseErrors} />
        <PipelineGrid
          instructions={instructions}
          snapshots={snapshots}
        />
      </CardContent>
    </Card>
  )
}

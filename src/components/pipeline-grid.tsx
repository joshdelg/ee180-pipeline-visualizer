import {
  type CycleSnapshot,
  type PipelineInstruction,
  type PipelineStage,
} from "@/lib/pipeline-types"
import { getCellContent } from "@/lib/snapshots-to-grid"
import type { GridCellContent } from "@/lib/snapshots-to-grid"
import { cn } from "@/lib/utils"

const STAGE_COLORS: Record<PipelineStage, string> = {
  IF: "bg-blue-500/20 border-blue-500/40 dark:bg-blue-500/15",
  "ID/RF": "bg-amber-500/20 border-amber-500/40 dark:bg-amber-500/15",
  EX: "bg-emerald-500/20 border-emerald-500/40 dark:bg-emerald-500/15",
  MEM: "bg-violet-500/20 border-violet-500/40 dark:bg-violet-500/15",
  WB: "bg-rose-500/20 border-rose-500/40 dark:bg-rose-500/15",
}

interface PipelineCellProps {
  content: GridCellContent | null
}

function PipelineCell({ content }: PipelineCellProps) {
  if (content === null) {
    return (
      <div className="flex min-h-10 min-w-14 items-center justify-center rounded border border-border/50 bg-muted/30 text-muted-foreground text-xs">
        —
      </div>
    )
  }

  if (content.type === "bubble") {
    return (
      <div className="flex min-h-10 min-w-14 items-center justify-center rounded border border-amber-500/60 bg-amber-500/15 text-amber-700 text-xs font-medium dark:text-amber-400">
        bubble
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-10 min-w-14 items-center justify-center rounded border text-xs font-medium",
        STAGE_COLORS[content.stage]
      )}
    >
      {content.stage}
    </div>
  )
}

interface PipelineRowProps {
  instruction: PipelineInstruction
  snapshots: CycleSnapshot[]
}

function PipelineRow({ instruction, snapshots }: PipelineRowProps) {
  const cycleCount = snapshots.length

  return (
    <div className="flex items-center gap-2">
      <div className="w-28 shrink-0 truncate text-xs font-mono text-muted-foreground">
        {instruction.text}
      </div>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: cycleCount }, (_, cycle) => (
          <PipelineCell
            key={cycle}
            content={getCellContent(instruction.index, cycle, snapshots)}
          />
        ))}
      </div>
    </div>
  )
}

interface PipelineGridProps {
  instructions: PipelineInstruction[]
  snapshots: CycleSnapshot[]
}

export function PipelineGrid({ instructions, snapshots }: PipelineGridProps) {
  const cycleCount = snapshots.length

  return (
    <div className="flex flex-col gap-2 overflow-auto p-4">
      {/* Axis labels */}
      <div className="flex items-center gap-2">
        <div className="flex w-28 shrink-0 items-center justify-center">
          <span className="text-muted-foreground text-xs font-medium">
            Instr. Order
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-muted-foreground text-xs font-medium">
            Time (clock cycles)
          </span>
          <div className="flex gap-1">
            {Array.from({ length: cycleCount }, (_, i) => (
              <div
                key={i}
                className="flex min-w-14 items-center justify-center text-xs text-muted-foreground"
              >
                {i}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid rows */}
      <div className="flex flex-col gap-1">
        {instructions.map((instruction) => (
          <PipelineRow
            key={instruction.index}
            instruction={instruction}
            snapshots={snapshots}
          />
        ))}
      </div>
    </div>
  )
}

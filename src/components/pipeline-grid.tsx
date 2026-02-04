import { useRef } from "react"
import {
  type CycleSnapshot,
  type ParsedInstruction,
  type PipelineStage,
} from "@/lib/pipeline-types"
import { STAGE_ORDER } from "@/lib/pipeline-types"
import {
  getForwardingPaths,
  getRegisterId,
  isFastRfPath,
  getFastRfAnchorFromId,
  getFastRfAnchorToId,
} from "@/lib/forwarding-paths"
import { getCellContent } from "@/lib/snapshots-to-grid"
import type { GridCellContent } from "@/lib/snapshots-to-grid"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ForwardingPathsOverlay } from "@/components/forwarding-paths-overlay"

const STAGE_COLORS: Record<PipelineStage, string> = {
  IF: "bg-blue-500/20 border-blue-500/40 dark:bg-blue-500/15",
  "ID/RF": "bg-amber-500/20 border-amber-500/40 dark:bg-amber-500/15",
  EX: "bg-emerald-500/20 border-emerald-500/40 dark:bg-emerald-500/15",
  MEM: "bg-violet-500/20 border-violet-500/40 dark:bg-violet-500/15",
  WB: "bg-rose-500/20 border-rose-500/40 dark:bg-rose-500/15",
}
/** Left half of WB when it's the fast-RF source (forwarding from here) */
const FAST_RF_WB_LEFT =
  "bg-green-500/30 border-green-500/50 dark:bg-green-500/25 border-rose-500/40"
/** Right half of WB when it's the fast-RF source (normal stage) */
const FAST_RF_WB_RIGHT =
  "bg-rose-500/20 border-rose-500/40 dark:bg-rose-500/15"
/** Left half of ID/RF when it's the fast-RF target (normal stage) */
const FAST_RF_IDRF_LEFT =
  "bg-amber-500/20 border-amber-500/40 dark:bg-amber-500/15"
/** Right half of ID/RF when it's the fast-RF target (forwarding to here) */
const FAST_RF_IDRF_RIGHT =
  "bg-green-500/30 border-green-500/50 dark:bg-green-500/25 border-amber-500/40"

const PIPELINE_REGISTER_WIDTH = "w-1.5"

function getPipelineRegisterName(
  leftContent: GridCellContent | null,
  rightContent: GridCellContent | null
): string {
  if (leftContent === null || rightContent === null || rightContent.type === "bubble") return ""

  const rightStageName = rightContent.stage

  if(leftContent?.type === "bubble") {
    const leftStageName = STAGE_ORDER[STAGE_ORDER.indexOf(rightStageName) - 1]
    return `${leftStageName}/${rightStageName}`
  }

  return `${leftContent.stage}/${rightStageName}`
}

interface PipelineRegisterProps {
  /** When false, render as placeholder (very light) to maintain alignment */
  active?: boolean
  /** Name shown in tooltip */
  name?: string
  /** Unique id for forwarding path anchoring */
  id?: string
}

function PipelineRegister({ active = true, name, id }: PipelineRegisterProps) {
  const label = `${name} Pipeline Register`
  const div = (
    <div
      id={id}
      className={cn(
        "shrink-0 self-stretch rounded-sm",
        PIPELINE_REGISTER_WIDTH,
        active
          ? "cursor-default bg-muted-foreground/30 dark:bg-muted-foreground/20"
          : "bg-transparent dark:bg-transparent"
      )}
    />
  )
  if (!active) return div
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{div}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

interface PipelineCellProps {
  content: GridCellContent | null
  instructionIndex: number
  cycle: number
  /** This cycle is the WB producer of a WB→ID/RF (fast RF) path */
  isFastRfProducer?: boolean
  /** This cycle is the ID/RF consumer of a WB→ID/RF (fast RF) path */
  isFastRfConsumer?: boolean
}

function PipelineCell({
  content,
  instructionIndex,
  cycle,
  isFastRfProducer = false,
  isFastRfConsumer = false,
}: PipelineCellProps) {
  const cellId = `cell-${instructionIndex}-${cycle}`

  if (content === null) {
    return (
      <div
        id={cellId}
        className="flex min-h-10 min-w-14 shrink-0 items-center justify-center rounded border border-border/50 bg-muted/30 text-muted-foreground text-xs"
      >
        —
      </div>
    )
  }

  if (content.type === "bubble") {
    return (
      <div
        id={cellId}
        className="flex min-h-10 min-w-14 shrink-0 items-center justify-center rounded border border-amber-500/60 bg-amber-500/15 text-amber-700 text-xs font-medium dark:text-amber-400"
      >
        bubble
      </div>
    )
  }

  const isWbFastRf = content.stage === "WB" && isFastRfProducer
  const isIdRfFastRf = content.stage === "ID/RF" && isFastRfConsumer

  if (isWbFastRf) {
    return (
      <div
        id={cellId}
        className="flex min-h-10 min-w-14 shrink-0 overflow-hidden rounded border border-rose-500/40 text-xs font-medium"
      >
        <div
          id={getFastRfAnchorFromId(instructionIndex, cycle)}
          className={cn(
            "flex flex-1 min-w-0 items-center justify-center rounded-l border-r border-rose-500/40",
            FAST_RF_WB_LEFT
          )}
        >
          WB
        </div>
        <div
          className={cn(
            "flex flex-1 min-w-0 items-center justify-center rounded-r",
            FAST_RF_WB_RIGHT
          )}
        >
        </div>
      </div>
    )
  }

  if (isIdRfFastRf) {
    return (
      <div
        id={cellId}
        className="flex min-h-10 min-w-14 shrink-0 overflow-hidden rounded border border-amber-500/40 text-xs font-medium"
      >
        <div
          className={cn(
            "flex flex-1 min-w-0 items-center justify-center rounded-l border-r border-amber-500/40",
            FAST_RF_IDRF_LEFT
          )}
        >
          ID
        </div>
        <div
          id={getFastRfAnchorToId(instructionIndex, cycle)}
          className={cn(
            "flex flex-1 min-w-0 items-center justify-center rounded-r",
            FAST_RF_IDRF_RIGHT
          )}
        >
          RF
        </div>
      </div>
    )
  }

  return (
    <div
      id={cellId}
      className={cn(
        "flex min-h-10 min-w-14 shrink-0 items-center justify-center rounded border text-xs font-medium",
        STAGE_COLORS[content.stage]
      )}
    >
      {content.stage}
    </div>
  )
}

function shouldShowPipelineRegister(
  leftContent: GridCellContent | null,
  rightContent: GridCellContent | null
): boolean {
  const leftIsBubbleOrEmpty = leftContent?.type === "bubble" || leftContent === null
  const rightIsBubbleOrEmpty = rightContent?.type === "bubble" || rightContent === null

  const bothAreNonEmpty = !leftIsBubbleOrEmpty && !rightIsBubbleOrEmpty
  const bubbleOnLeftAndRightNonEmpty = leftContent?.type === "bubble" && !rightIsBubbleOrEmpty

  return bothAreNonEmpty || bubbleOnLeftAndRightNonEmpty
}

interface PipelineRowProps {
  instruction: ParsedInstruction
  snapshots: CycleSnapshot[]
  /** Cycles where this instruction is the WB producer in a WB→ID/RF path */
  fastRfProducerCycles: Set<number>
  /** Cycles where this instruction is the ID/RF consumer in a WB→ID/RF path */
  fastRfConsumerCycles: Set<number>
}

function PipelineRow({
  instruction,
  snapshots,
  fastRfProducerCycles,
  fastRfConsumerCycles,
}: PipelineRowProps) {
  const cycleCount = snapshots.length

  return (
    <div className="flex items-center gap-2">
      <div className="w-28 shrink-0 truncate text-xs font-mono text-muted-foreground">
        {instruction.text}
      </div>
      <div className="flex flex-1 items-stretch gap-0.5">
        {Array.from({ length: cycleCount }, (_, cycle) => {
          const content = getCellContent(
            instruction.index,
            cycle,
            snapshots
          )
          const previousContent =
            cycle > 0
              ? getCellContent(
                  instruction.index,
                  cycle - 1,
                  snapshots
                )
              : null
          const showRegBefore = shouldShowPipelineRegister(
            previousContent,
            content
          )
          const registerName = getPipelineRegisterName(previousContent, content)

          return (
            <div key={cycle} className="flex items-stretch gap-0.5">
              {cycle > 0 && (
                <PipelineRegister
                  active={showRegBefore}
                  name={registerName}
                  id={getRegisterId(instruction.index, cycle)}
                />
              )}
              <PipelineCell
                content={content}
                instructionIndex={instruction.index}
                cycle={cycle}
                isFastRfProducer={fastRfProducerCycles.has(cycle)}
                isFastRfConsumer={fastRfConsumerCycles.has(cycle)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface PipelineGridProps {
  instructions: ParsedInstruction[]
  snapshots: CycleSnapshot[]
}

export function PipelineGrid({ instructions, snapshots }: PipelineGridProps) {
  const cycleCount = snapshots.length
  const forwardingPaths = getForwardingPaths(snapshots)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const fastRfPaths = forwardingPaths.filter(isFastRfPath)
  const fastRfProducerByInstruction = new Map<number, Set<number>>()
  const fastRfConsumerByInstruction = new Map<number, Set<number>>()
  for (const path of fastRfPaths) {
    if (!fastRfProducerByInstruction.has(path.fromInstructionIndex)) {
      fastRfProducerByInstruction.set(
        path.fromInstructionIndex,
        new Set<number>()
      )
    }
    fastRfProducerByInstruction.get(path.fromInstructionIndex)!.add(path.cycle)
    if (!fastRfConsumerByInstruction.has(path.toInstructionIndex)) {
      fastRfConsumerByInstruction.set(path.toInstructionIndex, new Set<number>())
    }
    fastRfConsumerByInstruction.get(path.toInstructionIndex)!.add(path.cycle)
  }

  return (
    <div
      ref={scrollContainerRef}
      className="relative flex flex-col gap-2 overflow-auto p-4"
    >
      <ForwardingPathsOverlay
        paths={forwardingPaths}
        scrollContainerRef={scrollContainerRef}
      />
      {/* Axis labels */}
      <div className="flex items-start gap-2">
        <div className="flex w-28 shrink-0 items-center justify-center pt-6">
          <span className="text-muted-foreground text-xs font-medium">
            Instr. Order
          </span>
        </div>
        <div className="flex flex-1 flex-col items-start gap-1 min-w-0">
          <span className="text-muted-foreground text-xs font-medium">
            Time (clock cycles)
          </span>
          <div className="flex items-stretch gap-0.5 min-w-0">
            {Array.from({ length: cycleCount }, (_, i) => (
              <div key={i} className="flex items-stretch gap-0.5 shrink-0">
                {i > 0 && (
                  <div
                    className={cn("shrink-0", PIPELINE_REGISTER_WIDTH)}
                    aria-hidden
                  />
                )}
                <div className="flex min-w-14 shrink-0 items-center justify-center text-xs text-muted-foreground">
                  {i}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid rows */}
      <div className="flex flex-col gap-4">
        {instructions.map((instruction) => (
          <PipelineRow
            key={instruction.index}
            instruction={instruction}
            snapshots={snapshots}
            fastRfProducerCycles={
              fastRfProducerByInstruction.get(instruction.index) ?? new Set()
            }
            fastRfConsumerCycles={
              fastRfConsumerByInstruction.get(instruction.index) ?? new Set()
            }
          />
        ))}
      </div>
    </div>
  )
}

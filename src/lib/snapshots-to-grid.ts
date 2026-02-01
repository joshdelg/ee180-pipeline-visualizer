import type { CycleSnapshot, PipelineStage } from "./pipeline-types"

export type GridCellContent =
  | { type: "stage"; stage: PipelineStage }
  | { type: "bubble" }

/**
 * For a given (instructionIndex, cycle), returns what to display in that cell.
 * - stage: instruction is in this pipeline stage
 * - bubble: instruction is stalled (show bubble instead of stage)
 * - null: instruction not in pipeline this cycle
 */
export function getCellContent(
  instructionIndex: number,
  cycle: number,
  snapshots: CycleSnapshot[]
): GridCellContent | null {
  const snapshot = snapshots[cycle]
  if (!snapshot) return null

  const stages: Array<keyof Omit<CycleSnapshot, "cycle">> = [
    "IF",
    "ID/RF",
    "EX",
    "MEM",
    "WB",
  ]

  for (const stage of stages) {
    const content = snapshot[stage]
    if (content?.type === "instruction" && content.index === instructionIndex) {
      if (content.stalled) {
        return { type: "bubble" }
      }
      return { type: "stage", stage }
    }
  }

  return null
}

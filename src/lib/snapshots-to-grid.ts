import type { CycleSnapshot, PipelineStage } from "./pipeline-types"
import { isInstructionSlot, STAGE_ORDER } from "./pipeline-types"

export type GridCellContent =
  | { type: "stage"; stage: PipelineStage }
  | { type: "bubble" }

/**
 * Returns the content of a grid cell for a given instruction and cycle.
 * @param instructionIndex - The index of the instruction
 * @param cycle - The cycle
 * @param snapshots - The snapshots
 * @returns The content of the grid cell
 */
export function getCellContent(
  instructionIndex: number,
  cycle: number,
  snapshots: CycleSnapshot[]
): GridCellContent | null {
  const snapshot = snapshots[cycle]
  if (!snapshot) return null

  for (const stage of STAGE_ORDER) {
    const content = snapshot[stage]
    if (isInstructionSlot(content) && content.instruction.index === instructionIndex) {
      if (content.stalled) {
        return { type: "bubble" }
      }
      return { type: "stage", stage }
    }
  }

  return null
}

/**
 * Returns the content for a specific stage cell (instruction, cycle, stage).
 */
export function getCellContentForStage(
  instructionIndex: number,
  cycle: number,
  stage: PipelineStage,
  snapshots: CycleSnapshot[]
): GridCellContent | null {
  const snapshot = snapshots[cycle]
  if (!snapshot) return null

  const content = snapshot[stage]
  if (!isInstructionSlot(content) || content.instruction.index !== instructionIndex)
    return null

  return content.stalled ? { type: "bubble" } : { type: "stage", stage }
}

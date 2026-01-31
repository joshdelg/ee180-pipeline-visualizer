export type PipelineStage = "IF" | "ID/RF" | "EX" | "MEM" | "WB"

export interface PipelineInstruction {
  text: string
  index: number
}

/**
 * Returns the pipeline stage for instruction at index `instructionIndex`
 * during clock cycle `cycle`, or null if the instruction isn't in any stage.
 */
export function getStageAtCycle(
  instructionIndex: number,
  cycle: number
): PipelineStage | null {
  const offset = cycle - instructionIndex
  if (offset < 0 || offset > 4) return null
  const stages: PipelineStage[] = ["IF", "ID/RF", "EX", "MEM", "WB"]
  return stages[offset]
}

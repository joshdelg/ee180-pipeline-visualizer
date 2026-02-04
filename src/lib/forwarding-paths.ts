import type { CycleSnapshot, PipelineStage } from "./pipeline-types"
import { isInstructionSlot, STAGE_ORDER } from "./pipeline-types"

/**
 * A path from a producer instruction to a consumer in the same cycle (forwarding).
 * fromStage / toStage refer to the stage *in front of* the pipeline register that actually forwards/receives the value:
 */
export interface ForwardingPath {
  fromInstructionIndex: number
  toInstructionIndex: number
  fromStage: PipelineStage
  toStage: PipelineStage
  cycle: number
  register: number
}

/**
 * Extracts forwarding paths from simulation snapshots.
 * Returns paths where producer and consumer are in the same cycle.
 */
export function getForwardingPaths(
  snapshots: CycleSnapshot[]
): ForwardingPath[] {
  const paths: ForwardingPath[] = []

  for (let cycle = 0; cycle < snapshots.length; cycle++) {
    const snapshot = snapshots[cycle]

    for (const stage of STAGE_ORDER) {
      const content = snapshot[stage]
      if (!isInstructionSlot(content)) continue
      if (!content.forwardedFrom) continue

      const toInstructionIndex = content.instruction.index

      for (const [register, source] of Object.entries(content.forwardedFrom)) {
        paths.push({
          fromInstructionIndex: source.instructionIndex,
          toInstructionIndex,
          fromStage: source.stage,
          toStage: stage,
          cycle,
          register: Number(register),
        })
      }
    }
  }

  return paths
}

/** Generates a stable DOM id for a grid cell: cell-{instructionIndex}-{cycle} */
export function getCellId(instructionIndex: number, cycle: number): string {
  return `cell-${instructionIndex}-${cycle}`
}

/** Generates a stable DOM id for a pipeline register: register-{instructionIndex}-{cycle} */
export function getRegisterId(
  instructionIndex: number,
  cycle: number
): string {
  return `register-${instructionIndex}-${cycle}`
}
/** Whether this path is WB → ID/RF (fast RF) forwarding */
export function isFastRfPath(path: ForwardingPath): boolean {
  return path.fromStage === "WB" && path.toStage === "ID/RF"
}
/** DOM id for the fast-RF arrow start (center of left half of WB cell) */
export function getFastRfAnchorFromId(
  instructionIndex: number,
  cycle: number
): string {
  return `fast-rf-from-${instructionIndex}-${cycle}`
}
/** DOM id for the fast-RF arrow end (center of right half of ID/RF cell) */
export function getFastRfAnchorToId(
  instructionIndex: number,
  cycle: number
): string {
  return `fast-rf-to-${instructionIndex}-${cycle}`
}

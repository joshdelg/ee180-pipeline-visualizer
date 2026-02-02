import type { CycleSnapshot } from "./pipeline-types"
import { STAGE_ORDER } from "./pipeline-types"

export interface ForwardingPath {
  fromInstructionIndex: number
  toInstructionIndex: number
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
      if (content?.type !== "instruction") continue
      if (!content.forwardedFrom) continue

      const toInstructionIndex = content.index

      for (const [register, source] of Object.entries(content.forwardedFrom)) {
        paths.push({
          fromInstructionIndex: source.instructionIndex,
          toInstructionIndex,
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

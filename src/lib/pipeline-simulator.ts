import type { CycleSnapshot, PipelineInstruction, StageContent } from "./pipeline-types"

const STAGE_ORDER: Array<keyof Omit<CycleSnapshot, "cycle">> = [
  "IF",
  "ID/RF",
  "EX",
  "MEM",
  "WB",
]

function createEmptyState(): Record<string, StageContent | null> {
  return {
    IF: null,
    "ID/RF": null,
    EX: null,
    MEM: null,
    WB: null,
  }
}

/**
 * Simulates pipeline execution and produces cycle snapshots.
 * Dummy logic: ideal pipeline with one hardcoded stall at cycle 3
 * (inst 1 stalls in ID when inst 0 is in EX - RAW hazard).
 */
export function simulate(
  instructions: PipelineInstruction[]
): CycleSnapshot[] {
  const snapshots: CycleSnapshot[] = []
  const count = instructions.length

  if (count === 0) return snapshots

  let state = createEmptyState()
  let nextFetchIndex = 0
  let cycle = 0

  while (true) {
    const next = createEmptyState()

    // Hazard: inst 1 in ID, inst 0 in EX (RAW) - stall one cycle
    const inst0InEX =
      state.EX?.type === "instruction" && state.EX.index === 0
    const inst1InID =
      state["ID/RF"]?.type === "instruction" && state["ID/RF"].index === 1
    const shouldStall = inst0InEX && inst1InID

    if (shouldStall) {
      // Inst 0: EX -> MEM
      next.MEM = state.EX
      // Bubble in EX
      next.EX = { type: "bubble", causedByStallOf: 1 }
      // Inst 1 stays in ID (stalled)
      next["ID/RF"] = {
        type: "instruction",
        index: 1,
        stalled: true,
      }
      // Inst 2 stays in IF (stalled)
      if (state.IF?.type === "instruction") {
        next.IF = {
          type: "instruction",
          index: state.IF.index,
          stalled: true,
        }
      }
      // MEM -> WB, WB retires
      next.WB = state.MEM
    } else {
      // Normal advance: WB -> retire, MEM -> WB, EX -> MEM, ID -> EX, IF -> ID, fetch
      next.WB = state.MEM
      next.MEM = state.EX
      next.EX = state["ID/RF"]
      next["ID/RF"] = state.IF

      if (nextFetchIndex < count) {
        next.IF = { type: "instruction", index: nextFetchIndex }
        nextFetchIndex++
      }
    }

    state = next
    cycle++

    // Record snapshot for this cycle (state after advance)
    snapshots.push({
      cycle: cycle - 1,
      IF: state.IF,
      "ID/RF": state["ID/RF"],
      EX: state.EX,
      MEM: state.MEM,
      WB: state.WB,
    })

    // Check if simulation is done: pipeline empty and no more to fetch
    const pipelineEmpty = STAGE_ORDER.every((s) => state[s] === null)
    if (pipelineEmpty && nextFetchIndex >= count) {
      // Don't keep the final empty snapshot
      snapshots.pop()
      break
    }

    // Safety limit
    if (cycle > 200) break
  }

  return snapshots
}

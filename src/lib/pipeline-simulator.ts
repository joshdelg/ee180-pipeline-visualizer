import type {
  CycleSnapshot,
  ParsedInstruction,
  PipelineStage,
  PipelineStageData,
} from "./pipeline-types"
import { STAGE_ORDER } from "./pipeline-types"

function createEmptyState(): PipelineStageData {
  return {
    IF: null,
    "ID/RF": null,
    EX: null,
    MEM: null,
    WB: null,
  }
}

/** Registers this instruction reads (for RAW hazard check) */
function getRegistersRead(inst: ParsedInstruction): number[] {
  const regs: number[] = []
  if (inst.rs !== null) regs.push(inst.rs)
  if (inst.rt !== null) regs.push(inst.rt)
  return regs
}

/** Register this instruction writes, or null if none */
function getRegisterWritten(inst: ParsedInstruction): number | null {
  // R-type: rd; I-type (addi, lw): rt; sw: writes nothing
  if (inst.rd !== null) return inst.rd
  if (inst.opcode === "addi" || inst.opcode === "addiu" || inst.opcode === "lw")
    return inst.rt
  return null
}

/**
 * Checks if the consumer instruction reads from registers that are output by an earlier instruction (further in the pipeline)
 * @param consumer - The instruction that is consuming the register
 * @param consumerIndex - The index of the consumer instruction
 * @param state - The current state of the pipeline
 * @param instructions - The instructions to simulate
 * @param downstreamStages - The stages that are downstream of the consumer
 * @returns True if the consumer has an unresolved dependency
 */
function hasUnresolvedDependency(
  consumer: ParsedInstruction,
  consumerIndex: number,
  nextPipelineState: PipelineStageData,
  instructions: ParsedInstruction[],
  downstreamStages: PipelineStage[]
): boolean {
  const readRegs = getRegistersRead(consumer)
  if (readRegs.length === 0) return false

  for (const stage of downstreamStages) {
    const stageContent = nextPipelineState[stage]
    if (stageContent?.type !== "instruction") continue

    const producerIndex = stageContent.index
    if (producerIndex >= consumerIndex) continue

    const producer = instructions[producerIndex]
    const writtenReg = getRegisterWritten(producer)
    if (writtenReg === null) continue

    if (readRegs.includes(writtenReg)) return true
  }

  return false
}

/**
 * Simulates pipeline execution and produces cycle snapshots.
 * Iterates through pipeline stages in reverse order. If an instruction has a dependency on
 * an earlier instruction (later in the pipeline), then it is stalled. Otherwise, it is advanced.
 * @param instructions - The instructions to simulate
 * @returns The cycle snapshots
 */
export function simulate(
  instructions: ParsedInstruction[]
): CycleSnapshot[] {
  const snapshots: CycleSnapshot[] = []
  const count = instructions.length

  if (count === 0) return snapshots

  let state = createEmptyState()
  let nextFetchIndex = 0
  let cycle = 0

  while (true) {
    const next = createEmptyState()

    // Handle assigning to IF separately
    for (let stageIndex = STAGE_ORDER.length - 1; stageIndex > 0; stageIndex--) {
      // `nextStage` is the stage we are assigning to in `next` (otherwise, WB would be useless)
      const nextStage = STAGE_ORDER[stageIndex];
      const previousStage = STAGE_ORDER[stageIndex - 1];

      if (state[previousStage] === null || state[previousStage].type !== "instruction") continue

      const currentInstructionIndex = state[previousStage].index
      const currentInstruction = instructions[currentInstructionIndex]

      // If instruction has dependency, stall it
      if (hasUnresolvedDependency(
          currentInstruction,
          currentInstructionIndex,
          next,
          instructions,
          STAGE_ORDER.slice(stageIndex + 1))
      ) {
        // To stall: Instruction stays in the same stage as before and we mark that it is stalled
        next[previousStage] = {
          ...state[previousStage],
          stalled: true,
        }

        continue
      }

      // If there's no dependency, advance it
      next[nextStage] = {
        ...state[previousStage],
        stalled: false,
      }
    }

    // If IF stage is empty, then fetch a new instruction
    if (next.IF === null && nextFetchIndex < count) {
      next.IF = {
        type: "instruction",
        index: nextFetchIndex,
        stalled: false,
      }
      nextFetchIndex++
    }

    state = next
    cycle++

    snapshots.push({
      cycle: cycle - 1,
      ...state
    })

    console.log("State", state)

    const pipelineEmpty = STAGE_ORDER.every((s) => state[s] === null)
    if (pipelineEmpty && nextFetchIndex >= count) {
      snapshots.pop()
      break
    }

    if (cycle > 500) break
  }

  return snapshots
}

import { getRegisterName } from "./mips-parser"
import { getDataAvailableAfterStage, getDataRequiredStage, INSTRUCTION_INFO, type OptLevel } from "./pipeline-data-availability"
import type {
  CycleSnapshot,
  ForwardSource,
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
  if (inst.instructionType === "R") {
    return [inst.rs, inst.rt]
  }
  // I-type: rt is only a source when not writing (e.g. sw)
  const info = INSTRUCTION_INFO[inst.opcode]
  if (!info.writesToRegister) {
    return [inst.rs, inst.rt]
  }
  return [inst.rs]
}

/** Register this instruction writes, or null if none */
function getRegisterWritten(inst: ParsedInstruction): number | null {
  if (inst.instructionType === "R") {
    return inst.rd
  }
  const info = INSTRUCTION_INFO[inst.opcode]
  return info.writesToRegister ? inst.rt : null
}

/**
 * For each register the consumer reads, finds the producer (if any) in the pipeline
 * downstream of the consumer. Returns a map: registerNumber -> ForwardSource.
 * At most one producer per register.
 */
function getRegisterDependencies(
  consumer: ParsedInstruction,
  consumerStage: PipelineStage,
  nextState: PipelineStageData,
  instructions: ParsedInstruction[],
): Map<number, ForwardSource> {
  const deps = new Map<number, ForwardSource>()
  const readRegs = getRegistersRead(consumer)
  if (readRegs.length === 0) {
    console.log(`${consumer.text} does not read any registers, so it does not have a dependency`)
    return deps
  }

  const consumerStageIndex = STAGE_ORDER.indexOf(consumerStage)
  for (const stage of STAGE_ORDER.slice(consumerStageIndex + 1)) {
    console.log(`Searching for dependency in stage: ${stage}`)
    const producerContent = nextState[stage]
    if (producerContent?.type !== "instruction") {
      console.log(`Stage ${stage} is not an instruction, so it cannot be a dependency`)
      continue
    }

    const producer = instructions[producerContent.index]
    const writtenReg = getRegisterWritten(producer)
    if (writtenReg === null) continue
    if (!readRegs.includes(writtenReg)) continue
    if (deps.has(writtenReg)) continue

    console.log(`Producer instruction ${producer.text} writes register: $${getRegisterName(writtenReg) ?? writtenReg}, which is read by ${consumer.text}`)
    deps.set(writtenReg, {
      instructionIndex: producerContent.index,
      stage,
    })
  }

  return deps
}

/**
 * Simulates pipeline execution and produces cycle snapshots.
 * Iterates through pipeline stages in reverse order. If an instruction has a dependency on
 * an earlier instruction (later in the pipeline), then it is stalled. Otherwise, it is advanced.
 * @param instructions - The instructions to simulate
 * @returns The cycle snapshots
 */
export function simulate(
  instructions: ParsedInstruction[],
  optLevel: OptLevel
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
      const promotingToStage = STAGE_ORDER[stageIndex];
      const currentlyInStage = STAGE_ORDER[stageIndex - 1];

      const currentStageContent = state[currentlyInStage];
    
      if (currentStageContent === null || currentStageContent.type !== "instruction") continue

      const currentInstructionIndex = currentStageContent.index
      const currentInstruction = instructions[currentInstructionIndex]

      // Check if instruction is going to enter a stage that requires data
      const dataRequiredStage = getDataRequiredStage(
        currentInstruction.opcode,
        optLevel
      )

      const doesStageRequireData = dataRequiredStage === promotingToStage;
      if (!doesStageRequireData) {
        next[promotingToStage] = {
          type: "instruction",
          index: currentInstructionIndex,
          stalled: false,
          forwardedFrom: undefined,
        }
        continue
      }

      console.log(`${currentInstruction.text} is going to enter data-requiring stage: ${promotingToStage}`)

      const registerDeps = getRegisterDependencies(
        currentInstruction,
        promotingToStage,
        next,
        instructions,
      )

      if (registerDeps.size === 0) {
        console.log(`Since ${currentInstruction.text} does not have a dependency, we can advance`)
        next[promotingToStage] = {
          type: "instruction",
          index: currentInstructionIndex,
          stalled: false,
          forwardedFrom: undefined,
        }
        continue
      }

      console.log(`If promoted, ${currentInstruction.text} would depend on ${registerDeps.size} register(s): ${[...registerDeps.keys()].map((r) => `$${getRegisterName(r) ?? r}`).join(", ")}`)

      // For each register with a dependency, check if we can forward
      let canForwardAll = true
      const forwardedFrom: Record<number, ForwardSource> = {}

      for (const [reg, producer] of registerDeps) {
        const producerInst = instructions[producer.instructionIndex]
        const dataAvailableAfterStage = getDataAvailableAfterStage(
          producerInst.opcode,
          optLevel,
        )
        // Condition is <, because data is available AFTER `dataAvailableAfterStage` stage, so the instruction must be in a stage after this
        const producerHasDataReady =
          STAGE_ORDER.indexOf(dataAvailableAfterStage) <
          STAGE_ORDER.indexOf(producer.stage)

        if (producerHasDataReady) {
          forwardedFrom[reg] = producer
          console.log(`Register $${getRegisterName(reg) ?? reg}: producer ${producerInst.text} in ${producer.stage} has data ready (available after ${dataAvailableAfterStage})`)
        } else {
          console.log(`Register $${getRegisterName(reg) ?? reg}: producer ${producerInst.text} in ${producer.stage} does NOT have data ready (available after ${dataAvailableAfterStage})`)
          canForwardAll = false
          break
        }
      }

      if (canForwardAll) {
        console.log(`Since all dependencies can be forwarded, we can advance ${currentInstruction.text} with forwarding`)
        next[promotingToStage] = {
          type: "instruction",
          index: currentInstructionIndex,
          stalled: false,
          forwardedFrom: Object.keys(forwardedFrom).length > 0 ? forwardedFrom : undefined,
        }
        continue
      }
      
      console.log(`Since data would not be available in time, we must stall ${currentInstruction.text}`)
      next[currentlyInStage] = {
        type: "instruction",
        index: currentInstructionIndex,
        stalled: true,
        forwardedFrom: undefined,
      }
    }

    // If IF stage is empty, then fetch a new instruction
    if (next.IF === null && nextFetchIndex < count) {
      next.IF = {
        type: "instruction",
        index: nextFetchIndex,
        stalled: false,
        forwardedFrom: undefined,
      }
      nextFetchIndex++
    }

    state = next
    cycle++

    snapshots.push({
      cycle: cycle - 1,
      ...state
    })

    console.log(state)

    const pipelineEmpty = STAGE_ORDER.every((s) => state[s] === null)
    if (pipelineEmpty && nextFetchIndex >= count) {
      snapshots.pop()
      break
    }

    if (cycle > 500) break
  }

  return snapshots
}

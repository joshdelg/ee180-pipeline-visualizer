import { getRegisterName } from "./mips-parser"
import { getDataAvailableAfterStage, getDataRequiredStage, INSTRUCTION_INFO, type OptLevel } from "./pipeline-data-availability"
import type {
  CycleSnapshot,
  ForwardedFrom,
  ForwardSource,
  ParsedInstruction,
  PipelineStage,
  PipelineStageData,
  StageSlot,
} from "./pipeline-types"
import { instructionSlot, isInstructionSlot, STAGE_ORDER } from "./pipeline-types"

const NOP_SLOT: StageSlot = { type: "nop" }

function createEmptyState(): PipelineStageData {
  return {
    IF: NOP_SLOT,
    "ID/RF": NOP_SLOT,
    EX: NOP_SLOT,
    MEM: NOP_SLOT,
    WB: NOP_SLOT,
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
 * For a fixed pipeline state, finds the producers (if any) for each register that the consumer reads.
 * Returns a map: registerNumber -> ForwardSource. At most one producer per register.
 */
function getRegisterDependencies(
  consumer: ParsedInstruction,
  consumerStage: PipelineStage,
  pipelineState: PipelineStageData,
): Map<number, ForwardSource> {
  const deps = new Map<number, ForwardSource>()
  const readRegs = getRegistersRead(consumer)
  
  if (readRegs.length === 0) {
    console.log(`[${consumer.index}] ${consumer.text} does not read any registers, so it does not have a dependency`)
    return deps
  }

  const consumerStageIndex = STAGE_ORDER.indexOf(consumerStage)
  const stagesAfterConsumer = STAGE_ORDER.slice(consumerStageIndex + 1)

  for (const stage of stagesAfterConsumer) {
    console.log(`[${consumer.index}] Searching for dependency in stage: ${stage}`)
    
    const producerSlot = pipelineState[stage]
    if (!isInstructionSlot(producerSlot)) {
      console.log(`[${consumer.index}] Stage ${stage} is not an instruction, so it cannot be a dependency`)
      continue
    }

    const producerInstruction = producerSlot.instruction
    const writtenReg = getRegisterWritten(producerInstruction)
    
    if (writtenReg === null || !readRegs.includes(writtenReg) || deps.has(writtenReg)) continue

    console.log(`[${consumer.index}] Producer instruction [${producerInstruction.index}] ${producerInstruction.text} writes register: $${getRegisterName(writtenReg) ?? writtenReg}, which is read by [${consumer.index}] ${consumer.text}`)
    deps.set(writtenReg, {
      instructionIndex: producerInstruction.index,
      stage,
    })
  }

  return deps
}

/** WB→ID/RF forwarding: returns ForwardedFrom for producers in WB, or undefined if none. */
function tryUseFastRF(
  instruction: ParsedInstruction,
  next: PipelineStageData
): ForwardedFrom | undefined {
  const deps = getRegisterDependencies(instruction, "ID/RF", next)
  const fastRfFrom: ForwardedFrom = {}
  for (const [reg, producer] of deps) {
    if (producer.stage === "WB") fastRfFrom[reg] = producer
  }
  return Object.keys(fastRfFrom).length > 0 ? fastRfFrom : undefined
}

/** Returns ForwardedFrom if all deps can be forwarded, null if we must stall. */
function tryForwardAll(
  registerDeps: Map<number, ForwardSource>,
  instructions: ParsedInstruction[],
  optLevel: OptLevel
): ForwardedFrom | null {
  const forwardedFrom: ForwardedFrom = {}

  for (const [reg, producer] of registerDeps) {
    const producerInst = instructions[producer.instructionIndex]!
    const dataAvailableAfterStage = getDataAvailableAfterStage(producerInst.opcode, optLevel)
    
    const producerHasDataReady =
      STAGE_ORDER.indexOf(dataAvailableAfterStage) < STAGE_ORDER.indexOf(producer.stage)
    
    if (!producerHasDataReady) return null
    forwardedFrom[reg] = producer
  }

  return forwardedFrom
}

type PromoteOutcome =
  | { kind: "skip" }
  | { kind: "stall"; instruction: ParsedInstruction }
  | { kind: "advance"; instruction: ParsedInstruction; forwardedFrom?: ForwardedFrom }

/** Returns whether or not the instruction can be promoted to the next stage depending on
 * the data availability and forwarding logic.
 */
function getPromoteOutcome(
  state: PipelineStageData,
  next: PipelineStageData,
  fromStage: PipelineStage,
  toStage: PipelineStage,
  instructions: ParsedInstruction[],
  optLevel: OptLevel
): PromoteOutcome {
  // fromStage is empty, so there's nothing to promote.
  const slot = state[fromStage]
  if (!isInstructionSlot(slot)) return { kind: "skip" }

  // There is already an instruction where we would promote to, so we must stall.
  const instruction = slot.instruction
  if (isInstructionSlot(next[toStage])) return { kind: "stall", instruction }

  const dataRequiredStage = getDataRequiredStage(instruction.opcode, optLevel)
  const stageDoesNotRequireData = dataRequiredStage !== toStage;
  const shouldTryFastRF = toStage === "ID/RF";

  // If the stage doesn't require register values, we:
  // 1) See if we can use fast RF. We should always try this when possible (instead of waiting and trying to forward later).
  // 2) Otherwise, just advance
  if (stageDoesNotRequireData) {
    if (shouldTryFastRF) {
      const forwardedFrom = tryUseFastRF(instruction, next)
      return { kind: "advance", instruction, forwardedFrom }
    }

    return { kind: "advance", instruction }
  }

  // If this instruction doesn't depend on any others in the current pipeline state, we can advance.
  const registerDeps = getRegisterDependencies(instruction, toStage, next)
  if (registerDeps.size === 0) return { kind: "advance", instruction }

  // Otherwise, we need to see if we can forward all the dependencies.
  const forwardedFrom = tryForwardAll(registerDeps, instructions, optLevel)
  if (forwardedFrom !== null) return { kind: "advance", instruction, forwardedFrom }

  // If we can't forward all the dependencies, we must stall.
  return { kind: "stall", instruction }
}

/**
 * Tries to promote the instruction in fromStage to toStage. Mutates next: either writes
 * the instruction into toStage (advance) or leaves it in fromStage (stall).
 */
function tryPromoteInstruction(
  state: PipelineStageData,
  next: PipelineStageData,
  fromStage: PipelineStage,
  toStage: PipelineStage,
  instructions: ParsedInstruction[],
  optLevel: OptLevel
): void {
  const outcome = getPromoteOutcome(state, next, fromStage, toStage, instructions, optLevel)

  switch (outcome.kind) {
    case "skip":
      return
    case "stall":
      next[fromStage] = instructionSlot(outcome.instruction, { stalled: true })
      return
    case "advance":
      next[toStage] = instructionSlot(outcome.instruction, {
        stalled: false,
        forwardedFrom: outcome.forwardedFrom,
      })
      return
  }
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
  // `cycle` is the cycle number of `next` -- the pipeline we're assigning to
  let cycle = 0

  while (true) {
    const next = createEmptyState()

    for (let stageIndex = STAGE_ORDER.length - 1; stageIndex > 0; stageIndex--) {
      const toStage = STAGE_ORDER[stageIndex]
      const fromStage = STAGE_ORDER[stageIndex - 1]

      console.log(`Promoting from stage: ${fromStage} to stage: ${toStage}`)
      tryPromoteInstruction(state, next, fromStage, toStage, instructions, optLevel)
    }

    // If IF stage is empty, then fetch a new instruction
    if (!isInstructionSlot(next.IF) && nextFetchIndex < count) {
      next.IF = instructionSlot(instructions[nextFetchIndex]!, { stalled: false })
      nextFetchIndex++
    }

    state = next

    snapshots.push({
      cycle,
      ...state
    })

    console.log(`cycle ${cycle}:`, JSON.parse(JSON.stringify(state)))

    const pipelineEmpty = STAGE_ORDER.every((s) => !isInstructionSlot(state[s]))
    if (pipelineEmpty && nextFetchIndex >= count) {
      snapshots.pop()
      break
    }

    cycle++

    if (cycle > 500) break
  }

  return snapshots
}

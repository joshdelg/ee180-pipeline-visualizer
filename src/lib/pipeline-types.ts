/**
 * Pipeline data shapes:
 * - ParsedInstruction[] = the program (one source of truth; simulator and UI both use it).
 * - StageSlot = what occupies a single pipeline stage: an instruction (plus stall/forwarding) or nop (empty or stall bubble).
 * - PipelineStageData always has five StageSlots (no null); empty / bubble is represented by { type: "nop" }.
 * - GridCellContent = display-only: what to draw in one (instruction, cycle) cell (stage or bubble).
 */

export type PipelineStage = "IF" | "ID/RF" | "EX" | "MEM" | "WB"

export const STAGE_ORDER: PipelineStage[] = ["IF", "ID/RF", "EX", "MEM", "WB"]

export type RTypeOpcode = "add" | "addu" | "sub" | "subu"
export type ITypeOpcode = "addi" | "addiu" | "lw" | "sw"

export interface ParsedRType {
  text: string
  index: number
  instructionType: "R"
  opcode: RTypeOpcode
  rd: number
  rs: number
  rt: number
}

export interface ParsedIType {
  text: string
  index: number
  instructionType: "I"
  opcode: ITypeOpcode
  rt: number
  rs: number
  immediate: number
}

export type ParsedInstruction = ParsedRType | ParsedIType

export interface ForwardSource {
  instructionIndex: number
  stage: PipelineStage
}

/** Map from register number to the source of the forwarded value */
export type ForwardedFrom = Record<number, ForwardSource>

/** What can occupy a single pipeline stage slot: the instruction (plus stall/forwarding) or nop (empty or stall bubble). */
export type StageSlot =
  | {
      type: "instruction"
      instruction: ParsedInstruction
      stalled: boolean
      forwardedFrom?: ForwardedFrom
    }
  | { type: "nop" }

export function isInstructionSlot(
  slot: StageSlot
): slot is Extract<StageSlot, { type: "instruction" }> {
  return slot.type === "instruction"
}

export function instructionSlot(
  instruction: ParsedInstruction,
  opts: { stalled: boolean; forwardedFrom?: ForwardedFrom }
): Extract<StageSlot, { type: "instruction" }> {
  return {
    type: "instruction",
    instruction,
    stalled: opts.stalled,
    forwardedFrom: opts.forwardedFrom,
  }
}

export interface PipelineStageData {
  IF: StageSlot
  "ID/RF": StageSlot
  EX: StageSlot
  MEM: StageSlot
  WB: StageSlot
}

/** Pipeline state at the end of cycle N. snapshots[i].cycle === i. */
export interface CycleSnapshot extends PipelineStageData {
  cycle: number
}

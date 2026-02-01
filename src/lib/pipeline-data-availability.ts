import type { PipelineStage } from "./pipeline-types"

/**
 * Supported MIPS instruction opcodes.
 */
export const INSTRUCTIONS = [
  "add",
  "addu",
  "sub",
  "subu",
  "addi",
  "addiu",
  "lw",
  "sw",
] as const

export type InstructionOpcode = (typeof INSTRUCTIONS)[number]

/**
 * Pipeline stage at which each instruction's output data becomes available.
 * With no optimizations, all instructions produce their result at WB.
 */
export const DATA_AVAILABLE_STAGE: Record<InstructionOpcode, PipelineStage> = {
  add: "WB",
  addu: "WB",
  sub: "WB",
  subu: "WB",
  addi: "WB",
  addiu: "WB",
  lw: "WB",
  sw: "WB",
}

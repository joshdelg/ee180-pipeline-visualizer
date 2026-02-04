/**
 * Single source of truth for MIPS opcodes supported by the parser and pipeline.
 * R-type: $d, $s, $t. I-type: $t, $s, imm or offset($base) for lw/sw.
 */

export const R_TYPE_OPCODES = [
  "add",
  "addu",
  "sub",
  "subu",
  "and",
  "or",
  "nor",
  "xor",
  "slt",
  "sltu",
] as const

export const I_TYPE_OPCODES = [
  "addi",
  "addiu",
  "andi",
  "ori",
  "xori",
  "slti",
  "sltiu",
  "lw",
  "sw",
] as const

export const INSTRUCTIONS = [
  ...R_TYPE_OPCODES,
  ...I_TYPE_OPCODES,
] as const

export type RTypeOpcode = (typeof R_TYPE_OPCODES)[number]
export type ITypeOpcode = (typeof I_TYPE_OPCODES)[number]
export type InstructionOpcode = (typeof INSTRUCTIONS)[number]

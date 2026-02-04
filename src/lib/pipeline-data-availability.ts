import type { InstructionOpcode } from "./mips-opcodes"
import type { PipelineStage } from "./pipeline-types"

export type { InstructionOpcode } from "./mips-opcodes"
export { INSTRUCTIONS } from "./mips-opcodes"

export type InstructionFormatType = "R" | "I"

export type InstructionCategory = "arithmetic" | "memory"

export interface InstructionInfo {
  /** The opcode of the instruction */
  opcode: InstructionOpcode
  /** The type of the instruction */
  instructionType: InstructionFormatType
  /** The category of the instruction (arithmetic or memory); determine shared behavior like at which stage data is required/available */
  category: InstructionCategory
  /** Whether the instruction writes to a register */
  writesToRegister: boolean
}

export const INSTRUCTION_INFO: Record<InstructionOpcode, InstructionInfo> = {
  add: {
    opcode: "add",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  addu: {
    opcode: "addu",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  sub: {
    opcode: "sub",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  subu: {
    opcode: "subu",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  and: {
    opcode: "and",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  or: {
    opcode: "or",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  nor: {
    opcode: "nor",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  xor: {
    opcode: "xor",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  slt: {
    opcode: "slt",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  sltu: {
    opcode: "sltu",
    instructionType: "R",
    category: "arithmetic",
    writesToRegister: true,
  },
  addi: {
    opcode: "addi",
    instructionType: "I",
    category: "arithmetic",
    writesToRegister: true,
  },
  addiu: {
    opcode: "addiu",
    instructionType: "I",
    category: "arithmetic",
    writesToRegister: true,
  },
  andi: {
    opcode: "andi",
    instructionType: "I",
    category: "arithmetic",
    writesToRegister: true,
  },
  ori: {
    opcode: "ori",
    instructionType: "I",
    category: "arithmetic",
    writesToRegister: true,
  },
  xori: {
    opcode: "xori",
    instructionType: "I",
    category: "arithmetic",
    writesToRegister: true,
  },
  slti: {
    opcode: "slti",
    instructionType: "I",
    category: "arithmetic",
    writesToRegister: true,
  },
  sltiu: {
    opcode: "sltiu",
    instructionType: "I",
    category: "arithmetic",
    writesToRegister: true,
  },
  lw: {
    opcode: "lw",
    instructionType: "I",
    category: "memory",
    writesToRegister: true,
  },
  sw: {
    opcode: "sw",
    instructionType: "I",
    category: "memory",
    writesToRegister: false,
  },
}

export const OPT_LEVEL_NONE = "NONE" as const
export const OPT_LEVEL_FAST_RF = "FAST_RF" as const
export const OPT_LEVEL_FORWARDING = "FORWARDING" as const
export const OPT_LEVELS = [OPT_LEVEL_NONE, OPT_LEVEL_FAST_RF, OPT_LEVEL_FORWARDING] as const
export type OptLevel = (typeof OPT_LEVELS)[number]

interface StageTimingConfig {
  dataAvailableAfterStage: PipelineStage
  dataRequiredStage: PipelineStage
}

const STAGE_TIMING_BY_OPT_LEVEL: Record<
  OptLevel,
  Record<InstructionCategory, StageTimingConfig>
> = {
  [OPT_LEVEL_NONE]: {
    arithmetic: { dataAvailableAfterStage: "WB", dataRequiredStage: "ID/RF" },
    memory: { dataAvailableAfterStage: "WB", dataRequiredStage: "ID/RF" },
  },
  [OPT_LEVEL_FAST_RF]: {
    // RF processes writes in first half of cycle, reads in second. So, register values effectively available in WB/after MEM.
    arithmetic: { dataAvailableAfterStage: "MEM", dataRequiredStage: "ID/RF" },
    memory: { dataAvailableAfterStage: "MEM", dataRequiredStage: "ID/RF" },
  },
  [OPT_LEVEL_FORWARDING]: {
    // Forwarding paths allow arithmetic instruction to get their data in the EX stage, and send it out anywhere after EX stage
    // Memory instructions still will only produce their data after the MEM stage, but require it in EX.
    arithmetic: { dataAvailableAfterStage: "EX", dataRequiredStage: "EX" },
    memory: { dataAvailableAfterStage: "MEM", dataRequiredStage: "EX" },
  }
}

export function getDataAvailableAfterStage(
  opcode: InstructionOpcode,
  optLevel: OptLevel
): PipelineStage {
  const category = INSTRUCTION_INFO[opcode].category
  return STAGE_TIMING_BY_OPT_LEVEL[optLevel][category].dataAvailableAfterStage
}

export function getDataRequiredStage(
  opcode: InstructionOpcode,
  optLevel: OptLevel
): PipelineStage {
  const category = INSTRUCTION_INFO[opcode].category
  return STAGE_TIMING_BY_OPT_LEVEL[optLevel][category].dataRequiredStage
}

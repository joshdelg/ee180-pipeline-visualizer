export type PipelineStage = "IF" | "ID/RF" | "EX" | "MEM" | "WB"

export const STAGE_ORDER: PipelineStage[] = ["IF", "ID/RF", "EX", "MEM", "WB"]

export interface PipelineInstruction {
  text: string
  index: number
}

export type RTypeOpcode = "add" | "addu" | "sub" | "subu"
export type ITypeOpcode = "addi" | "addiu" | "lw" | "sw"

export interface ParsedRType extends PipelineInstruction {
  instructionType: "R"
  opcode: RTypeOpcode
  rd: number
  rs: number
  rt: number
}

export interface ParsedIType extends PipelineInstruction {
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

export type StageContent =
  | {
      type: "instruction"
      index: number
      stalled: boolean
      forwardedFrom?: ForwardedFrom
    }
  | {
      type: "bubble"
      causedByStallOf?: number
    }

export interface PipelineStageData {
  IF: StageContent | null
  "ID/RF": StageContent | null
  EX: StageContent | null
  MEM: StageContent | null
  WB: StageContent | null
}

export interface CycleSnapshot extends PipelineStageData {
  cycle: number
}

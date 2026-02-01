export type PipelineStage = "IF" | "ID/RF" | "EX" | "MEM" | "WB"

export const STAGE_ORDER: PipelineStage[] = ["IF", "ID/RF", "EX", "MEM", "WB"]

export interface PipelineInstruction {
  text: string
  index: number
}

/**
 * Parsed instruction with operands for hazard detection.
 * rd/rs/rt are MIPS register numbers (0-31).
 */
export interface ParsedInstruction extends PipelineInstruction {
  opcode: string
  rd: number | null
  rs: number | null
  rt: number | null
  immediate: number | null
}

export interface ForwardFrom {
  instructionIndex: number
  stage: PipelineStage
}

export type StageContent =
  | {
      type: "instruction"
      index: number
      stalled: boolean
      forwardedFrom?: ForwardFrom
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

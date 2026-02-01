export type PipelineStage = "IF" | "ID/RF" | "EX" | "MEM" | "WB"

export interface PipelineInstruction {
  text: string
  index: number
}

export interface ForwardFrom {
  instructionIndex: number
  stage: PipelineStage
}

export type StageContent =
  | {
      type: "instruction"
      index: number
      stalled?: boolean
      forwardedFrom?: ForwardFrom
    }
  | {
      type: "bubble"
      causedByStallOf?: number
    }

export interface CycleSnapshot {
  cycle: number
  IF: StageContent | null
  "ID/RF": StageContent | null
  EX: StageContent | null
  MEM: StageContent | null
  WB: StageContent | null
}

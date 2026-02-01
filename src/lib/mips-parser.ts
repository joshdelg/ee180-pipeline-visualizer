import type { ParsedInstruction } from "./pipeline-types"

export interface ParseError {
  line: number
  column?: number
  message: string
}

export interface ParseResult {
  instructions: ParsedInstruction[]
  errors: ParseError[]
}

/** MIPS register name/number mapping */
const REGISTERS: Record<string, number> = {
  zero: 0,
  at: 1,
  v0: 2,
  v1: 3,
  a0: 4,
  a1: 5,
  a2: 6,
  a3: 7,
  t0: 8,
  t1: 9,
  t2: 10,
  t3: 11,
  t4: 12,
  t5: 13,
  t6: 14,
  t7: 15,
  s0: 16,
  s1: 17,
  s2: 18,
  s3: 19,
  s4: 20,
  s5: 21,
  s6: 22,
  s7: 23,
  t8: 24,
  t9: 25,
  k0: 26,
  k1: 27,
  gp: 28,
  sp: 29,
  fp: 30,
  ra: 31,
}

function parseRegister(s: string): number | null {
  const trimmed = s.trim()
  if (!trimmed.startsWith("$")) return null
  const rest = trimmed.slice(1)
  if (REGISTERS[rest] !== undefined) return REGISTERS[rest]
  const num = parseInt(rest, 10)
  if (!isNaN(num) && num >= 0 && num <= 31) return num
  return null
}

function parseImmediate(s: string): number | null {
  const trimmed = s.trim()
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    const n = parseInt(trimmed.slice(2), 16)
    return isNaN(n) ? null : n
  }
  const n = parseInt(trimmed, 10)
  return isNaN(n) ? null : n
}

const R_TYPE_OPS = ["add", "addu", "sub", "subu"]
const I_TYPE_ARITH_OPS = ["addi", "addiu"]
const LOAD_STORE_OPS = ["lw", "sw"]

/** Strips comment and trims. Returns null if line is empty or comment-only. */
function stripLine(line: string): string | null {
  const commentIdx = line.indexOf("#")
  const code = (commentIdx >= 0 ? line.slice(0, commentIdx) : line).trim()
  return code.length > 0 ? code : null
}

/**
 * Parses MIPS assembly source into ParsedInstruction[].
 * Supports: add, addu, sub, subu, addi, addiu, lw, sw.
 */
export function parse(source: string): ParseResult {
  const errors: ParseError[] = []
  const instructions: ParsedInstruction[] = []
  const labelToIndex = new Map<string, number>()

  const lines = source.split("\n")
  let instructionIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const code = stripLine(lines[i])
    if (!code) continue

    // Handle label (e.g., "loop:")
    let rest = code
    const labelMatch = code.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/)
    if (labelMatch) {
      labelToIndex.set(labelMatch[1], instructionIndex)
      rest = labelMatch[2].trim()
      if (!rest) continue
    }

    const parts = rest.split(/[\s,]+/).filter(Boolean)
    if (parts.length === 0) continue

    const opcode = parts[0].toLowerCase()
    const operands = parts.slice(1)
    const raw = rest

    const err = (msg: string) => {
      errors.push({ line: lineNum, message: msg })
    }

    let rd: number | null = null
    let rs: number | null = null
    let rt: number | null = null
    let immediate: number | null = null

    if (R_TYPE_OPS.includes(opcode)) {
      // add $d, $s, $t
      if (operands.length !== 3) {
        err(`Expected 3 operands for ${opcode}`)
      } else {
        rd = parseRegister(operands[0])
        rs = parseRegister(operands[1])
        rt = parseRegister(operands[2])
        if (rd === null) err(`Invalid destination register: ${operands[0]}`)
        if (rs === null) err(`Invalid source register: ${operands[1]}`)
        if (rt === null) err(`Invalid source register: ${operands[2]}`)
      }
    } else if (I_TYPE_ARITH_OPS.includes(opcode)) {
      // addi $t, $s, imm
      if (operands.length !== 3) {
        err(`Expected 3 operands for ${opcode}`)
      } else {
        rt = parseRegister(operands[0])
        rs = parseRegister(operands[1])
        immediate = parseImmediate(operands[2])
        if (rt === null) err(`Invalid destination register: ${operands[0]}`)
        if (rs === null) err(`Invalid source register: ${operands[1]}`)
        if (immediate === null) err(`Invalid immediate: ${operands[2]}`)
      }
    } else if (LOAD_STORE_OPS.includes(opcode)) {
      // lw $t, offset($s)  or  sw $t, offset($s)
      if (operands.length !== 2) {
        err(`Expected 2 operands for ${opcode}`)
      } else {
        rt = parseRegister(operands[0])
        const memMatch = operands[1].match(/^(-?\d+)\s*\(\s*\$(\w+)\s*\)$/)
        const memMatchAlt = operands[1].match(
          /^(-?0x[0-9a-fA-F]+)\s*\(\s*\$(\w+)\s*\)$/i
        )
        const memMatch2 = operands[1].match(/\(\s*\$(\w+)\s*\)/)
        if (memMatch) {
          immediate = parseInt(memMatch[1], 10)
          rs = parseRegister("$" + memMatch[2])
        } else if (memMatchAlt) {
          immediate = parseInt(memMatchAlt[1], 16)
          rs = parseRegister("$" + memMatchAlt[2])
        } else if (memMatch2) {
          rs = parseRegister("$" + memMatch2[1])
          immediate = 0
        } else {
          err(`Invalid memory operand: ${operands[1]} (expected offset($base))`)
        }
        if (rt === null) err(`Invalid register: ${operands[0]}`)
        if (rs === null && operands[1].includes("("))
          err(`Invalid base register in ${operands[1]}`)
      }
    } else {
      err(`Unsupported instruction: ${opcode}`)
      continue
    }

    // Only add instruction if operands are valid
    const isValid =
      (R_TYPE_OPS.includes(opcode) && rd !== null && rs !== null && rt !== null) ||
      (I_TYPE_ARITH_OPS.includes(opcode) &&
        rt !== null &&
        rs !== null &&
        immediate !== null) ||
      (LOAD_STORE_OPS.includes(opcode) && rt !== null && rs !== null)

    if (isValid) {
      instructions.push({
        index: instructionIndex,
        text: raw,
        opcode,
        rd,
        rs,
        rt,
        immediate,
      })
      instructionIndex++
    }
  }

  return { instructions, errors }
}

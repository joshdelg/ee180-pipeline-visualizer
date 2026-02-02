export interface AssemblySnippet {
  id: string
  label: string
  description: string
  code: string
}

export const ASSEMBLY_SNIPPETS: AssemblySnippet[] = [
  {
    id: "raw-example",
    label: "Standard RAW Hazard",
    description: "With no optimizations, processor stalls 3 times. With fast RF, only stalls twice. With forwarding, no stalls.",
    code: `
add $t1, $t2, $t3
sub $t4, $t1, $t3
add $t6, $t1, $t7
add $t8, $t1, $s0
add $s1, $t1, $s2
`,
  },
  {
    id: "load-case",
    label: "Load Case",
    description: "Even with forwarding, processor must stall one cycle.",
    code: `
lw $t1, 0($t2)
sub $t4, $t1, $t6
add $t6, $t1, $t7
add $t8, $t1, $s0
`,
  },
  {
    id: "double-hazard",
    label: "Double Hazard",
    description: "Must forward the most updated value of $t1.",
    code: `
add $t1, $t1, $t2
sub $t1, $t1, $t3
add $t1, $t1, $t4
`,
  },
  {
    id: "store",
    label: "Store",
    description: "Stores do not write to a register, so no dependency",
    code: `
sw $t1, 0($t2)
add $t4, $t1, $t6
`,
  },
  {
    id: "blank",
    label: "Blank",
    description: "Empty editor to write your own MIPS assembly.",
    code: `# Enter your MIPS assembly code here
`,
  },
]

import { useState } from "react"

import { EditorPanel } from "@/components/editor-panel"
import { StepControls } from "@/components/step-controls"
import { VisualizationPanel } from "@/components/visualization-panel"

const DEFAULT_MIPS = `# Enter your MIPS assembly code here
add $t0, $t1, $t2
lw $s0, 0($sp)
sw $s1, 4($sp)`

function App() {
  const [assemblyCode, setAssemblyCode] = useState(DEFAULT_MIPS)
  const [currentStep, setCurrentStep] = useState(0)

  // Placeholder: count non-empty, non-comment lines as instructions
  const instructionCount = assemblyCode
    ? assemblyCode
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim()
          return trimmed.length > 0 && !trimmed.startsWith("#")
        }).length
    : 0

  const handleStepBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const handleStepForward = () => {
    setCurrentStep((prev) => Math.min(instructionCount, prev + 1))
  }

  return (
    <div className="flex min-h-svh flex-col">
      <StepControls
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        canStepBack={currentStep > 0}
        canStepForward={currentStep < instructionCount}
        currentStep={currentStep}
        totalSteps={instructionCount}
      />
      <main className="flex flex-1 overflow-hidden">
        <aside className="flex w-80 shrink-0 flex-col border-r bg-muted/30">
          <div className="flex h-full flex-col p-3">
            <EditorPanel value={assemblyCode} onChange={setAssemblyCode} />
          </div>
        </aside>
        <section className="flex flex-1 flex-col overflow-hidden p-3">
          <VisualizationPanel />
        </section>
      </main>
    </div>
  )
}

export default App

import { useState, useMemo } from "react"

import { EditorPanel } from "@/components/editor-panel"
import { OptLevelSelector } from "@/components/opt-level-selector"
import { SnippetSelector } from "@/components/snippet-selector"
import { StepControls } from "@/components/step-controls"
import { VisualizationPanel } from "@/components/visualization-panel"
import { ASSEMBLY_SNIPPETS } from "@/lib/assembly-snippets"
import { parse } from "@/lib/mips-parser"
import { OPT_LEVEL_NONE, type OptLevel } from "@/lib/pipeline-data-availability"

function App() {
  const [assemblyCode, setAssemblyCode] = useState(
    () => ASSEMBLY_SNIPPETS[0].code
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [optLevel, setOptLevel] = useState<OptLevel>(OPT_LEVEL_NONE)

  const parseResult = useMemo(() => parse(assemblyCode), [assemblyCode])
  const { instructions, errors } = parseResult
  const instructionCount = instructions.length

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
          <div className="flex h-full flex-col gap-3 p-3">
            <SnippetSelector value={assemblyCode} onChange={setAssemblyCode} />
            <div className="min-h-0 flex-1">
              <EditorPanel value={assemblyCode} onChange={setAssemblyCode} />
            </div>
            <OptLevelSelector value={optLevel} onChange={setOptLevel} />
          </div>
        </aside>
        <section className="flex flex-1 flex-col overflow-hidden p-3">
          <VisualizationPanel
            instructions={instructions}
            parseErrors={errors}
            optLevel={optLevel}
          />
        </section>
      </main>
    </div>
  )
}

export default App

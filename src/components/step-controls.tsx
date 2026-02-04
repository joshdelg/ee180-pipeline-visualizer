import { ModeToggle } from "@/components/mode-toggle"

// interface StepControlsProps {
//   onStepBack?: () => void
//   onStepForward?: () => void
//   canStepBack?: boolean
//   canStepForward?: boolean
//   currentStep?: number
//   totalSteps?: number
// }

// export function StepControls({
//   onStepBack: _onStepBack,
//   onStepForward: _onStepForward,
//   canStepBack: _canStepBack = true,
//   canStepForward: _canStepForward = true,
//   currentStep = 0,
//   totalSteps = 0,
// }: StepControlsProps) {
export function StepControls() {
  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          {/* <Button
            variant="outline"
            size="icon"
            onClick={onStepBack}
            disabled={!canStepBack}
            aria-label="Step backward"
          >
            <ChevronLeft className="size-4" />
          </Button> */}
          {/* Step forward commented out for now
          <Button
            variant="outline"
            size="icon"
            onClick={onStepForward}
            disabled={!canStepForward}
            aria-label="Step forward"
          >
            <ChevronRight className="size-4" />
          </Button> */}
          Pipeline Visualizer
        </div>
        <div className="text-muted-foreground text-sm">
          Write your own MIPS or use a provided snippet to explore how stalling and forwarding work. Only arithmetic/memory operations are supported. <br />
          Change the optimization level to see how it affects the pipeline.
        </div>
        {/* <span className="text-muted-foreground text-sm">
          Step {currentStep} of {totalSteps}
        </span> */}
      </div>
      <ModeToggle />
    </header>
  )
}

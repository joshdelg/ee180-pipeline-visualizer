import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

interface StepControlsProps {
  onStepBack?: () => void
  onStepForward?: () => void
  canStepBack?: boolean
  canStepForward?: boolean
  currentStep?: number
  totalSteps?: number
}

export function StepControls({
  onStepBack,
  onStepForward,
  canStepBack = true,
  canStepForward = true,
  currentStep = 0,
  totalSteps = 0,
}: StepControlsProps) {
  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onStepBack}
            disabled={!canStepBack}
            aria-label="Step backward"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onStepForward}
            disabled={!canStepForward}
            aria-label="Step forward"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <span className="text-muted-foreground text-sm">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <ModeToggle />
    </header>
  )
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  OPT_LEVELS,
  type OptLevel,
} from "@/lib/pipeline-data-availability"

const OPT_LEVEL_LABELS: Record<OptLevel, string> = {
  NONE: "None",
  FAST_RF: "Fast RF",
  FORWARDING: "Forwarding",
}

interface OptLevelSelectorProps {
  value: OptLevel
  onChange: (value: OptLevel) => void
}

export function OptLevelSelector({ value, onChange }: OptLevelSelectorProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t pt-3">
      <label className="text-muted-foreground text-xs font-medium">
        Optimization level
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as OptLevel)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select optimization" />
        </SelectTrigger>
        <SelectContent>
          {OPT_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {OPT_LEVEL_LABELS[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

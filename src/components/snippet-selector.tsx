import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ASSEMBLY_SNIPPETS } from "@/lib/assembly-snippets"

interface SnippetSelectorProps {
  value: string
  onChange: (code: string) => void
}

export function SnippetSelector({ value, onChange }: SnippetSelectorProps) {
  const selectedId =
    ASSEMBLY_SNIPPETS.find((s) => s.code.trim() === value.trim())?.id ??
    "custom"

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <label className="text-muted-foreground text-xs font-medium">
        Load snippet
      </label>
      <Select
        value={selectedId}
        onValueChange={(id) => {
          const snippet = ASSEMBLY_SNIPPETS.find((s) => s.id === id)
          if (snippet) onChange(snippet.code)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a snippet" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom" disabled>
            Custom (edited)
          </SelectItem>
          {ASSEMBLY_SNIPPETS.map((snippet) => (
            <SelectItem
              key={snippet.id}
              value={snippet.id}
              title={snippet.description}
            >
              {snippet.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

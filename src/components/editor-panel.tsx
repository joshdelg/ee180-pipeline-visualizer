import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface EditorPanelProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function EditorPanel({
  value = "",
  onChange,
  placeholder = "Enter MIPS assembly instructions...",
}: EditorPanelProps) {
  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="flex-shrink-0 border-b px-4 !pb-2 pt-3">
        <CardTitle className="text-base font-medium">MIPS Assembly</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="min-h-0 flex-1 resize-none rounded-none border-0 border-l-2 border-border bg-muted/40 font-mono text-sm [field-sizing:normal] [tab-size:4] focus-visible:ring-0 dark:bg-muted/20"
        />
      </CardContent>
    </Card>
  )
}

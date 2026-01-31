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
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 border-b px-4 py-3">
        <CardTitle className="text-base font-medium">MIPS Assembly</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="min-h-full resize-none rounded-none border-0 focus-visible:ring-0"
        />
      </CardContent>
    </Card>
  )
}

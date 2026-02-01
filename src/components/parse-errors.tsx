import { AlertCircle } from "lucide-react"

import type { ParseError } from "@/lib/mips-parser"

interface ParseErrorsProps {
  errors: ParseError[]
}

export function ParseErrors({ errors }: ParseErrorsProps) {
  if (errors.length === 0) return null

  return (
    <div
      role="alert"
      className="flex gap-3 border-b border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive"
    >
      <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium">
          {errors.length} parse error{errors.length > 1 ? "s" : ""}
        </span>
        <ul className="list-inside list-disc space-y-0.5 text-destructive/90">
          {errors.map((e) => (
            <li key={`${e.line}-${e.message}`}>
              Line {e.line}: {e.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

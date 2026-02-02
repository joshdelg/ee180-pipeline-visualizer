import { useEffect, useRef } from "react"
import type { ForwardingPath } from "@/lib/forwarding-paths"
import { getRegisterId } from "@/lib/forwarding-paths"

interface LeaderLineInstance {
  position(): LeaderLineInstance
  remove(): void
}

interface ForwardingPathsOverlayProps {
  paths: ForwardingPath[]
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

export function ForwardingPathsOverlay({
  paths,
  scrollContainerRef,
}: ForwardingPathsOverlayProps) {
  const linesRef = useRef<LeaderLineInstance[]>([])

  useEffect(() => {
    const LeaderLine = (window as unknown as { LeaderLine: new (a: HTMLElement, b: HTMLElement, o?: object) => LeaderLineInstance }).LeaderLine
    if (!LeaderLine) return

    const lines: LeaderLineInstance[] = []

    for (const path of paths) {
      const fromId = getRegisterId(path.fromInstructionIndex, path.cycle)
      const toId = getRegisterId(path.toInstructionIndex, path.cycle)

      const fromEl = document.getElementById(fromId)
      const toEl = document.getElementById(toId)

      if (fromEl && toEl) {
        const line = new LeaderLine(fromEl, toEl, {
          path: "arc",
          color: "#16a34a",
          size: 3,
          outline: true,
          outlineColor: "#15803d",
          dropShadow: true,
          startPlug: "behind",
          endPlug: "arrow3",
          endPlugColor: "#16a34a",
          startSocket: "bottom",
          endSocket: "top",
          startSocketGravity: [80, 0],
          endSocketGravity: [-80, 0],
        })
        lines.push(line)
      }
    }

    linesRef.current = lines

    const positionLines = () => {
      for (const line of linesRef.current) {
        line.position()
      }
    }

    const container = scrollContainerRef?.current
    if (container) {
      container.addEventListener("scroll", positionLines)
      window.addEventListener("resize", positionLines)
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", positionLines)
        window.removeEventListener("resize", positionLines)
      }
      for (const line of lines) {
        line.remove()
      }
      linesRef.current = []
    }
  }, [paths, scrollContainerRef])

  return null
}

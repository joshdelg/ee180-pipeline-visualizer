import { useEffect, useRef } from "react"
import type { ForwardingPath } from "@/lib/forwarding-paths"
import { getCellId } from "@/lib/forwarding-paths"

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
      const fromId = getCellId(path.fromInstructionIndex, path.cycle)
      const toId = getCellId(path.toInstructionIndex, path.cycle)

      const fromEl = document.getElementById(fromId)
      const toEl = document.getElementById(toId)

      if (fromEl && toEl) {
        const line = new LeaderLine(fromEl, toEl, {
          path: "fluid",
          color: "#22c55e",
          size: 2,
          startPlug: "behind",
          endPlug: "behind",
          startSocket: "bottom",
          endSocket: "top",
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

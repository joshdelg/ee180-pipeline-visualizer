import { useEffect, useRef, useState } from "react"
import type { ForwardingPath } from "@/lib/forwarding-paths"
import {
  getRegisterId,
  isFastRfPath,
  getFastRfAnchorFromId,
  getFastRfAnchorToId,
} from "@/lib/forwarding-paths"

interface LeaderLineInstance {
  position(): LeaderLineInstance
  remove(): void
}

interface PathHover {
  x: number
  y: number
  path: ForwardingPath
}

interface ForwardingPathsOverlayProps {
  paths: ForwardingPath[]
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  onHoveredPathChange?: (path: ForwardingPath | null) => void
}

/**
 * If LeaderLine left an SVG path in the DOM, sample the midpoint of that path
 * and return it in container coordinates. Returns null if the path can't be found.
 */
function pointFromLeaderLinePath(
  pathElement: SVGPathElement,
  containerRect: DOMRect,
  container: HTMLElement
): { x: number; y: number } | null {
  try {
    const length = pathElement.getTotalLength()
    const mid = pathElement.getPointAtLength(length * 0.5)
    const ctm = pathElement.getScreenCTM()
    if (!ctm) return null
    const screenX = mid.x * ctm.a + mid.y * ctm.c + ctm.e
    const screenY = mid.x * ctm.b + mid.y * ctm.d + ctm.f
    return {
      x: screenX - containerRect.left + container.scrollLeft,
      y: screenY - containerRect.top + container.scrollTop,
    }
  } catch {
    return null
  }
}

/**
 * Fallback: approximate a point on the arc using chord midpoint + perpendicular bulge.
 */
function pointOnArc(
  fromRect: DOMRect,
  toRect: DOMRect,
  containerRect: DOMRect,
  container: HTMLElement,
  isFastRf: boolean
): { x: number; y: number } {
  const gravity = isFastRf ? 0 : 80
  const startX = fromRect.left + fromRect.width / 2 + (isFastRf ? 0 : gravity)
  const startY = fromRect.bottom
  const endX = toRect.left + toRect.width / 2 - (isFastRf ? 0 : gravity)
  const endY = toRect.top

  const chordMidX = (startX + endX) / 2
  const chordMidY = (startY + endY) / 2
  const dx = endX - startX
  const dy = endY - startY
  const len = Math.hypot(dx, dy) || 1
  const perpX = -dy / len
  const perpY = dx / len
  const bulge = 0.2 * len
  const curveX = chordMidX + bulge * perpX
  const curveY = chordMidY + bulge * perpY

  return {
    x: curveX - containerRect.left + container.scrollLeft,
    y: curveY - containerRect.top + container.scrollTop,
  }
}

function getLeaderLinePathElements(): Element[] {
  const all = document.querySelectorAll(".leader-line")
  return Array.from(all)
}

function computePathHovers(
  paths: ForwardingPath[],
  container: HTMLElement,
  lineCount: number
): PathHover[] {
  const result: PathHover[] = []
  const containerRect = container.getBoundingClientRect()
  const pathClass = "leader-line-line-path"
  const wrappers = getLeaderLinePathElements().slice(-lineCount)

  let wrapperIndex = 0
  for (const path of paths) {
    const isFastRf = isFastRfPath(path)
    const fromId = isFastRf
      ? getFastRfAnchorFromId(path.fromInstructionIndex, path.cycle)
      : getRegisterId(path.fromInstructionIndex, path.cycle)
    const toId = isFastRf
      ? getFastRfAnchorToId(path.toInstructionIndex, path.cycle)
      : getRegisterId(path.toInstructionIndex, path.cycle)
    const fromEl = document.getElementById(fromId)
    const toEl = document.getElementById(toId)
    if (!fromEl || !toEl) continue

    let x: number
    let y: number
    const pathEl = wrappers[wrapperIndex]?.querySelector?.(`.${pathClass}`) as SVGPathElement | null
    const fromPath = pathEl
      ? pointFromLeaderLinePath(pathEl, containerRect, container)
      : null
    if (fromPath) {
      x = fromPath.x
      y = fromPath.y
    } else {
      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()
      const arc = pointOnArc(fromRect, toRect, containerRect, container, isFastRf)
      x = arc.x
      y = arc.y
    }
    result.push({ x, y, path })
    wrapperIndex++
  }
  return result
}

const LINE_GLOW_STYLE = "drop-shadow(0 0 10px #16a34a) drop-shadow(0 0 4px #16a34a)"
const ANCHOR_GLOW_STYLE = "0 0 12px #16a34a, 0 0 4px #16a34a"

export function ForwardingPathsOverlay({
  paths,
  scrollContainerRef,
  onHoveredPathChange,
}: ForwardingPathsOverlayProps) {
  const linesRef = useRef<LeaderLineInstance[]>([])
  const [pathHovers, setPathHovers] = useState<PathHover[]>([])
  const [hoveredPathIndex, setHoveredPathIndex] = useState<number | null>(null)
  const glowedElementsRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    const LeaderLine = (window as unknown as { LeaderLine: new (a: HTMLElement, b: HTMLElement, o?: object) => LeaderLineInstance }).LeaderLine
    if (!LeaderLine) return

    const lines: LeaderLineInstance[] = []
    const container = scrollContainerRef?.current

    for (const path of paths) {
      const isFastRf = isFastRfPath(path)
      const fromId = isFastRf
        ? getFastRfAnchorFromId(path.fromInstructionIndex, path.cycle)
        : getRegisterId(path.fromInstructionIndex, path.cycle)
      const toId = isFastRf
        ? getFastRfAnchorToId(path.toInstructionIndex, path.cycle)
        : getRegisterId(path.toInstructionIndex, path.cycle)

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
          startSocketGravity: isFastRf ? [0, 0] : [80, 0],
          endSocketGravity: isFastRf ? [0, 0] : [-80, 0],
        })
        lines.push(line)
      }
    }

    linesRef.current = lines

    let raf = 0
    const positionLines = () => {
      for (const line of linesRef.current) {
        line.position()
      }
      if (container) {
        setPathHovers(computePathHovers(paths, container, lines.length))
      }
    }

    if (container) {
      raf = requestAnimationFrame(() => {
        setPathHovers(computePathHovers(paths, container, lines.length))
      })
      container.addEventListener("scroll", positionLines)
      window.addEventListener("resize", positionLines)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
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

  useEffect(() => {
    if (pathHovers.length === 0) return
    const wrappers = getLeaderLinePathElements().slice(-pathHovers.length)
    wrappers.forEach((el, i) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.filter = i === hoveredPathIndex ? LINE_GLOW_STYLE : ""
    })

    const clearAnchorGlow = () => {
      glowedElementsRef.current.forEach((el) => {
        el.style.boxShadow = ""
      })
      glowedElementsRef.current = []
    }

    if (hoveredPathIndex !== null && pathHovers[hoveredPathIndex]) {
      clearAnchorGlow()
      const path = pathHovers[hoveredPathIndex].path
      const isFastRf = isFastRfPath(path)
      const fromId = isFastRf
        ? getFastRfAnchorFromId(path.fromInstructionIndex, path.cycle)
        : getRegisterId(path.fromInstructionIndex, path.cycle)
      const toId = isFastRf
        ? getFastRfAnchorToId(path.toInstructionIndex, path.cycle)
        : getRegisterId(path.toInstructionIndex, path.cycle)
      const toGlow = [
        document.getElementById(fromId),
        document.getElementById(toId),
      ].filter((el): el is HTMLElement => el != null)
      toGlow.forEach((el) => {
        el.style.boxShadow = ANCHOR_GLOW_STYLE
      })
      glowedElementsRef.current = toGlow
    } else {
      clearAnchorGlow()
    }

    return () => {
      wrappers.forEach((el) => {
        (el as HTMLElement).style.filter = ""
      })
      clearAnchorGlow()
    }
  }, [hoveredPathIndex, pathHovers])

  if (pathHovers.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden
    >
      {pathHovers.map((hover, i) => (
        <div
          key={i}
          className="pointer-events-auto absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-default rounded-full"
          style={{ left: hover.x, top: hover.y }}
          onMouseEnter={() => {
            setHoveredPathIndex(i)
            onHoveredPathChange?.(hover.path)
          }}
          onMouseLeave={() => {
            setHoveredPathIndex(null)
            onHoveredPathChange?.(null)
          }}
        />
      ))}
    </div>
  )
}

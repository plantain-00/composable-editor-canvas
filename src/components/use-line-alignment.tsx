import * as React from "react"
import { Region, ResizeDirection } from ".."

/**
 * @public
 */
export function useLineAlignment(delta: number) {
  const [lineAlignmentX, setLineAlignmentX] = React.useState<number>()
  const [lineAlignmentY, setLineAlignmentY] = React.useState<number>()

  return {
    lineAlignmentX,
    lineAlignmentY,
    changeOffsetByLineAlignment(
      offset: Region,
      direction: ResizeDirection,
      target: Region,
      xlines: number[],
      yLines: number[],
    ) {
      if (direction.includes('bottom')) {
        const y = target.y + target.height + offset.y + offset.height
        const line = yLines.find((r) => Math.abs(r - y) < delta)
        if (line !== undefined) {
          const delta = line - y
          offset.height += delta
          if (offset.y !== 0) {
            offset.height += delta
            offset.y -= delta
          }
          setLineAlignmentY(line)
        } else {
          setLineAlignmentY(undefined)
        }
      } else if (direction.includes('top')) {
        const y = target.y + offset.y
        const line = yLines.find((r) => Math.abs(r - y) < delta)
        if (line !== undefined) {
          const delta = line - y
          offset.height -= delta * (offset.y + offset.height !== 0 ? 2 : 1)
          offset.y += delta
          setLineAlignmentY(line)
        } else {
          setLineAlignmentY(undefined)
        }
      } else {
        setLineAlignmentY(undefined)
      }
      if (direction.includes('right')) {
        const x = target.x + target.width + offset.x + offset.width
        const line = xlines.find((r) => Math.abs(r - x) < delta)
        if (line !== undefined) {
          const delta = line - x
          offset.width += delta
          if (offset.x !== 0) {
            offset.width += delta
            offset.x -= delta
          }
          setLineAlignmentX(line)
        } else {
          setLineAlignmentX(undefined)
        }
      } else if (direction.includes('left')) {
        const x = target.x + offset.x
        const line = xlines.find((r) => Math.abs(r - x) < delta)
        if (line !== undefined) {
          const delta = line - x
          offset.width -= delta * (offset.x + offset.width !== 0 ? 2 : 1)
          offset.x += delta
          setLineAlignmentX(line)
        } else {
          setLineAlignmentX(undefined)
        }
      } else {
        setLineAlignmentX(undefined)
      }
    },
    clearLineAlignments() {
      setLineAlignmentX(undefined)
      setLineAlignmentY(undefined)
    },
  }
}

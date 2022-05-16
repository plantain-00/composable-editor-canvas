import * as React from "react"

import { getAngleSnapPosition, useEllipseClickCreate, useKey } from ".."
import { EllipseArc, Position, rotatePositionByCenter } from "../../utils"

export function useEllipseArcClickCreate(
  type: 'ellipse center' | 'ellipse endpoint' | undefined,
  onEnd: (arc: EllipseArc) => void,
  options?: Partial<{
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [ellipseArc, setEllipseArc] = React.useState<EllipseArc>()
  const [startAngle, setStartAngle] = React.useState<number>()

  const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition, setCursorPosition } = useEllipseClickCreate(
    type,
    (c) => setEllipseArc(c ? { ...c, startAngle: 0, endAngle: 0 } : undefined),
    options,
  )

  const reset = () => {
    setEllipseArc(undefined)
    setStartAngle(undefined)
    setCursorPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setEllipseArc, setStartAngle, setCursorPosition])

  return {
    ellipse,
    ellipseArc,
    startPosition,
    middlePosition,
    cursorPosition,
    onClick(p: Position) {
      if (!type) {
        return
      }
      if (ellipseArc) {
        p = getAngleSnapPosition({ x: ellipseArc.cx, y: ellipseArc.cy }, p, options?.getAngleSnap)
        const newPosition = rotatePositionByCenter(p, { x: ellipseArc.cx, y: ellipseArc.cy }, ellipseArc.angle ?? 0)
        let angle = Math.atan2((newPosition.y - ellipseArc.cy) / ellipseArc.ry, (newPosition.x - ellipseArc.cx) / ellipseArc.rx) * 180 / Math.PI
        if (startAngle === undefined) {
          setStartAngle(angle)
          setEllipseArc({ ...ellipseArc, startAngle: angle, endAngle: angle })
        } else {
          if (angle < startAngle) {
            angle += 360
          }
          setEllipseArc(undefined)
          onEnd({ ...ellipseArc, startAngle, endAngle: angle })
          reset()
        }
      } else {
        onClick(p)
      }
    },
    onMove(p: Position, viewportPosition?: Position) {
      if (!type) {
        return
      }
      if (ellipseArc) {
        p = getAngleSnapPosition({ x: ellipseArc.cx, y: ellipseArc.cy }, p, options?.getAngleSnap)
        setCursorPosition(p)
        if (startAngle !== undefined) {
          const newPosition = rotatePositionByCenter(p, { x: ellipseArc.cx, y: ellipseArc.cy }, ellipseArc.angle ?? 0)
          let angle = Math.atan2((newPosition.y - ellipseArc.cy) / ellipseArc.ry, (newPosition.x - ellipseArc.cx) / ellipseArc.rx) * 180 / Math.PI
          if (angle < startAngle) {
            angle += 360
          }
          setEllipseArc({ ...ellipseArc, startAngle, endAngle: angle })
        }
      } else {
        onMove(p, viewportPosition)
      }
    },
    input,
  }
}

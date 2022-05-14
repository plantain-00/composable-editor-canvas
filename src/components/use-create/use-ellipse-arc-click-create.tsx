import * as React from "react"

import { useEllipseClickCreate, useKey } from ".."
import { Ellipse, EllipseArc, Position, rotatePositionByCenter } from "../../utils"

export function useEllipseArcClickCreate(
  type: 'ellipse center' | 'ellipse endpoint' | undefined,
  setEllipseArc: (arc?: EllipseArc) => void,
  onEnd: (arc: EllipseArc) => void,
) {
  const [ellipseCreate, setEllipseCreate] = React.useState<Ellipse>()
  const [startAngle, setStartAngle] = React.useState<number>()

  const { onEllipseClickCreateClick, onEllipseClickCreateMove, ellipseClickCreateInput, startPosition, middlePosition, cursorPosition, setCursorPosition } = useEllipseClickCreate(
    type,
    (c) => setEllipseArc(c ? { ...c, startAngle: 0, endAngle: 0 } : undefined),
    setEllipseCreate,
  )

  const reset = () => {
    setEllipseCreate(undefined)
    setStartAngle(undefined)
    setCursorPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setEllipseCreate, setStartAngle, setCursorPosition])

  return {
    ellipseCreate,
    startPosition,
    middlePosition,
    cursorPosition,
    onEllipseArcClickCreateClick(p: Position) {
      if (!type) {
        return
      }
      if (ellipseCreate) {
        const newPosition = rotatePositionByCenter(p, { x: ellipseCreate.cx, y: ellipseCreate.cy }, ellipseCreate.angle ?? 0)
        let angle = Math.atan2((newPosition.y - ellipseCreate.cy) / ellipseCreate.ry, (newPosition.x - ellipseCreate.cx) / ellipseCreate.rx) * 180 / Math.PI
        if (startAngle === undefined) {
          setStartAngle(angle)
          setEllipseArc({ ...ellipseCreate, startAngle: angle, endAngle: angle })
        } else {
          if (angle < startAngle) {
            angle += 360
          }
          setEllipseArc(undefined)
          onEnd({ ...ellipseCreate, startAngle, endAngle: angle })
          reset()
        }
      } else {
        onEllipseClickCreateClick(p)
      }
    },
    onEllipseArcClickCreateMove(p: Position, viewportPosition?: Position) {
      if (!type) {
        return
      }
      if (ellipseCreate) {
        setCursorPosition(p)
        if (startAngle) {
          const newPosition = rotatePositionByCenter(p, { x: ellipseCreate.cx, y: ellipseCreate.cy }, ellipseCreate.angle ?? 0)
          let angle = Math.atan2((newPosition.y - ellipseCreate.cy) / ellipseCreate.ry, (newPosition.x - ellipseCreate.cx) / ellipseCreate.rx) * 180 / Math.PI
          if (angle < startAngle) {
            angle += 360
          }
          setEllipseArc({ ...ellipseCreate, startAngle, endAngle: angle })
        }
      } else {
        onEllipseClickCreateMove(p, viewportPosition)
      }
    },
    ellipseArcClickCreateInput: ellipseClickCreateInput,
  }
}

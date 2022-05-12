import * as React from "react"

import { useKey } from ".."
import { Arc, Circle } from "../../utils"
import { useCircleClickCreate } from "./use-circle-click-create"

export function useCircleArcClickCreate(
  type: '2 points' | '3 points' | 'center radius' | 'center diameter' | undefined,
  setCircleArc: (arc?: Arc) => void,
  onEnd: (arc: Arc) => void,
) {
  const [circleCreate, setCircleCreate] = React.useState<Circle>()
  const [startAngle, setStartAngle] = React.useState<number>()

  const { onCircleClickCreateClick, onCircleClickCreateMove, circleClickCreateInput, startPosition, middlePosition, cursorPosition, setCursorPosition } = useCircleClickCreate(
    type,
    (c) => setCircleArc(c ? { ...c, startAngle: 0, endAngle: 0 } : undefined),
    setCircleCreate,
  )

  const reset = () => {
    setCircleCreate(undefined)
    setStartAngle(undefined)
    setCursorPosition(undefined)
  }

  useKey((e) => e.key === 'Escape', reset, [setCircleCreate, setStartAngle, setCursorPosition])

  return {
    circleCreate,
    startPosition,
    middlePosition,
    cursorPosition,
    onCircleArcClickCreateClick(e: { clientX: number, clientY: number }) {
      if (!type) {
        return
      }
      if (circleCreate) {
        if (startAngle === undefined) {
          const angle = Math.atan2(e.clientY - circleCreate.y, e.clientX - circleCreate.x) * 180 / Math.PI
          setStartAngle(angle)
          setCircleArc({ ...circleCreate, startAngle: angle, endAngle: angle })
        } else {
          let angle = Math.atan2(e.clientY - circleCreate.y, e.clientX - circleCreate.x) * 180 / Math.PI
          if (angle < startAngle) {
            angle += 360
          }
          setCircleArc(undefined)
          onEnd({ ...circleCreate, startAngle, endAngle: angle })
          reset()
        }
      } else {
        onCircleClickCreateClick(e)
      }
    },
    onCircleArcClickCreateMove(e: { clientX: number, clientY: number }) {
      if (!type) {
        return
      }
      if (circleCreate) {
        setCursorPosition({ x: e.clientX, y: e.clientY })
        if (startAngle) {
          let angle = Math.atan2(e.clientY - circleCreate.y, e.clientX - circleCreate.x) * 180 / Math.PI
          if (angle < startAngle) {
            angle += 360
          }
          setCircleArc({ ...circleCreate, startAngle, endAngle: angle })
        }
      } else {
        onCircleClickCreateMove(e)
      }
    },
    circleArcClickCreateInput: circleClickCreateInput,
  }
}

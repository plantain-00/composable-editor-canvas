import * as React from "react"

import { useEllipseClickCreate, useKey } from ".."
import { EllipseArc, getEllipseAngle, Position } from "../../utils"
import { getAngleSnapPosition } from "../../utils/snap"

/**
 * @public
 */
export function useEllipseArcClickCreate(
  type: 'ellipse center' | 'ellipse endpoint' | undefined,
  onEnd: (arc: EllipseArc) => void,
  options?: Partial<{
    getAngleSnap: (angle: number) => number | undefined
  }>,
) {
  const [ellipseArc, setEllipseArc] = React.useState<EllipseArc>()
  const [startAngle, setStartAngle] = React.useState<number>()

  let message: string | undefined
  if (ellipseArc) {
    message = startAngle === undefined ? 'specify start angle by click or input angle' : 'specify end angle by click or input angle'
  }
  const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition, setCursorPosition, clearText, setInputPosition } = useEllipseClickCreate(
    type,
    (c) => setEllipseArc(c ? { ...c, startAngle: 0, endAngle: 0 } : undefined),
    {
      ...options,
      message,
      onKeyDown: ellipseArc ? (e, text) => {
        if (e.key === 'Enter') {
          let angle = +text
          if (!isNaN(angle)) {
            if (startAngle === undefined) {
              setStartAngle(angle)
              setEllipseArc({ ...ellipseArc, startAngle: angle, endAngle: angle })
              clearText()
            } else {
              if (angle < startAngle) {
                angle += 360
              }
              setEllipseArc(undefined)
              onEnd({ ...ellipseArc, startAngle, endAngle: angle })
              reset()
            }
          }
        }
      } : undefined,
    },
  )

  const reset = () => {
    setEllipseArc(undefined)
    setStartAngle(undefined)
    setCursorPosition(undefined)
    clearText()
  }

  useKey((e) => e.key === 'Escape', reset, [setEllipseArc, setStartAngle, setCursorPosition])

  return {
    ellipse,
    ellipseArc,
    startPosition,
    middlePosition,
    cursorPosition,
    reset,
    onClick(p: Position) {
      if (!type) {
        return
      }
      if (ellipseArc) {
        p = getAngleSnapPosition({ x: ellipseArc.cx, y: ellipseArc.cy }, p, options?.getAngleSnap)
        let angle = getEllipseAngle(p, ellipseArc)
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
      setInputPosition(viewportPosition ?? p)
      if (!type) {
        return
      }
      if (ellipseArc) {
        p = getAngleSnapPosition({ x: ellipseArc.cx, y: ellipseArc.cy }, p, options?.getAngleSnap)
        setCursorPosition(p)
        if (startAngle !== undefined) {
          let angle = getEllipseAngle(p, ellipseArc)
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

import * as React from "react"

import { useCursorInput, useKey } from ".."
import { PathCommand, Position } from "../../utils"

/**
 * @public
 */
export function usePathClickCreate(
  enabled: boolean,
  onEnd: (path: PathCommand[]) => void,
) {
  const [path, setPath] = React.useState<PathCommand[]>([])
  const [current, setCurrent] = React.useState<PathCommand>()
  const [inputType, setInputType] = React.useState<PathCommand['type']>('move')
  const [controlPoint, setControlPoint] = React.useState<Position>()
  const [controlPoint2, setControlPoint2] = React.useState<Position>()
  const [radius, setRadius] = React.useState<number>()

  let message = ''
  if (inputType === 'move') {
    message = 'specify start point by click'
  } else if (inputType === 'line') {
    message = 'specify end point by click'
  } else if (inputType === 'quadraticCurve') {
    if (controlPoint) {
      message = 'specify end point by click'
    } else {
      message = 'specify control point by click'
    }
  } else if (inputType === 'bezierCurve') {
    if (controlPoint) {
      if (controlPoint2) {
        message = 'specify end point by click'
      } else {
        message = 'specify control point 2 by click'
      }
    } else {
      message = 'specify control point 1 by click'
    }
  } else if (inputType === 'arc') {
    if (controlPoint) {
      if (controlPoint2) {
        message = 'input radius'
      } else {
        message = 'specify end point by click, or input radius'
      }
    } else {
      message = 'specify start point by click, or input radius'
    }
  }
  const { input, setCursorPosition, cursorPosition, clearText, setInputPosition, resetInput } = useCursorInput(enabled ? message : '', enabled ? (e, text, cursorPosition) => {
    if (e.key === 'Enter') {
      const position = text.split(',')
      if (position.length === 2) {
        const x = +position[0]
        const y = +position[1]
        if (!isNaN(x) && !isNaN(y)) {
          clickPosition({ x, y })
          movePosition(cursorPosition)
          clearText()
        }
      } else if (position.length === 1 && inputType === 'arc') {
        const radius = +text
        if (!isNaN(radius) && radius > 0) {
          if (controlPoint && controlPoint2) {
            setPath([...path, { type: 'arc', from: controlPoint, to: controlPoint2, radius }])
            setCurrent(undefined)
            setControlPoint(undefined)
            setControlPoint2(undefined)
          } else {
            setRadius(radius)
          }
          clearText()
        }
      }
    }
  } : undefined)

  const reset = () => {
    setPath([])
    setCurrent(undefined)
    resetInput()
    setInputType('move')
    clearText()
    setControlPoint(undefined)
    setControlPoint2(undefined)
    setRadius(undefined)
  }

  useKey((e) => e.key === 'Escape', () => {
    if (path.length > 1) {
      onEnd(path)
    }
    reset()
  }, [path, setPath, setCurrent])

  const clickPosition = (p: Position) => {
    setCursorPosition(p)
    if (inputType === 'move') {
      setPath([...path, { type: 'move', to: p }])
      setInputType('line')
    } else if (inputType === 'line') {
      setPath([...path, { type: 'line', to: p }])
      setCurrent(undefined)
    } else if (inputType === 'quadraticCurve') {
      if (controlPoint) {
        setPath([...path, { type: 'quadraticCurve', cp: controlPoint, to: p }])
        setCurrent(undefined)
        setControlPoint(undefined)
      } else {
        setControlPoint(p)
      }
    } else if (inputType === 'bezierCurve') {
      if (controlPoint) {
        if (controlPoint2) {
          setPath([...path, { type: 'bezierCurve', cp1: controlPoint, cp2: controlPoint2, to: p }])
          setCurrent(undefined)
          setControlPoint(undefined)
          setControlPoint2(undefined)
        } else {
          setControlPoint2(p)
        }
      } else {
        setControlPoint(p)
      }
    } else if (inputType === 'arc') {
      if (controlPoint) {
        if (radius) {
          setPath([...path, { type: 'arc', from: controlPoint, to: p, radius }])
          setCurrent(undefined)
          setControlPoint(undefined)
          setRadius(undefined)
        } else if (!controlPoint2) {
          setControlPoint2(undefined)
        }
      } else {
        setControlPoint(p)
      }
    }
  }
  const movePosition = (p: Position) => {
    if (inputType === 'line') {
      setCurrent({
        type: 'line',
        to: p,
      })
    } else if (inputType === 'quadraticCurve') {
      if (controlPoint) {
        setCurrent({ type: 'quadraticCurve', cp: controlPoint, to: p })
      } else {
        setCurrent(undefined)
      }
    } else if (inputType === 'bezierCurve') {
      if (controlPoint && controlPoint2) {
        setCurrent({ type: 'bezierCurve', cp1: controlPoint, cp2: controlPoint2, to: p })
      } else {
        setCurrent(undefined)
      }
    } else if (inputType === 'arc') {
      if (controlPoint && radius) {
        setCurrent({ type: 'arc', from: controlPoint, radius, to: p })
      } else {
        setCurrent(undefined)
      }
    }
  }

  return {
    path,
    preview: current ? [...path, current] : path,
    controlPoint,
    controlPoint2,
    onClick(p: Position) {
      if (!enabled) {
        return
      }
      clickPosition(p)
    },
    onMove(p: Position, viewportPosition?: Position) {
      setInputPosition(viewportPosition || p)
      if (!enabled) {
        return
      }
      setCursorPosition(p)
      movePosition(p)
    },
    input,
    reset,
    setInputType(type: PathCommand['type']) {
      if (type === 'close') {
        onEnd([...path, { type: 'close' }])
        reset()
      } else {
        setInputType(type)
      }
    },
    cursorPosition,
  }
}

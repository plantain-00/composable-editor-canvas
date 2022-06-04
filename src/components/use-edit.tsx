import type { Draft } from "immer/dist/types/types-external"
import * as React from "react"
import { getTwoNumbersDistance, Position, Region } from "../utils"
import { getAngleSnapPosition } from "./use-create/use-circle-click-create"
import { useKey } from "./use-key"
import { isSelected } from "./use-selected"

export function useEdit<T>(
  onEnd: () => void,
  readOnly: boolean,
  scale: number,
  contents: readonly T[],
  selected: readonly number[][],
  createRect: (rect: Region) => T,
  getAngleSnap?: (angle: number) => number | undefined,
  getEditPoints?: (content: T, contents: readonly T[]) => {
    editPoints: EditPoint<T>[]
    angleSnapStartPoint?: Position
  } | undefined,
) {
  const [editPoint, setEditPoint] = React.useState<EditPoint<T> & { index: number, angleSnapStartPoint?: Position }>()
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const cursorWidth = 5 / scale

  const reset = () => {
    setEditPoint(undefined)
    setStartPosition(undefined)
    setCursorPosition(undefined)
  }

  React.useEffect(() => {
    if (readOnly === false) {
      reset()
    }
  }, [readOnly])

  useKey((e) => e.key === 'Escape', () => {
    reset()
  }, [setEditPoint, setStartPosition, setCursorPosition])

  return {
    editPoint,
    updateEditContent(content: T, contents: readonly T[]) {
      const assistentContents: T[] = []
      if (!readOnly) {
        const editPoints = getEditPoints?.(content, contents)
        if (editPoints) {
          assistentContents.push(...editPoints.editPoints.map((e) => createRect({
            x: e.x,
            y: e.y,
            width: cursorWidth,
            height: cursorWidth,
          })))
        }
      }
      return { assistentContents }
    },
    updateEditPreview(contents: Draft<T>[]) {
      if (editPoint && startPosition && cursorPosition) {
        return editPoint.update(contents[editPoint.index], cursorPosition, startPosition)
      }
    },
    onEditMove(p: Position) {
      if (readOnly) {
        return
      }
      if (editPoint?.angleSnapStartPoint) {
        p = getAngleSnapPosition(editPoint.angleSnapStartPoint, p, getAngleSnap)
      } else if (startPosition) {
        p = getAngleSnapPosition(startPosition, p, getAngleSnap)
      }
      if (startPosition) {
        setCursorPosition(p)
        return
      }
      for (let i = 0; i < contents.length; i++) {
        const s = contents[i]
        if (isSelected([i], selected)) {
          const editPoints = getEditPoints?.(s, contents)
          if (editPoints) {
            const t = editPoints.editPoints.find((e) => getTwoNumbersDistance(e.x, p.x) <= cursorWidth && getTwoNumbersDistance(e.y, p.y) <= cursorWidth)
            if (t) {
              setEditPoint({ ...t, index: i, angleSnapStartPoint: editPoints.angleSnapStartPoint })
              return
            }
          }
        }
      }
      setEditPoint(undefined)
    },
    onEditClick(p: Position) {
      if (!editPoint) {
        return
      }
      if (!startPosition) {
        setStartPosition(p)
      } else {
        onEnd()
        reset()
      }
    },
  }
}

export type EditPoint<T> = Position & {
  cursor: string
  update: (content: Draft<T>, cursor: Position, start: Position) => { assistentContents?: T[] } | void
}

import { produceWithPatches } from "immer"
import type { Draft } from "immer/dist/types/types-external"
import * as React from "react"
import { getTwoNumbersDistance, Position, Region } from "../utils"
import { getAngleSnapPosition } from "./use-create/use-circle-click-create"
import { useKey } from "./use-key"
import { prependPatchPath } from "./use-partial-edit"
import { SelectPath } from "./use-selected"

/**
 * @public
 */
export function useEdit<T, TPath extends SelectPath = SelectPath>(
  onEnd: () => void,
  getEditPoints?: (content: T) => {
    editPoints: EditPoint<T>[]
    angleSnapStartPoint?: Position
  } | undefined,
  options?: Partial<{
    scale: number
    readOnly: boolean
    getAngleSnap: (angle: number) => number | undefined,
  }>,
) {
  const [editPoint, setEditPoint] = React.useState<EditPoint<T> & { path: TPath, content: T, angleSnapStartPoint?: Position }>()
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const cursorWidth = 5 / (options?.scale ?? 1)
  const readOnly = options?.readOnly ?? false

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
    editLastPosition: editPoint?.angleSnapStartPoint ?? startPosition,
    getEditAssistentContents<V>(content: T, createRect: (rect: Region) => V) {
      const assistentContents: V[] = []
      if (!readOnly) {
        const editPoints = getEditPoints?.(content)
        if (editPoints) {
          assistentContents.push(...editPoints.editPoints.map((e) => createRect({
            x: e.x,
            y: e.y,
            width: cursorWidth,
            height: cursorWidth,
          })))
        }
      }
      return assistentContents
    },
    updateEditPreview() {
      if (editPoint && startPosition && cursorPosition) {
        let assistentContents: T[] | undefined
        const [result, patches, reversePatches] = produceWithPatches(editPoint.content, (draft) => {
          const r = editPoint.update(draft, { cursor: cursorPosition, start: startPosition, scale: options?.scale ?? 1 })
          if (r) {
            assistentContents = r.assistentContents
          }
        })
        return {
          result,
          patches: prependPatchPath(patches, editPoint.path),
          reversePatches: prependPatchPath(reversePatches, editPoint.path),
          assistentContents,
        }
      }
      return
    },
    onEditMove(p: Position, selectedContents: readonly { content: T, path: TPath }[]) {
      if (readOnly) {
        return
      }
      if (editPoint?.angleSnapStartPoint) {
        p = getAngleSnapPosition(editPoint.angleSnapStartPoint, p, options?.getAngleSnap)
      } else if (startPosition) {
        p = getAngleSnapPosition(startPosition, p, options?.getAngleSnap)
      }
      if (startPosition) {
        setCursorPosition(p)
        return
      }
      for (const { content, path } of selectedContents) {
        const editPoints = getEditPoints?.(content)
        if (editPoints) {
          const t = editPoints.editPoints.find((e) => getTwoNumbersDistance(e.x, p.x) <= cursorWidth && getTwoNumbersDistance(e.y, p.y) <= cursorWidth)
          if (t) {
            setEditPoint({ ...t, content, path, angleSnapStartPoint: editPoints.angleSnapStartPoint })
            return
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

/**
 * @public
 */
export type EditPoint<T> = Position & {
  cursor: string
  update: (
    content: Draft<T>,
    props: { cursor: Position, start: Position, scale: number },
  ) => {
    assistentContents?: T[]
  } | void
}

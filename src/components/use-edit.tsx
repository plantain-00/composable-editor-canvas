import { produceWithPatches, Draft, Patch } from "immer"
import * as React from "react"
import { getTwoNumbersDistance, Position, Region } from "../utils"
import { getAngleSnapPosition } from "../utils/snap"
import { prependPatchPath } from "./use-partial-edit"
import { SnapTarget } from "./use-point-snap"
import { SelectPath } from "./use-selected"

/**
 * @public
 */
export function useEdit<T, TPath extends SelectPath = SelectPath>(
  onEnd: (patches: Patch[], reversePatches: Patch[]) => void,
  getEditPoints?: (content: T) => {
    editPoints: EditPoint<T>[]
    angleSnapStartPoint?: Position
  } | undefined,
  options?: Partial<{
    scale: number
    readOnly: boolean
    contentReadOnly: (content: T) => boolean | undefined
    getAngleSnap: (angle: number) => number | undefined,
  }>,
) {
  const [editPoint, setEditPoint] = React.useState<EditPoint<T> & { path: TPath, content: T, angleSnapStartPoint?: Position, relatedEditPoints: (EditPoint<T> & { path: TPath, content: T })[] }>()
  const [menuEditPoint, setMenuEditPoint] = React.useState<{ update: EditPointUpdate<T>, path: TPath, content: T }>()
  const [startPosition, setStartPosition] = React.useState<Position>()
  const [cursorPosition, setCursorPosition] = React.useState<Position>()
  const [snapTarget, setSnapTarget] = React.useState<SnapTarget<T>>()
  const [editMenu, setEditMenu] = React.useState<JSX.Element>()
  const cursorWidth = 5 / (options?.scale ?? 1)
  const readOnly = options?.readOnly ?? false

  const reset = () => {
    setEditPoint(undefined)
    setStartPosition(undefined)
    setCursorPosition(undefined)
    setSnapTarget(undefined)
    setEditMenu(undefined)
    setMenuEditPoint(undefined)
  }

  React.useEffect(() => {
    if (readOnly === false) {
      reset()
    }
  }, [readOnly])

  return {
    editPoint,
    editLastPosition: editPoint?.angleSnapStartPoint ?? startPosition,
    getEditAssistentContents<V>(content: T, createRect: (rect: Region) => V) {
      const assistentContents: V[] = []
      if (!readOnly && !options?.contentReadOnly?.(content)) {
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
    updateEditPreview(): {
      content: T
      result: T;
      patches: Patch[];
      reversePatches: Patch[];
      assistentContents: T[];
      relatedEditPointResults: Map<T, T>;
    } | undefined {
      if (menuEditPoint && startPosition && cursorPosition) {
        const assistentContents: T[] = []
        const [result, patches, reversePatches] = produceWithPatches(menuEditPoint.content, (draft) => {
          const r = menuEditPoint.update?.(draft, { cursor: cursorPosition, start: startPosition, scale: options?.scale ?? 1, target: snapTarget })
          if (r?.assistentContents) {
            assistentContents.push(...r.assistentContents)
          }
        })
        return {
          content: menuEditPoint.content,
          result,
          patches: prependPatchPath(patches, menuEditPoint.path),
          reversePatches: prependPatchPath(reversePatches, menuEditPoint.path),
          assistentContents,
          relatedEditPointResults: new Map<T, T>(),
        }
      }
      if (editPoint && startPosition && cursorPosition && editPoint.update) {
        const assistentContents: T[] = []
        const [result, patches, reversePatches] = produceWithPatches(editPoint.content, (draft) => {
          const r = editPoint.update?.(draft, { cursor: cursorPosition, start: startPosition, scale: options?.scale ?? 1, target: snapTarget })
          if (r?.assistentContents) {
            assistentContents.push(...r.assistentContents)
          }
        })
        const s = {
          content: editPoint.content,
          result,
          patches: prependPatchPath(patches, editPoint.path),
          reversePatches: prependPatchPath(reversePatches, editPoint.path),
          assistentContents,
          relatedEditPointResults: new Map<T, T>(),
        }
        for (const p of editPoint.relatedEditPoints) {
          const [result, patches, reversePatches] = produceWithPatches(p.content, (draft) => {
            const r = p.update?.(draft, { cursor: cursorPosition, start: startPosition, scale: options?.scale ?? 1 })
            if (r?.assistentContents) {
              assistentContents.push(...r.assistentContents)
            }
          })
          s.patches.push(...prependPatchPath(patches, p.path))
          s.reversePatches.push(...prependPatchPath(reversePatches, p.path))
          s.relatedEditPointResults.set(p.content, result)
        }
        return s
      }
      return
    },
    onEditMove(p: Position, selectedContents: readonly { content: T, path: TPath }[], target?: SnapTarget<T>) {
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
        setSnapTarget(target)
        return
      }
      let result: typeof editPoint | undefined
      for (const { content, path } of selectedContents) {
        if (options?.contentReadOnly?.(content)) continue
        const editPoints = getEditPoints?.(content)
        if (editPoints) {
          const t = editPoints.editPoints.find((e) => getTwoNumbersDistance(e.x, p.x) <= cursorWidth && getTwoNumbersDistance(e.y, p.y) <= cursorWidth)
          if (t) {
            if (result) {
              result.relatedEditPoints.push({ ...t, content, path })
            } else {
              result = { ...t, content, path, angleSnapStartPoint: editPoints.angleSnapStartPoint, relatedEditPoints: [] }
            }
          }
        }
      }
      setEditPoint(result)
    },
    onEditClick(p: Position) {
      if (menuEditPoint) {
        onEnd([], [])
        reset()
        return
      }
      if (!editPoint) {
        return
      }
      if (editPoint.execute) {
        const [, patches, reversePatches] = produceWithPatches(editPoint.content, (draft) => {
          editPoint.execute?.(draft)
        })
        onEnd(prependPatchPath(patches, editPoint.path), prependPatchPath(reversePatches, editPoint.path))
        return
      }
      if (!startPosition) {
        setStartPosition(p)
      } else {
        onEnd([], [])
        reset()
      }
    },
    onEditContextMenu(p: Position, getMenu: (menu: EditPointMenu<T>[], getClickHandler: (m: EditPointMenu<T>) => () => void) => JSX.Element) {
      if (!editPoint?.menu) {
        return
      }
      setEditMenu(getMenu(editPoint.menu, m => () => {
        setEditMenu(undefined)
        if (m.execute) {
          const [, patches, reversePatches] = produceWithPatches(editPoint.content, (draft) => {
            m.execute?.(draft)
          })
          onEnd(prependPatchPath(patches, editPoint.path), prependPatchPath(reversePatches, editPoint.path))
          return
        }
        if (m.update) {
          setStartPosition(p)
          setCursorPosition(p)
          setMenuEditPoint({
            content: editPoint.content,
            path: editPoint.path,
            update: m.update,
          })
          setEditPoint(editPoint)
        }
      }))
    },
    editMenu,
    resetEdit: reset,
  }
}

export type EditPointUpdate<T> = (
  content: Draft<T>,
  props: {
    cursor: Position
    start: Position
    scale: number
    target?: SnapTarget<T>
  },
) => {
  assistentContents?: T[]
} | void

export type EditPoint<T> = Position & {
  cursor: string
  update?: EditPointUpdate<T>
  execute?: (content: Draft<T>) => void
  menu?: EditPointMenu<T>[]
}

export interface EditPointMenu<T> {
  title: string
  update?: EditPointUpdate<T>
  execute?: (content: Draft<T>) => void
}

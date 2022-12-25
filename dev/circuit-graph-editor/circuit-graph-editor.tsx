import { enablePatches } from 'immer'
import React from 'react';
import { bindMultipleRefs, metaKeyIfMacElseCtrlKey, Nullable, scaleByCursorPosition, Transform, useKey, usePatchBasedUndoRedo, useWheelScroll, useWheelZoom, useWindowSize } from "../../src";
import { BaseContent, registerModel } from "./model";
import { powerModel } from "./plugins/power";
import { Renderer } from './renderer';

const me = Math.round(Math.random() * 15 * 16 ** 3 + 16 ** 3).toString(16)

enablePatches()

registerModel(powerModel)

export function CircuitGraphEditor(props: {
  initialState: readonly Nullable<BaseContent>[]
  onChange?: (state: readonly Nullable<BaseContent>[]) => void
}) {
  const { width, height } = useWindowSize()
  const { state, undo, redo } = usePatchBasedUndoRedo(props.initialState, me, {
    onChange({ newState }) {
      props.onChange?.(newState)
    },
  })
  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    min: 0.001,
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })

  const transform: Transform = {
    x,
    y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }
  useKey((k) => k.code === 'KeyZ' && !k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    undo(e)
  })
  useKey((k) => k.code === 'KeyZ' && k.shiftKey && metaKeyIfMacElseCtrlKey(k), (e) => {
    redo(e)
  })
  return (
    <>
      <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}>
        <div style={{ position: 'absolute', inset: '0px' }}>
          <Renderer
            contents={state}
            x={transform.x}
            y={transform.y}
            scale={transform.scale}
            width={width}
            height={height}
          />
        </div>
      </div>
    </>
  )
}

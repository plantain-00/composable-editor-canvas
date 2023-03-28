import React from "react"
import { Position, Size, TwoPointsFormRegion, rotatePosition } from "../utils/geometry";

export function useMinimap(props: Size & {
  viewport: Size & {
    center: Position
    rotate?: number
  }
  children: (minimapTransform: MinimapTransform) => React.ReactNode
}) {
  const [transform, setMinimapTransform] = React.useState<MinimapTransform>()
  if (!transform) {
    return { setMinimapTransform }
  }
  const contentWidth = transform.bounding.end.x - transform.bounding.start.x
  const contentHeight = transform.bounding.end.y - transform.bounding.start.y
  const ratio = Math.min(props.width / contentWidth, props.height / contentHeight)
  const xOffset = Math.max(0, (props.width - ratio * contentWidth) / 2)
  const yOffset = Math.max(0, (props.height - ratio * contentHeight) / 2)
  return {
    setMinimapTransform,
    xOffset,
    yOffset,
    ratio,
    contentWidth,
    contentHeight,
    getMinimapPosition(e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) {
      let p = {
        x: transform.bounding.start.x + (e.nativeEvent.offsetX - xOffset) / ratio,
        y: transform.bounding.start.y + (e.nativeEvent.offsetY - yOffset) / ratio,
      }
      if (props.viewport.rotate) {
        p = rotatePosition(p, { x: 0, y: 0 }, props.viewport.rotate)
      }
      return p
    },
    minimap: (
      <div
        style={{
          position: 'absolute',
          left: '1px',
          bottom: '1px',
          width: `${props.width}px`,
          height: `${props.height}px`,
          clipPath: 'inset(0)',
          border: '1px solid blue',
        }}
      >
        {props.children(transform)}
        <div style={{
          position: 'absolute',
          border: '1px solid red',
          left: `${xOffset + ratio * (props.viewport.center.x - props.viewport.width / 2 - transform.bounding.start.x)}px`,
          top: `${yOffset + ratio * (props.viewport.center.y - props.viewport.height / 2 - transform.bounding.start.y)}px`,
          width: `${ratio * props.viewport.width}px`,
          height: `${ratio * props.viewport.height}px`,
          cursor: 'default',
          rotate: props.viewport.rotate ? `${props.viewport.rotate}rad` : undefined,
          pointerEvents: 'none',
        }}></div>
      </div>
    ),
  }
}

export interface MinimapTransform {
  x: number
  y: number
  scale: number
  bounding: TwoPointsFormRegion
}

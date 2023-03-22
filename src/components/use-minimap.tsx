import React from "react"
import { Position, Size, TwoPointsFormRegion } from "../utils/geometry";

export function useMinimap(props: Size & {
  start: Position
  end: Position
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
      return {
        x: transform.bounding.start.x + contentWidth * (e.nativeEvent.offsetX - xOffset) / ratio / contentWidth,
        y: transform.bounding.start.y + contentHeight * (e.nativeEvent.offsetY - yOffset) / ratio / contentHeight,
      }
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
          left: `${xOffset + ratio * (props.start.x - transform.bounding.start.x)}px`,
          top: `${yOffset + ratio * (props.start.y - transform.bounding.start.y)}px`,
          width: `${ratio * (props.end.x - props.start.x)}px`,
          height: `${ratio * (props.end.y - props.start.y)}px`,
          cursor: 'default',
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

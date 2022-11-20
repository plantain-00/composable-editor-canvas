import React from "react"
import { getLinearDimensionGeometries, getLinearDimensionTextPosition, getRotateTransform, getTextSize, LinearDimension } from "../src"
import { dimensionStyle } from "./cad-editor/model"

export default () => {
  const dimension: LinearDimension = {
    p1: { x: 200, y: 200 },
    p2: { x: 300, y: 300 },
    position: {
      x: 400,
      y: 100,
    },
    fontFamily: 'monospace',
    fontSize: 16,
    direct: true,
  }
  const { regions, lines } = getLinearDimensionGeometries(
    dimension,
    dimensionStyle,
    (c) => getLinearDimensionTextPosition(c, dimensionStyle.margin, getTextSize)
  )
  const { textPosition, textRotation, text } = getLinearDimensionTextPosition(dimension, dimensionStyle.margin, getTextSize)
  return (
    <svg
      viewBox="0 0 800 600"
      width={800}
      height={600}
      xmlns="http://www.w3.org/2000/svg"
      fill='none'
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      {lines.map((line, i) => <polyline key={i} stroke='black' points={line.map((p) => `${p.x},${p.y}`).join(' ')} />)}
      {regions[0] && <polyline stroke='black' points={regions[0].points.map((p) => `${p.x},${p.y}`).join(' ')} fill='black' />}
      {regions[1] && <polyline stroke='black' points={regions[1].points.map((p) => `${p.x},${p.y}`).join(' ')} fill='black' />}
      <text x={textPosition.x} y={textPosition.y} fill='black' transform={getRotateTransform(textPosition.x, textPosition.y, { rotation: textRotation })} style={{ fontSize: `${dimension.fontSize}px`, fontFamily: dimension.fontFamily }}>{text}</text>
    </svg>
  )
}

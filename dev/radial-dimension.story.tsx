import React from "react"
import { Circle, getRadialDimensionGeometries, getRadialDimensionTextPosition, getRotateTransform, getTextSize, RadialDimension } from "../src"
import { dimensionStyle } from "./models/model"

export default () => {
  const circle: Circle = {
    x: 200,
    y: 200,
    r: 100,
  }
  const dimension: RadialDimension = {
    position: {
      x: 400,
      y: 300,
    },
    fontFamily: 'monospace',
    fontSize: 16,
  }
  const { regions, lines } = getRadialDimensionGeometries(
    dimension,
    circle,
    dimensionStyle,
    (d, c) => getRadialDimensionTextPosition(d, c, dimensionStyle.margin, getTextSize)
  )
  const { textPosition, textRotation, text } = getRadialDimensionTextPosition(dimension, circle, dimensionStyle.margin, getTextSize)
  return (
    <svg
      viewBox="0 0 800 600"
      width={800}
      height={600}
      xmlns="http://www.w3.org/2000/svg"
      fill='none'
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      <circle cx={circle.x} cy={circle.y} r={circle.r} stroke='black' />
      {lines.map((line, i) => <polyline key={i} stroke='black' points={line.map((p) => `${p.x},${p.y}`).join(' ')} />)}
      {regions && regions.length > 0 && <polyline stroke='black' points={regions[0].points.map((p) => `${p.x},${p.y}`).join(' ')} fill='black' />}
      <text x={textPosition.x} y={textPosition.y} fill='black' transform={getRotateTransform(textPosition.x, textPosition.y, { rotation: textRotation })} style={{ fontSize: `${dimension.fontSize}px`, fontFamily: dimension.fontFamily }}>{text}</text>
    </svg>
  )
}

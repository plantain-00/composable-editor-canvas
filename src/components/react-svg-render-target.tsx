import * as React from "react"
import { ReactRenderTarget } from "."
import { Position } from "../utils"

export const reactSvgRenderTarget: ReactRenderTarget = {
  type: 'svg',
  getResult(
    children: JSX.Element[],
    width: number,
    height: number,
    attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
      style: React.CSSProperties
    }>,
  ) {
    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        colorInterpolationFilters="sRGB"
        {...attributes}
      >
        {children}
      </svg>
    )
  },
  strokeRect(x: number, y: number, width: number, height: number, color: number, angle?: number) {
    return <rect
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={getColorString(color)}
      fill="none"
      transform={angle ? `rotate(${angle},${x + width / 2},${y + height / 2})` : undefined}
    />
  },
  strokePolyline(points: Position[], color: number) {
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return <polyline
      points={pointsText}
      stroke={getColorString(color)}
      fill="none"
    />
  },
  strokeCircle(cx: number, cy: number, r: number, color: number) {
    return <circle stroke={getColorString(color)} cx={cx} cy={cy} r={r} fill="none" />
  },
  strokeEllipse(cx, cy, rx, ry, color, angle) {
    return <ellipse
      stroke={getColorString(color)}
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      transform={angle ? `rotate(${angle},${cx},${cy})` : undefined}
    />
  },
}

function getColorString(color: number) {
  const s = color.toString(16)
  return `#${'0'.repeat(6 - s.length)}${s}`
}

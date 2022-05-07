import * as React from "react"
import { ReactRenderTarget } from "."

export const reactSvgRenderTarget: ReactRenderTarget = {
  type: 'svg',
  getResult(children, width, height, attributes) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
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
  strokeRect(x, y, width, height, color, angle) {
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
  strokePolyline(points, color, dashArray) {
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return <polyline
      points={pointsText}
      stroke={getColorString(color)}
      strokeDasharray={dashArray?.join(' ')}
      fill="none"
    />
  },
  strokeCircle(cx, cy, r, color) {
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
  strokeArc(cx, cy, r, startAngle, endAngle, color) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    return <path
      d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`}
      stroke={getColorString(color)}
      fill="none"
    />
  },
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = angleInDegrees * Math.PI / 180
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  }
}

export function getColorString(color: number) {
  const s = color.toString(16)
  return `#${'0'.repeat(6 - s.length)}${s}`
}

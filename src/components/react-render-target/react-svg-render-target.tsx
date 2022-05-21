import * as React from "react"
import { ReactRenderTarget } from ".."

export const reactSvgRenderTarget: ReactRenderTarget = {
  type: 'svg',
  getResult(children, width, height, attributes, transform) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    const x = transform?.x ?? 0
    const y = transform?.y ?? 0
    const scale = transform?.scale ?? 1
    const viewportWidth = width / scale
    const viewportHeight = height / scale
    const viewportX = (width - viewportWidth) / 2 - x / scale
    const viewportY = (height - viewportHeight) / 2 - y / scale
    return (
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`${viewportX} ${viewportY} ${viewportWidth} ${viewportHeight}`}
        width={width}
        height={height}
        colorInterpolationFilters="sRGB"
        {...attributes}
      >
        {children}
      </svg>
    )
  },
  getEmpty() {
    return <></>
  },
  getGroup(children, x, y, base, angle) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    return (
      <g transform={angle ? `translate(${x}, ${y}) rotate(${angle},${base.x},${base.y})` : `translate(${x}, ${y})`}>
        {children}
      </g>
    )
  },
  strokeRect(x, y, width, height, color, angle, strokeWidth) {
    return <rect
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={getColorString(color)}
      strokeWidth={strokeWidth}
      fill="none"
      transform={angle ? `rotate(${angle},${x + width / 2},${y + height / 2})` : undefined}
    />
  },
  strokePolyline(points, color, dashArray, strokeWidth) {
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return <polyline
      points={pointsText}
      stroke={getColorString(color)}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray?.join(' ')}
      fill="none"
    />
  },
  strokeCircle(cx, cy, r, color, strokeWidth) {
    return <circle stroke={getColorString(color)} strokeWidth={strokeWidth} cx={cx} cy={cy} r={r} fill="none" />
  },
  strokeEllipse(cx, cy, rx, ry, color, angle, strokeWidth) {
    return <ellipse
      stroke={getColorString(color)}
      strokeWidth={strokeWidth}
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      transform={angle ? `rotate(${angle},${cx},${cy})` : undefined}
    />
  },
  strokeArc(cx, cy, r, startAngle, endAngle, color, strokeWidth) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    return <path
      d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`}
      strokeWidth={strokeWidth}
      stroke={getColorString(color)}
      fill="none"
    />
  },
  fillText(x, y, text, color, fontSize) {
    return <text x={x} y={y} style={{ fill: getColorString(color), fontSize: `${fontSize}px`, fontFamily: 'monospace' }}>{text}</text>
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

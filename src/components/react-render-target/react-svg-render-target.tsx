import * as React from "react"
import { ReactRenderTarget } from ".."

export const reactSvgRenderTarget: ReactRenderTarget = {
  type: 'svg',
  renderResult(children, width, height, attributes, transform) {
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
  renderEmpty() {
    return <></>
  },
  renderGroup(children, x, y, base, angle) {
    children = children.map((child, i) => child.key ? child : React.cloneElement(child, { key: i }))
    return (
      <g transform={angle ? `translate(${x}, ${y}) rotate(${angle},${base.x},${base.y})` : `translate(${x}, ${y})`}>
        {children}
      </g>
    )
  },
  renderRect(x, y, width, height, strokeColor, angle, strokeWidth, fillColor) {
    return <rect
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={getColorString(strokeColor)}
      strokeWidth={strokeWidth}
      fill={fillColor !== undefined ? getColorString(fillColor) : 'none'}
      transform={angle ? `rotate(${angle},${x + width / 2},${y + height / 2})` : undefined}
    />
  },
  renderPolyline(points, strokeColor, dashArray, strokeWidth, skippedLines) {
    if (skippedLines && skippedLines.length > 0) {
      const d = points.map((p, i) => i === 0 || skippedLines.includes(i - 1) ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')
      return (
        <path
          d={d}
          strokeWidth={strokeWidth}
          stroke={getColorString(strokeColor)}
          strokeDasharray={dashArray?.join(' ')}
          fill="none"
        />
      )
    }
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return <polyline
      points={pointsText}
      stroke={getColorString(strokeColor)}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray?.join(' ')}
      fill="none"
    />
  },
  renderCircle(cx, cy, r, strokeColor, strokeWidth) {
    return <circle stroke={getColorString(strokeColor)} strokeWidth={strokeWidth} cx={cx} cy={cy} r={r} fill="none" />
  },
  renderEllipse(cx, cy, rx, ry, strokeColor, angle, strokeWidth) {
    return <ellipse
      stroke={getColorString(strokeColor)}
      strokeWidth={strokeWidth}
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      transform={angle ? `rotate(${angle},${cx},${cy})` : undefined}
    />
  },
  renderArc(cx, cy, r, startAngle, endAngle, strokeColor, strokeWidth) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    return <path
      d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`}
      strokeWidth={strokeWidth}
      stroke={getColorString(strokeColor)}
      fill="none"
    />
  },
  renderText(x, y, text, strokeColor, fontSize) {
    return <text x={x} y={y} style={{ fill: getColorString(strokeColor), fontSize: `${fontSize}px`, fontFamily: 'monospace' }}>{text}</text>
  },
}

export function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
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

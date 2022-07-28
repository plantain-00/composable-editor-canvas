import * as React from "react"
import { ReactRenderTarget, renderPartStyledPolyline } from ".."
import { polygonToPolyline } from "../../utils"

/**
 * @public
 */
export const reactSvgRenderTarget: ReactRenderTarget<(key: React.Key, strokeWidthScale: number) => JSX.Element> = {
  type: 'svg',
  renderResult(children, width, height, options) {
    const x = options?.transform?.x ?? 0
    const y = options?.transform?.y ?? 0
    const scale = options?.transform?.scale ?? 1
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
        {...options?.attributes}
        style={{
          ...options?.attributes?.style,
          backgroundColor: options?.backgroundColor !== undefined ? getColorString(options.backgroundColor) : undefined,
        }}
      >
        {children.map((child, i) => child(i, options?.strokeWidthScale ?? 1))}
      </svg>
    )
  },
  renderEmpty() {
    return () => <></>
  },
  renderGroup(children, options) {
    const transform: string[] = []
    if (options?.translate) {
      transform.push(`translate(${options.translate.x}, ${options.translate.y})`)
    }
    if (options?.base) {
      const rotateTransform = getRotateTransform(options.base.x, options.base.y, options)
      if (rotateTransform) {
        transform.push(rotateTransform)
      }
    }
    return (key, strokeWidthScale) => (
      <g transform={transform.join(' ')} key={key}>
        {children.map((child, i) => child(i, strokeWidthScale))}
      </g>
    )
  },
  renderRect(x, y, width, height, options) {
    return (key, strokeWidthScale) => (
      <rect
        key={key}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeWidth={(options?.strokeWidth ?? 1) * strokeWidthScale}
        fill={options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'}
        transform={getRotateTransform(x + width / 2, y + height / 2, options)}
      />
    )
  },
  renderPolyline(points, options) {
    const { partsStyles, ...restOptions } = options ?? {}
    if (partsStyles && partsStyles.length > 0) {
      return renderPartStyledPolyline(this, partsStyles, points, restOptions)
    }
    const fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    const skippedLines = options?.skippedLines
    if (skippedLines && skippedLines.length > 0) {
      const d = points.map((p, i) => i === 0 || skippedLines.includes(i - 1) ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')
      return (key, strokeWidthScale) => (
        <path
          d={d}
          key={key}
          strokeWidth={(options?.strokeWidth ?? 1) * strokeWidthScale}
          stroke={getColorString(options?.strokeColor ?? 0)}
          strokeDasharray={options?.dashArray?.join(' ')}
          fill={fill}
        />
      )
    }
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return (key, strokeWidthScale) => (
      <polyline
        key={key}
        points={pointsText}
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeWidth={(options?.strokeWidth ?? 1) * strokeWidthScale}
        strokeDasharray={options?.dashArray?.join(' ')}
        fill={fill}
      />
    )
  },
  renderPolygon(points, options) {
    return this.renderPolyline(polygonToPolyline(points), options)
  },
  renderCircle(cx, cy, r, options) {
    const fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    return (key, strokeWidthScale) => (
      <circle
        key={key}
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeWidth={(options?.strokeWidth ?? 1) * strokeWidthScale}
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
      />
    )
  },
  renderEllipse(cx, cy, rx, ry, options) {
    const fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    return (key, strokeWidthScale) => (
      <ellipse
        stroke={getColorString(options?.strokeColor ?? 0)}
        key={key}
        strokeWidth={(options?.strokeWidth ?? 1) * strokeWidthScale}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={fill}
        transform={getRotateTransform(cx, cy, options)}
      />
    )
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    return (key, strokeWidthScale) => (
      <path
        key={key}
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`}
        strokeWidth={(options?.strokeWidth ?? 1) * strokeWidthScale}
        stroke={getColorString(options?.strokeColor ?? 0)}
        fill="none"
      />
    )
  },
  renderText(x, y, text, fillColor, fontSize, fontFamily) {
    return (key) => (
      <text
        key={key}
        x={x}
        y={y}
        style={{
          fill: getColorString(fillColor),
          fontSize: `${fontSize}px`, fontFamily
        }}>
        {text}
      </text>
    )
  },
  renderPath(lines, options) {
    let fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    const d = lines.map((points) => points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')).join(' ')
    return (key, strokeWidthScale) => {
      let defs: JSX.Element | undefined
      if (options?.fillPattern) {
        const id = `${key}-pattern`
        defs = (
          <pattern
            id={id}
            patternUnits="userSpaceOnUse"
            // patternTransform={options.fillPattern.rotate ? `rotate(${options.fillPattern.rotate})` : undefined}
            width={options.fillPattern.width}
            height={options.fillPattern.height}
          >
            {options.fillPattern.path.map((p, i) => this.renderPath(p.lines, p.options)(i, strokeWidthScale))}
          </pattern>
        )
        fill = `url(#${id})`
      }
      return (
        <React.Fragment key={key}>
          {defs}
          <path
            d={d}
            strokeWidth={(options?.strokeWidth ?? 1) * strokeWidthScale}
            stroke={getColorString(options?.strokeColor ?? 0)}
            strokeDasharray={options?.dashArray?.join(' ')}
            fill={fill}
            fillRule='evenodd'
            // strokeLinecap={options?.lineCap}
          />
        </React.Fragment>
      )
    }
  },
}

/**
 * @public
 */
export function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = angleInDegrees * Math.PI / 180
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  }
}

/**
 * @public
 */
export function getColorString(color: number) {
  const s = color.toString(16)
  return `#${'0'.repeat(6 - s.length)}${s}`
}

/**
 * @public
 */
export function colorStringToNumber(color: string) {
  return +`0x${color.slice(1)}`
}

/**
 * @public
 */
export function getRotateTransform(
  x: number,
  y: number,
  options?: Partial<{
    angle: number
    rotation: number
  }>,
) {
  if (options?.angle) {
    return `rotate(${options.angle},${x},${y})`
  }
  if (options?.rotation) {
    return `rotate(${options.rotation * 180 / Math.PI},${x},${y})`
  }
  return undefined
}

import * as React from "react"
import { PathOptions, ReactRenderTarget, renderPartStyledPolyline } from ".."
import { polygonToPolyline } from "../../utils"

/**
 * @public
 */
export const reactSvgRenderTarget: ReactRenderTarget<Draw> = {
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
        {children.map((child, i) => child(i))}
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
    return (key) => (
      <g transform={transform.join(' ')} key={key}>
        {children.map((child, i) => child(i))}
      </g>
    )
  },
  renderRect(x, y, width, height, options) {
    return renderFillPattern(fill => (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeWidth={options?.strokeWidth ?? 1}
        vectorEffect='non-scaling-stroke'
        strokeDasharray={options?.dashArray?.join(' ')}
        fill={fill}
        transform={getRotateTransform(x + width / 2, y + height / 2, options)}
      />
    ), options)
  },
  renderPolyline(points, options) {
    const { partsStyles, ...restOptions } = options ?? {}
    if (partsStyles && partsStyles.length > 0) {
      return renderPartStyledPolyline(this, partsStyles, points, restOptions)
    }
    const skippedLines = options?.skippedLines
    if (skippedLines && skippedLines.length > 0) {
      const d = points.map((p, i) => i === 0 || skippedLines.includes(i - 1) ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')
      return renderFillPattern(fill => (
        <path
          d={d}
          strokeWidth={options?.strokeWidth ?? 1}
          vectorEffect='non-scaling-stroke'
          stroke={getColorString(options?.strokeColor ?? 0)}
          strokeDasharray={options?.dashArray?.join(' ')}
          fill={fill}
        />
      ), options)
    }
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return renderFillPattern(fill => (
      <polyline
        points={pointsText}
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeWidth={options?.strokeWidth ?? 1}
        vectorEffect='non-scaling-stroke'
        strokeDasharray={options?.dashArray?.join(' ')}
        fill={fill}
      />
    ), options)
  },
  renderPolygon(points, options) {
    return this.renderPolyline(polygonToPolyline(points), options)
  },
  renderCircle(cx, cy, r, options) {
    return renderFillPattern(fill => (
      <circle
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeWidth={options?.strokeWidth ?? 1}
        vectorEffect='non-scaling-stroke'
        cx={cx}
        cy={cy}
        r={r}
        strokeDasharray={options?.dashArray?.join(' ')}
        fill={fill}
      />
    ), options)
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return renderFillPattern(fill => (
      <ellipse
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeWidth={options?.strokeWidth ?? 1}
        vectorEffect='non-scaling-stroke'
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        strokeDasharray={options?.dashArray?.join(' ')}
        fill={fill}
        transform={getRotateTransform(cx, cy, options)}
      />
    ), options)
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const b = endAngle - startAngle <= 180
    const largeArcFlag = (options?.counterclockwise ? !b : b) ? "0" : "1"
    const clockwiseFlag = options?.counterclockwise ? "1" : "0"
    return renderFillPattern(fill => (
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${clockwiseFlag} ${end.x} ${end.y}`}
        strokeWidth={options?.strokeWidth ?? 1}
        vectorEffect='non-scaling-stroke'
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeDasharray={options?.dashArray?.join(' ')}
        fill={fill}
      />
    ), options)
  },
  renderText(x, y, text, fillColor, fontSize, fontFamily, options) {
    return (key) => (
      <text
        key={key}
        x={x}
        y={y}
        style={{
          fill: getColorString(fillColor),
          fontWeight: options?.fontWeight,
          fontSize: `${fontSize}px`,
          fontStyle: options?.fontStyle,
          fontFamily
        }}>
        {text}
      </text>
    )
  },
  renderImage(url, x, y, width, height, options) {
    return (key) => (
      <image
        key={key}
        href={url}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio='none'
        crossOrigin={options?.crossOrigin}
      />
    )
  },
  renderPath(lines, options) {
    const d = lines.map((points) => points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')).join(' ')
    return renderFillPattern(fill => (
      <path
        d={d}
        strokeWidth={options?.strokeWidth ?? 1}
        vectorEffect='non-scaling-stroke'
        stroke={getColorString(options?.strokeColor ?? 0)}
        strokeDasharray={options?.dashArray?.join(' ')}
        fill={fill}
        fillRule='evenodd'
      // strokeLinecap={options?.lineCap}
      />
    ), options)
  },
}

type Draw = (key: React.Key) => JSX.Element

function renderFillPattern(
  children: (fill: string) => JSX.Element,
  options?: Partial<PathOptions<Draw>>,
) {
  return (key: React.Key) => {
    const id = React.useId()
    let fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    let defs: JSX.Element | undefined
    if (options?.fillPattern) {
      defs = (
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          // patternTransform={options.fillPattern.rotate ? `rotate(${options.fillPattern.rotate})` : undefined}
          width={options.fillPattern.width}
          height={options.fillPattern.height}
        >
          {options.fillPattern.pattern()(id)}
        </pattern>
      )
      fill = `url(#${id})`
    }
    return (
      <React.Fragment key={key}>
        {defs}
        {children(fill)}
      </React.Fragment>
    )
  }
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

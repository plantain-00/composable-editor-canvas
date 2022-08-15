import * as React from "react"
import { PathOptions, ReactRenderTarget, renderPartStyledPolyline } from ".."
import { defaultMiterLimit, m3 } from "../../utils"

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
    if (options?.matrix) {
      transform.push(`matrix(${m3.getTransform(options.matrix).join(' ')})`)
    }
    return (key) => (
      <g transform={transform.join(' ')} key={key} opacity={options?.opacity}>
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
        {...getCommonLineAttributes(options)}
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
          {...getCommonLineAttributes(options)}
          fill={fill}
        />
      ), options)
    }
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return renderFillPattern(fill => React.createElement(options?.closed ? 'polygon' : 'polyline', {
      points: pointsText,
      ...getCommonLineAttributes(options),
      fill,
    }), options)
  },
  renderPolygon(points, options) {
    return this.renderPolyline(points, { ...options, closed: true })
  },
  renderCircle(cx, cy, r, options) {
    return renderFillPattern(fill => (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        {...getCommonLineAttributes(options)}
        fill={fill}
      />
    ), options)
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return renderFillPattern(fill => (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        {...getCommonLineAttributes(options)}
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
        {...getCommonLineAttributes(options)}
        fill={fill}
      />
    ), options)
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    const start = ellipsePolarToCartesian(cx, cy, rx, ry, endAngle)
    const end = ellipsePolarToCartesian(cx, cy, rx, ry, startAngle)
    const b = endAngle - startAngle <= 180
    const largeArcFlag = (options?.counterclockwise ? !b : b) ? "0" : "1"
    const clockwiseFlag = options?.counterclockwise ? "1" : "0"
    return renderFillPattern(fill => (
      <path
        d={`M ${start.x} ${start.y} A ${rx} ${ry} 0 ${largeArcFlag} ${clockwiseFlag} ${end.x} ${end.y}`}
        {...getCommonLineAttributes(options)}
        fill={fill}
        transform={getRotateTransform(cx, cy, options)}
      />
    ), options)
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return renderFillPattern(fill => (
      <text
        x={x}
        y={y}
        style={{
          fill,
          fontWeight: options?.fontWeight,
          fontSize: `${fontSize}px`,
          fontStyle: options?.fontStyle,
          fontFamily,
          strokeWidth: options?.strokeWidth,
          stroke: options?.strokeColor ? getColorString(options.strokeColor) : undefined,
          strokeDasharray: options?.dashArray?.join(' '),
          strokeDashoffset: options?.dashOffset,
          fillOpacity: options?.fillOpacity,
          strokeOpacity: options?.strokeOpacity,
        }}>
        {text}
      </text>
    ), {
      fillColor: typeof fill === 'number' ? fill : undefined,
      fillPattern: fill !== undefined && typeof fill !== 'number' ? fill : undefined,
    })
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
        opacity={options?.opacity}
      />
    )
  },
  renderPath(lines, options) {
    let d = lines.map((points) => points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')).join(' ')
    if (options?.closed) {
      d = d + ' Z'
    }
    return renderFillPattern(fill => (
      <path
        d={d}
        {...getCommonLineAttributes(options)}
        fill={fill}
        fillRule='evenodd'
      />
    ), options)
  },
}

type Draw = (key: React.Key) => JSX.Element

function renderFillPattern(
  children: (fill: string) => JSX.Element,
  options?: Partial<Pick<PathOptions<Draw>, 'fillColor' | 'fillPattern' | 'fillLinearGradient' | 'fillRadialGradient' | 'clip'>>,
) {
  return (key: React.Key) => {
    const fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    let defs: JSX.Element | undefined
    let target: JSX.Element
    if (options?.clip) {
      const id = React.useId()
      const path = children(fill)
      defs = (
        <>
          <clipPath id={id}>
            {path}
          </clipPath>
          {path}
        </>
      )
      target = (
        <g clipPath={`url(#${id})`}>
          {options.clip()(id)}
        </g>
      )
    } else if (options?.fillPattern) {
      const id = React.useId()
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
      target = children(`url(#${id})`)
    } else if (options?.fillLinearGradient) {
      const id = React.useId()
      defs = (
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={options.fillLinearGradient.start.x}
          y1={options.fillLinearGradient.start.y}
          x2={options.fillLinearGradient.end.x}
          y2={options.fillLinearGradient.end.y}
        >
          {options.fillLinearGradient.stops.map(s => <stop key={s.offset} offset={s.offset} stopColor={getColorString(s.color, s.opacity)} />)}
        </linearGradient>
      )
      target = children(`url(#${id})`)
    } else if (options?.fillRadialGradient) {
      const id = React.useId()
      defs = (
        <radialGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          fx={options.fillRadialGradient.start.x}
          fy={options.fillRadialGradient.start.y}
          fr={options.fillRadialGradient.start.r}
          cx={options.fillRadialGradient.end.x}
          cy={options.fillRadialGradient.end.y}
          r={options.fillRadialGradient.end.r}
        >
          {options.fillRadialGradient.stops.map(s => <stop key={s.offset} offset={s.offset} stopColor={getColorString(s.color, s.opacity)} />)}
        </radialGradient>
      )
      target = children(`url(#${id})`)
    } else {
      target = children(fill)
    }
    return (
      <React.Fragment key={key}>
        {defs}
        {target}
      </React.Fragment>
    )
  }
}

function getCommonLineAttributes<T>(options?: Partial<PathOptions<T>>) {
  return {
    strokeWidth: options?.strokeWidth ?? 1,
    vectorEffect: 'non-scaling-stroke' as const,
    stroke: getColorString(options?.strokeColor ?? 0),
    strokeDasharray: options?.dashArray?.join(' '),
    strokeDashoffset: options?.dashOffset,
    strokeMiterlimit: options?.miterLimit ?? defaultMiterLimit,
    strokeLinejoin: options?.lineJoin ?? 'miter',
    strokeLinecap: options?.lineCap ?? 'butt',
    fillOpacity: options?.fillOpacity,
    strokeOpacity: options?.strokeOpacity,
  }
}

/**
 * @public
 */
export function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  return ellipsePolarToCartesian(cx, cy, radius, radius, angleInDegrees)
}

/**
 * @public
 */
export function ellipsePolarToCartesian(cx: number, cy: number, rx: number, ry: number, angleInDegrees: number) {
  const angleInRadians = angleInDegrees * Math.PI / 180
  return {
    x: cx + (rx * Math.cos(angleInRadians)),
    y: cy + (ry * Math.sin(angleInRadians))
  }
}

/**
 * @public
 */
export function getColorString(color: number, alpha?: number) {
  const s = color.toString(16)
  let a = ''
  if (alpha !== undefined) {
    const f = Math.floor(alpha * 255).toString(16)
    a = '0'.repeat(2 - f.length) + f
  }
  return `#${'0'.repeat(6 - s.length)}${s}${a}`
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

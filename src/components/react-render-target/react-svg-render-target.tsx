import * as React from "react"
import { Filter, PathFillOptions, PathOptions, PathStrokeOptions, ReactRenderTarget, renderPartStyledPolyline } from ".."
import { defaultMiterLimit, getFootPoint, getParallelLinesByDistance, getPointSideOfLine, getTwoGeneralFormLinesIntersectionPoint, isZero, m3, Position, twoPointLineToGeneralFormLine } from "../../utils"

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
    return renderPattern((fill, stroke) => (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        {...getCommonLineAttributes(options)}
        fill={fill}
        stroke={stroke}
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
      return renderPattern((fill, stroke) => (
        <path
          d={d}
          {...getCommonLineAttributes(options)}
          fill={fill}
          stroke={stroke}
        />
      ), options)
    }
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return renderPattern((fill, stroke) => React.createElement(options?.closed ? 'polygon' : 'polyline', {
      points: pointsText,
      ...getCommonLineAttributes(options),
      fill,
      stroke,
    }), options)
  },
  renderPolygon(points, options) {
    return this.renderPolyline(points, { ...options, closed: true })
  },
  renderCircle(cx, cy, r, options) {
    return renderPattern((fill, stroke) => (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        {...getCommonLineAttributes(options)}
        fill={fill}
        stroke={stroke}
      />
    ), options)
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return renderPattern((fill, stroke) => (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        {...getCommonLineAttributes(options)}
        fill={fill}
        stroke={stroke}
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
    return renderPattern((fill, stroke) => (
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${clockwiseFlag} ${end.x} ${end.y}`}
        {...getCommonLineAttributes(options)}
        fill={fill}
        stroke={stroke}
      />
    ), options)
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    const start = ellipsePolarToCartesian(cx, cy, rx, ry, endAngle)
    const end = ellipsePolarToCartesian(cx, cy, rx, ry, startAngle)
    const b = endAngle - startAngle <= 180
    const largeArcFlag = (options?.counterclockwise ? !b : b) ? "0" : "1"
    const clockwiseFlag = options?.counterclockwise ? "1" : "0"
    return renderPattern((fill, stroke) => (
      <path
        d={`M ${start.x} ${start.y} A ${rx} ${ry} 0 ${largeArcFlag} ${clockwiseFlag} ${end.x} ${end.y}`}
        {...getCommonLineAttributes(options)}
        fill={fill}
        stroke={stroke}
        transform={getRotateTransform(cx, cy, options)}
      />
    ), options)
  },
  renderPathCommands(pathCommands, options) {
    let d = ''
    let last: Position | undefined
    for (const command of pathCommands) {
      if (command.type === 'move') {
        d += ` M ${command.to.x} ${command.to.y}`
        last = command.to
      } else if (command.type === 'line') {
        d += ` L ${command.to.x} ${command.to.y}`
        last = command.to
      } else if (command.type === 'arc') {
        if (last) {
          const p1 = command.from
          const p2 = command.to
          const line1 = twoPointLineToGeneralFormLine(last, p1)
          const line2 = twoPointLineToGeneralFormLine(p1, p2)
          const p2Direction = getPointSideOfLine(p2, line1)
          if (isZero(p2Direction)) {
            d += ` L ${p2.x} ${p2.y}`
            last = p2
          } else {
            const index = p2Direction < 0 ? 0 : 1
            const center = getTwoGeneralFormLinesIntersectionPoint(
              getParallelLinesByDistance(line1, command.radius)[index],
              getParallelLinesByDistance(line2, command.radius)[index],
            )
            if (center) {
              const t1 = getFootPoint(center, line1)
              const t2 = getFootPoint(center, line2)
              d += ` L ${t1.x} ${t1.y} A ${command.radius} ${command.radius} 0 0 ${p2Direction < 0 ? 1 : 0} ${t2.x} ${t2.y}`
              last = t2
            }
          }
        }
      } else if (command.type === 'bezierCurve') {
        d += ` C ${command.cp1.x} ${command.cp1.y}, ${command.cp2.x} ${command.cp2.y}, ${command.to.x} ${command.to.y}`
        last = command.to
      } else if (command.type === 'quadraticCurve') {
        d += ` Q ${command.cp.x} ${command.cp.y}, ${command.to.x} ${command.to.y}`
        last = command.to
      } else if (command.type === 'close') {
        d += ' Z'
      }
    }
    return renderPattern((fill, stroke) => (
      <path
        d={d}
        {...getCommonLineAttributes(options)}
        fill={fill}
        stroke={stroke}
      />
    ), options)
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return renderPattern((fill, stroke) => (
      <text
        x={x}
        y={y}
        textAnchor={options?.textAlign === 'center' ? 'middle' : options?.textAlign === 'right' ? 'end' : 'start'}
        alignmentBaseline={options?.textBaseline === 'top' ? 'before-edge' : options?.textBaseline === 'bottom' ? 'after-edge' : options?.textBaseline ?? 'alphabetic'}
        style={{
          fill,
          fontWeight: options?.fontWeight,
          fontSize: `${fontSize}px`,
          fontStyle: options?.fontStyle,
          fontFamily,
          strokeWidth: options?.strokeWidth,
          stroke,
          strokeDasharray: options?.dashArray?.join(' '),
          strokeDashoffset: options?.dashOffset,
          fillOpacity: options?.fillOpacity,
          strokeOpacity: options?.strokeOpacity,
        }}>
        {text}
      </text>
    ), {
      ...options,
      fillColor: typeof fill === 'number' ? fill : undefined,
      fillPattern: fill !== undefined && typeof fill !== 'number' ? fill : undefined,
    }, true)
  },
  renderImage(url, x, y, width, height, options) {
    return renderFilters(filter => (
      <image
        filter={filter}
        href={url}
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio='none'
        crossOrigin={options?.crossOrigin}
        opacity={options?.opacity}
      />
    ), options?.filters)
  },
  renderPath(lines, options) {
    let d = lines.map((points) => points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ')).join(' ')
    if (options?.closed) {
      d += ' Z'
    }
    return renderPattern((fill, stroke) => (
      <path
        d={d}
        {...getCommonLineAttributes(options)}
        fill={fill}
        stroke={stroke}
        fillRule='evenodd'
      />
    ), options)
  },
}

type Draw = (key: React.Key) => JSX.Element

function renderFilters(
  children: (filter: string | undefined) => JSX.Element,
  filters?: Filter[],
) {
  return (key: React.Key) => {
    let def: JSX.Element | undefined
    let filter: string | undefined
    if (filters && filters.length > 0) {
      const id = React.useId()
      const results: JSX.Element[] = []
      filters.forEach((f, i) => {
        if (f.type === 'brightness') {
          results.push(
            <feComponentTransfer key={i}>
              <feFuncR type="linear" slope={f.value} />
              <feFuncG type="linear" slope={f.value} />
              <feFuncB type="linear" slope={f.value} />
            </feComponentTransfer>
          )
        } else if (f.type === 'contrast') {
          const intercept = 0.5 * (1 - f.value)
          results.push(
            <feComponentTransfer key={i}>
              <feFuncR type="linear" slope={f.value} intercept={intercept} />
              <feFuncG type="linear" slope={f.value} intercept={intercept} />
              <feFuncB type="linear" slope={f.value} intercept={intercept} />
            </feComponentTransfer>
          )
        } else if (f.type === 'hue-rotate') {
          results.push(
            <feColorMatrix key={i} type="hueRotate" values={f.value.toString()} />
          )
        } else if (f.type === 'saturate') {
          results.push(
            <feColorMatrix key={i} type="saturate" values={f.value.toString()} />
          )
        }
      })
      def = (
        <filter id={id}>
          {results}
        </filter>
      )
      filter = `url(#${id})`
    }
    return (
      <React.Fragment key={key}>
        {def}
        {children(filter)}
      </React.Fragment>
    )
  }
}

function renderPattern(
  children: (fill: string, stroke: string | undefined) => JSX.Element,
  options?: Partial<PathFillOptions<Draw> & PathStrokeOptions<Draw>>,
  noDefaultStrokeColor?: boolean,
) {
  return (key: React.Key) => {
    let fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    let stroke = options?.strokeColor !== undefined ? getColorString(options.strokeColor) : noDefaultStrokeColor ? undefined : getColorString(0)
    let fillDef: JSX.Element | undefined
    let strokeDef: JSX.Element | undefined

    if (options?.strokePattern) {
      const id = React.useId()
      strokeDef = (
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={options.strokePattern.width}
          height={options.strokePattern.height}
        >
          {options.strokePattern.pattern()(id)}
        </pattern>
      )
      stroke = `url(#${id})`
    } else if (options?.strokeLinearGradient) {
      const id = React.useId()
      strokeDef = (
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={options.strokeLinearGradient.start.x}
          y1={options.strokeLinearGradient.start.y}
          x2={options.strokeLinearGradient.end.x}
          y2={options.strokeLinearGradient.end.y}
        >
          {options.strokeLinearGradient.stops.map(s => <stop key={s.offset} offset={s.offset} stopColor={getColorString(s.color, s.opacity)} />)}
        </linearGradient>
      )
      stroke = `url(#${id})`
    } else if (options?.strokeRadialGradient) {
      const id = React.useId()
      strokeDef = (
        <radialGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          fx={options.strokeRadialGradient.start.x}
          fy={options.strokeRadialGradient.start.y}
          fr={options.strokeRadialGradient.start.r}
          cx={options.strokeRadialGradient.end.x}
          cy={options.strokeRadialGradient.end.y}
          r={options.strokeRadialGradient.end.r}
        >
          {options.strokeRadialGradient.stops.map(s => <stop key={s.offset} offset={s.offset} stopColor={getColorString(s.color, s.opacity)} />)}
        </radialGradient>
      )
      stroke = `url(#${id})`
    }
    if (options?.fillPattern) {
      const id = React.useId()
      fillDef = (
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
    } else if (options?.fillLinearGradient) {
      const id = React.useId()
      fillDef = (
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
      fill = `url(#${id})`
    } else if (options?.fillRadialGradient) {
      const id = React.useId()
      fillDef = (
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
      fill = `url(#${id})`
    }

    let target: JSX.Element
    if (options?.clip) {
      const id = React.useId()
      const path = children(fill, stroke)
      fillDef = (
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
    } else {
      target = children(fill, stroke)
    }
    return (
      <React.Fragment key={key}>
        {fillDef}
        {strokeDef}
        {target}
      </React.Fragment>
    )
  }
}

function getCommonLineAttributes<T>(options?: Partial<PathOptions<T>>) {
  return {
    strokeWidth: options?.strokeWidth ?? 1,
    vectorEffect: 'non-scaling-stroke' as const,
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

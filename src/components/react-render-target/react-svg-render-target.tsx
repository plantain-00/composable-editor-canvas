import * as React from "react"
import { getColorString } from "../../utils/color"
import { isZero, largerOrEqual } from "../../utils/math"
import { Position } from "../../utils/position"
import { getLargeArc } from "../../utils/angle"
import { getParallelLinesByDistance } from "../../utils/line"
import { twoPointLineToGeneralFormLine } from "../../utils/line"
import { getPointSideOfLine } from "../../utils/line"
import { Matrix, RotationOptions, ScaleOptions, getRenderOptionsMatrix, getRotationOptionsAngle, getScaleOptionsScale, m3, multiplyMatrix } from "../../utils/matrix"
import { WeakmapCache } from "../../utils/weakmap-cache"
import { Filter, PathFillOptions, PathOptions, PathStrokeOptions, ReactRenderTarget, renderPartStyledPolyline } from "./react-render-target"
import { getRayTransformedLineSegment } from "../../utils/line"
import { RenderTransform } from "../../utils/transform"
import { angleToRadian } from "../../utils/radian"
import { getTwoGeneralFormLinesIntersectionPoint } from "../../utils/intersection"
import { getPerpendicularPoint } from "../../utils/perpendicular"
import { defaultLineCap, defaultLineJoin, defaultMiterLimit } from "../../utils/triangles"

/**
 * @public
 */
export const reactSvgRenderTarget: ReactRenderTarget<SvgDraw> = {
  type: 'svg',
  renderResult(children, width, height, options) {
    const x = options?.transform?.x ?? 0
    const y = options?.transform?.y ?? 0
    const scale = options?.transform?.scale ?? 1
    const viewportWidth = width / scale
    const viewportHeight = height / scale
    const viewportX = (width - viewportWidth) / 2 - x / scale
    const viewportY = (height - viewportHeight) / 2 - y / scale
    const strokeWidthFixed = options?.strokeWidthFixed ?? false
    const rotate = options?.transform?.rotate ?? 0
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
        <g style={{ rotate: `${rotate}rad` }}>{children.map((child, i) => child(i, scale, strokeWidthFixed, width, height, options?.transform))}</g>
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
      const scaleTransform = getScaleTransform(options.base.x, options.base.y, options)
      if (scaleTransform) {
        transform.push(scaleTransform)
      }
    }
    if (options?.matrix) {
      transform.push(`matrix(${m3.getTransform(options.matrix).join(' ')})`)
    }

    return (key, scale, strokeWidthFixed, width, height, globalTransform, matrix) => {
      const parentMatrix = multiplyMatrix(matrix, getRenderOptionsMatrix(options))
      return (
        <g transform={transform.join(' ')} key={key} opacity={options?.opacity}>
          {children.map((child, i) => child(i, scale, strokeWidthFixed, width, height, globalTransform, parentMatrix))}
        </g>
      )
    }
  },
  renderRect(x, y, width, height, options) {
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
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
      return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
        <path
          d={d}
          {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
          fill={fill}
          stroke={stroke}
        />
      ), options)
    }
    const pointsText = points.map((p) => `${p.x},${p.y}`).join(' ')
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => React.createElement(options?.closed ? 'polygon' : 'polyline', {
      points: pointsText,
      ...getCommonLineAttributes(scale, strokeWidthFixed, options),
      fill,
      stroke,
    }), options)
  },
  renderPolygon(points, options) {
    return this.renderPolyline(points, { ...options, closed: true })
  },
  renderCircle(cx, cy, r, options) {
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
        fill={fill}
        stroke={stroke}
      />
    ), options)
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
        fill={fill}
        stroke={stroke}
        transform={getRotateTransform(cx, cy, options)}
      />
    ), options)
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    if (options?.counterclockwise) {
      if (largerOrEqual(startAngle - endAngle, 360)) {
        return this.renderCircle(cx, cy, r, options)
      }
    } else {
      if (largerOrEqual(endAngle - startAngle, 360)) {
        return this.renderCircle(cx, cy, r, options)
      }
    }
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = getLargeArc({ startAngle, endAngle, counterclockwise: options?.counterclockwise }) ? "1" : "0"
    const clockwiseFlag = options?.counterclockwise ? "1" : "0"
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${clockwiseFlag} ${end.x} ${end.y}`}
        {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
        fill={fill}
        stroke={stroke}
      />
    ), options)
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    if (options?.counterclockwise) {
      if (largerOrEqual(startAngle - endAngle, 360)) {
        return this.renderEllipse(cx, cy, rx, ry, options)
      }
    } else {
      if (largerOrEqual(endAngle - startAngle, 360)) {
        return this.renderEllipse(cx, cy, rx, ry, options)
      }
    }
    const start = ellipsePolarToCartesian(cx, cy, rx, ry, endAngle)
    const end = ellipsePolarToCartesian(cx, cy, rx, ry, startAngle)
    const largeArcFlag = getLargeArc({ startAngle, endAngle, counterclockwise: options?.counterclockwise }) ? "1" : "0"
    const clockwiseFlag = options?.counterclockwise ? "1" : "0"
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
      <path
        d={`M ${start.x} ${start.y} A ${rx} ${ry} 0 ${largeArcFlag} ${clockwiseFlag} ${end.x} ${end.y}`}
        {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
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
              const t1 = getPerpendicularPoint(center, line1)
              const t2 = getPerpendicularPoint(center, line2)
              d += ` L ${t1.x} ${t1.y} A ${command.radius} ${command.radius} 0 0 ${p2Direction < 0 ? 1 : 0} ${t2.x} ${t2.y}`
              last = t2
            }
          }
        }
      } else if (command.type === 'ellipseArc') {
        d += ` A ${command.rx} ${command.ry} ${command.angle} ${command.largeArc ? 1 : 0} ${command.sweep ? 1 : 0} ${command.to.x} ${command.to.y}`
        last = command.to
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
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
      <path
        d={d}
        {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
        fill={fill}
        stroke={stroke}
      />
    ), options)
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => (
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
          strokeDasharray: getStrokeDasharray(scale, strokeWidthFixed, options),
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
    const ds = lines.map((points) => points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' '))
    const clipHoles = options?.clip && ds.length > 1
    const holes = clipHoles ? ds.slice(1).map((d, i) => <path key={i} d={d} fill='black' />) : undefined
    return renderPattern((fill, stroke, scale, strokeWidthFixed) => {
      let d: string
      if (clipHoles) {
        d = ds[0]
      } else {
        d = ds.join(' ')
        if (options?.closed) {
          d += ' Z'
        }
      }
      return (
        <path
          d={d}
          {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
          fill={fill}
          stroke={stroke}
          fillRule='evenodd'
        />
      )
    }, options, undefined, holes)
  },
  renderRay(x, y, angle, options) {
    return renderPattern((fill, stroke, scale, strokeWidthFixed, width, height, transform, matrix) => {
      const line = getRayTransformedLineSegment({ x, y, angle, bidirectional: options?.bidirectional }, width, height, transform, matrix)
      if (!line) return <></>
      return (
        <line
          x1={line[0].x}
          y1={line[0].y}
          x2={line[1].x}
          y2={line[1].y}
          {...getCommonLineAttributes(scale, strokeWidthFixed, options)}
          fill={fill}
          stroke={stroke}
        />
      )
    }, options)
  },
}

/**
 * @public
 */
export type SvgDraw = (key: React.Key, scale: number, strokeWidthFixed: boolean, width: number, height: number, transform?: RenderTransform, matrix?: Matrix) => JSX.Element

function renderFilters(
  children: (filter: string | undefined) => JSX.Element,
  filters?: Filter[],
) {
  return (key: React.Key) => {
    let def: JSX.Element | undefined
    let filter: string | undefined
    if (filters && filters.length > 0) {
      const id = getDomId(filters)
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
        } else if (f.type === 'grayscale') {
          const m = 1 - f.value
          results.push(
            <feColorMatrix key={i} type="matrix"
              values={`
                ${0.2126 + 0.7874 * m} ${0.7152 - 0.7152 * m} ${0.0722 - 0.0722 * m} 0 0
                ${0.2126 - 0.2126 * m} ${0.7152 + 0.2848 * m} ${0.0722 - 0.0722 * m} 0 0
                ${0.2126 - 0.2126 * m} ${0.7152 - 0.7152 * m} ${0.0722 + 0.9278 * m} 0 0
                0 0 0 1 0`}
            />
          )
        } else if (f.type === 'invert') {
          const m = `${f.value} ${1 - f.value}`
          results.push(
            <feComponentTransfer key={i}>
              <feFuncR type="table" tableValues={m} />
              <feFuncG type="table" tableValues={m} />
              <feFuncB type="table" tableValues={m} />
            </feComponentTransfer>
          )
        } else if (f.type === 'sepia') {
          const m = 1 - f.value
          results.push(
            <feColorMatrix key={i} type="matrix"
              values={`
                ${0.393 + 0.607 * m} ${0.769 - 0.769 * m} ${0.189 - 0.189 * m} 0 0
                ${0.349 - 0.349 * m} ${0.686 + 0.314 * m} ${0.168 - 0.168 * m} 0 0
                ${0.272 - 0.272 * m} ${0.534 - 0.534 * m} ${0.131 + 0.869 * m} 0 0
                0 0 0 1 0`}
            />
          )
        } else if (f.type === 'opacity') {
          results.push(
            <feComponentTransfer key={i}>
              <feFuncA type="table" tableValues={`0 ${f.value}`} />
            </feComponentTransfer>
          )
        } else if (f.type === 'blur') {
          results.push(
            <feGaussianBlur key={i} in="SourceGraphic" stdDeviation={f.value} />
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
  children: (fill: string, stroke: string | undefined, scale: number, strokeWidthFixed: boolean, width: number, height: number, transform?: RenderTransform, matrix?: Matrix) => JSX.Element,
  options?: Partial<PathFillOptions<SvgDraw> & PathStrokeOptions<SvgDraw> & RotationOptions>,
  noDefaultStrokeColor?: boolean,
  holes?: JSX.Element[],
) {
  return (key: React.Key, scale: number, strokeWidthFixed: boolean, width: number, height: number, transform?: RenderTransform, matrix?: Matrix) => {
    let fill = options?.fillColor !== undefined ? getColorString(options.fillColor) : 'none'
    let stroke = options?.strokeColor !== undefined ? getColorString(options.strokeColor) : noDefaultStrokeColor ? undefined : getColorString(0)
    let fillDef: JSX.Element | undefined
    let strokeDef: JSX.Element | undefined

    if (options?.strokePattern) {
      const id = getDomId(options.strokePattern)
      strokeDef = (
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          patternTransform={getReverseRotateTransform(options)}
          width={options.strokePattern.width}
          height={options.strokePattern.height}
        >
          {options.strokePattern.pattern()(id, scale, strokeWidthFixed, width, height, transform, matrix)}
        </pattern>
      )
      stroke = `url(#${id})`
    } else if (options?.strokeLinearGradient) {
      const id = getDomId(options.strokeLinearGradient)
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
      const id = getDomId(options.strokeRadialGradient)
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
      const id = getDomId(options.fillPattern)
      fillDef = (
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          patternTransform={getReverseRotateTransform(options)}
          width={options.fillPattern.width}
          height={options.fillPattern.height}
        >
          {options.fillPattern.pattern()(id, scale, strokeWidthFixed, width, height, transform, matrix)}
        </pattern>
      )
      fill = `url(#${id})`
    } else if (options?.fillLinearGradient) {
      const id = getDomId(options.fillLinearGradient)
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
      const id = getDomId(options.fillRadialGradient)
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
    const path = children(fill, stroke, scale, strokeWidthFixed, width, height, transform, matrix)
    if (options?.clip) {
      const id = getDomId(options.clip)
      const clipContent = options.clip()(id, scale, strokeWidthFixed, width, height, transform, matrix)
      if (holes) {
        fillDef = (
          <>
            <mask id={id}>
              {children('white', stroke, scale, strokeWidthFixed, width, height, transform, matrix)}
              {holes}
            </mask>
            {path}
          </>
        )
        target = (
          <g mask={`url(#${id})`}>
            {clipContent}
          </g>
        )
      } else {
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
            {clipContent}
          </g>
        )
      }
    } else {
      target = path
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

const domIdCache = new WeakmapCache<object, string>()
function getDomId(target: object) {
  return domIdCache.get(target, () => Math.random().toString())
}

function getCommonLineAttributes<T>(scale: number, strokeWidthFixed: boolean, options?: Partial<PathOptions<T>>) {
  return {
    strokeWidth: options?.strokeWidth ?? 1,
    vectorEffect: strokeWidthFixed ? 'non-scaling-stroke' as const : undefined,
    strokeDasharray: getStrokeDasharray(scale, strokeWidthFixed, options),
    strokeDashoffset: options?.dashOffset,
    strokeMiterlimit: options?.miterLimit ?? defaultMiterLimit,
    strokeLinejoin: options?.lineJoin ?? defaultLineJoin,
    strokeLinecap: options?.lineCap ?? defaultLineCap,
    fillOpacity: options?.fillOpacity,
    strokeOpacity: options?.strokeOpacity,
  }
}

function getStrokeDasharray<T>(scale: number, strokeWidthFixed: boolean, options?: Partial<PathOptions<T>>) {
  if (options?.dashArray && options.dashArray.length > 0) {
    return options.dashArray.map(d => d * (strokeWidthFixed ? scale : 1)).join(' ')
  }
  return
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
  const angleInRadians = angleToRadian(angleInDegrees)
  return {
    x: cx + (rx * Math.cos(angleInRadians)),
    y: cy + (ry * Math.sin(angleInRadians))
  }
}

export function getScaleTransform(x: number, y: number, options?: Partial<ScaleOptions>) {
  const scale = getScaleOptionsScale(options)
  if (scale) {
    return `translate(${x},${y}) scale(${scale.x},${scale.y}) translate(${-x},${-y})`
  }
  return undefined
}

export function getRotateTransform(
  x: number,
  y: number,
  options?: Partial<RotationOptions>,
) {
  const angle = getRotationOptionsAngle(options)
  if (angle) {
    return `rotate(${angle},${x},${y})`
  }
  return undefined
}

function getReverseRotateTransform(options?: Partial<RotationOptions>) {
  const angle = getRotationOptionsAngle(options)
  if (angle) {
    return `rotate(${-angle})`
  }
  return undefined
}

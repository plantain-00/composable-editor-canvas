import * as React from "react"
import { ReactRenderTarget, RenderTransform } from "./react-render-target"
import { Graphic } from "./create-webgl-renderer"
import { colorNumberToRec } from "../../utils/color"
import { Vec4 } from "../../utils/types"
import { createWebgpuRenderer } from "./create-webgpu-renderer"
import { WebglDraw, reactWebglRenderTarget } from "./react-webgl-render-target"

/**
 * @public
 */
export const reactWebgpuRenderTarget: ReactRenderTarget<WebgpuDraw> = {
  ...reactWebglRenderTarget,
  type: 'webgpu',
  renderResult(children, width, height, options) {
    return (
      <Canvas
        width={width}
        height={height}
        attributes={options?.attributes}
        graphics={children}
        transform={options?.transform}
        backgroundColor={options?.backgroundColor}
        debug={options?.debug}
        strokeWidthFixed={options?.strokeWidthFixed}
      />
    )
  },
}

export type WebgpuDraw = WebglDraw

function Canvas(props: {
  width: number,
  height: number,
  attributes?: Partial<React.DOMAttributes<HTMLOrSVGElement> & {
    style: React.CSSProperties
  }>,
  graphics: WebglDraw[]
  transform?: RenderTransform
  backgroundColor?: number
  debug?: boolean
  strokeWidthFixed?: boolean
}) {
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const [imageLoadStatus, setImageLoadStatus] = React.useState(0)
  const render = React.useRef<(
    graphics: ((strokeWidthFixed: boolean, rerender: () => void) => Graphic[])[],
    backgroundColor: Vec4,
    x: number,
    y: number,
    scale: number,
    strokeWidthFixed: boolean,
    rotate?: number
  ) => void>()
  React.useEffect(() => {
    if (ref.current) {
      ref.current.width = props.width
      ref.current.height = props.height
    }
  }, [props.width, props.height])
  React.useEffect(() => {
    if (!ref.current) {
      return
    }
    createWebgpuRenderer(ref.current).then(renderer => {
      if (!renderer) {
        return
      }
      const rerender = () => setImageLoadStatus(c => c + 1)
      render.current = (graphics, backgroundColor, x, y, scale, strokeWidthFixed, rotate) => {
        const now = performance.now()
        renderer(graphics.map(g => g(strokeWidthFixed, rerender)).flat(), backgroundColor, x, y, scale, rotate)
        if (props.debug) {
          console.info(Math.round(performance.now() - now))
        }
      }
      rerender()
    })
  }, [ref.current, props.debug])

  React.useEffect(() => {
    if (render.current) {
      const x = props.transform?.x ?? 0
      const y = props.transform?.y ?? 0
      const scale = props.transform?.scale ?? 1
      const color = colorNumberToRec(props.backgroundColor ?? 0xffffff)
      const strokeWidthFixed = props.strokeWidthFixed ?? false
      render.current(props.graphics, color, x, y, scale, strokeWidthFixed, props.transform?.rotate)
    }
  }, [props.graphics, props.backgroundColor, render.current, props.transform, imageLoadStatus])
  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      {...props.attributes}
    />
  )
}

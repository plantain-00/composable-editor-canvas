import React from "react"
import { Transform, bindMultipleRefs, reactSvgRenderTarget, reverseTransformPosition, scaleByCursorPosition, useMinimap, useWheelScroll, useWheelZoom, useWindowSize, zoomToFit } from "../src"

export default () => {
  const { ref: scrollRef, x, setX, y, setY } = useWheelScroll<HTMLDivElement>()
  const { ref: zoomRef, scale } = useWheelZoom<HTMLDivElement>({
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const target = reactSvgRenderTarget
  const minimapWidth = 100, minimapHeight = 100
  const size = useWindowSize()
  const width = size.width / 2, height = size.height / 2
  const contentWidth = 1200, contentHeight = 800
  const transform: Transform = {
    x,
    y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }
  const children = [target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 0, 0, contentWidth, contentHeight)]
  const { setMinimapTransform, minimap, getMinimapPosition } = useMinimap({
    width: minimapWidth,
    height: minimapHeight,
    viewport: {
      width: width / transform.scale,
      height: height / transform.scale,
      center: reverseTransformPosition(transform.center, transform),
    },
    children(minimapTransform) {
      return target.renderResult(children, minimapWidth, minimapHeight, {
        transform: minimapTransform, attributes: {
          onClick: e => {
            if (getMinimapPosition) {
              const p = getMinimapPosition(e)
              setX((transform.center.x - p.x) * transform.scale)
              setY((transform.center.y - p.y) * transform.scale)
            }
          }
        }
      })
    },
  })
  React.useEffect(() => {
    const bounding = {
      start: { x: 0, y: 0 },
      end: { x: contentWidth, y: contentHeight },
    }
    const result = zoomToFit(bounding, { width: minimapWidth, height: minimapHeight }, { x: minimapWidth / 2, y: minimapHeight / 2 }, 1)
    if (result) {
      setMinimapTransform({
        bounding,
        ...result,
      })
    }
  }, [])
  return (
    <div ref={bindMultipleRefs(scrollRef, zoomRef)} style={{ position: 'absolute', inset: '0px' }}>
      {target.renderResult(children, width, height, { transform, attributes: { style: { border: '1px solid green' } } })}
      {minimap}
    </div>
  )
}

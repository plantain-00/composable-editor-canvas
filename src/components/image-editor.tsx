import React from "react"
import { ReactRenderTarget, reactCanvasRenderTarget } from "./react-render-target"
import { Menu, MenuItem, getMenuHeight } from "./menu"
import { useDragMove } from "./use-drag-move"
import { useWheelScroll } from "./use-wheel-scroll"
import { useWheelZoom } from "./use-wheel-zoom"
import { Transform, reverseTransformPosition, scaleByCursorPosition, zoomToFitPoints } from "../utils/transform"
import { bindMultipleRefs } from "../utils/ref"
import { useGlobalKeyDown } from "./use-global-keydown"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useZoom } from "./use-zoom"
import { useDragSelect } from "./use-drag-select"
import { Position } from "../utils/position"
import { Size, getPolygonFromTwoPointsFormRegion, getTwoPointsFormRegion } from "../utils/region"
import { pointInPolygon } from "../utils"

export function ImageEditor(props: {
  src: string
  width: number
}) {
  const imageData = React.useRef<ImageData>()
  const canvasCtx = React.useRef<CanvasRenderingContext2D>()
  const [image, setImage] = React.useState(props.src)
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [status, setStatus] = React.useState<'select' | 'move'>('select')
  const [size, setSize] = React.useState<Size>({ width: props.width, height: 0 })
  const [imageSize, setImageSize] = React.useState<Size>()
  const [selection, setSelection] = React.useState<Position[]>()

  React.useEffect(() => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const height = props.width / image.width * image.height
      setSize({ width: size.width, height })
      setImageSize({ width: image.width, height: image.height })
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const result = zoomToFitPoints(getPolygonFromTwoPointsFormRegion({ start: { x: 0, y: 0 }, end: { x: image.width, y: image.height } }), { width: props.width, height: height }, { x: props.width / 2, y: height / 2 }, 1, transform.rotate)
      if (result) {
        setScale(result.scale)
        setX(result.x)
        setY(result.y)
      }
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(image, 0, 0, image.width, image.height)
        imageData.current = ctx.getImageData(0, 0, image.width, image.height)
        canvasCtx.current = ctx
      }
    }
    image.src = props.src
  }, [])
  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition(size, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const { zoomIn, zoomOut } = useZoom(scale, setScale)
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask, resetDragMove } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })
  const { onStartSelect, dragSelectMask, endDragSelect, resetDragSelect } = useDragSelect((start, end) => {
    if (end) {
      const points = getPolygonFromTwoPointsFormRegion(getTwoPointsFormRegion(start, end)).map(p => reverseTransform(p))
      setSelection(points)
    }
  })
  useGlobalKeyDown(e => {
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.code === 'Minus') {
        zoomOut(e)
      } else if (e.code === 'Equal') {
        zoomIn(e)
      } else if (e.key === 'ArrowLeft') {
        setX((v) => v + size.width / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        setX((v) => v - size.width / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        setY((v) => v + size.height / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowDown') {
        setY((v) => v - size.height / 10)
        e.preventDefault()
      }
    } else if (e.key === 'Escape') {
      setStatus('select')
      setContextMenu(undefined)
      resetDragMove()
      resetDragSelect()
      setSelection(undefined)
    }
  })

  const transform: Transform = {
    x,
    y,
    scale,
    center: {
      x: size.width / 2,
      y: size.height / 2,
    },
  }
  transform.x += offset.x
  transform.y += offset.y
  const reverseTransform = (p: Position) => {
    p = reverseTransformPosition(p, transform)
    return p
  }
  const target: ReactRenderTarget<unknown> = reactCanvasRenderTarget
  const children: ReturnType<typeof target.renderGroup>[] = []
  if (imageSize) {
    children.push(target.renderImage(image, 0, 0, imageSize.width, imageSize.height))
  }
  if (selection) {
    children.push(target.renderPolygon(selection, { strokeWidth: 0, fillColor: 0x000000, fillOpacity: 0.3 }))
  }

  return (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)} style={{ cursor: status === 'move' ? 'grab' : 'crosshair', position: 'absolute', inset: '0px', overflow: 'hidden' }}>
      {target.renderResult(children, size.width, size.height, {
        attributes: {
          onMouseDown(e) {
            if (status === 'move') {
              onStartMoveCanvas({ x: e.clientX, y: e.clientY })
            } else if (e.buttons === 4) {
              onStartMoveCanvas({ x: e.clientX, y: e.clientY })
            }
          },
          onClick(e) {
            if (status === 'select') {
              onStartSelect(e)
            }
          },
          onDoubleClick(e) {
            endDragSelect(e)
          },
          onContextMenu(e) {
            e.preventDefault()
            const viewportPosition = { x: e.clientX, y: e.clientY }
            if (contextMenu) {
              setContextMenu(undefined)
              return
            }
            const items: MenuItem[] = (['select', 'move'] as const).map(s => ({
              title: s,
              onClick: () => {
                setStatus(s)
                setContextMenu(undefined)
              },
            }))
            if (selection) {
              items.push({
                title: 'delete',
                onClick() {
                  if (imageData.current && canvasCtx.current) {
                    for (let i = 0; i < imageData.current.width; i++) {
                      for (let j = 0; j < imageData.current.height; j++) {
                        if (pointInPolygon({ x: i, y: j }, selection)) {
                          const index = (i + j * imageData.current.width) * 4
                          imageData.current.data[index] = 0
                          imageData.current.data[index + 1] = 0
                          imageData.current.data[index + 2] = 0
                          imageData.current.data[index + 3] = 0
                        }
                      }
                    }
                    canvasCtx.current.putImageData(imageData.current, 0, 0)
                    setImage(canvasCtx.current.canvas.toDataURL())
                    setContextMenu(undefined)
                    setSelection(undefined)
                  }
                },
              })
            }
            items.push({
              title: 'save to clipboard',
              onClick() {
                if (canvasCtx.current) {
                  canvasCtx.current.canvas.toBlob(blob => {
                    if (blob) {
                      navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                    }
                  })
                  setContextMenu(undefined)
                  setSelection(undefined)
                }
              }
            })
            setContextMenu(
              <Menu
                items={items}
                style={{
                  left: viewportPosition.x + 'px',
                  top: Math.min(viewportPosition.y, size.height - getMenuHeight(items, 16)) + 'px',
                }}
              />
            )
          },
        },
        transform,
      })}
      {contextMenu}
      {dragSelectMask}
      {moveCanvasMask}
    </div>
  )
}

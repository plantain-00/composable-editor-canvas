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
import { Size, getPolygonFromTwoPointsFormRegion, getTwoPointsFormRegion, getTwoPointsFormRegionSize } from "../utils/region"
import { blobToDataUrl, dataUrlToImage, createCanvasContext } from "../utils/blob"
import { pointInPolygon } from "../utils/line"
import { getPointsBounding } from "../utils/bounding"
import { setArrayItems } from "../utils/math"

export function ImageEditor(props: {
  src: string
  width: number
}) {
  const imageInfo = React.useRef<{ ctx: CanvasRenderingContext2D, imageData: ImageData, size: Size }>()
  const [image, setImage] = React.useState(props.src)
  const [previewImage, setPreviewImage] = React.useState<{ url: string } & Size>()
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [status, setStatus] = React.useState<'select' | 'move' | 'paste'>('select')
  const [size, setSize] = React.useState<Size>({ width: props.width, height: 0 })
  const [selection, setSelection] = React.useState<Position[]>()

  React.useEffect(() => {
    dataUrlToImage(props.src, 'anonymous').then(image => {
      const height = props.width / image.width * image.height
      setSize({ width: size.width, height })
      const result = zoomToFitPoints(getPolygonFromTwoPointsFormRegion({ start: { x: 0, y: 0 }, end: { x: image.width, y: image.height } }), { width: props.width, height: height }, { x: props.width / 2, y: height / 2 }, 1, transform.rotate)
      if (result) {
        setScale(result.scale)
        setX(result.x)
        setY(result.y)
      }
      const ctx = createCanvasContext(image)
      if (ctx) {
        ctx.drawImage(image, 0, 0, image.width, image.height)
        imageInfo.current = {
          imageData: ctx.getImageData(0, 0, image.width, image.height),
          ctx,
          size: { width: image.width, height: image.height }
        }
      }
    })
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
      setPreviewImage(undefined)
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
  if (imageInfo.current) {
    children.push(target.renderImage(image, 0, 0, imageInfo.current.size.width, imageInfo.current.size.height))
  }
  if (previewImage) {
    children.push(target.renderImage(previewImage.url, 0, 0, previewImage.width, previewImage.height))
  }
  if (selection) {
    children.push(target.renderPolygon(selection, { strokeWidth: 0, fillColor: 0x000000, fillOpacity: 0.3 }))
  }
  const deleteSelection = () => {
    if (imageInfo.current && selection) {
      for (let i = 0; i < imageInfo.current.imageData.width; i++) {
        for (let j = 0; j < imageInfo.current.imageData.height; j++) {
          if (pointInPolygon({ x: i, y: j }, selection)) {
            setArrayItems(imageInfo.current.imageData.data, (i + j * imageInfo.current.imageData.width) * 4, [0, 0, 0, 0])
          }
        }
      }
      imageInfo.current.ctx.putImageData(imageInfo.current.imageData, 0, 0)
      setImage(imageInfo.current.ctx.canvas.toDataURL())
    }
    setSelection(undefined)
  }
  const copySelection = () => {
    if (imageInfo.current && selection) {
      const bounding = getPointsBounding(selection)
      if (bounding) {
        const size = getTwoPointsFormRegionSize(bounding)
        const ctx = createCanvasContext(size)
        if (ctx) {
          const imageData = ctx.createImageData(size.width, size.height)
          const minX = Math.round(bounding.start.x), minY = Math.round(bounding.start.y)
          for (let i = 0; i < imageData.width; i++) {
            const x = i + minX
            for (let j = 0; j < imageData.height; j++) {
              const y = j + minY
              if (pointInPolygon({ x, y }, selection)) {
                const k = (x + y * imageInfo.current.imageData.width) * 4
                setArrayItems(imageData.data, (i + j * imageData.width) * 4, imageInfo.current.imageData.data.slice(k, k + 4))
              }
            }
          }
          ctx.putImageData(imageData, 0, 0)
          ctx.canvas.toBlob(blob => {
            if (blob) {
              navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
            }
          })
        }
      }
    }
    setSelection(undefined)
  }

  return (
    <div
      ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}
      style={{ cursor: status === 'move' ? 'grab' : 'crosshair', position: 'absolute', inset: '0px', overflow: 'hidden' }}
    >
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
            const items: MenuItem[] = []
            for (const s of ['select', 'move'] as const) {
              if (s !== status) {
                items.push({
                  title: s,
                  onClick: () => {
                    setStatus(s)
                    setContextMenu(undefined)
                  },
                })
              }
            }
            if (selection) {
              items.push({
                title: 'delete',
                onClick() {
                  deleteSelection()
                  setContextMenu(undefined)
                },
              })
              items.push({
                title: 'cut',
                onClick() {
                  copySelection()
                  deleteSelection()
                  setContextMenu(undefined)
                },
              })
              items.push({
                title: 'copy',
                onClick() {
                  copySelection()
                  setContextMenu(undefined)
                },
              })
            }
            items.push({
              title: 'paste',
              async onClick() {
                const items = await navigator.clipboard.read()
                for (const item of items) {
                  if (item.types.includes('image/png')) {
                    const blob = await item.getType('image/png')
                    const base64 = await blobToDataUrl(blob)
                    const image = await dataUrlToImage(base64, 'anonymous')
                    const ctx = createCanvasContext(image)
                    if (ctx) {
                      ctx.drawImage(image, 0, 0, image.width, image.height)
                      setPreviewImage({ url: base64, width: image.width, height: image.height })
                    }
                    setStatus('paste')
                    break
                  }
                }
                setContextMenu(undefined)
              },
            })
            items.push({
              title: 'save to clipboard',
              onClick() {
                if (imageInfo.current) {
                  imageInfo.current.ctx.canvas.toBlob(blob => {
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

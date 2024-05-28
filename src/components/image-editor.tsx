import React from "react"
import { ReactRenderTarget, reactCanvasRenderTarget } from "./react-render-target"
import { Menu, MenuItem, getMenuHeight } from "./menu"
import { useDragMove } from "./use-drag-move"
import { useWheelScroll } from "./use-wheel-scroll"
import { useWheelZoom } from "./use-wheel-zoom"
import { Transform, reverseTransformPosition, scaleByCursorPosition, zoomToFitPoints } from "../utils/transform"
import { bindMultipleRefs } from "../utils/ref"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useZoom } from "./use-zoom"
import { useDragSelect } from "./use-drag-select"
import { Position } from "../utils/position"
import { getPolygonFromTwoPointsFormRegion, getTwoPointsFormRegion, getTwoPointsFormRegionSize } from "../utils/region"
import { blobToDataUrl, dataUrlToImage, createCanvasContext } from "../utils/blob"
import { pointInPolygon } from "../utils/line"
import { getPointsBounding } from "../utils/bounding"
import { setArrayItems } from "../utils/math"
import { useChooseFile } from "./use-create/use-image-click-create"
import { useUndoRedo } from "./use-undo-redo"
import { Cursor } from "./cursor"

export function ImageEditor(props: {
  src: string
  x?: number
  y?: number
  width: number
  height: number
  onCancel?: () => void
  onCpmplete?: (url: string, wdith: number, height: number) => void
  style?: React.CSSProperties
}) {
  const { state: image, setState, resetHistory, undo, redo, canRedo, canUndo } = useUndoRedo<{ url: string, ctx: CanvasRenderingContext2D, x: number, y: number, canvasWidth: number, canvasHeight: number } | undefined>(undefined)
  const [previewImage, setPreviewImage] = React.useState<{ url: string, ctx: CanvasRenderingContext2D }>()
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [status, setStatus] = React.useState<'select' | 'move' | 'paste'>('select')
  const [selection, setSelection] = React.useState<Position[]>()
  const [previewOffset, setPreviewOffset] = React.useState<Position>()
  const ref = React.useRef<HTMLInputElement | null>(null)

  const focus = () => {
    setTimeout(() => {
      ref.current?.focus()
    })
  }
  const loadUrl = async (url: string) => {
    const imageElement = await dataUrlToImage(url, 'anonymous')
    const rate = Math.min(props.width / imageElement.width, props.height / imageElement.height)
    const width = imageElement.width * rate
    const height = imageElement.height * rate
    const x = (props.width - width) / 2 + (props.x ?? 0)
    const y = (props.height - height) / 2 + (props.y ?? 0)
    const result = zoomToFitPoints(getPolygonFromTwoPointsFormRegion({ start: { x: 0, y: 0 }, end: { x: imageElement.width, y: imageElement.height } }), { width, height }, { x: width / 2, y: height / 2 }, 1)
    if (result) {
      setScale(result.scale)
      setX(result.x)
      setY(result.y)
    }
    const ctx = createCanvasContext(imageElement)
    if (ctx) {
      ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height)
      resetHistory({
        url,
        ctx,
        x,
        y,
        canvasWidth: width,
        canvasHeight: height,
      })
      focus()
    }
  }
  React.useEffect(() => {
    loadUrl(props.src)
  }, [])
  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    onChange(oldScale, newScale, cursor) {
      if (!image) return
      const result = scaleByCursorPosition({ width: image.canvasWidth, height: image.canvasHeight }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const { zoomIn, zoomOut } = useZoom(scale, setScale)
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask, resetDragMove } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
    setStatus('select')
    closeContextMenu()
  })
  const { onStartSelect, dragSelectMask, endDragSelect, resetDragSelect } = useDragSelect((start, end) => {
    if (end) {
      const points = getPolygonFromTwoPointsFormRegion(getTwoPointsFormRegion(start, end)).map(p => reverseTransform(p))
      setSelection(points)
      focus()
    }
  })
  const closeContextMenu = () => {
    setContextMenu(undefined)
    focus()
  }
  const reset = () => {
    setStatus('select')
    closeContextMenu()
    resetDragMove()
    resetDragSelect()
    setSelection(undefined)
    setPreviewImage(undefined)
    setPreviewOffset(undefined)
  }
  const { start: chooseFile, ui: chooseFileUI } = useChooseFile(async file => {
    const base64 = await blobToDataUrl(file)
    await loadUrl(base64)
  })
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    e.stopPropagation()
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.code === 'Minus') {
        zoomOut(e)
      } else if (e.code === 'Equal') {
        zoomIn(e)
      } else if (e.key === 'ArrowLeft') {
        if (!image) return
        setX((v) => v + image.canvasWidth / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        if (!image) return
        setX((v) => v - image.canvasWidth / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        if (!image) return
        setY((v) => v + image.canvasHeight / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowDown') {
        if (!image) return
        setY((v) => v - image.canvasHeight / 10)
        e.preventDefault()
      } else if (e.code === 'KeyZ') {
        if (e.shiftKey) {
          redo(e)
        } else {
          undo(e)
        }
      } else if (!e.shiftKey) {
        if (e.code === 'KeyA') {
          if (!image) return
          const points = getPolygonFromTwoPointsFormRegion(getTwoPointsFormRegion({ x: 0, y: 0 }, { x: image.ctx.canvas.width, y: image.ctx.canvas.height }))
          setSelection(points)
          e.preventDefault()
        } else if (e.code === 'KeyC') {
          copySelection()
          e.preventDefault()
        } else if (e.code === 'KeyV') {
          paste()
          e.preventDefault()
        } else if (e.code === 'KeyX') {
          copySelection()
          deleteSelection()
          e.preventDefault()
        } else if (e.code === 'KeyS') {
          if (image) {
            props.onCpmplete?.(image.url, image.canvasWidth, image.canvasHeight)
          }
          e.preventDefault()
        }
      }
    } else if (e.key === 'Escape') {
      reset()
      props.onCancel?.()
    }
  }

  if (!image) return null
  const transform: Transform = {
    x,
    y,
    scale,
    center: {
      x: image.canvasWidth / 2,
      y: image.canvasHeight / 2,
    },
  }
  transform.x += offset.x
  transform.y += offset.y
  const transformOffset = (p: Position) => {
    return {
      x: p.x - image.x,
      y: p.y - image.y,
    }
  }
  const reverseTransform = (p: Position) => {
    p = transformOffset(p)
    p = reverseTransformPosition(p, transform)
    return p
  }
  const target: ReactRenderTarget<unknown> = reactCanvasRenderTarget
  const children: ReturnType<typeof target.renderGroup>[] = []
  children.push(target.renderImage(image.url, 0, 0, image.ctx.canvas.width, image.ctx.canvas.height))
  if (previewImage && previewOffset) {
    children.push(target.renderImage(previewImage.url, previewOffset.x, previewOffset.y, previewImage.ctx.canvas.width, previewImage.ctx.canvas.height))
  }
  if (selection) {
    children.push(target.renderPolygon(selection, { strokeWidth: 0, fillColor: 0x000000, fillOpacity: 0.3 }))
  }
  const deleteSelection = () => {
    if (selection) {
      const imageData = image.ctx.getImageData(0, 0, image.ctx.canvas.width, image.ctx.canvas.height)
      for (let i = 0; i < image.ctx.canvas.width; i++) {
        for (let j = 0; j < image.ctx.canvas.height; j++) {
          if (pointInPolygon({ x: i, y: j }, selection)) {
            setArrayItems(imageData.data, (i + j * imageData.width) * 4, [0, 0, 0, 0])
          }
        }
      }
      image.ctx.putImageData(imageData, 0, 0)
      setState(draft => {
        if (draft) {
          draft.url = image.ctx.canvas.toDataURL()
        }
      })
    }
    setSelection(undefined)
  }
  const copySelection = () => {
    if (selection) {
      const bounding = getPointsBounding(selection)
      if (bounding) {
        const size = getTwoPointsFormRegionSize(bounding)
        const ctx = createCanvasContext(size)
        if (ctx) {
          const imageData = ctx.createImageData(size.width, size.height)
          const minX = Math.round(bounding.start.x), minY = Math.round(bounding.start.y)
          const oldImageData = image.ctx.getImageData(0, 0, image.ctx.canvas.width, image.ctx.canvas.height)
          for (let i = 0; i < imageData.width; i++) {
            const x = i + minX
            for (let j = 0; j < imageData.height; j++) {
              const y = j + minY
              if (pointInPolygon({ x, y }, selection)) {
                const k = (x + y * oldImageData.width) * 4
                setArrayItems(imageData.data, (i + j * imageData.width) * 4, oldImageData.data.slice(k, k + 4))
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
  const paste = async () => {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      if (item.types.includes('image/png')) {
        const blob = await item.getType('image/png')
        const base64 = await blobToDataUrl(blob)
        const imageElement = await dataUrlToImage(base64, 'anonymous')
        const ctx = createCanvasContext(imageElement)
        if (ctx) {
          ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height)
          setPreviewImage({ url: base64, ctx })
        }
        setStatus('paste')
        break
      }
    }
  }

  return (
    <div
      ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}
      style={{ cursor: status === 'move' ? 'grab' : 'crosshair', position: 'absolute', inset: '0px', left: image.x + 'px', top: image.y + 'px', overflow: 'hidden' }}
      onMouseMove={e => {
        if (previewImage && status === 'paste') {
          const p = reverseTransform({ x: e.clientX, y: e.clientY })
          setPreviewOffset({ x: p.x - previewImage.ctx.canvas.width / 2, y: p.y - previewImage.ctx.canvas.height / 2 })
        }
      }}
    >
      {target.renderResult(children, image.canvasWidth, image.canvasHeight, {
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
            } else if (status === 'paste' && previewImage && previewOffset) {
              const imageData = image.ctx.getImageData(0, 0, image.ctx.canvas.width, image.ctx.canvas.height)
              const previewImageData = previewImage.ctx.getImageData(0, 0, previewImage.ctx.canvas.width, previewImage.ctx.canvas.height)
              const x0 = Math.round(previewOffset.x), y0 = Math.round(previewOffset.y)
              const xMin = Math.max(x0, 0)
              const xMax = Math.min(x0 + previewImage.ctx.canvas.width, image.ctx.canvas.width)
              const yMin = Math.max(y0, 0)
              const yMax = Math.min(y0 + previewImage.ctx.canvas.height, image.ctx.canvas.height)
              for (let x = xMin; x < xMax; x++) {
                const i = x - x0
                for (let y = yMin; y < yMax; y++) {
                  const j = y - y0
                  const k = (i + j * previewImage.ctx.canvas.width) * 4
                  if (previewImageData.data[k + 3] !== 0) {
                    setArrayItems(imageData.data, (x + y * imageData.width) * 4, previewImageData.data.slice(k, k + 4))
                  }
                }
              }
              image.ctx.putImageData(imageData, 0, 0)
              setState(draft => {
                if (draft) {
                  draft.url = image.ctx.canvas.toDataURL()
                }
              })
              reset()
            }
          },
          onDoubleClick(e) {
            endDragSelect(e)
          },
          onContextMenu(e) {
            e.preventDefault()
            const viewportPosition = transformOffset({ x: e.clientX, y: e.clientY })
            if (contextMenu) {
              closeContextMenu()
              return
            }
            const items: MenuItem[] = []
            if (props.onCpmplete) {
              items.push({
                title: 'complete',
                onClick() {
                  props.onCpmplete?.(image.url, image.canvasWidth, image.canvasHeight)
                  closeContextMenu()
                },
              })
            }
            if (props.onCancel) {
              items.push({
                title: 'cancel',
                onClick() {
                  props.onCancel?.()
                  closeContextMenu()
                },
              })
            }
            items.push({
              title: 'open',
              onClick() {
                chooseFile()
                closeContextMenu()
              },
            })
            if (canUndo) {
              items.push({
                title: 'undo',
                onClick() {
                  undo()
                  closeContextMenu()
                },
              })
            }
            if (canRedo) {
              items.push({
                title: 'redo',
                onClick() {
                  redo()
                  closeContextMenu()
                },
              })
            }
            items.push({
              title: 'move',
              onClick: () => {
                setStatus('move')
                closeContextMenu()
              },
            })
            if (selection) {
              items.push({
                title: 'delete',
                onClick() {
                  deleteSelection()
                  closeContextMenu()
                },
              })
              items.push({
                title: 'cut',
                onClick() {
                  copySelection()
                  deleteSelection()
                  closeContextMenu()
                },
              })
              items.push({
                title: 'copy',
                onClick() {
                  copySelection()
                  closeContextMenu()
                },
              })
            }
            items.push({
              title: 'paste',
              async onClick() {
                await paste()
                closeContextMenu()
              },
            })
            items.push({
              title: 'save to clipboard',
              onClick() {
                image.ctx.canvas.toBlob(blob => {
                  if (blob) {
                    navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                  }
                })
                closeContextMenu()
                setSelection(undefined)
              }
            })
            setContextMenu(
              <Menu
                items={items}
                style={{
                  left: viewportPosition.x + 'px',
                  top: Math.min(viewportPosition.y, image.canvasHeight - getMenuHeight(items, 16)) + 'px',
                }}
              />
            )
          },
          style: props.style,
        },
        transform,
      })}
      {contextMenu}
      {dragSelectMask}
      {moveCanvasMask}
      {chooseFileUI}
      <Cursor ref={ref} onKeyDown={onKeyDown} />
    </div>
  )
}

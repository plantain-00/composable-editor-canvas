import React from "react"
import { produce } from 'immer'
import { PathOptions, ReactRenderTarget, reactCanvasRenderTarget } from "./react-render-target"
import { Menu, MenuItem } from "./menu"
import { useDragMove } from "./use-drag-move"
import { useWheelScroll } from "./use-wheel-scroll"
import { useWheelZoom } from "./use-wheel-zoom"
import { Transform, reverseTransformPosition, scaleByCursorPosition, transformPosition, zoomToFitPoints } from "../utils/transform"
import { bindMultipleRefs } from "../utils/ref"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useZoom } from "./use-zoom"
import { useDragSelect } from "./use-drag-select"
import { Position } from "../utils/position"
import { Region, TwoPointsFormRegion, getPolygonFromTwoPointsFormRegion, getTwoPointsFormRegion, getTwoPointsFormRegionSize } from "../utils/region"
import { blobToDataUrl, dataUrlToImage, createCanvasContext } from "../utils/blob"
import { pointInPolygon } from "../utils/line"
import { getPointsBounding } from "../utils/bounding"
import { getNumberRangeUnion, isBetween, mergeItems, setArrayItems } from "../utils/math"
import { useChooseFile } from "./use-create/use-image-click-create"
import { useUndoRedo } from "./use-undo-redo"
import { Cursor } from "./cursor"
import { Button, NumberEditor, StringEditor } from "./react-composable-json-editor"
import { Vec4 } from "../utils/types"
import { colorNumberToPixelColor, getColorString } from "../utils/color"
import { useCircleClickCreate } from "./use-create/use-circle-click-create"
import { arcToPolyline, circleToArc } from "../utils/circle"
import { useEllipseClickCreate } from "./use-create/use-ellipse-click-create"
import { ellipseArcToPolyline, ellipseToEllipseArc } from "../utils/ellipse"
import { useLineClickCreate } from "./use-create/use-line-click-create"
import { usePenClickCreate } from "./use-create/use-pen-click-create"
import { SimpleTextEditor } from "./simple-text-editor"
import { flowLayout } from "../utils/flow-layout"
import { getTextSizeFromCache, getTextStyleFont, isWordCharactor } from "../utils/text"
import { getTextComposition } from "./use-flow-layout-text-editor"
import { angleToRadian } from "../utils/radian"

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
  const [status, setStatus] = React.useState<'select' | 'move' | 'paste' | 'brush' | 'circle select' | 'ellipse select' | 'polygon select' | 'pen select' | 'add image' | 'add text' | 'add circle' | 'add ellipse' | 'add polyline' | 'add pen' | 'add rect'>('select')
  const [selection, setSelection] = React.useState<Selection>()
  const [previewOffset, setPreviewOffset] = React.useState<Position>()
  const ref = React.useRef<HTMLInputElement | null>(null)
  const [brushSize, setBrushSize] = React.useState(10)
  const colorRef = React.useRef(0)
  const opacityRef = React.useRef(0.5)
  const fontSizeRef = React.useRef(20)
  const fontFamilyRef = React.useRef('monospace')
  const strokeWidthRef = React.useRef(1)
  const [text, setText] = React.useState<{ text: string } & Region>()

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
      start = reverseTransform(start)
      end = reverseTransform(end)
      const region = getTwoPointsFormRegion(start, end)
      if (status === 'add text') {
        setText({
          ...region.start,
          ...getTwoPointsFormRegionSize(region),
          text: '',
        })
        return
      }
      const points = getPolygonFromTwoPointsFormRegion(region)
      setSelection({ type: 'polygon', points })
      focus()
    }
  })
  const closeContextMenu = () => {
    setContextMenu(undefined)
    focus()
  }
  const reset = (saveCurrent = true) => {
    setStatus('select')
    closeContextMenu()
    resetDragMove()
    resetDragSelect()
    setSelection(undefined)
    setPreviewImage(undefined)
    setPreviewOffset(undefined)
    resetCircle()
    resetEllipse()
    resetPolygon(saveCurrent)
    resetPen()
    setText(undefined)
  }
  const { start: chooseFile, ui: chooseFileUI } = useChooseFile(async file => {
    const base64 = await blobToDataUrl(file)
    if (status === 'add image') {
      const imageElement = await dataUrlToImage(base64, 'anonymous')
      const ctx = createCanvasContext(imageElement)
      if (ctx) {
        ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height)
        setPreviewImage({ url: base64, ctx })
      }
      setStatus('paste')
      return
    }
    await loadUrl(base64)
  })
  const { circle, onClick: onCircleClick, onMove: onCircleMove, reset: resetCircle } = useCircleClickCreate(status === 'circle select' || status === 'add circle' ? 'center radius' : undefined, c => {
    if (status === 'add circle') {
      drawStroke(ctx => {
        ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI)
      })
      return
    }
    const points = arcToPolyline(circleToArc(c), 10).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
    setSelection({ type: 'polygon', points })
    focus()
  })
  const { ellipse, onClick: onEllipseClick, onMove: onEllipseMove, reset: resetEllipse } = useEllipseClickCreate(status === 'ellipse select' || status === 'add ellipse' ? 'ellipse center' : undefined, c => {
    if (status === 'add ellipse') {
      drawStroke(ctx => {
        ctx.ellipse(c.cx, c.cy, c.rx, c.ry, angleToRadian(c.angle), 0, 2 * Math.PI)
      })
      return
    }
    const points = ellipseArcToPolyline(ellipseToEllipseArc(c), 10).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
    setSelection({ type: 'polygon', points })
    focus()
  })
  const { line: polygon, onClick: onPolygonClick, onMove: onPolygonMove, reset: resetPolygon } = useLineClickCreate(status === 'polygon select' || status === 'add polyline' || status === 'add rect', c => {
    if (status === 'add polyline') {
      drawStroke(ctx => {
        for (let i = 0; i < c.length; i++) {
          if (i === 0) {
            ctx.moveTo(c[i].x, c[i].y)
          } else {
            ctx.lineTo(c[i].x, c[i].y)
          }
        }
      })
      return
    }
    if (status === 'add rect') {
      const region = getTwoPointsFormRegion(c[0], c[1])
      const size = getTwoPointsFormRegionSize(region)
      drawStroke(ctx => {
        ctx.rect(region.start.x, region.start.y, size.width, size.height)
      })
      return
    }
    if (c.length > 2) {
      const points = c.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
      setSelection({ type: 'polygon', points })
    }
    focus()
  }, { once: status === 'add rect' })
  const { points: pen, onClick: onPenClick, onMove: onPenMove, reset: resetPen } = usePenClickCreate(status === 'pen select' || status === 'add pen', () => {
    if (status === 'add pen') {
      drawStroke(ctx => {
        for (let i = 0; i < pen.length; i++) {
          if (i === 0) {
            ctx.moveTo(pen[i].x, pen[i].y)
          } else {
            ctx.lineTo(pen[i].x, pen[i].y)
          }
        }
      })
      return
    }
    const points = pen.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))
    setSelection({ type: 'polygon', points })
    focus()
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
          setSelection({ type: 'polygon', points })
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
    p.x = Math.floor(p.x)
    p.y = Math.floor(p.y)
    return p
  }
  const target: ReactRenderTarget<unknown> = reactCanvasRenderTarget
  const children: ReturnType<typeof target.renderGroup>[] = []
  children.push(target.renderImage(image.url, 0, 0, image.ctx.canvas.width, image.ctx.canvas.height))
  if (previewImage && previewOffset) {
    children.push(target.renderImage(previewImage.url, previewOffset.x, previewOffset.y, previewImage.ctx.canvas.width, previewImage.ctx.canvas.height))
  }
  const pathOptions: Partial<PathOptions<unknown>> = { strokeWidth: 0, fillColor: 0x000000, fillOpacity: 0.3 }
  const strokePathOptions: Partial<PathOptions<unknown>> = { strokeWidth: strokeWidthRef.current, strokeColor: colorRef.current, strokeOpacity: opacityRef.current }
  if (selection?.type === 'polygon') {
    children.push(target.renderPolygon(selection.points, pathOptions))
  }
  if (selection?.type === 'range') {
    for (const range of selection.ranges) {
      for (const y of range.ys) {
        children.push(target.renderRect(range.x, y[0], 1, y[1] - y[0] + 1, pathOptions))
      }
    }
  } else if (status === 'brush' && previewOffset) {
    children.push(target.renderRect(previewOffset.x, previewOffset.y, 2 * brushSize + 1, 2 * brushSize + 1, pathOptions))
  }
  if (circle) {
    children.push(target.renderCircle(circle.x, circle.y, circle.r, status === 'add circle' ? strokePathOptions : pathOptions))
  }
  if (ellipse) {
    children.push(target.renderEllipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, { ...(status === 'add ellipse' ? strokePathOptions : pathOptions), angle: ellipse.angle }))
  }
  if (polygon) {
    if (status === 'add polyline' && polygon.length > 1) {
      children.push(target.renderPolyline(polygon, strokePathOptions))
    } else if (status === 'add rect' && polygon.length > 1) {
      const region = getTwoPointsFormRegion(polygon[0], polygon[1])
      const size = getTwoPointsFormRegionSize(region)
      children.push(target.renderRect(region.start.x, region.start.y, size.width, size.height, strokePathOptions))
    } else if (status === 'polygon select' && polygon.length > 2) {
      children.push(target.renderPolygon(polygon, pathOptions))
    }
  }
  if (pen) {
    if (status === 'add pen' && pen.length > 1) {
      children.push(target.renderPolyline(pen, strokePathOptions))
    } else if (status === 'pen select' && pen.length > 2) {
      children.push(target.renderPolygon(pen, pathOptions))
    }
  }
  children.push(target.renderRect(0, 0, image.ctx.canvas.width, image.ctx.canvas.height, { strokeOpacity: 0.3, dashArray: [4] }))
  const setSelectionValue = (getValue: (v: Uint8ClampedArray) => Vec4) => {
    let inRange: ((x: number) => ((y: number) => boolean | undefined) | undefined) | undefined
    if (selection?.type === 'polygon') {
      inRange = x => y => pointInPolygon({ x, y }, selection.points)
    } else if (selection?.type === 'range') {
      inRange = x => {
        const range = selection.ranges.find(r => r.x === x)
        if (!range) return
        return y => range.ys.some(c => isBetween(y, ...c))
      }
    }
    if (inRange) {
      const imageData = image.ctx.getImageData(0, 0, image.ctx.canvas.width, image.ctx.canvas.height)
      for (let i = 0; i < image.ctx.canvas.width; i++) {
        const range = inRange(i)
        if (!range) continue
        if (!isBetween(i, 0, imageData.width)) continue
        for (let j = 0; j < image.ctx.canvas.height; j++) {
          if (!isBetween(j, 0, imageData.height)) continue
          if (range(j)) {
            const index = (i + j * imageData.width) * 4
            setArrayItems(imageData.data, index, getValue(imageData.data.slice(index, index + 4)))
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
  const deleteSelection = () => {
    setSelectionValue(() => [0, 0, 0, 0])
  }
  const copySelection = () => {
    let selectionData: { bounding?: TwoPointsFormRegion, inRange: (x: number) => ((y: number) => boolean | undefined) | undefined } | undefined
    if (selection?.type === 'polygon') {
      selectionData = {
        bounding: getPointsBounding(selection.points),
        inRange: x => y => pointInPolygon({ x, y }, selection.points),
      }
    } else if (selection?.type === 'range') {
      const rows = selection.ranges.map(r => r.x)
      selectionData = {
        bounding: {
          start: {
            x: Math.min(...rows),
            y: Math.min(...selection.ranges.map(r => r.ys.map(c => c[0])).flat()),
          },
          end: {
            x: Math.max(...rows),
            y: Math.max(...selection.ranges.map(r => r.ys.map(c => c[1])).flat()),
          },
        },
        inRange: x => {
          const range = selection.ranges.find(r => r.x === x)
          if (!range) return
          return y => range.ys.some(c => isBetween(y, ...c))
        },
      }
    }
    if (selectionData) {
      const bounding = selectionData.bounding
      if (bounding) {
        const size = getTwoPointsFormRegionSize(bounding)
        size.width++
        size.height++
        const ctx = createCanvasContext(size)
        if (ctx) {
          const imageData = ctx.createImageData(size.width, size.height)
          const minX = bounding.start.x, minY = bounding.start.y
          const oldImageData = image.ctx.getImageData(0, 0, image.ctx.canvas.width, image.ctx.canvas.height)
          for (let i = 0; i < imageData.width; i++) {
            const x = i + minX
            const range = selectionData.inRange(x)
            if (!range) continue
            if (!isBetween(x, 0, oldImageData.width)) continue
            for (let j = 0; j < imageData.height; j++) {
              const y = j + minY
              if (!isBetween(y, 0, oldImageData.height)) continue
              if (range(y)) {
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
  const openClipboardImage = async () => {
    const items = await navigator.clipboard.read()
    for (const item of items) {
      if (item.types.includes('image/png')) {
        const blob = await item.getType('image/png')
        const base64 = await blobToDataUrl(blob)
        await loadUrl(base64)
        break
      }
    }
  }
  const drawStroke = (setPath: (ctx: CanvasRenderingContext2D) => void) => {
    image.ctx.save()
    image.ctx.beginPath()
    setPath(image.ctx)
    image.ctx.lineWidth = strokeWidthRef.current
    image.ctx.strokeStyle = getColorString(colorRef.current, opacityRef.current)
    image.ctx.stroke()
    image.ctx.restore()
    setState(draft => {
      if (draft) {
        draft.url = image.ctx.canvas.toDataURL()
      }
    })
    reset(false)
  }

  let textEditor: JSX.Element | undefined
  if (status === 'add text' && text) {
    const p = transformPosition(text, transform)
    textEditor = (
      <SimpleTextEditor
        fontSize={fontSizeRef.current * scale}
        width={text.width * scale}
        height={text.height * scale}
        color={colorRef.current}
        fontFamily={fontFamilyRef.current}
        onCancel={reset}
        x={p.x}
        y={p.y}
        value={text.text}
        setValue={v => {
          text.text = v
        }}
      />
    )
  }
  return (
    <div
      ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)}
      style={{ cursor: status === 'move' ? 'grab' : 'crosshair', position: 'absolute', inset: '0px', left: image.x + 'px', top: image.y + 'px', overflow: 'hidden' }}
      onMouseMove={e => {
        if (status === 'brush') {
          const p = reverseTransform({ x: e.clientX, y: e.clientY })
          if (selection?.type === 'range') {
            const ranges = getBrushRectRanges(p, brushSize)
            setSelection({
              type: 'range',
              ranges: produce(selection.ranges, draft => {
                for (const range of ranges) {
                  const oldRange = draft.find(d => d.x === range.x)
                  if (oldRange) {
                    oldRange.ys = mergeItems([...range.ys, ...oldRange.ys], getNumberRangeUnion)
                  } else {
                    draft.push(range)
                  }
                }
              }),
            })
          } else {
            setPreviewOffset({ x: p.x - brushSize, y: p.y - brushSize })
          }
        }
        if (previewImage && status === 'paste') {
          const p = reverseTransform({ x: e.clientX, y: e.clientY })
          setPreviewOffset({ x: Math.floor(p.x - previewImage.ctx.canvas.width / 2), y: Math.floor(p.y - previewImage.ctx.canvas.height / 2) })
        } else if (status === 'circle select' || status === 'add circle') {
          onCircleMove(reverseTransform({ x: e.clientX, y: e.clientY }))
        } else if (status === 'ellipse select' || status === 'add ellipse') {
          onEllipseMove(reverseTransform({ x: e.clientX, y: e.clientY }))
        } else if (status === 'polygon select' || status === 'add polyline' || status === 'add rect') {
          onPolygonMove(reverseTransform({ x: e.clientX, y: e.clientY }))
        } else if (status === 'pen select' || status === 'add pen') {
          onPenMove(reverseTransform({ x: e.clientX, y: e.clientY }))
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
            } else if (status === 'brush') {
              if (selection?.type !== 'range') {
                const p = reverseTransform({ x: e.clientX, y: e.clientY })
                const ranges = getBrushRectRanges(p, brushSize)
                setSelection({ type: 'range', ranges })
              }
            }
          },
          onClick(e) {
            if (status === 'select') {
              onStartSelect(e)
            } else if (status === 'paste' && previewImage && previewOffset) {
              const imageData = image.ctx.getImageData(0, 0, image.ctx.canvas.width, image.ctx.canvas.height)
              const previewImageData = previewImage.ctx.getImageData(0, 0, previewImage.ctx.canvas.width, previewImage.ctx.canvas.height)
              const x0 = Math.floor(previewOffset.x), y0 = Math.floor(previewOffset.y)
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
            } else if (status === 'brush' && selection?.type === 'range') {
              const ranges = selection.ranges
              reset()
              setSelection({ type: 'range', ranges })
            } else if (status === 'circle select' || status === 'add circle') {
              onCircleClick(reverseTransform({ x: e.clientX, y: e.clientY }))
            } else if (status === 'ellipse select' || status === 'add ellipse') {
              onEllipseClick(reverseTransform({ x: e.clientX, y: e.clientY }))
            } else if (status === 'polygon select' || status === 'add polyline' || status === 'add rect') {
              onPolygonClick(reverseTransform({ x: e.clientX, y: e.clientY }))
              focus()
            } else if (status === 'pen select' || status === 'add pen') {
              onPenClick(reverseTransform({ x: e.clientX, y: e.clientY }))
            } else if (status === 'add text') {
              if (!text) {
                onStartSelect(e)
              } else if (text.text) {
                const state = text.text.split('')
                const font = getTextStyleFont({ fontSize: fontSizeRef.current, fontFamily: fontFamilyRef.current })
                const getTextWidth = (text: string) => getTextSizeFromCache(font, text)?.width ?? 0
                const { layoutResult } = flowLayout({
                  state,
                  width: text.width,
                  lineHeight: fontSizeRef.current * 1.2,
                  getWidth: getTextWidth,
                  endContent: '',
                  isNewLineContent: c => c === '\n',
                  isPartOfComposition: c => isWordCharactor(c),
                  getComposition: (index: number) => getTextComposition(index, state, getTextWidth, c => c),
                })
                image.ctx.save()
                image.ctx.font = font
                image.ctx.textAlign = 'center'
                image.ctx.textBaseline = 'alphabetic'
                image.ctx.fillStyle = getColorString(colorRef.current)
                for (const { x, y, content } of layoutResult) {
                  const textWidth = getTextWidth(content)
                  image.ctx.fillText(content, text.x + x + textWidth / 2, text.y + y + fontSizeRef.current)
                }
                image.ctx.restore()
                setState(draft => {
                  if (draft) {
                    draft.url = image.ctx.canvas.toDataURL()
                  }
                })
                reset()
              }
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
              children: [
                {
                  title: 'file',
                  onClick() {
                    chooseFile()
                    closeContextMenu()
                  },
                },
                {
                  title: 'clipboard image',
                  async onClick() {
                    await openClipboardImage()
                    closeContextMenu()
                  },
                },
              ]
            })
            const edits: MenuItem[] = []
            if (canUndo) {
              edits.push({
                title: 'undo',
                onClick() {
                  undo()
                  closeContextMenu()
                },
              })
            }
            if (canRedo) {
              edits.push({
                title: 'redo',
                onClick() {
                  redo()
                  closeContextMenu()
                },
              })
            }
            edits.push({
              title: 'move',
              onClick: () => {
                setStatus('move')
                closeContextMenu()
              },
            })
            items.push({
              title: 'select',
              children: [
                {
                  title: (
                    <>
                      <NumberEditor
                        value={brushSize}
                        style={{ width: '50px' }}
                        setValue={setBrushSize}
                      />
                      <Button
                        onClick={() => {
                          setStatus('brush')
                          closeContextMenu()
                          setSelection(undefined)
                        }}
                      >brush select</Button>
                    </>
                  ),
                  height: 41,
                },
                {
                  title: 'circle select',
                  onClick: () => {
                    setStatus('circle select')
                    closeContextMenu()
                  },
                },
                {
                  title: 'ellipse select',
                  onClick: () => {
                    setStatus('ellipse select')
                    closeContextMenu()
                  },
                },
                {
                  title: 'polygon select',
                  onClick: () => {
                    setStatus('polygon select')
                    closeContextMenu()
                  },
                },
                {
                  title: 'pen select',
                  onClick: () => {
                    setStatus('pen select')
                    closeContextMenu()
                  },
                },
              ]
            })
            if (selection) {
              edits.push(
                {
                  title: 'delete',
                  onClick() {
                    deleteSelection()
                    closeContextMenu()
                  },
                },
                {
                  title: (
                    <>
                      <NumberEditor
                        value={colorRef.current}
                        type='color'
                        style={{ width: '50px' }}
                        setValue={v => colorRef.current = v}
                      />
                      <Button
                        onClick={() => {
                          const vec = colorNumberToPixelColor(colorRef.current)
                          setSelectionValue(v => [vec[0], vec[1], vec[2], v[3]])
                          closeContextMenu()
                        }}
                      >apply color</Button>
                    </>
                  ),
                  height: 33,
                },
                {
                  title: (
                    <>
                      <NumberEditor
                        value={opacityRef.current * 100}
                        style={{ width: '50px' }}
                        setValue={v => opacityRef.current = v * 0.01}
                      />
                      <Button
                        onClick={() => {
                          const opacity = Math.round(opacityRef.current * 255)
                          setSelectionValue(v => [v[0], v[1], v[2], opacity])
                          closeContextMenu()
                        }}
                      >apply opacity</Button>
                    </>
                  ),
                  height: 41,
                },
                {
                  title: 'cut',
                  onClick() {
                    copySelection()
                    deleteSelection()
                    closeContextMenu()
                  },
                },
                {
                  title: 'copy',
                  onClick() {
                    copySelection()
                    closeContextMenu()
                  },
                },
              )
            }
            items.push({
              title: 'edit',
              children: edits,
            })
            items.push({
              title: 'add',
              children: [
                {
                  title: 'paste',
                  async onClick() {
                    await paste()
                    closeContextMenu()
                  },
                },
                {
                  title: 'image',
                  onClick() {
                    setStatus('add image')
                    chooseFile()
                    closeContextMenu()
                  },
                },
                {
                  title: <>
                    <NumberEditor
                      value={fontSizeRef.current}
                      style={{ width: '40px' }}
                      setValue={v => fontSizeRef.current = v}
                    />
                    <StringEditor
                      value={fontFamilyRef.current}
                      style={{ width: '100px' }}
                      setValue={v => fontFamilyRef.current = v}
                    />
                    <Button
                      onClick={() => {
                        setStatus('add text')
                        closeContextMenu()
                      }}
                    >text</Button>
                  </>,
                  height: 41,
                },
                {
                  title: <>
                    <NumberEditor
                      value={colorRef.current}
                      type='color'
                      style={{ width: '50px' }}
                      setValue={v => colorRef.current = v}
                    />
                    <NumberEditor
                      value={opacityRef.current * 100}
                      style={{ width: '50px' }}
                      setValue={v => opacityRef.current = v * 0.01}
                    />
                    <NumberEditor
                      value={strokeWidthRef.current}
                      style={{ width: '40px' }}
                      setValue={v => strokeWidthRef.current = v}
                    />
                  </>,
                  height: 41,
                },
                {
                  title: 'polyline',
                  onClick() {
                    setStatus('add polyline')
                    closeContextMenu()
                  },
                },
                {
                  title: 'pen',
                  onClick() {
                    setStatus('add pen')
                    closeContextMenu()
                  },
                },
                {
                  title: 'circle',
                  onClick() {
                    setStatus('add circle')
                    closeContextMenu()
                  },
                },
                {
                  title: 'ellipse',
                  onClick() {
                    setStatus('add ellipse')
                    closeContextMenu()
                  },
                },
                {
                  title: 'rect',
                  onClick() {
                    setStatus('add rect')
                    closeContextMenu()
                  },
                },
              ]
            })
            items.push({
              title: 'export',
              children: [
                {
                  title: 'to clipboard',
                  onClick() {
                    image.ctx.canvas.toBlob(blob => {
                      if (blob) {
                        navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                      }
                    })
                    closeContextMenu()
                    setSelection(undefined)
                  }
                }
              ],
            })
            setContextMenu(
              <Menu
                items={items}
                y={viewportPosition.y}
                height={image.canvasHeight}
                style={{
                  left: viewportPosition.x + 'px',
                }}
              />
            )
          },
          style: props.style,
        },
        transform,
      })}
      {textEditor}
      {contextMenu}
      {dragSelectMask}
      {moveCanvasMask}
      {chooseFileUI}
      <Cursor ref={ref} onKeyDown={onKeyDown} />
    </div>
  )
}

function getBrushRectRanges({ x, y }: Position, size: number) {
  const ranges: SelectionRange[] = []
  for (let i = -size; i <= size; i++) {
    ranges.push({ x: x + i, ys: [[y - size, y + size]] })
  }
  return ranges
}

type Selection = {
  type: 'polygon'
  points: Position[]
} | {
  type: 'range'
  ranges: SelectionRange[]
}

interface SelectionRange {
  x: number
  ys: [number, number][]
}

import React from "react"
import { CanvasDraw, reactCanvasRenderTarget } from "./react-render-target"
import { Menu, MenuItem, getMenuHeight } from "./menu"
import { useDragMove } from "./use-drag-move"
import { useWheelScroll } from "./use-wheel-scroll"
import { useWheelZoom } from "./use-wheel-zoom"
import { Transform, scaleByCursorPosition } from "../utils/transform"
import { bindMultipleRefs } from "../utils/ref"
import { useGlobalKeyDown } from "./use-global-keydown"
import { metaKeyIfMacElseCtrlKey } from "../utils/key"
import { useZoom } from "./use-zoom"

export function ImageEditor(props: {
  src: string
  width: number
}) {
  const [contextMenu, setContextMenu] = React.useState<JSX.Element>()
  const [status, setStatus] = React.useState<'select' | 'move'>('select')
  const [height, setHeight] = React.useState(0)

  React.useEffect(() => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      setHeight(width / image.width * image.height)
    }
    image.src = props.src
  }, [])
  const { x, y, ref: wheelScrollRef, setX, setY } = useWheelScroll<HTMLDivElement>()
  const { scale, setScale, ref: wheelZoomRef } = useWheelZoom<HTMLDivElement>({
    onChange(oldScale, newScale, cursor) {
      const result = scaleByCursorPosition({ width, height }, newScale / oldScale, cursor)
      setX(result.setX)
      setY(result.setY)
    }
  })
  const { zoomIn, zoomOut } = useZoom(scale, setScale)
  const { offset, onStart: onStartMoveCanvas, mask: moveCanvasMask, resetDragMove } = useDragMove(() => {
    setX((v) => v + offset.x)
    setY((v) => v + offset.y)
  })
  useGlobalKeyDown(e => {
    if (metaKeyIfMacElseCtrlKey(e)) {
      if (e.code === 'Minus') {
        zoomOut(e)
      } else if (e.code === 'Equal') {
        zoomIn(e)
      } else if (e.key === 'ArrowLeft') {
        setX((v) => v + width / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        setX((v) => v - width / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        setY((v) => v + height / 10)
        e.preventDefault()
      } else if (e.key === 'ArrowDown') {
        setY((v) => v - height / 10)
        e.preventDefault()
      }
    } else if (e.key === 'Escape') {
      setStatus('select')
      setContextMenu(undefined)
      resetDragMove()
    }
  })

  const width = props.width
  const transform: Transform = {
    x,
    y,
    scale,
    center: {
      x: width / 2,
      y: height / 2,
    },
  }
  transform.x += offset.x
  transform.y += offset.y
  const children: CanvasDraw[] = []
  children.push(reactCanvasRenderTarget.renderImage(props.src, 0, 0, width, height))

  return (
    <div ref={bindMultipleRefs(wheelScrollRef, wheelZoomRef)} style={{ cursor: status === 'move' ? 'grab' : 'crosshair', position: 'absolute', inset: '0px', overflow: 'hidden' }}>
      {reactCanvasRenderTarget.renderResult(children, width, height, {
        attributes: {
          onMouseDown(e) {
            if (status === 'move') {
              onStartMoveCanvas({ x: e.clientX, y: e.clientY })
            } else if (e.buttons === 4) {
              onStartMoveCanvas({ x: e.clientX, y: e.clientY })
            }
          },
          onContextMenu(e) {
            e.preventDefault()
            const viewportPosition = { x: e.clientX, y: e.clientY }
            if (contextMenu) {
              setContextMenu(undefined)
              return
            }
            const items: MenuItem[] = (['select', 'move',] as const).map(s => ({
              title: s,
              onClick: () => {
                setStatus(s)
                setContextMenu(undefined)
              },
            }))
            setContextMenu(
              <Menu
                items={items}
                style={{
                  left: viewportPosition.x + 'px',
                  top: Math.min(viewportPosition.y, height - getMenuHeight(items, 16)) + 'px',
                }}
              />
            )
          },
        },
        transform,
      })}
      {contextMenu}
      {moveCanvasMask}
    </div>
  )
}

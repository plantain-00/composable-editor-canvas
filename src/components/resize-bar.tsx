import * as React from "react"

export function ResizeBar(props: {
  scale: number
  resizeSize?: number
  directions?: ResizeDirection[]
  onMouseDown: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: ResizeDirection) => void
}) {
  const { scale, resizeSize } = props
  const width = (resizeSize ?? 5) / scale
  const border = 1 / scale
  const leftTop = width / 2
  const rightBottom = width / 2 - border
  const directions = props.directions ?? ['left', 'right', 'top', 'bottom', 'left-bottom', 'left-top', 'right-top', 'right-bottom']
  const bars: { style: React.CSSProperties, direction: ResizeDirection }[] = []
  if (directions.includes('left-top')) {
    bars.push({
      direction: 'left-top',
      style: {
        left: -leftTop + 'px',
        top: -leftTop + 'px',
        cursor: 'nw-resize',
      },
    })
  }
  if (directions.includes('left-bottom')) {
    bars.push({
      direction: 'left-bottom',
      style: {
        left: -leftTop + 'px',
        bottom: -rightBottom + 'px',
        cursor: 'sw-resize',
      },
    },)
  }
  if (directions.includes('right-top')) {
    bars.push({
      direction: 'right-top',
      style: {
        right: -rightBottom + 'px',
        top: -leftTop + 'px',
        cursor: 'ne-resize',
      },
    })
  }
  if (directions.includes('right-bottom')) {
    bars.push({
      direction: 'right-bottom',
      style: {
        right: -rightBottom + 'px',
        bottom: -rightBottom + 'px',
        cursor: 'se-resize',
      },
    })
  }
  if (directions.includes('left')) {
    bars.push({
      direction: 'left',
      style: {
        left: -leftTop + 'px',
        top: `calc(50% - ${leftTop}px)`,
        cursor: 'w-resize',
      },
    })
  }
  if (directions.includes('right')) {
    bars.push({
      direction: 'right',
      style: {
        top: `calc(50% - ${leftTop}px)`,
        right: -rightBottom + 'px',
        cursor: 'e-resize',
      },
    })
  }
  if (directions.includes('top')) {
    bars.push({
      direction: 'top',
      style: {
        left: `calc(50% - ${leftTop}px)`,
        top: -leftTop + 'px',
        cursor: 'n-resize',
      },
    })
  }
  if (directions.includes('bottom')) {
    bars.push({
      direction: 'bottom',
      style: {
        left: `calc(50% - ${leftTop}px)`,
        bottom: -rightBottom + 'px',
        cursor: 's-resize',
      },
    })
  }

  return (
    <>
      {bars.map((s, i) => (
        <div
          key={i}
          style={{
            width: width + 'px',
            height: width + 'px',
            border: `${border}px solid green`,
            position: 'absolute',
            backgroundColor: 'white',
            boxSizing: 'border-box',
            pointerEvents: 'auto',
            ...s.style,
          }}
          onMouseDown={(e) => {
            props.onMouseDown(e, s.direction)
          }}
        />
      ))}
    </>
  )
}

export type ResizeDirection = `${'left' | 'right'}-${'top' | 'bottom'}` | "left" | "right" | "top" | "bottom"

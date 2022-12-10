import * as React from "react"
import { useDragMove } from "./use-drag-move"

/**
 * @public
 */
export function Scrollbar(props: {
  value: number
  type: 'horizontal' | 'vertical'
  contentSize: number
  containerSize: number
  align?: 'head' | 'center' | 'tail'
  onChange: (value: number) => void
  style?: React.CSSProperties
}) {
  const { type, containerSize, contentSize } = props

  const { onStart, mask } = useDragMove(undefined, {
    transformOffset: ({ x, y }) => {
      const newOffset = Math.max(Math.min(type === 'vertical' ? y : x, containerSize - scrollbarSize), 0)
      if (newOffset !== offset) {
        props.onChange((newOffset - alignOffset) * scale)
      }
      return { x, y }
    }
  })

  if (containerSize >= contentSize) {
    return null
  }

  // 滚动条尺寸
  const scrollbarSize = Math.max(12, contentSize ? containerSize * containerSize / contentSize : 0)
  const alignOffset = (containerSize / 2 - scrollbarSize / 2) * (props.align === 'head' ? 0 : props.align === 'tail' ? 2 : 1)
  // 内容移动距离与滚动条滚动距离的比例，根据滚动到底时内容移动的距离来算
  const scale = -(contentSize - containerSize) / (containerSize - scrollbarSize)
  // 相对上、左，滚动条滚动距离
  const offset = props.value / scale + alignOffset

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    userSelect: 'none',
    ...props.style,
  }
  const barStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    position: 'absolute',
    cursor: 'grab',
  }
  if (type === 'vertical') {
    containerStyle.width = '8px'
    containerStyle.height = `${containerSize}px`
    containerStyle.right = '0px'
    containerStyle.top = '0px'

    barStyle.width = '8px'
    barStyle.height = `${scrollbarSize}px`
    barStyle.top = `${offset}px`
  } else {
    containerStyle.height = '8px'
    containerStyle.width = `${containerSize}px`
    containerStyle.left = '0px'
    containerStyle.bottom = '0px'

    barStyle.height = '8px'
    barStyle.width = `${scrollbarSize}px`
    barStyle.left = `${offset}px`
  }

  return (
    <div style={containerStyle} >
      <div
        style={barStyle}
        onMouseDown={(e) => onStart({ x: e.clientX, y: e.clientY }, { [type === 'vertical' ? 'y' : 'x']: offset })}
      >
      </div>
      {mask}
    </div>
  )
}

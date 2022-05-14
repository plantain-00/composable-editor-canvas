import * as React from "react"

export function AlignmentLine(props: {
  value?: number
  type: 'x' | 'y'
  transformX?: (p: number) => number
  transformY?: (p: number) => number
  style?: React.CSSProperties
}) {
  if (props.value === undefined) {
    return null
  }
  const style: React.CSSProperties = {
    position: 'absolute',
    ...props.style,
  }
  if (props.type === 'x') {
    style.borderLeft = '1px dashed black'
    style.left = (props.transformX?.(props.value) ?? props.value) + 'px'
    style.top = '0px'
    style.width = '1px'
    style.height = '100%'
  } else {
    style.borderTop = '1px dashed black'
    style.top = (props.transformY?.(props.value) ?? props.value) + 'px'
    style.left = '0px'
    style.width = '100%'
    style.height = '1px'
  }

  return (
    <div style={style} />
  )
}

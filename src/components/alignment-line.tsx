import * as React from "react"

import { reverseTransformX, reverseTransformY, Transform } from ".."

export function AlignmentLine(props: {
  value?: number
  type: 'x' | 'y'
  transform?: Transform
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
    style.left = reverseTransformX(props.value, props.transform) + 'px'
    style.top = '0px'
    style.width = '1px'
    style.height = '100%'
  } else {
    style.borderTop = '1px dashed black'
    style.top = reverseTransformY(props.value, props.transform) + 'px'
    style.left = '0px'
    style.width = '100%'
    style.height = '1px'
  }

  return (
    <div style={style} />
  )
}

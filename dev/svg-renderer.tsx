import React from 'react'

import { Content } from './util-2'

export function SvgRenderer(props: {
  contents: Content[]
  drawingContent?: Content
  selectedContents: number[]
  hoveringContent: number
  onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
}) {
  const drawContent = (content: Content, index?: number) => {
    let color = '#00ff00'
    if (index !== undefined) {
      if (props.selectedContents.includes(index)) {
        color = '#ff0000'
      } else if (props.hoveringContent === index) {
        color = '#000000'
      }
    }
    if (content.type === 'circle') {
      return <circle key={index} stroke={color} cx={content.x} cy={content.y} r={content.r} />
    }
    if (content.type === 'polyline' || content.type === 'line') {
      return <polyline key={index} stroke={color} points={content.points.map((p) => `${p.x},${p.y}`).join(' ')} />
    }
    return null
  }

  return (
    <svg
      viewBox="0 0 800 600"
      width={800}
      height={600}
      xmlns="http://www.w3.org/2000/svg"
      onClick={props.onClick}
      fill='none'
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      {props.contents.map(drawContent)}
      {props.drawingContent && drawContent(props.drawingContent)}
    </svg>
  )
}

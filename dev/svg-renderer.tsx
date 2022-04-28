import React from 'react'
import { Content, getModel } from './model-2'

export function SvgRenderer(props: {
  contents: Content[]
  selectedContents: number[]
  hoveringContent: number
  onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
}) {
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
      {props.contents.map((content: Content, i: number) => {
        let color = '#00ff00'
        if (props.selectedContents.includes(i)) {
          color = '#ff0000'
        } else if (props.hoveringContent === i) {
          color = '#000000'
        }
        const ContentRender = getModel(content.type).renderSvg
        return <ContentRender key={i} content={content} stroke={color} />
      })}
    </svg>
  )
}

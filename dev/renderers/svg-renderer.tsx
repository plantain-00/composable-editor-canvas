import React from 'react'
import { BaseContent, getModel } from '../models/model'

export function SvgRenderer(props: {
  contents: BaseContent[]
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
      {props.contents.map((content, i) => {
        let color = '#00ff00'
        if (props.selectedContents.includes(i)) {
          color = '#ff0000'
        } else if (props.hoveringContent === i) {
          color = '#000000'
        }
        const ContentRender = getModel(content.type)?.renderSvg
        if (!ContentRender) {
          return null
        }
        return <ContentRender key={i} content={content} stroke={color} />
      })}
    </svg>
  )
}

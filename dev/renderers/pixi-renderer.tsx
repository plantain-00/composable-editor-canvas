import React from 'react'
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { BaseContent, getModel } from '../models/model'

export function PixiRenderer(props: {
  contents: BaseContent[]
  selectedContents: number[]
  hoveringContent: number
  onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
}) {
  return (
    <Stage
      onClick={props.onClick}
      options={{
        backgroundColor: 0xffffff,
      }}
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      {props.contents.map((content, i) => {
        let color = 0x00ff00
        if (props.selectedContents.includes(i)) {
          color = 0xff0000
        } else if (props.hoveringContent === i) {
          color = 0x000000
        }
        return <ContentRenderer key={i} content={content} color={color} />
      })}
    </Stage>
  )
}

function ContentRenderer(props: {
  content: BaseContent
  color: number
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    g.lineStyle(1, props.color)
    getModel(props.content.type)?.renderPixi(props.content, g)
  }, [props.content, props.color])

  return <Graphics draw={draw} />
}

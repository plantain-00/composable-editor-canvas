import React from 'react'
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'

import { Content } from './util-2'

export function PixiRenderer(props: {
  contents: Content[]
  drawingContent?: Content
  selectedContents: number[]
  hoveringContent: number
  onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
}) {
  const drawContent = (g: PIXI.Graphics, content: Content, index?: number) => {
    let color = 0x00ff00
    if (index !== undefined) {
      if (props.selectedContents.includes(index)) {
        color = 0xff0000
      } else if (props.hoveringContent === index) {
        color = 0x000000
      }
    }
    g.lineStyle(1, color)
    if (content.type === 'circle') {
      g.drawCircle(content.x, content.y, content.r)
    } else if (content.type === 'polyline' || content.type === 'line') {
      content.points.forEach((p, i) => {
        if (i === 0) {
          g.moveTo(p.x, p.y)
        } else {
          g.lineTo(p.x, p.y)
        }
      })
    }
  }
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    for (let i = 0; i < props.contents.length; i++) {
      drawContent(g, props.contents[i], i)
    }
    if (props.drawingContent) {
      drawContent(g, props.drawingContent)
    }
  }, [props.contents, props.drawingContent, props.hoveringContent, props.selectedContents])

  return (
    <Stage
      onClick={props.onClick}
      options={{
        backgroundColor: 0xffffff,
      }}
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      <Graphics draw={draw} />
    </Stage>
  )
}

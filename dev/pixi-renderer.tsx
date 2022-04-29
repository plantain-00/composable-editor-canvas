import React from 'react'
import { Stage, Graphics } from '@inlet/react-pixi'
import * as PIXI from 'pixi.js'
import { BaseContent, getModel } from './model-2'

export function PixiRenderer(props: {
  contents: BaseContent[]
  selectedContents: number[]
  hoveringContent: number
  onClick: (e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => void
}) {
  const draw = React.useCallback((g: PIXI.Graphics) => {
    g.clear()
    for (let i = 0; i < props.contents.length; i++) {
      const content = props.contents[i]
      let color = 0x00ff00
      if (props.selectedContents.includes(i)) {
        color = 0xff0000
      } else if (props.hoveringContent === i) {
        color = 0x000000
      }
      g.lineStyle(1, color)
      getModel(content.type)?.renderPixi(content, g)
    }
  }, [props.contents, props.hoveringContent, props.selectedContents])

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

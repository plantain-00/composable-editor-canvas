import React from 'react'
import { Position, useLineClickCreate } from '../../src'
import { getAngleSnap, Model } from './model'
import { getPolylineLines, LineContent, lineModel } from './line-model'

export const polylineModel: Model<LineContent> = {
  ...lineModel,
  type: 'polyline',
  explode(content) {
    const { lines } = getPolylineLines(content)
    return lines.map((line) => ({ type: 'line', points: line }))
  },
  useCreate(type, onEnd, angleSnapEnabled) {
    const [lineCreate, setLineCreate] = React.useState<{ points: Position[] }>()
    const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
      type === 'polyline',
      (c) => setLineCreate(c ? { points: c } : undefined),
      (c) => onEnd([{ points: c, type: 'polyline' }]),
      {
        getAngleSnap: angleSnapEnabled ? getAngleSnap : undefined,
      },
    )
    return {
      input: lineClickCreateInput,
      onClick: onLineClickCreateClick,
      onMove: onLineClickCreateMove,
      updatePreview(contents) {
        if (lineCreate) {
          contents.push({ points: lineCreate.points, type: 'polyline' })
        }
      },
    }
  },
}

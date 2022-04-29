import React from 'react'
import { Position, useLineClickCreate } from '../../src'
import { Model } from '../model-2'
import { LineContent, lineModel } from './line-model'

export const polylineModel: Model<LineContent> = {
  ...lineModel,
  useCreate(type, onEnd) {
    const [lineCreate, setLineCreate] = React.useState<{ points: Position[] }>()
    const { onLineClickCreateClick, onLineClickCreateMove, lineClickCreateInput } = useLineClickCreate(
      type === 'polyline',
      (c) => setLineCreate(c ? { points: c } : undefined),
      (c) => onEnd([{ points: c, type: 'polyline' }]),
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

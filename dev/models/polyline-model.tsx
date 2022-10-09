import { BaseContent, getEditPointsFromCache, getStrokeContentPropertyPanel, Model } from './model'
import { getPolylineEditPoints, getPolylineGeometries, LineContent, lineModel } from './line-model'
import React from 'react'
import { ArrayEditor, getArrayEditorProps, NumberEditor, ObjectEditor, Position } from '../../src'

export const polylineModel: Model<LineContent> = {
  ...lineModel,
  type: 'polyline',
  explode(content) {
    const { lines } = getPolylineGeometries(content)
    return lines.map((line) => ({ type: 'line', points: line } as LineContent))
  },
  render({ content, color, target, strokeWidth }) {
    return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth })
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => ({ editPoints: getPolylineEditPoints(content, isPolyLineContent) }))
  },
  canSelectPart: true,
  propertyPanel(content, update) {
    return {
      points: <ArrayEditor
        inline
        {...getArrayEditorProps<Position, typeof content>(v => v.points, { x: 0, y: 0 }, (v) => update(c => { if (isPolyLineContent(c)) { v(c) } }))}
        items={content.points.map((f, i) => <ObjectEditor
          inline
          properties={{
            x: <NumberEditor value={f.x} setValue={(v) => update(c => { if (isPolyLineContent(c)) { c.points[i].x = v } })} />,
            y: <NumberEditor value={f.y} setValue={(v) => update(c => { if (isPolyLineContent(c)) { c.points[i].y = v } })} />,
          }}
        />)}
      />,
      ...getStrokeContentPropertyPanel(content, update, isPolyLineContent),
    }
  },
}

export function isPolyLineContent(content: BaseContent): content is LineContent {
  return content.type === 'polyline'
}

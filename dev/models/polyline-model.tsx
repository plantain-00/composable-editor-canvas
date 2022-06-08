import { Position, ReactRenderTarget } from '../../src'
import { BaseContent, getEditPointsFromCache, Model } from './model'
import { getPolylineEditPoints, getPolylineLines, LineContent, lineModel } from './line-model'

export const polylineModel: Model<LineContent> = {
  ...lineModel,
  type: 'polyline',
  explode(content) {
    const { lines } = getPolylineLines(content)
    return lines.map((line) => ({ type: 'line', points: line } as LineContent))
  },
  render({ content, color, target, strokeWidth, partsStyles }) {
    return renderPolyline(target, content.points, color, content.dashArray, strokeWidth, partsStyles)
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => ({ editPoints: getPolylineEditPoints(content, isPolyLineContent) }))
  },
  canSelectPart: true,
}

export function isPolyLineContent(content: BaseContent): content is LineContent {
  return content.type === 'polyline'
}

export function renderPolyline<T>(
  target: ReactRenderTarget<T>,
  points: Position[],
  stroke: number,
  dashArray?: number[],
  strokeWidth?: number,
  partsStyles: readonly { index: number, color: number }[] = [],
) {
  if (partsStyles.length > 0) {
    const children: T[] = [
      target.renderPolyline(points, stroke, dashArray, strokeWidth, partsStyles.map((s) => s.index)),
      ...partsStyles.map(({ index, color }) => target.renderPolyline([points[index], points[index + 1]], color, dashArray, strokeWidth)),
    ]
    return target.renderGroup(children, 0, 0, { x: 0, y: 0 })
  }
  return target.renderPolyline(points, stroke, dashArray, strokeWidth)
}

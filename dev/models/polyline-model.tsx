import { BaseContent, getEditPointsFromCache, Model } from './model'
import { getPolylineEditPoints, getPolylineGeometries, LineContent, lineModel } from './line-model'

export const polylineModel: Model<LineContent> = {
  ...lineModel,
  type: 'polyline',
  explode(content) {
    const { lines } = getPolylineGeometries(content)
    return lines.map((line) => ({ type: 'line', points: line } as LineContent))
  },
  render({ content, color, target, strokeWidth, partsStyles }) {
    return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth, partsStyles })
  },
  getEditPoints(content) {
    return getEditPointsFromCache(content, () => ({ editPoints: getPolylineEditPoints(content, isPolyLineContent) }))
  },
  canSelectPart: true,
}

export function isPolyLineContent(content: BaseContent): content is LineContent {
  return content.type === 'polyline'
}

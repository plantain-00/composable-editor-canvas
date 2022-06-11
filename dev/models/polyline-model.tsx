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
    return renderPolyline(target, content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth, partsStyles })
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
  options?: Partial<{
    strokeColor: number,
    dashArray?: number[],
    strokeWidth?: number,
    partsStyles: readonly { index: number, color: number }[],
  }>,
) {
  const partsStyles = options?.partsStyles ?? []
  if (partsStyles.length > 0) {
    const children: T[] = [
      target.renderPolyline(points, { strokeColor: options?.strokeColor, dashArray: options?.dashArray, strokeWidth: options?.strokeWidth, skippedLines: partsStyles.map((s) => s.index) }),
      ...partsStyles.map(({ index, color }) => target.renderPolyline([points[index], points[index + 1]], { strokeColor: color, dashArray: options?.dashArray, strokeWidth: options?.strokeWidth })),
    ]
    return target.renderGroup(children)
  }
  return target.renderPolyline(points, { strokeColor: options?.strokeColor, dashArray: options?.dashArray, strokeWidth: options?.strokeWidth })
}

import { Position, ReactRenderTarget } from '../../src'
import { defaultStrokeColor, Model } from './model'
import { getPolylineLines, LineContent, lineModel } from './line-model'

export const polylineModel: Model<LineContent> = {
  ...lineModel,
  type: 'polyline',
  explode(content) {
    const { lines } = getPolylineLines(content)
    return lines.map((line) => ({ type: 'line', points: line } as LineContent))
  },
  render({ content, color, target, strokeWidth, partsStyles }) {
    return strokePolyline(target, content.points, color ?? defaultStrokeColor, content.dashArray, strokeWidth, partsStyles)
  },
  canSelectPart: true,
}

export function strokePolyline<T>(
  target: ReactRenderTarget<T>,
  points: Position[],
  stroke: number,
  dashArray?: number[],
  strokeWidth?: number,
  partsStyles: readonly { index: number, color: number }[] = [],
) {
  if (partsStyles.length > 0) {
    const children: T[] = [
      target.strokePolyline(points, stroke, dashArray, strokeWidth, partsStyles.map((s) => s.index)),
      ...partsStyles.map(({ index, color }) => target.strokePolyline([points[index], points[index + 1]], color, dashArray, strokeWidth)),
    ]
    return target.getGroup(children, 0, 0, { x: 0, y: 0 })
  }
  return target.strokePolyline(points, stroke, dashArray, strokeWidth)
}

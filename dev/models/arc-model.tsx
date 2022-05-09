import { Arc, Position } from '../../src'
import { angleDelta } from './ellipse-model'
import { iteratePolylineLines } from './line-model'
import { BaseContent, getLinesAndPointsFromCache, Model } from './model'

export type ArcContent = BaseContent<'arc'> & Arc

export const arcModel: Model<ArcContent> = {
  type: 'arc',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  render({ content, stroke, target }) {
    if (content.dashArray) {
      const { points } = getLinesAndPointsFromCache(content, getArcLines)
      return target.strokePolyline(points, stroke, content.dashArray)
    }
    return target.strokeArc(content.x, content.y, content.r, content.startAngle, content.endAngle, stroke)
  },
  renderOperator({ content, stroke, target, text, fontSize }) {
    const { points } = getLinesAndPointsFromCache(content, getArcLines)
    return target.fillText(points[0].x, points[0].y, text, stroke, fontSize)
  },
  getLines: getArcLines,
}

export function getArcLines(content: Omit<ArcContent, "type">) {
  const points: Position[] = []
  const endAngle = content.startAngle > content.endAngle ? content.endAngle + 360 : content.endAngle
  let i = content.startAngle
  for (; i <= endAngle; i += angleDelta) {
    const angle = i * Math.PI / 180
    points.push({
      x: content.x + content.r * Math.cos(angle),
      y: content.y + content.r * Math.sin(angle),
    })
  }
  if (i !== endAngle) {
    const angle = endAngle * Math.PI / 180
    points.push({
      x: content.x + content.r * Math.cos(angle),
      y: content.y + content.r * Math.sin(angle),
    })
  }
  return {
    lines: Array.from(iteratePolylineLines(points)),
    points,
  }
}

import { Arc } from '../../src'
import { BaseContent, Model } from './model'

export type ArcContent = BaseContent<'arc'> & Arc

export const arcModel: Model<ArcContent> = {
  type: 'arc',
  move(content, offset) {
    content.x += offset.x
    content.y += offset.y
  },
  render({ content, stroke, target }) {
    return target.strokeArc(content.x, content.y, content.r, content.startAngle, content.endAngle, stroke)
  },
}

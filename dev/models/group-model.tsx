import { getBlockGeometries, getBlockSnapPoints, renderBlockChildren } from "./block-model"
import { BaseContent, getModel, Model } from "./model"

export type GroupContent = BaseContent<'group'> & {
  contents: BaseContent[]
}

export const groupModel: Model<GroupContent> = {
  type: 'group',
  move(content, offset) {
    content.contents.forEach((c) => {
      getModel(c.type)?.move?.(c, offset)
    })
  },
  rotate(content, center, angle, contents) {
    content.contents.forEach((c) => {
      getModel(c.type)?.rotate?.(c, center, angle, contents)
    })
  },
  explode(content) {
    return content.contents
  },
  mirror(content, line, angle, contents) {
    content.contents.forEach((c) => {
      getModel(c.type)?.mirror?.(c, line, angle, contents)
    })
  },
  render({ content, target, color, strokeWidth, contents }) {
    const children = renderBlockChildren(content, target, strokeWidth, contents, color)
    return target.renderGroup(children)
  },
  getSnapPoints: getBlockSnapPoints,
  getGeometries: getBlockGeometries,
}

export function isGroupContent(content: BaseContent): content is GroupContent {
  return content.type === 'group'
}

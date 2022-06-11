import { Position } from "../../src"
import { BaseContent, Model } from "./model"

export type TextContent = BaseContent<'text'> & Position & TextStyle & {
  text: string
  color: number
}

export interface TextStyle {
  fontSize: number
  fontFamily: string
}

export const textModel: Model<TextContent> = {
  type: 'text',
  getDefaultColor(content) {
    return content.color
  },
  render({ content, target, color }) {
    return target.renderText(content.x, content.y, content.text, color ?? content.color, content.fontSize, content.fontFamily)
  },
}

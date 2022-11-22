import { FlowLayoutBlock, FlowLayoutBlockStyle, Position, ReactRenderTarget } from "../../src"

export const lineHeightRatio = 1.2
export const defaultFontSize = 16
export const defaultFontFamily = 'monospace'

export interface RichText extends Partial<RichTextStyle> {
  text: string
  type?: string
  kind?: string
}

export interface RichTextStyle {
  fontSize: number
  fontFamily: string
  bold: boolean
  italic: boolean
  underline: boolean
  passThrough: boolean
  color: number
  backgroundColor: number
}

export type BlockType = keyof JSX.IntrinsicElements

export interface RichTextBlock extends FlowLayoutBlock<RichTextInline>, Partial<RichTextStyle> {
  type: BlockType
}

export interface RichTextInline {
  kind?: string
}

export function isText(content: RichTextInline): content is RichText {
  return content.kind === undefined
}

export type RichTextEditorPluginBlock = Partial<RichTextStyle & FlowLayoutBlockStyle>

export interface RichTextEditorPluginInline {
  getLineHeight: (content: RichTextInline) => number | undefined
  getWidth: (content: RichTextInline) => number | undefined
}

export type RichTextEditorPluginStyle = (
  content: RichText | undefined,
  block: RichTextBlock | undefined,
  updateSelection: (recipe: (richText: Partial<RichTextStyle>) => void) => void
) => JSX.Element | (JSX.Element | undefined)[]

export type RichTextEditorPluginHook = <T>(props: {
  cursor: Position
  cursorHeight: number
  currentContent: RichTextInline | undefined,
  inputText: (text: (string | RichTextInline)[]) => void
  updateCurrentContent: (recipe: (richText: RichTextInline) => void) => void
}) => {
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  ui?: JSX.Element
  propertyPanel?: Record<string, JSX.Element | (JSX.Element | undefined)[]>
  exportToHtml?: (richText: RichTextInline) => string | undefined
  render?: (content: RichTextInline, target: ReactRenderTarget<T>, x: number, y: number) => (T | undefined)
}

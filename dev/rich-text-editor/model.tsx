import { FlowLayoutBlock, FlowLayoutBlockStyle, Position } from "../../src"

export const lineHeightRatio = 1.2
export const defaultFontSize = 16
export const defaultFontFamily = 'monospace'

export interface RichText extends Partial<RichTextStyle> {
  text: string
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

export interface RichTextBlock extends FlowLayoutBlock<RichText>, Partial<RichTextStyle> {
  type: BlockType
}

export type RichTextEditorPluginBlock = Partial<RichTextStyle & FlowLayoutBlockStyle>

export type RichTextEditorPluginStyle = (
  content: RichText | undefined,
  block: RichTextBlock | undefined,
  updateSelection: (recipe: (richText: Partial<RichTextStyle>) => void) => void
) => JSX.Element | (JSX.Element | undefined)[]

export type RichTextEditorPluginHook = (props: {
  cursor: Position
  cursorHeight: number
  inputText: (text: (string | RichText)[]) => void
}) => {
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  ui?: JSX.Element
}

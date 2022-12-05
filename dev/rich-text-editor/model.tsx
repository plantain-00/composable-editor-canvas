import { Position, HtmlText, HtmlBlock, HtmlTextInline, HtmlTextStyle, Size } from "../../src"

export const lineHeightRatio = 1.14

export type RichTextEditorPluginStyle = (
  content: HtmlText | undefined,
  block: HtmlBlock | undefined,
  updateSelection: (recipe: (richText: Partial<HtmlTextStyle>) => void) => void
) => JSX.Element | (JSX.Element | undefined)[]

export type RichTextEditorPluginHook = (props: {
  cursor: Position
  cursorHeight: number
  currentContent: HtmlTextInline | undefined
  currentContentLayout: Position | undefined
  inputText: (text: (string | HtmlTextInline)[]) => void
  inputContent: (contents: readonly HtmlBlock[]) => void
  updateCurrentContent: (recipe: (richText: HtmlTextInline) => void) => void
  setResizeOffset: (offset: Size) => void
}) => {
  processInput?(e: React.KeyboardEvent<HTMLInputElement>): boolean
  ui?: JSX.Element
  propertyPanel?: Record<string, JSX.Element | (JSX.Element | undefined)[]>
}

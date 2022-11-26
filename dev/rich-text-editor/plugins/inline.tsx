import { RichTextEditorPluginTextInline } from "../model";

export const span: RichTextEditorPluginTextInline = {}

export const code: RichTextEditorPluginTextInline = {
  fontFamily: 'monospace',
}

export const mark: RichTextEditorPluginTextInline = {
  backgroundColor: 0xffff00,
}

export const sub: RichTextEditorPluginTextInline = {
  fontSize: 0.83,
  verticalAlign: -0.25,
}

export const sup: RichTextEditorPluginTextInline = {
  fontSize: 0.83,
  verticalAlign: 0.25,
}

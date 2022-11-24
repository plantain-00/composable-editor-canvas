import { RichTextEditorPluginBlock } from "../model";

export const h1: RichTextEditorPluginBlock = {
  fontSize: 2,
  bold: true,
  blockStart: 0.67,
  blockEnd: 0.67,
}

export const h2: RichTextEditorPluginBlock = {
  fontSize: 1.5,
  bold: true,
  blockStart: 0.83,
  blockEnd: 0.83,
}

export const h3: RichTextEditorPluginBlock = {
  fontSize: 1.17,
  bold: true,
  blockStart: 1.17,
  blockEnd: 1.17,
}

export const h4: RichTextEditorPluginBlock = {
  fontSize: 1,
  bold: true,
  blockStart: 1,
  blockEnd: 1,
}

export const h5: RichTextEditorPluginBlock = {
  fontSize: 0.83,
  bold: true,
  blockStart: 1,
  blockEnd: 1,
}

export const h6: RichTextEditorPluginBlock = {
  fontSize: 0.67,
  bold: true,
  blockStart: 2.33,
  blockEnd: 2.33,
}

export const p: RichTextEditorPluginBlock = {
  blockStart: 1,
  blockEnd: 1,
}

export const ul: RichTextEditorPluginBlock = {
  blockStart: 1,
  blockEnd: 1,
  inlineStart: 40,
  listStyleType: 'disc',
}

export const ol: RichTextEditorPluginBlock = {
  blockStart: 1,
  blockEnd: 1,
  inlineStart: 40,
  listStyleType: 'decimal',
}

export const hr: RichTextEditorPluginBlock = {
  blockStart: 0.5,
  blockEnd: 0.5,
  void: true,
  render(content, target, x, y, width) {
    if (content.type === 'hr') {
      return target.renderPolyline([{ x, y }, { x: x + width, y }], { strokeColor: content.color })
    }
    return
  }
}

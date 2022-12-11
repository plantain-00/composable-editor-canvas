import React from "react"
import { BooleanEditor, NumberEditor, StringEditor, defaultFontFamily, defaultFontSize } from "../../../src"
import { RichTextEditorPluginStyle } from "../model"

export const fontSize: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <NumberEditor value={currentContent?.fontSize ?? currentBlock?.fontSize ?? defaultFontSize} setValue={v => updateSelection(c => c.fontSize = v)} style={{ width: '100px' }} />
}

export const fontFamily: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <StringEditor value={currentContent?.fontFamily ?? currentBlock?.fontFamily ?? defaultFontFamily} setValue={v => updateSelection(c => c.fontFamily = v)} style={{ width: '100px' }} />
}

export const bold: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <BooleanEditor value={(currentContent?.bold ?? currentBlock?.bold) === true} setValue={v => updateSelection(c => c.bold = v ? true : undefined)} />
}

export const italic: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <BooleanEditor value={(currentContent?.italic ?? currentBlock?.italic) === true} setValue={v => updateSelection(c => c.italic = v ? true : undefined)} />
}

export const underline: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <BooleanEditor value={(currentContent?.underline ?? currentBlock?.underline) === true} setValue={v => updateSelection(c => c.underline = v ? true : undefined)} />
}

export const passThrough: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <BooleanEditor value={(currentContent?.passThrough ?? currentBlock?.passThrough) === true} setValue={v => updateSelection(c => c.passThrough = v ? true : undefined)} />
}

export const color: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <NumberEditor type='color' value={currentContent?.color ?? currentBlock?.color ?? 0} setValue={v => updateSelection(c => c.color = v ? v : undefined)} />
}

export const backgroundColor: RichTextEditorPluginStyle = (currentContent, currentBlock, updateSelection) => {
  return <NumberEditor type='color' value={currentContent?.backgroundColor ?? currentBlock?.backgroundColor ?? 0xffffff} setValue={v => updateSelection(c => c.backgroundColor = v ? v : undefined)} />
}

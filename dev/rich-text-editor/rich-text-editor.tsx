import React from "react"
import { ObjectEditor, Button, defaultFontFamily, isHtmlText, HtmlBlock, metaKeyIfMacElseCtrlKey, usePatchBasedUndoRedo, useHtmlEditor, getKeys, HtmlEditorPlugin } from "../../src"
import { produce, Patch } from "immer"
import { RichTextEditorPluginHook, RichTextEditorPluginStyle } from "./model"

export const RichTextEditor = React.forwardRef((props: {
  initialState: readonly HtmlBlock[]
  width: number
  height: number
  onApplyPatchesFromSelf?: (patches: Patch[], reversePatches: Patch[]) => void
  onSendLocation?: (location: [number, number]) => void
  autoHeight: boolean
  readOnly: boolean
  operator: string
  plugin?: RichTextEditorPlugin
}, ref: React.ForwardedRef<RichTextEditorRef>) => {
  const { state, setState, undo, redo, applyPatchFromOtherOperators } = usePatchBasedUndoRedo(props.initialState, props.operator, {
    onApplyPatchesFromSelf: props.onApplyPatchesFromSelf,
  })
  const [resizeOffset, setResizeOffset] = React.useState({ width: 0, height: 0 })

  const { renderEditor, currentContent, currentBlock, currentContentLayout, inputText, layoutResult, cursor, inputContent, location, scrollY, updateSelection, updateTextInline, updateParagraph, updateCurrentContent } = useHtmlEditor({
    state,
    setState,
    width: props.width,
    height: props.height,
    readOnly: props.readOnly,
    processInput(e) {
      for (const processAtInput of hooksProcessInputs) {
        if (processAtInput(e)) {
          return true
        }
      }
      if (metaKeyIfMacElseCtrlKey(e)) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            redo(e)
          } else {
            undo(e)
          }
          return true
        }
      }
      return false
    },
    onLocationChanged: props.onSendLocation,
    autoHeight: props.autoHeight,
    plugin: props.plugin,
    resizeOffset,
    keepSelectionOnBlur: true,
  })

  const hooksProcessInputs: NonNullable<ReturnType<RichTextEditorPluginHook>['processInput']>[] = []
  const hooksUIs: React.ReactNode[] = []
  const properties: ReturnType<RichTextEditorPluginHook>['propertyPanel'] = {}
  if (props.plugin?.hooks) {
    const hooksProps = { cursor, cursorHeight: cursor.height, inputText, inputContent, currentContent, currentContentLayout, updateCurrentContent, setResizeOffset }
    props.plugin.hooks.forEach((useHook, i) => {
      const { processInput, ui, propertyPanel } = useHook(hooksProps)
      if (processInput) hooksProcessInputs.push(processInput)
      if (ui) hooksUIs.push(React.cloneElement(ui, { key: i }))
      if (propertyPanel) Object.assign(properties, propertyPanel)
    })
  }
  const [othersLocation, setOthersLocation] = React.useState<{ location: [number, number], operator: string }[]>([])

  React.useImperativeHandle<RichTextEditorRef, RichTextEditorRef>(ref, () => ({
    handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }) {
      try {
        applyPatchFromOtherOperators(data.patches, data.reversePatches, data.operator)
      } catch (error) {
        console.error(error)
      }
    },
    handleLocationEvent(data: { location?: [number, number], operator: string }) {
      setOthersLocation(produce(othersLocation, (draft) => {
        const index = othersLocation.findIndex((s) => s.operator === data.operator)
        if (index >= 0) {
          if (data.location && state[data.location[0]]?.children?.[data.location[1]]) {
            draft[index].location = data.location
          } else {
            draft.splice(index, 1)
          }
        } else if (data.location) {
          draft.push({ location: data.location, operator: data.operator })
        }
      }))
    },
  }), [applyPatchFromOtherOperators])

  const children: JSX.Element[] = []
  layoutResult?.cells?.forEach((r, blockIndex) => {
    const block = state[blockIndex]
    const blockFontFamily = block?.fontFamily ?? defaultFontFamily
    r.forEach(({ x, y, height }, contentIndex) => {
      const others = othersLocation.filter(c => c.location[0] === blockIndex && c.location[1] === contentIndex)
      if (others.length > 0) {
        children.push(
          <div style={{ position: 'absolute', left: x + 'px', top: y + scrollY + 'px', width: '2px', height: height + 'px', backgroundColor: 'red' }}></div>,
          <span style={{ position: 'absolute', left: x + 'px', top: y + scrollY + height + 'px', fontSize: '12px', fontFamily: blockFontFamily, color: 'red' }}>{others.map(h => h.operator).join(',')}</span>,
        )
      }
    })
  })

  if (props.plugin?.styles && currentContent && isHtmlText(currentContent)) {
    for (const key in props.plugin.styles) {
      properties[key] = props.plugin.styles[key](currentContent, currentBlock, updateSelection)
    }
  }
  if (props.plugin?.textInlines) {
    properties.textInlines = <div>{getKeys(props.plugin.textInlines).map(t => <Button key={t} style={{ fontWeight: currentContent && isHtmlText(currentContent) && currentContent.type === t ? 'bold' : undefined }} onClick={() => updateTextInline(t)}>{t}</Button>)}</div>
  }
  if (props.plugin?.blocks) {
    properties.block = <div>{getKeys(props.plugin.blocks).map(t => <Button key={t} style={{ fontWeight: state[location[0]]?.type === t ? 'bold' : undefined }} onClick={() => updateParagraph(t)}>{t}</Button>)}</div>
  }

  return (
    <div style={{ position: 'relative', margin: '10px' }}>
      <div style={{ display: 'flex' }}>
        {renderEditor(<>{children}</>)}
        <ObjectEditor inline properties={properties} />
      </div>
      {hooksUIs}
    </div>
  )
})

export interface RichTextEditorPlugin extends HtmlEditorPlugin {
  styles?: Record<string, RichTextEditorPluginStyle>
  hooks?: RichTextEditorPluginHook[]
}

export interface RichTextEditorRef {
  handlePatchesEvent(data: { patches: Patch[], reversePatches: Patch[], operator: string }): void
  handleLocationEvent(data: { location?: [number, number], operator: string }): void
}

import React from "react";
import { useCursorInput, useKey } from "../../src";
import { isArcContent, ArcContent } from "../models/arc-model";
import { CircleContent, isCircleContent } from "../models/circle-model";
import { BaseContent, getNextId } from "../models/model";
import { RadialDimensionContent } from "../models/radial-dimension-model";
import { RadialDimensionReferenceContent } from "../models/radial-dimension-reference-model";
import { Command } from "./command";

export const createRadialDimensionCommand: Command = {
  name: 'create radial dimension',
  selectCount: 1,
  contentSelectable,
  useCommand({ onEnd, selected, type }) {
    const [result, setResult] = React.useState<Omit<RadialDimensionContent, 'refId'> & { refId?: number }>()
    const [text, setText] = React.useState<string>()
    let message = ''
    if (type) {
      message = 'input text'
    }
    const { input, clearText, setCursorPosition, setInputPosition, resetInput } = useCursorInput(message, type ? (e, text) => {
      if (e.key === 'Enter') {
        setText(text)
        if (result) {
          setResult({ ...result, text })
        }
        clearText()
      }
    } : undefined)
    const reset = () => {
      setResult(undefined)
      resetInput()
      setText(undefined)
    }
    useKey((e) => e.key === 'Escape', reset, [setResult])
    return {
      input,
      onStart() {
        if (result) {
          onEnd({
            updateContents: (contents) => {
              if (!result.refId && selected.length > 0 && type) {
                const content = selected[0].content
                if (contentSelectable(content)) {
                  result.refId = getNextId(contents);
                  // type-coverage:ignore-next-line
                  (contents[selected[0].path[0]] as CircleContent | ArcContent).id = result.refId
                }
              }
              if (result.refId) {
                contents.push({
                  type: 'radial dimension reference',
                  position: result.position,
                  fontSize: result.fontSize,
                  fontFamily: result.fontFamily,
                  refId: result.refId,
                  text: result.text,
                } as RadialDimensionReferenceContent)
              }
            },
            nextCommand: type,
          })
          reset()
        }
      },
      onMove(p, viewportPosition) {
        setInputPosition(viewportPosition || p)
        setCursorPosition(p)
        if (selected.length > 0 && type) {
          const content = selected[0].content
          if (contentSelectable(content)) {
            setResult({
              type: 'radial dimension',
              position: p,
              x: content.x,
              y: content.y,
              r: content.r,
              fontSize: 16,
              fontFamily: 'monospace',
              refId: content.id,
              text,
            })
          }
        }
      },
      assistentContents: result ? [result] : undefined,
    }
  },
}

function contentSelectable(content: BaseContent): content is CircleContent | ArcContent {
  return isArcContent(content) || isCircleContent(content)
}

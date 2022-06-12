import React from "react";
import { useKey } from "../../src";
import { isArcContent, ArcContent } from "../models/arc-model";
import { CircleContent, isCircleContent } from "../models/circle-model";
import { BaseContent } from "../models/model";
import { RadialDimensionContent } from "../models/radial-dimension-model";
import { Command } from "./command";

export const createRadialDimensionCommand: Command = {
  name: 'create radial dimension',
  selectCount: 1,
  contentSelectable,
  useCommand({ onEnd, selected, type }) {
    const [result, setResult] = React.useState<RadialDimensionContent>()
    const reset = () => {
      setResult(undefined)
    }
    useKey((e) => e.key === 'Escape', reset, [setResult])
    return {
      onStart() {
        if (result) {
          onEnd(
            (contents) => {
              contents.push(result)
            },
            type,
          )
          reset()
        }
      },
      onMove(p) {
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

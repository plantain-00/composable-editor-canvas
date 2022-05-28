import React from "react"
import { Circle, getCirclesTangentTo2Circles, getCirclesTangentTo2Lines, getCirclesTangentToLineAndCircle, getTwoNumbersDistance, getTwoPointsDistance, useCursorInput, useKey } from "../../src"
import { isArcContent } from "../models/arc-model"
import { CircleContent, isCircleContent } from "../models/circle-model"
import { isLineContent } from "../models/line-model"
import { BaseContent } from "../models/model"
import { Command } from "./command"

export const createTangentTangentRadiusCircleCommand: Command = {
  name: 'create tangent tangent radius circle',
  useCommand(onEnd, _t, _s, enabled, selected) {
    const [candidates, setCandidates] = React.useState<Circle[]>([])
    const [result, setResult] = React.useState<Circle>()
    let message = ''
    if (enabled) {
      if (candidates.length > 0) {
        message = 'select one result'
      } else {
        message = 'input radius'
      }
    }
    const assistentContents: CircleContent[] = candidates.map((c) => ({
      ...c,
      type: 'circle',
      dashArray: c === result ? undefined : [4],
    }))
    const { input, setInputPosition, setCursorPosition, clearText, resetInput } = useCursorInput(message, enabled && candidates.length == 0 ? (e, text) => {
      if (e.key === 'Enter') {
        const radius = +text
        if (!isNaN(radius)) {
          setCandidates(getTangentTangentRadiusCircles(selected[0], selected[1], radius))
          clearText()
        }
      }
    } : undefined)
    const reset = () => {
      setCandidates([])
      setResult(undefined)
      clearText()
      resetInput()
    }
    useKey((e) => e.key === 'Escape', reset, [setCandidates])

    return {
      onStart(p) {
        setCursorPosition(p)
        if (result) {
          onEnd((contents) => {
            contents.push({ type: 'circle', ...result } as CircleContent)
          })
          setCandidates([])
        }
      },
      input,
      onMove(p, viewportPosition) {
        setCursorPosition(p)
        setInputPosition(viewportPosition || p)
        setResult(candidates.find((c) => getTwoNumbersDistance(getTwoPointsDistance(c, p), c.r) < 5))
      },
      assistentContents,
    }
  },
  selectCount: 2,
  contentSelectable: (c) => isCircleContent(c) || isArcContent(c) || isLineContent(c),
  selectType: 'select part',
}

function getTangentTangentRadiusCircles(content1: BaseContent, content2: BaseContent, radius: number) {
  const result: Circle[] = []
  const content1IsCircle = isCircleContent(content1) || isArcContent(content1)
  const content2IsCircle = isCircleContent(content2) || isArcContent(content2)
  if (content1IsCircle && content2IsCircle) {
    result.push(...getCirclesTangentTo2Circles(content1, content2, radius).map((c) => ({ ...c, r: radius })))
  } else if (content1IsCircle && isLineContent(content2)) {
    result.push(...getCirclesTangentToLineAndCircle(content2.points[0], content2.points[1], content1, radius).map((c) => ({ ...c, r: radius })))
  } else if (content2IsCircle && isLineContent(content1)) {
    result.push(...getCirclesTangentToLineAndCircle(content1.points[0], content1.points[1], content2, radius).map((c) => ({ ...c, r: radius })))
  } else if (isLineContent(content1) && isLineContent(content2)) {
    result.push(...getCirclesTangentTo2Lines(content1.points[0], content1.points[1], content2.points[0], content2.points[1], radius).map((c) => ({ ...c, r: radius })))
  }
  return result
}

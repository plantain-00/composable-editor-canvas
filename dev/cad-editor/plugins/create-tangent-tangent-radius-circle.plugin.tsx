import type { PluginContext } from './types'
import type * as core from '../../../src'
import type { Command } from '../command'
import type * as model from '../model'
import { isLineContent, LineContent } from './line-polyline.plugin'
import { CircleContent, isArcContent, isCircleContent } from './circle-arc.plugin'

export function getCommand(ctx: PluginContext): Command[] {
  function getTangentTangentRadiusCircles(content1: model.BaseContent, content2: model.BaseContent, radius: number): core.Circle[] {
    const result: core.Position[] = []
    if (isCircleContent(content1) || isArcContent(content1)) {
      if (isCircleContent(content2) || isArcContent(content2)) {
        result.push(...ctx.getCirclesTangentTo2Circles(content1, content2, radius))
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])
        if (!line2) return []
        result.push(...ctx.getCirclesTangentToLineAndCircle(line2, content1, radius))
      }
    } else if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])
      if (!line1) return []
      if (isCircleContent(content2) || isArcContent(content2)) {
        result.push(...ctx.getCirclesTangentToLineAndCircle(line1, content2, radius))
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])
        if (!line2) return []
        result.push(...ctx.getCirclesTangentTo2Lines(line1, line2, radius))
      }
    }
    return result.map((c) => ({ ...c, r: radius }))
  }
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="10,87 89,87" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <circle cx="17" cy="40" r="16" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="60" cy="57" r="30" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
    </svg>
  )
  const contentSelectable = (c: model.BaseContent) => isCircleContent(c) || isArcContent(c) || isLineContent(c)
  const icon2 = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polyline points="10,87 89,87" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></polyline>
      <circle cx="17" cy="40" r="16" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="60" cy="57" r="30" strokeWidth="5" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="none" stroke="currentColor"></circle>
      <circle cx="33" cy="46" r="8" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="none"></circle>
      <circle cx="60" cy="87" r="8" fillOpacity="1" strokeOpacity="1" fill="currentColor" stroke="none"></circle>
    </svg>
  )
  const command: Command = {
    name: 'create tangent tangent radius circle',
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState<core.Circle[]>([])
      const [result, setResult] = React.useState<core.Circle>()
      let message = ''
      if (type) {
        if (candidates.length > 0) {
          message = 'select one result'
        } else {
          message = 'input radius'
        }
      }
      const assistentContents: CircleContent[] = candidates.map((c) => ({
        ...c,
        type: 'circle',
        dashArray: c === result ? undefined : [4 / scale],
      }))
      const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
        if (e.key === 'Enter') {
          const radius = +text
          if (!isNaN(radius)) {
            setCandidates(getTangentTangentRadiusCircles(selected[0].content, selected[1].content, radius))
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

      return {
        onStart(p) {
          setCursorPosition(p)
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: 'circle', ...result } as CircleContent)
              }
            })
            setCandidates([])
          }
        },
        input,
        onMove(p, viewportPosition) {
          setCursorPosition(p)
          setInputPosition(viewportPosition || p)
          setResult(candidates.find((c) => ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(c, p), c.r) < 5))
        },
        assistentContents,
        reset,
      }
    },
    selectCount: 2,
    contentSelectable,
    selectType: 'select part',
    icon,
  }
  return [
    command,
    {
      ...command,
      name: 'create tangent tangent radius circle 2',
      useCommand({ onEnd, type, scale, contentVisible, contents, getContentsInRange }) {
        const [first, setFirst] = React.useState<{ content: model.BaseContent, point: core.Position, path: core.ContentPath }>()
        const [second, setSecond] = React.useState<{ content: model.BaseContent, point: core.Position, path: core.ContentPath }>()
        const [hovering, setHovering] = React.useState<{ content: model.BaseContent, point: core.Position, path: core.ContentPath }>()
        const [result, setResult] = React.useState<core.Circle>()
        let message = ''
        if (type) {
          if (!first) {
            message = 'select first circle, arc or line'
          } else if (!second) {
            message = 'select second circle, arc or line'
          } else {
            message = 'input radius'
          }
        }
        const assistentContents: CircleContent[] = []
        if (result) {
          assistentContents.push({ ...result, type: 'circle', dashArray: [4 / scale] })
        }
        const selected: core.ContentPath[] = []
        if (first) {
          selected.push(first.path)
        }
        if (second) {
          selected.push(second.path)
        }
        const getCandidate = (radius: number) => {
          if (!first || !second) return
          const candidates = getTangentTangentRadiusCircles(first.content, second.content, radius)
          return ctx.minimumBy(candidates, c => ctx.getTwoPointsDistanceSquare(c, first.point) + ctx.getTwoPointsDistanceSquare(c, second.point))
        }
        const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
          if (e.key === 'Enter') {
            const radius = +text
            if (!isNaN(radius) && first && second) {
              const candidate = getCandidate(radius)
              if (!candidate) return
              onEnd({
                updateContents: (contents) => {
                  contents.push({ type: 'circle', ...candidate } as CircleContent)
                }
              })
              reset()
            }
          }
        } : undefined)
        const reset = () => {
          setFirst(undefined)
          setSecond(undefined)
          setHovering(undefined)
          setResult(undefined)
          clearText()
          resetInput()
        }
        const selectContent = (p: core.Position) => {
          const indexes = getContentsInRange({ start: p, end: p }).filter((c): c is model.BaseContent => !!c).map(c => ctx.getContentIndex(c, contents))
          const contentPath = ctx.getContentByClickPosition(contents, p, c => {
            const content = ctx.getContentByIndex(contents, c)
            return !!content && contentSelectable(content)
          }, ctx.getContentModel, true, contentVisible, indexes, 3 / scale)
          if (contentPath) {
            const content = ctx.getContentByIndex(contents, contentPath)
            if (content) {
              return { content, point: p, path: contentPath }
            }
          }
          return
        }
        return {
          onStart(p) {
            if (!first) {
              setFirst(hovering)
              setHovering(undefined)
              return
            } else if (!second) {
              setSecond(hovering)
              setHovering(undefined)
              return
            }
            setCursorPosition(p)
            if (result) {
              onEnd({
                updateContents: (contents) => {
                  contents.push({ type: 'circle', ...result } as CircleContent)
                }
              })
              reset()
            }
          },
          input,
          onMove(p, viewportPosition) {
            setCursorPosition(p)
            setInputPosition(viewportPosition || p)
            if (!first) {
              setHovering(selectContent(p))
              return
            } else if (!second) {
              setHovering(selectContent(p))
              return
            }
            setResult(getCandidate(ctx.getTwoPointsDistance(second.point, p)))
          },
          assistentContents,
          selected,
          hovering: hovering ? [hovering.path] : undefined,
          reset,
        }
      },
      selectCount: 0,
    },
    {
      name: 'create tangent tangent radius circle at points',
      useCommand({ onEnd, type, scale, contents }) {
        const [start, setStart] = React.useState<{ point: core.Position, param: number, line: core.GeometryLine }>()
        const [cursor, setCursor] = React.useState<core.Position>()
        const [radius, setRadius] = React.useState<number>()
        const [result, setResult] = React.useState<core.Circle>()
        const assistentContents: (LineContent | CircleContent)[] = []
        if (start && cursor && type) {
          assistentContents.push({
            points: [start.point, cursor],
            type: 'line',
            dashArray: [4 / scale],
          })
        }
        if (result) {
          assistentContents.push({ ...result, type: 'circle' } as CircleContent)
        }
        const getTarget = (point: core.Position, id: number, param: number) => {
          const content = contents[id]
          if (!content) return
          const lines = ctx.getContentModel(content)?.getGeometries?.(content, contents)?.lines
          if (!lines) return
          const index = Math.floor(param)
          return { point, line: lines[index], param: param - index }
        }
        let message = ''
        if (type && !radius) {
          message = 'input radius'
        }
        const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
          if (e.key === 'Enter') {
            const r = +text
            if (!isNaN(r)) {
              setRadius(r)
              clearText()
              resetInput()
            }
          }
        } : undefined)
        const reset = () => {
          setStart(undefined)
          setResult(undefined)
          setCursor(undefined)
          setRadius(undefined)
          clearText()
          resetInput()
        }
        return {
          onStart(p, target) {
            if (!type) return
            if (!target) return
            if (target.param === undefined) return
            if (!start) {
              setStart(getTarget(p, target.id, target.param))
            } else if (result) {
              onEnd({
                updateContents: (contents) => {
                  contents.push({ ...result, type: 'circle' } as CircleContent)
                }
              })
              reset()
            }
          },
          onMove(p, viewportPosition, target) {
            if (!type) return
            setCursor(p)
            setResult(undefined)
            setCursorPosition(p)
            setInputPosition(viewportPosition || p)
            if (!radius) return
            if (!target) return
            if (target.param === undefined) return
            if (!start) return
            const end = getTarget(p, target.id, target.param)
            if (!end) return
            const circle = ctx.getCircleTangentToTwoGeometryLinesNearParam(start.line, end.line, radius, start.param, end.param)
            if (!circle) return
            setResult({ ...circle, r: radius })
          },
          input,
          assistentContents,
          reset,
        }
      },
      selectCount: 0,
      icon: icon2,
    }
  ]
}

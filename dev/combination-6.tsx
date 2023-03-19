import React from "react"
import produce from "immer"
import { Button, CanvasDraw, Position, getDirectionByAngle, getPointByLengthAndAngle, getPointByLengthAndDirection, getTwoNumberCenter, getTwoPointsAngle, getTwoPointsDistance, multipleDirection, reactCanvasRenderTarget, useEvent, useKey, useLineClickCreate, useRefState, useWindowSize } from "../src";

export function Combination6() {
  const { width, height } = useWindowSize()
  const target = reactCanvasRenderTarget
  const [state, setState, stateRef] = useRefState<(Position & { speed: Position, type: CreateType })[]>([])
  const [creating, setCreating] = React.useState<CreateType>()
  const [dropAuto, setDropAuto] = React.useState(false)
  const detonate = React.useRef(false)
  const [cursor, setCursor] = React.useState<Position>()
  const assistentContents: typeof state = []

  React.useEffect(() => {
    let lastTime: number | undefined
    const step = (time: number) => {
      if (lastTime !== undefined) {
        const t = (time - lastTime) * 0.002
        const r = detonate.current ? detonateRadius : radius
        const newState: typeof state = []
        for (const content of stateRef.current) {
          if (content.x < 0 || content.y < 0 || content.x > width || content.y > height) continue
          const newContent = produce(content, draft => {
            draft.x = content.x + t * content.speed.x
            const sy = content.speed.y + t * g
            draft.y = content.y + t * getTwoNumberCenter(sy, content.speed.y)
            draft.speed.y = sy
          })
          const index = newState.findIndex(c => (c.x - newContent.x) ** 2 + (c.y - newContent.y) ** 2 <= r ** 2)
          if (index >= 0) {
            newState.splice(index, 1)
          } else {
            newState.push(newContent)
          }
        }
        setState(newState)
      }
      lastTime = time
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])
  React.useEffect(() => {
    if (!dropAuto) return
    const timer = setInterval(() => {
      setState(produce(stateRef.current, draft => {
        draft.push({
          type: 'drop',
          x: Math.random() * width,
          y: radius,
          speed: {
            x: (Math.random() - 0.5) * width * 0.05,
            y: 0,
          },
        })
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [dropAuto])
  const { line, cursorPosition, onClick: startCreate, reset: resetCreate, onMove } = useLineClickCreate(
    creating === 'drop',
    (c) => {
      setState(produce(state, draft => {
        draft.push(lineToContent(c, radius, creating))
      }))
      resetCreate()
    },
    {
      once: true,
    },
  )
  const startCreation = (type: typeof creating) => {
    resetCreate()
    setCreating(type)
  }
  const reset = () => {
    setCreating(undefined)
    setCursor(undefined)
  }
  useKey((e) => e.key === 'Escape', reset, [setCreating])

  if (line) {
    assistentContents.push(lineToContent(line, radius, creating))
  } else if (cursorPosition) {
    assistentContents.push(lineToContent([cursorPosition, cursorPosition], radius, creating))
  } else if (cursor) {
    assistentContents.push(lineToContent([{ x: width / 2, y: height - radius }, cursor], radius, creating))
  }
  const children: CanvasDraw[] = []
  for (const s of [...state, ...assistentContents]) {
    const color = s.type === 'drop' ? 0xff0000 : 0x00ff00
    const r = detonate.current && s.type === 'shoot down' ? detonateRadius : radius
    children.push(target.renderCircle(s.x, s.y, r, { fillColor: color, strokeWidth: 0 }))
    if (s.speed.x || s.speed.y) {
      const distance = getTwoPointsDistance(s.speed)
      const angle = getTwoPointsAngle(s.speed)
      const p = getPointByLengthAndAngle(s, distance + radius, angle)
      children.push(target.renderPolyline([s, p], { strokeColor: color }))
    }
  }

  const onClick = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const p = { x: e.clientX, y: e.clientY }
    if (creating === 'drop') {
      startCreate(p)
    } else if (creating === 'shoot down' && cursor) {
      setState(produce(state, draft => {
        draft.push(lineToContent([{ x: width / 2, y: height - radius }, cursor], radius, creating))
      }))
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    const p = { x: e.clientX, y: e.clientY }
    if (creating === 'drop') {
      onMove(p)
    } else if (creating === 'shoot down') {
      setCursor(p)
    }
  })

  return (
    <div style={{ position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
      {target.renderResult(children, width, height, { attributes: { onClick } })}
      <div style={{ position: 'absolute', top: '0px' }}>
        <Button style={{ color: creating === 'drop' ? 'red' : undefined }} onClick={() => startCreation('drop')}>drop</Button>
        <label style={{ position: 'relative' }}>
          <input type='checkbox' checked={dropAuto} onChange={(e) => setDropAuto(e.target.checked)} />
          drop auto
        </label>
      </div>
      <div style={{ position: 'absolute', bottom: '0px', right: '0px' }}>
        <Button style={{ color: creating === 'shoot down' ? 'red' : undefined }} onClick={() => startCreation('shoot down')}>shoot down</Button>
        <label style={{ position: 'relative' }}>
          <input type='checkbox' checked={detonate.current} onChange={(e) => detonate.current = e.target.checked} />
          detonate
        </label>
      </div>
    </div>
  )
}

const radius = 5
const detonateRadius = 25
const g = 9.8

type CreateType = 'drop' | 'shoot down'

function lineToContent([p1, p2]: Position[], radius: number, type?: CreateType) {
  if (type === 'drop') {
    p1 = { x: p1.x, y: radius }
    p2 = { x: p2.x, y: radius }
  } else if (type === 'shoot down') {
    const angle = getTwoPointsAngle(p2, p1)
    const speed = multipleDirection(getDirectionByAngle(angle), 200)
    return {
      type: 'shoot down' as const,
      ...p1,
      speed,
    }
  }
  const distance = getTwoPointsDistance(p1, p2)
  let speed: Position
  if (distance > radius) {
    const p = getPointByLengthAndDirection(p2, distance - radius, p1)
    speed = { x: p2.x - p.x, y: p2.y - p.y }
  } else {
    speed = { x: 0, y: 0 }
  }
  return {
    type: 'drop' as const,
    ...p1,
    speed,
  }
}

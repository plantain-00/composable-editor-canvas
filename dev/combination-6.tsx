import React from "react"
import { produce } from "immer"
import { Button, CanvasDraw, Position, getDirectionByAngle, getPointByLengthAndAngle, getPointByLengthAndDirection, getTwoNumberCenter, getTwoPointsAngle, getTwoPointsDistance, isZero, multipleDirection, reactCanvasRenderTarget, useEvent, useGlobalKeyDown, useLineClickCreate, useRefState, useWindowSize } from "../src";

export function Combination6() {
  const { width, height } = useWindowSize()
  const target = reactCanvasRenderTarget
  const [state, setState, stateRef] = useRefState<(Position & { speed: Position, type: CreateType })[]>([])
  const [creating, setCreating] = React.useState<CreateType>()
  const [dropAuto, setDropAuto] = React.useState(false)
  const [shootAuto, setShootAuto] = React.useState(false)
  const detonate = React.useRef(false)
  const [cursor, setCursor] = React.useState<Position>()
  const assistentContents: typeof state = []
  const launchPosition = { x: width / 2, y: height - radius }
  const aimedContents = React.useRef(new WeakSet<object>())

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
            if (aimedContents.current.has(content)) {
              aimedContents.current.add(newContent)
              aimedContents.current.delete(content)
            }
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
      const rate = Math.random()
      setState(produce(stateRef.current, draft => {
        draft.push({
          type: 'drop',
          x: rate * width,
          y: radius,
          speed: {
            x: (rate > 0.5 ? -1 : 1) * Math.random() * width * 0.03,
            y: 0,
          },
        })
      }))
    }, 1000)
    return () => clearInterval(timer)
  }, [dropAuto])
  React.useEffect(() => {
    if (!shootAuto) return
    const timer = setInterval(() => {
      aimAuto()
    }, 1000)
    return () => clearInterval(timer)
  }, [shootAuto])
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
  const aimAuto = () => {
    const content = stateRef.current.find(c => c.type === 'drop' && !aimedContents.current.has(c))
    if (!content) return
    const speed = getLaunchSpeed(content, launchPosition)
    if (speed.length === 0) return
    setState(produce(stateRef.current, draft => {
      for (const s of speed) {
        if (s.y < 0) {
          draft.push({
            type: 'shoot down',
            ...launchPosition,
            speed: s,
          })
        }
      }
    }))
    aimedContents.current.add(content)
  }
  const reset = () => {
    setCreating(undefined)
    setCursor(undefined)
  }
  if (line) {
    assistentContents.push(lineToContent(line, radius, creating))
  } else if (cursorPosition) {
    assistentContents.push(lineToContent([cursorPosition, cursorPosition], radius, creating))
  } else if (cursor) {
    assistentContents.push(lineToContent([launchPosition, cursor], radius, creating))
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
        draft.push(lineToContent([launchPosition, cursor], radius, creating))
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
  useGlobalKeyDown(e => {
    if (e.key === 'Escape') {
      reset()
      resetCreate(true)
    }
  })

  return (
    <div style={{ position: 'absolute', inset: '0px', overflow: 'hidden' }} onMouseMove={onMouseMove}>
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
        <Button onClick={() => aimAuto()}>aim auto</Button>
        <label style={{ position: 'relative' }}>
          <input type='checkbox' checked={shootAuto} onChange={(e) => setShootAuto(e.target.checked)} />
          shoot auto
        </label>
      </div>
    </div>
  )
}

const radius = 5
const detonateRadius = 25
const g = 9.8
const launchSpeed = 200

type CreateType = 'drop' | 'shoot down'

function lineToContent([p1, p2]: Position[], radius: number, type?: CreateType) {
  if (type === 'drop') {
    p1 = { x: p1.x, y: radius }
    p2 = { x: p2.x, y: radius }
  } else if (type === 'shoot down') {
    const angle = getTwoPointsAngle(p2, p1)
    const speed = multipleDirection(getDirectionByAngle(angle), launchSpeed)
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

function getLaunchSpeed(target: Position & { speed: Position }, position: Position): Position[] {
  const dx = position.x - target.x
  const dy = position.y - target.y
  const c = dx * target.speed.y - dy * target.speed.x
  const r0 = launchSpeed ** 2
  const a = dx ** 2 + dy ** 2
  const b = 4 * r0 * dx ** 2 - 4 * c ** 2 + 4 * r0 * dy ** 2
  if (b < 0) {
    return []
  }
  const f = -c * dy
  const g = c * dx
  if (isZero(b)) {
    return [{
      x: f / a,
      y: g / a,
    }]
  }
  const e = b ** 0.5
  const h = 0.5 * dx * e
  const i = 0.5 * dy * e
  return [
    {
      x: (f + h) / a,
      y: (g + i) / a,
    },
    {
      x: (f - h) / a,
      y: (g - i) / a,
    },
  ]
}

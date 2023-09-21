import React from "react"
import { Button, getTwoPointsRadian, getPointByLengthAndRadian, reactCanvasRenderTarget, useRefState, useRefState2, useWindowSize, useEvent, getTwoPointsDistance } from "../src"

export default () => {
  const size = useWindowSize()
  const width = size.width / 2
  const height = size.height
  const target = reactCanvasRenderTarget
  const center = { x: width / 2, y: height / 3 }
  const [length, setLength] = React.useState(width / 2)
  const [editing, setEditing] = React.useState(false)
  const [state, setState] = React.useState({ radian: -Math.PI / 4, speed: 0 })
  const [editingState, setEditingState] = React.useState<(typeof state) & { length: number }>()
  const [running, setRunning, runningRef] = useRefState(false)
  const [runningState, setRunningState, runningStateRef] = useRefState2<typeof state>()
  const currentState = runningState ?? editingState ?? state
  const currentLength = editingState?.length ?? length
  const position = {
    x: center.x - currentLength * Math.sin(currentState.radian),
    y: center.y + currentLength * Math.cos(currentState.radian),
    r: 10,
  }
  const p = getPointByLengthAndRadian(position, currentState.speed * currentLength + position.r * (currentState.speed >= 0 ? 1 : -1), getTwoPointsRadian(position, center) + Math.PI / 2)
  const children = [
    target.renderCircle(center.x, center.y, 5),
    target.renderCircle(position.x, position.y, position.r, { fillColor: 0x000000, strokeWidth: 0 }),
    target.renderPolyline([center, position]),
    target.renderPolyline([position, p])
  ]

  const stop = () => {
    setRunning(false)
    setRunningState(undefined)
  }
  const run = () => {
    if (runningRef.current) {
      setRunning(false)
      return
    }
    setRunning(true)
    let lastTime: number | undefined
    const step = (time: number) => {
      if (!runningRef.current) return
      if (lastTime !== undefined) {
        const t = (time - lastTime) * 0.005
        const current = runningStateRef.current ?? state
        const initialY = center.y + currentLength * Math.cos(state.radian)
        const y = center.y + currentLength * Math.cos(current.radian)
        const g = 9.8
        let newSpeed = current.speed - g * Math.sin(current.radian) / currentLength * t
        if (y !== initialY) {
          const newSpeed2 = Math.sqrt(g * Math.abs(y - initialY) * 2) / currentLength
          if (newSpeed2 < Math.abs(newSpeed)) {
            newSpeed = Math.sign(newSpeed) * newSpeed2
          }
        }
        setRunningState({ radian: current.radian + current.speed * t, speed: newSpeed })
      }
      lastTime = time
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  const onClick = useEvent(() => {
    if (editingState) {
      setState(editingState)
      setLength(editingState.length)
      setEditing(false)
      setEditingState(undefined)
    }
  })
  const onMouseMove = useEvent((e: React.MouseEvent<HTMLOrSVGElement, MouseEvent>) => {
    if (editing) {
      const p = { x: e.clientX, y: e.clientY }
      setEditingState({
        radian: getTwoPointsRadian(p, center) - Math.PI / 2,
        speed: 0,
        length: getTwoPointsDistance(p, center),
      })
    }
  })

  return (
    <div style={{ position: 'absolute', inset: '0px' }} onMouseMove={onMouseMove}>
      {target.renderResult(children, width, height, { attributes: { onClick } })}
      <div style={{ position: 'absolute', top: '0px' }}>
        <Button onClick={run}>{running ? 'pause' : 'run'}</Button>
        {runningState !== undefined && <Button onClick={stop}>stop</Button>}
        {runningState === undefined && <Button style={{ color: editing ? 'red' : undefined }} onClick={() => setEditing(true)}>edit</Button>}
      </div>
    </div>
  )
}

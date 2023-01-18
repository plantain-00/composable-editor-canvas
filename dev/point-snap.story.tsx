import React from "react"
import { allSnapTypes, Circle, iterateIntersectionPoints, Position, usePointSnap, WeakmapCache2 } from "../src"

const intersectionPointsCache = new WeakmapCache2<Circle, Circle, Position[]>()
const contents: Circle[] = [{ x: 300, y: 200, r: 100 }, { x: 450, y: 350, r: 130 }]

export default () => {
  const [position, setPosition] = React.useState<Position>()
  const { getSnapAssistentContents, getSnapPoint } = usePointSnap<Circle>(
    true,
    (c1, c2) => intersectionPointsCache.get(c1, c2, () => Array.from(iterateIntersectionPoints(c1, c2, contents, () => ({ getCircle: (c) => ({ circle: c }) })))),
    allSnapTypes,
    () => ({
      getSnapPoints(c) {
        return [
          { x: c.x, y: c.y, type: 'center' },
          { x: c.x - c.r, y: c.y, type: 'endpoint' },
          { x: c.x + c.r, y: c.y, type: 'endpoint' },
          { x: c.x, y: c.y - c.r, type: 'endpoint' },
          { x: c.x, y: c.y + c.r, type: 'endpoint' },
        ]
      },
      getCircle(c) {
        return {
          circle: c,
          bounding: {
            start: { x: c.x - c.r, y: c.y - c.r },
            end: { x: c.x + c.r, y: c.y + c.r },
          }
        }
      },
    }),
  )
  const assistentContents = getSnapAssistentContents(
    (circle) => ({ type: 'circle' as const, ...circle }),
    (rect) => ({ type: 'rect' as const, ...rect }),
    (points) => ({ type: 'polyline' as const, points }),
  )

  return (
    <>
      <svg
        viewBox="0 0 800 600"
        width={800}
        height={600}
        xmlns="http://www.w3.org/2000/svg"
        fill='none'
        style={{ position: 'absolute', left: 0, top: 0 }}
        onMouseMove={(e) => setPosition(getSnapPoint({ x: e.clientX, y: e.clientY }, contents).position)}
      >
        {contents.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} stroke='#00ff00' />)}
        {assistentContents.map((c, i) => {
          if (c.type === 'rect') {
            return <rect key={i} x={c.x - c.width / 2} y={c.y - c.height / 2} width={c.width} height={c.height} stroke='#00ff00' />
          }
          if (c.type === 'circle') {
            return <circle key={i} cx={c.x} cy={c.y} r={c.r} stroke='#00ff00' />
          }
          return <polyline key={i} points={c.points.map((p) => `${p.x},${p.y}`).join(' ')} stroke='#00ff00' />
        })}
        {position && <circle cx={position.x} cy={position.y} r={5} stroke='#ff0000' />}
      </svg>
    </>
  )
}

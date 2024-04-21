import React from "react"
import { allSnapTypes, Circle, circleToArc, formatNumber, getGridLines, iterateIntersectionPoints, Position, usePointSnap, useWindowSize, WeakmapCache2 } from "../src"

const intersectionPointsCache = new WeakmapCache2<Circle, Circle, Position[]>()
const contents: Circle[] = [{ x: 300, y: 200, r: 100 }, { x: 450, y: 350, r: 130 }]

export default () => {
  const [position, setPosition] = React.useState<Position>()
  const { width, height } = useWindowSize()
  const startPosition = { x: 500, y: 100 }
  const gridSize = 20
  const { getSnapAssistentContents, getSnapPoint } = usePointSnap<Circle>(
    true,
    (c1, c2) => intersectionPointsCache.get(c1, c2, () => Array.from(iterateIntersectionPoints(c1, c2, contents, () => ({ getGeometries: (c) => ({ lines: [{ type: 'arc', curve: circleToArc(c) }] }) })))),
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
      getGeometries(c) {
        return {
          lines: [{ type: 'arc', curve: circleToArc(c) }],
          bounding: {
            start: { x: c.x - c.r, y: c.y - c.r },
            end: { x: c.x + c.r, y: c.y + c.r },
          }
        }
      },
    }),
    undefined, undefined,
    p => ({ x: formatNumber(p.x, 1 / gridSize), y: formatNumber(p.y, 1 / gridSize) }),
  )
  const assistentContents = getSnapAssistentContents(
    (circle) => ({ type: 'circle' as const, ...circle }),
    (rect) => ({ type: 'rect' as const, ...rect }),
    (points) => ({ type: 'polyline' as const, points }),
    (ray) => ({ type: 'ray' as const, ...ray }),
  )
  const lines = getGridLines({ start: { x: 0, y: 0 }, end: { x: width / 2, y: height } }, gridSize)
  return (
    <>
      <svg
        viewBox={`0 0 ${width / 2} ${height}`}
        width={width / 2}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        fill='none'
        style={{ position: 'absolute', left: 0, top: 0 }}
        onMouseMove={(e) => setPosition(getSnapPoint({ x: e.clientX, y: e.clientY }, contents, undefined, startPosition).position)}
      >
        {contents.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} stroke='#000000' />)}
        {lines.map((c, i) => <polyline key={i} points={c.map((p) => `${p.x},${p.y}`).join(' ')} stroke="black" strokeOpacity='0.2' />)}
        {position && <polyline points={`${startPosition.x},${startPosition.y} ${position.x},${position.y}`} strokeDasharray={4} stroke='#ff0000' />}
        {assistentContents.map((c, i) => {
          if (c.type === 'rect') {
            return <rect key={i} x={c.x - c.width / 2} y={c.y - c.height / 2} width={c.width} height={c.height} stroke='#00ff00' />
          }
          if (c.type === 'circle') {
            return <circle key={i} cx={c.x} cy={c.y} r={c.r} stroke='#00ff00' />
          }
          if (c.type === 'ray') {
            return null
          }
          return <polyline key={i} points={c.points.map((p) => `${p.x},${p.y}`).join(' ')} stroke='#00ff00' />
        })}
        {position && <circle cx={position.x} cy={position.y} r={5} stroke='#ff0000' />}
      </svg>
    </>
  )
}

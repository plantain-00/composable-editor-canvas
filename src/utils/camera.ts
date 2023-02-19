import { rotatePositionByCenter } from "./geometry"

export function updateCamera(x: number, y: number, z: number, rotateX: number, rotateY: number) {
  return {
    position: rotateAround(x, y, z, rotateX, rotateY),
    up: rotateAround(0, 1, 0, rotateX, rotateY),
  }
}

function rotateAround(x: number, y: number, z: number, rotateX: number, rotateY: number) {
  const py = rotatePositionByCenter({ x: z, y }, { x: 0, y: 0 }, rotateY)
  z = py.x
  y = py.y
  const px = rotatePositionByCenter({ x, y: z }, { x: 0, y: 0 }, rotateX)
  x = px.x
  z = px.y
  return { x, y, z }
}

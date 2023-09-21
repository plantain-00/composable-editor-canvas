import { getPointByLengthAndRadian, reactCanvasRenderTarget } from "../../src";
import { Bullet, Model } from "./model";
import { units } from "./units";

export function renderModels(models: Model[], bullets: Bullet[], selected: number[]) {
  const target = reactCanvasRenderTarget
  const children = models.map((m, i) => {
    const size = units[m.unit].size
    const color = selected.includes(i) ? m.canControl ? 0x00ff00 : 0x0000ff : undefined
    const result = [
      target.renderCircle(m.position.x, m.position.y, size, { strokeColor: color }),
      target.renderPolyline([
        getPointByLengthAndRadian(m.position, size, m.facing),
        getPointByLengthAndRadian(m.position, size * 2, m.facing),
      ], { strokeColor: color }),
    ]
    if (m.health !== undefined) {
      const height = 6
      const width = size
      const rate = m.health
      result.push(
        target.renderRect(m.position.x - width / 2, m.position.y - size - height, width, height),
        target.renderRect(m.position.x - width / 2, m.position.y - size - height, rate * size, height, {
          fillColor: 0x00ff00,
        }),
      )
    }
    if (m.mana !== undefined) {
      const height = 6
      const y = -6
      const width = size
      const rate = m.mana
      result.push(
        target.renderRect(m.position.x - width / 2, m.position.y - size - height - y, width, height),
        target.renderRect(m.position.x - width / 2, m.position.y - size - height - y, rate * size, height, {
          fillColor: 0x0000ff,
        }),
      )
    }
    return target.renderGroup(result)
  })
  children.push(...bullets.map(b => {
    if (b.type === 'instant') {
      return target.renderEmpty()
    }
    return target.renderCircle(b.position.x, b.position.y, 5)
  }))
  return children
}

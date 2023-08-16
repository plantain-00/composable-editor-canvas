import { getPointByLengthAndAngle, reactCanvasRenderTarget } from "../../src";
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
        getPointByLengthAndAngle(m.position, size, m.facing),
        getPointByLengthAndAngle(m.position, size * 2, m.facing),
      ], { strokeColor: color }),
    ]
    if (m.health !== undefined) {
      const height = 6
      const width = size
      const rate = m.health
      result.push(
        target.renderRect(m.position.x - width / 2, m.position.y - size - height, width, height),
        target.renderRect(m.position.x - width / 2, m.position.y - size - height, rate * size, height, {
          fillColor: rate > 0.67 ? 0x00ff00 : rate > 0.33 ? 0xffff00 : 0x000000,
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

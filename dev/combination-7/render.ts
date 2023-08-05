import { getPointByLengthAndAngle, reactCanvasRenderTarget } from "../../src";
import { Bullet, Model } from "./model";

export function renderModels(models: Model[], bullets: Bullet[], selected: number[]) {
  const target = reactCanvasRenderTarget
  const children = models.map((m, i) => {
    const color = selected.includes(i) ? m.canControl ? 0x00ff00 : 0x0000ff : undefined
    const result = [
      target.renderCircle(m.position.x, m.position.y, m.size, { strokeColor: color }),
      target.renderPolyline([
        getPointByLengthAndAngle(m.position, m.size, m.facing),
        getPointByLengthAndAngle(m.position, m.size * 2, m.facing),
      ], { strokeColor: color }),
    ]
    if (m.health) {
      const height = 6
      const width = m.size
      const rate = m.health.current
      result.push(
        target.renderRect(m.position.x - width / 2, m.position.y - m.size - height, width, height),
        target.renderRect(m.position.x - width / 2, m.position.y - m.size - height, rate * m.size, height, {
          fillColor: rate > 0.67 ? 0x00ff00 : rate > 0.33 ? 0xffff00 : 0x000000,
        }),
      )
    }
    return target.renderGroup(result)
  })
  children.push(...bullets.map(b => target.renderCircle(b.position.x, b.position.y, 5)))
  return children
}

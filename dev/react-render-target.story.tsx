import React from "react"
import { reactCanvasRenderTarget, ReactRenderTarget, reactSvgRenderTarget } from "../src"

export default () => {
  function render<T>(target: ReactRenderTarget<T>) {
    return target.renderResult(
      [
        target.renderArc(150, 150, 100, 0, 120, { strokeColor: 0x000000 }),
        target.renderCircle(150, 150, 80, { strokeColor: 0x00ff00 }),
        target.renderEllipse(150, 150, 50, 100, { strokeColor: 0xff0000, angle: 30 }),
        target.renderPolyline([{ x: 10, y: 10 }, { x: 150, y: 150 }, { x: 100, y: 200 }, { x: 200, y: 200 }], { strokeColor: 0x0000ff, dashArray: [4] }),
        target.renderRect(50, 50, 100, 80, { strokeColor: 0xff00ff, angle: 60 }),
        target.renderText(50, 100, 'Hello World!', 0xffff00, 30, 'monospace'),
      ],
      300,
      300,
    )
  }
  return (
    <div>
      {render(reactSvgRenderTarget)}
      {render(reactCanvasRenderTarget)}
    </div>
  )
}

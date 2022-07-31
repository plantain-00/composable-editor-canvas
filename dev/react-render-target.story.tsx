import React from "react"
import { reactCanvasRenderTarget, ReactRenderTarget, reactSvgRenderTarget } from "../src"
import { reactWebglRenderTarget } from "./renderers/react-webgl-render-target"

export default () => {
  function render<T>(target: ReactRenderTarget<T>) {
    return target.renderResult(
      [
        target.renderArc(150, 150, 100, 0, 120, { strokeColor: 0x000000 }),
        target.renderCircle(150, 150, 80, { strokeColor: 0x00ff00 }),
        target.renderGroup(
          [
            target.renderPolygon([{ x: 100, y: 100 }, { x: 100, y: 200 }, { x: 200, y: 150 }], { strokeColor: 0xff0000 }),
            target.renderText(50, 100, 'aaa', 0xffff00, 30, 'monospace'),
          ],
          { translate: { x: 100, y: 100 }, angle: 45, base: { x: 200, y: 150 } },
        ),
        target.renderCircle(250, 250, 30, { fillColor: 0x0000ff, strokeWidth: 0 }),
        target.renderEllipse(150, 150, 50, 100, { strokeColor: 0xff0000, angle: 30 }),
        target.renderPolyline([{ x: 10, y: 10 }, { x: 150, y: 150 }, { x: 100, y: 200 }, { x: 200, y: 200 }], { strokeColor: 0x0000ff, dashArray: [4] }),
        target.renderText(50, 100, 'Hello World!', 0xffff00, 30, 'monospace'),
        target.renderPath(
          [
            [{ x: 10, y: 110 }, { x: 50, y: 250 }, { x: 50, y: 110 }],
            [{ x: 30, y: 130 }, { x: 30, y: 170 }, { x: 40, y: 170 }, { x: 40, y: 130 }]
          ], { fillColor: 0xff00ff, strokeWidth: 0 }),
        target.renderPath(
          [
            [{ x: 240, y: 10 }, { x: 280, y: 150 }, { x: 280, y: 10 }],
            [{ x: 260, y: 30 }, { x: 260, y: 70 }, { x: 270, y: 70 }, { x: 270, y: 30 }]
          ],
          {
            fillPattern: {
              width: 10,
              height: 10,
              path: [{
                lines: [
                  [{ x: 0, y: 5 }, { x: 5, y: 0 }],
                  [{ x: 10, y: 5 }, { x: 5, y: 10 }],
                ],
                options: {
                  strokeColor: 0x0000ff,
                  // lineCap: 'square',
                }
              }]
            },
            strokeWidth: 0,
          },
        ),
        target.renderRect(50, 50, 100, 80, { strokeColor: 0xff00ff, angle: 60 }),
        target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 50, 250, 50, 50, { crossOrigin: '' })
      ],
      300,
      300,
    )
  }
  return (
    <div>
      {render(reactSvgRenderTarget)}
      {render(reactCanvasRenderTarget)}
      {render(reactWebglRenderTarget)}
    </div>
  )
}

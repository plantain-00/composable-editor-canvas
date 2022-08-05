import React from "react"
import { reactCanvasRenderTarget, ReactRenderTarget, reactSvgRenderTarget, reactWebglRenderTarget } from "../src"

export default () => {
  const renderArcs = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderArc(40, 20, 50, 0, 120, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderArc(40, 40, 80, 0, 120, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderArc(50, 50, 100, 0, 120, { strokeColor: 0x00ff00 }),
    target.renderArc(60, 60, 100, 0, 120, { strokeWidth: 5 }),
    target.renderArc(70, 70, 100, 0, 120, { dashArray: [4] }),
    target.renderArc(170, 170, 30, 0, 120, { counterclockwise: true }),
  ], 230, 250)
  const renderCircles = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderCircle(110, 110, 50, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderCircle(110, 110, 80, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderCircle(110, 110, 90, { strokeColor: 0x00ff00 }),
    target.renderCircle(110, 110, 100, { strokeWidth: 5 }),
    target.renderCircle(110, 110, 110, { dashArray: [4] }),
  ], 230, 250)
  const renderTexts = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderText(10, 30, 'Hello World!', 0xff0000, 30, 'monospace'),
    target.renderText(10, 60, 'Hello World!', 0xff0000, 30, 'monospace', { fontWeight: 'bold' }),
    target.renderText(10, 90, 'Hello World!', 0xff0000, 30, 'monospace', { fontStyle: 'italic' }),
  ], 230, 250)

  function render<T>(target: ReactRenderTarget<T>) {
    return target.renderResult(
      [
        target.renderGroup(
          [
            target.renderPolygon([{ x: 100, y: 100 }, { x: 100, y: 200 }, { x: 200, y: 150 }], {
              strokeColor: 0xff0000,
              fillPattern: {
                width: 500,
                height: 500,
                pattern: () => target.renderGroup([
                  target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', -120, -150, 500, 500, { crossOrigin: '' }),
                  target.renderText(150, 150, 'EEE', 0xffff00, 30, 'monospace'),
                ]),
              }
            }),
            target.renderText(50, 100, 'aaa', 0xffff00, 30, 'monospace'),
          ],
          { translate: { x: 100, y: 100 }, angle: 45, base: { x: 200, y: 150 } },
        ),
        target.renderEllipse(150, 150, 50, 100, { strokeColor: 0xff0000, angle: 30 }),
        target.renderPolyline([{ x: 10, y: 10 }, { x: 150, y: 150 }, { x: 100, y: 200 }, { x: 200, y: 200 }], { strokeColor: 0x0000ff, dashArray: [4] }),
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
              pattern: () => target.renderPath([
                [{ x: 0, y: 5 }, { x: 5, y: 0 }],
                [{ x: 10, y: 5 }, { x: 5, y: 10 }],
              ], {
                strokeColor: 0x0000ff,
                // lineCap: 'square',
              }),
            },
            strokeWidth: 0,
          },
        ),
        target.renderRect(50, 50, 100, 80, { strokeColor: 0xff00ff, angle: 60 }),
        target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 50, 250, 50, 50, { crossOrigin: '' }),
      ],
      300,
      300,
    )
  }

  return (
    <div>
      {renderArcs(reactSvgRenderTarget)}
      {renderArcs(reactCanvasRenderTarget)}
      {renderArcs(reactWebglRenderTarget)}
      {renderCircles(reactSvgRenderTarget)}
      {renderCircles(reactCanvasRenderTarget)}
      {renderCircles(reactWebglRenderTarget)}
      {renderTexts(reactSvgRenderTarget)}
      {renderTexts(reactCanvasRenderTarget)}
      {renderTexts(reactWebglRenderTarget)}
      {render(reactSvgRenderTarget)}
      {render(reactCanvasRenderTarget)}
      {render(reactWebglRenderTarget)}
    </div>
  )
}

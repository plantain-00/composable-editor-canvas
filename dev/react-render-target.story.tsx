import React from "react"
import { m3, reactCanvasRenderTarget, ReactRenderTarget, reactSvgRenderTarget, reactWebglRenderTarget } from "../src"

export default () => {
  const renderArcs = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderArc(40, 20, 50, 0, 120, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderArc(40, 40, 80, 0, 120, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderArc(50, 50, 100, 0, 120, { strokeColor: 0x00ff00 }),
    target.renderArc(60, 60, 100, 0, 120, { strokeWidth: 5 }),
    target.renderArc(70, 70, 100, 0, 120, { dashArray: [4] }),
    target.renderArc(170, 170, 30, 0, 120, { counterclockwise: true }),
  ], 230, 200)

  const renderCircles = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderCircle(70, 110, 40, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderCircle(150, 110, 40, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderCircle(110, 110, 90, { strokeColor: 0x00ff00 }),
    target.renderCircle(110, 110, 100, { strokeWidth: 5 }),
    target.renderCircle(110, 110, 110, { dashArray: [4] }),
  ], 230, 220)

  const renderTexts = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderText(10, 30, 'Hello World!', 0xff0000, 30, 'monospace'),
    target.renderText(10, 60, 'Hello World!', 0xff0000, 30, 'monospace', { fontWeight: 'bold' }),
    target.renderText(10, 90, 'Hello World!', 0xff0000, 30, 'monospace', { fontStyle: 'italic' }),
    target.renderText(10, 150, 'Hello', { width: 4, height: 4, pattern: () => target.renderPath([[{ x: 0, y: 2 }, { x: 2, y: 0 }], [{ x: 4, y: 2 }, { x: 2, y: 4 }]], { strokeColor: 0x0000ff }) }, 70, 'monospace'),
  ], 230, 180)

  const renderEllipseArcs = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderEllipseArc(40, 20, 50, 30, 0, 120, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderEllipseArc(40, 40, 80, 40, 0, 120, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderEllipseArc(50, 50, 100, 50, 0, 120, { strokeColor: 0x00ff00 }),
    target.renderEllipseArc(60, 60, 100, 50, 0, 120, { strokeWidth: 5 }),
    target.renderEllipseArc(70, 70, 100, 50, 0, 120, { dashArray: [4] }),
    target.renderEllipseArc(170, 170, 30, 15, 0, 120, { counterclockwise: true }),
    target.renderEllipseArc(110, 110, 80, 40, 0, 120, { strokeColor: 0x00ff00, angle: 30 }),
  ], 230, 200)

  const renderEllipses = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderEllipse(70, 60, 40, 20, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderEllipse(150, 60, 40, 20, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderEllipse(110, 60, 90, 45, { strokeColor: 0x00ff00 }),
    target.renderEllipse(110, 60, 100, 50, { strokeWidth: 5 }),
    target.renderEllipse(110, 60, 110, 55, { dashArray: [4] }),
    target.renderEllipse(110, 140, 80, 40, { strokeColor: 0x0000ff, angle: 30 }),
  ], 230, 200)

  const renderRects = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderRect(10, 10, 50, 30, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderRect(70, 10, 80, 40, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderRect(90, 60, 100, 140, { strokeColor: 0x00ff00 }),
    target.renderRect(100, 70, 80, 120, { strokeWidth: 5 }),
    target.renderRect(110, 80, 60, 100, { dashArray: [4] }),
    target.renderRect(10, 90, 60, 30, { angle: 60 }),
  ], 230, 220)

  const renderPaths = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderPath([[{ x: 10, y: 10 }, { x: 50, y: 150 }, { x: 50, y: 10 }], [{ x: 30, y: 30 }, { x: 30, y: 70 }, { x: 40, y: 70 }, { x: 40, y: 30 }]], { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) }, strokeWidth: 0 }),
    target.renderPath([[{ x: 60, y: 10 }, { x: 100, y: 150 }, { x: 100, y: 10 }], [{ x: 80, y: 30 }, { x: 80, y: 70 }, { x: 90, y: 70 }, { x: 90, y: 30 }]], { fillColor: 0xff0000, strokeWidth: 0 }),
  ], 230, 220)

  const renderImages = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 10, 10, 50, 50, { crossOrigin: '' }),
  ], 230, 220)

  const renderViewports = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderCircle(50, 50, 20),
    target.renderCircle(50, 50, 35),
    target.renderRect(120, 10, 80, 80, {
      fillPattern: {
        width: 1000, height: 1000, pattern: () => target.renderGroup([
          target.renderCircle(50, 50, 20),
          target.renderCircle(50, 50, 35),
        ], { translate: { x: 100, y: 0 } })
      }
    }),
    target.renderCircle(180, 150, 50, {
      fillPattern: {
        width: 1000, height: 1000, pattern: () => target.renderGroup([
          target.renderCircle(50, 50, 20),
          target.renderCircle(50, 50, 35),
        ], { matrix: m3.multiply(m3.translation(150, 150), m3.scaling(0.7, 0.7)) })
      }
    }),
  ], 230, 200)

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
        target.renderPolyline([{ x: 10, y: 10 }, { x: 150, y: 150 }, { x: 100, y: 200 }, { x: 200, y: 200 }], { strokeColor: 0x0000ff, dashArray: [4] }),
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
      {renderEllipseArcs(reactSvgRenderTarget)}
      {renderEllipseArcs(reactCanvasRenderTarget)}
      {renderEllipseArcs(reactWebglRenderTarget)}
      {renderEllipses(reactSvgRenderTarget)}
      {renderEllipses(reactCanvasRenderTarget)}
      {renderEllipses(reactWebglRenderTarget)}
      {renderRects(reactSvgRenderTarget)}
      {renderRects(reactCanvasRenderTarget)}
      {renderRects(reactWebglRenderTarget)}
      {renderPaths(reactSvgRenderTarget)}
      {renderPaths(reactCanvasRenderTarget)}
      {renderPaths(reactWebglRenderTarget)}
      {renderImages(reactSvgRenderTarget)}
      {renderImages(reactCanvasRenderTarget)}
      {renderImages(reactWebglRenderTarget)}
      {renderViewports(reactSvgRenderTarget)}
      {renderViewports(reactCanvasRenderTarget)}
      {renderViewports(reactWebglRenderTarget)}
      {render(reactSvgRenderTarget)}
      {render(reactCanvasRenderTarget)}
      {render(reactWebglRenderTarget)}
    </div>
  )
}

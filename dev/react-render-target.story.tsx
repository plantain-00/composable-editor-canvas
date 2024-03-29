import React from "react"
import { m3, reactCanvasRenderTarget, ReactRenderTarget, reactSvgRenderTarget, reactWebglRenderTarget, reactWebgpuRenderTarget } from "../src"
import { OffsetXContext } from "./story-app"

export default () => {
  const renderArcs = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderArc(40, 20, 50, 0, 120, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderArc(40, 40, 80, 0, 120, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderArc(50, 50, 100, 0, 120, { strokeColor: 0x00ff00 }),
    target.renderArc(60, 60, 100, 0, 120, { strokeWidth: 5 }),
    target.renderArc(70, 70, 100, 0, 120, { dashArray: [4] }),
    target.renderArc(170, 170, 30, 0, 120, { counterclockwise: true }),
    target.renderArc(170, 170, 20, 120, 0, { counterclockwise: true }),
    target.renderArc(120, 200, 15, 0, 360,),
    target.renderArc(120, 200, 10, 360, 0, { counterclockwise: true }),
    target.renderArc(170, 170, 10, 0, 120, { closed: true }),
  ], 230, 310)

  const renderCircles = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderCircle(70, 100, 30, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderCircle(150, 100, 30, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderCircle(110, 100, 70, { strokeColor: 0x00ff00 }),
    target.renderCircle(110, 100, 80, { strokeWidth: 5 }),
    target.renderCircle(110, 100, 90, { dashArray: [4] }),
  ], 230, 200)

  const renderTexts = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderText(10, 30, 'Hello World!', 0xff0000, 30, 'monospace'),
    target.renderText(10, 60, 'Hello World!', 0xff0000, 30, 'monospace', { fontWeight: 'bold' }),
    target.renderText(10, 90, 'Hello World!', 0xff0000, 30, 'monospace', { fontStyle: 'italic' }),
    target.renderText(10, 150, 'He', { width: 4, height: 4, pattern: () => target.renderPath([[{ x: 0, y: 2 }, { x: 2, y: 0 }], [{ x: 4, y: 2 }, { x: 2, y: 4 }]], { strokeColor: 0x0000ff }) }, 70, 'monospace'),
    target.renderText(90, 150, 'l', undefined, 70, 'monospace', { strokeColor: 0xff0000 }),
    target.renderText(130, 150, 'l', undefined, 70, 'monospace', { strokeColor: 0xff0000, dashArray: [2] }),
    target.renderText(170, 150, 'l', undefined, 70, 'monospace', { strokeColor: 0xff0000, strokeWidth: 3 }),
    target.renderText(10, 200, 'H', 0x00ff00, 70, 'monospace', { strokeColor: 0xff0000, strokeWidth: 3 }),
    target.renderText(50, 200, 'H', 0x00ff00, 70, 'monospace', { strokeColor: 0xff0000, strokeWidth: 3, strokeOpacity: 0.3, fillOpacity: 0.3 }),
    target.renderText(90, 200, 'H', undefined, 70, 'monospace', { strokePattern: { width: 4, height: 4, pattern: () => target.renderPath([[{ x: 0, y: 2 }, { x: 2, y: 0 }], [{ x: 4, y: 2 }, { x: 2, y: 4 }]], { strokeColor: 0x0000ff }) }, strokeWidth: 3 }),
    target.renderText(130, 200, 'H', undefined, 70, 'monospace', { strokeLinearGradient: { start: { x: 150, y: 230 }, end: { x: 190, y: 150 }, stops: [{ offset: 0.2, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 0.8, color: 0x00ff00 }] }, strokeWidth: 3 }),
    target.renderText(170, 200, 'H', undefined, 70, 'monospace', { strokeRadialGradient: { start: { x: 190, y: 185, r: 5 }, end: { x: 190, y: 180, r: 30 }, stops: [{ offset: 0, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 1, color: 0x00ff00 }] }, strokeWidth: 3 }),
    target.renderText(70, 225, 'center', 0x00ff00, 30, 'monospace', { textAlign: 'center' }),
    target.renderText(130, 250, 'right', 0x00ff00, 30, 'monospace', { textAlign: 'right' }),
    target.renderText(130, 250, 'H', undefined, 70, 'monospace', { fillLinearGradient: { start: { x: 150, y: 280 }, end: { x: 190, y: 200 }, stops: [{ offset: 0.2, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 0.8, color: 0x00ff00 }] }, strokeWidth: 3 }),
    target.renderText(170, 250, 'H', undefined, 70, 'monospace', { fillRadialGradient: { start: { x: 190, y: 235, r: 5 }, end: { x: 190, y: 230, r: 30 }, stops: [{ offset: 0, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 1, color: 0x00ff00 }] }, strokeWidth: 3 }),
    target.renderText(10, 300, 'fgj', 0x00ff00, 30, 'monospace', { textBaseline: 'alphabetic' }),
    target.renderText(65, 300, 'fgj', 0x00ff00, 30, 'monospace', { textBaseline: 'top' }),
    target.renderText(120, 300, 'fgj', 0x00ff00, 30, 'monospace', { textBaseline: 'middle' }),
    target.renderText(175, 300, 'fgj', 0x00ff00, 30, 'monospace', { textBaseline: 'bottom' }),
  ], 230, 550)

  const renderEllipseArcs = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderEllipseArc(40, 10, 50, 30, 0, 120, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderEllipseArc(40, 30, 80, 40, 0, 120, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderEllipseArc(50, 40, 100, 50, 0, 120, { strokeColor: 0x00ff00 }),
    target.renderEllipseArc(60, 50, 100, 50, 0, 120, { strokeWidth: 5 }),
    target.renderEllipseArc(70, 60, 100, 50, 0, 120, { dashArray: [4] }),
    target.renderEllipseArc(170, 160, 30, 15, 0, 120, { counterclockwise: true }),
    target.renderEllipseArc(170, 160, 30, 25, 120, 20, { counterclockwise: true }),
    target.renderEllipseArc(110, 100, 80, 40, 0, 120, { strokeColor: 0x00ff00, angle: 30 }),
    target.renderEllipseArc(120, 200, 30, 15, 0, 360,),
    target.renderEllipseArc(120, 200, 20, 10, 360, 0, { counterclockwise: true }),
    target.renderEllipseArc(170, 160, 25, 20, 0, 120, { closed: true }),
  ], 230, 330)

  const renderEllipses = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderEllipse(70, 60, 40, 20, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderEllipse(150, 60, 40, 20, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderEllipse(110, 60, 90, 45, { strokeColor: 0x00ff00 }),
    target.renderEllipse(110, 60, 100, 50, { strokeWidth: 5 }),
    target.renderEllipse(110, 60, 110, 55, { dashArray: [4] }),
    target.renderEllipse(110, 140, 80, 40, { strokeColor: 0x0000ff, angle: 30 }),
    target.renderEllipse(110, 30, 10, 20, { angle: 60, fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
  ], 230, 230)

  const renderRects = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderRect(10, 10, 50, 30, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderRect(70, 10, 80, 40, { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderRect(90, 60, 100, 140, { strokeColor: 0x00ff00 }),
    target.renderRect(100, 70, 80, 120, { strokeWidth: 5 }),
    target.renderRect(110, 80, 60, 100, { dashArray: [4] }),
    target.renderRect(10, 90, 60, 30, { angle: 60 }),
  ], 230, 220)

  const renderPaths = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderPath([[{ x: 5, y: 10 }, { x: 45, y: 150 }, { x: 45, y: 10 }], [{ x: 25, y: 30 }, { x: 25, y: 70 }, { x: 35, y: 70 }, { x: 35, y: 30 }]], { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) }, strokeWidth: 0 }),
    target.renderPath([[{ x: 50, y: 10 }, { x: 90, y: 150 }, { x: 90, y: 10 }], [{ x: 70, y: 30 }, { x: 70, y: 70 }, { x: 80, y: 70 }, { x: 80, y: 30 }]], { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderPath([[{ x: 95, y: 10 }, { x: 135, y: 150 }, { x: 135, y: 10 }], [{ x: 115, y: 30 }, { x: 115, y: 70 }, { x: 125, y: 70 }, { x: 125, y: 30 }]], { strokeColor: 0x00ff00 }),
    target.renderPath([[{ x: 140, y: 10 }, { x: 180, y: 150 }, { x: 180, y: 10 }], [{ x: 160, y: 30 }, { x: 160, y: 70 }, { x: 170, y: 70 }, { x: 170, y: 30 }]], { fillPattern: { width: 100, height: 100, pattern: () => target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 0, 0, 100, 100, { crossOrigin: '' }) }, strokeWidth: 0 }),
    target.renderPath([[{ x: 185, y: 10 }, { x: 225, y: 150 }, { x: 225, y: 10 }], [{ x: 205, y: 30 }, { x: 205, y: 70 }, { x: 215, y: 70 }, { x: 215, y: 30 }]], { dashArray: [4] }),
    target.renderPath([[{ x: 5, y: 160 }, { x: 35, y: 160 }, { x: 35, y: 190 }]], { strokeColor: 0xff0000, strokeWidth: 5 }),
    target.renderPath([[{ x: 45, y: 160 }, { x: 75, y: 160 }, { x: 75, y: 190 }]], { strokeColor: 0xff0000, strokeWidth: 5, closed: true }),
    target.renderPath([[{ x: 85, y: 160 }, { x: 125, y: 160 }, { x: 125, y: 190 }]], { strokeColor: 0xff0000, strokeWidth: 5, closed: true, miterLimit: 2 }),
    target.renderPath([[{ x: 135, y: 160 }, { x: 175, y: 160 }, { x: 175, y: 190 }]], { strokeColor: 0xff0000, strokeWidth: 10, lineJoin: 'bevel' }),
    target.renderPath([[{ x: 185, y: 160 }, { x: 225, y: 160 }, { x: 225, y: 190 }]], { strokeColor: 0xff0000, strokeWidth: 10, lineJoin: 'round' }),
    target.renderPath([[{ x: 10, y: 210 }, { x: 40, y: 210 }, { x: 40, y: 240 }]], { strokeColor: 0xff0000, strokeWidth: 10, lineCap: 'square' }),
    target.renderPath([[{ x: 55, y: 210 }, { x: 85, y: 210 }, { x: 85, y: 240 }]], { strokeColor: 0xff0000, strokeWidth: 10, lineCap: 'round' }),
    target.renderPath([[{ x: 100, y: 210 }, { x: 220, y: 210 }]], { dashArray: [12, 4] }),
    target.renderPath([[{ x: 100, y: 220 }, { x: 220, y: 220 }]], { dashArray: [12, 4], dashOffset: 4 }),
    target.renderPath([[{ x: 5, y: 250 }, { x: 45, y: 390 }, { x: 45, y: 250 }], [{ x: 25, y: 270 }, { x: 25, y: 310 }, { x: 35, y: 310 }, { x: 35, y: 270 }]], { fillLinearGradient: { start: { x: 5, y: 250 }, end: { x: 45, y: 390 }, stops: [{ offset: 0.2, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 0.8, color: 0x00ff00 }] }, strokeWidth: 0 }),
    target.renderPath([[{ x: 50, y: 250 }, { x: 90, y: 390 }, { x: 90, y: 250 }], [{ x: 70, y: 270 }, { x: 70, y: 310 }, { x: 80, y: 310 }, { x: 80, y: 270 }]], { fillRadialGradient: { start: { x: 70, y: 320, r: 10 }, end: { x: 70, y: 320, r: 70 }, stops: [{ offset: 0, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 1, color: 0x00ff00 }] }, strokeWidth: 0 }),
    target.renderPath([[{ x: 95, y: 250 }, { x: 135, y: 390 }, { x: 135, y: 250 }], [{ x: 115, y: 270 }, { x: 115, y: 310 }, { x: 125, y: 310 }, { x: 125, y: 270 }]], { fillColor: 0xff0000, fillOpacity: 0.3, strokeOpacity: 0.3 }),
    target.renderPath([[{ x: 140, y: 250 }, { x: 180, y: 390 }, { x: 180, y: 250 }], [{ x: 160, y: 270 }, { x: 160, y: 310 }, { x: 170, y: 310 }, { x: 170, y: 270 }]], { fillRadialGradient: { start: { x: 160, y: 320, r: 10 }, end: { x: 160, y: 320, r: 70 }, stops: [{ offset: 0, color: 0xff0000, opacity: 0.3 }, { offset: 0.5, color: 0xffff00, opacity: 0.3 }, { offset: 1, color: 0x00ff00, opacity: 0.3 }] }, strokeWidth: 0 }),
    target.renderPath([[{ x: 185, y: 250 }, { x: 225, y: 390 }, { x: 225, y: 250 }], [{ x: 205, y: 270 }, { x: 205, y: 310 }, { x: 215, y: 310 }, { x: 215, y: 270 }]], { strokePattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) }, strokeWidth: 5 }),
    target.renderPath([[{ x: 5, y: 400 }, { x: 45, y: 540 }, { x: 45, y: 400 }], [{ x: 25, y: 420 }, { x: 25, y: 460 }, { x: 35, y: 460 }, { x: 35, y: 420 }]], { strokeLinearGradient: { start: { x: 5, y: 400 }, end: { x: 45, y: 540 }, stops: [{ offset: 0.2, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 0.8, color: 0x00ff00 }] }, strokeWidth: 5 }),
    target.renderPath([[{ x: 50, y: 400 }, { x: 90, y: 540 }, { x: 90, y: 400 }], [{ x: 70, y: 420 }, { x: 70, y: 460 }, { x: 80, y: 460 }, { x: 80, y: 420 }]], { strokeRadialGradient: { start: { x: 70, y: 470, r: 10 }, end: { x: 70, y: 470, r: 70 }, stops: [{ offset: 0, color: 0xff0000 }, { offset: 0.5, color: 0xffff00 }, { offset: 1, color: 0x00ff00 }] }, strokeWidth: 5 }),
    target.renderPath([[{ x: 110, y: 400 }, { x: 110, y: 470 }, { x: 110, y: 540 }]], { strokeColor: 0xff0000, strokeWidth: 10 }),
    target.renderPath([[{ x: 130, y: 400 }, { x: 130, y: 540 }, { x: 130, y: 470 }]], { strokeColor: 0xff0000, strokeWidth: 10 }),
  ], 230, 620)

  const renderImages = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 0, 0, 75, 65, { crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 77, 0, 75, 65, { opacity: 0.5, crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 154, 0, 75, 65, { filters: [{ type: 'brightness', value: 2 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 0, 70, 75, 65, { filters: [{ type: 'contrast', value: 2 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 77, 70, 75, 65, { filters: [{ type: 'hue-rotate', value: 90 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 154, 70, 75, 65, { filters: [{ type: 'saturate', value: 2 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 0, 140, 75, 65, { filters: [{ type: 'saturate', value: 2 }, { type: 'hue-rotate', value: 90 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 77, 140, 75, 65, { filters: [{ type: 'saturate', value: 2 }, { type: 'hue-rotate', value: 90 }, { type: 'contrast', value: 2 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 154, 140, 75, 65, { filters: [{ type: 'grayscale', value: 1 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 0, 210, 75, 65, { filters: [{ type: 'sepia', value: 1 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 77, 210, 75, 65, { filters: [{ type: 'invert', value: 1 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 154, 210, 75, 65, { filters: [{ type: 'opacity', value: 0.5 }], crossOrigin: '' }),
    target.renderImage('https://farm9.staticflickr.com/8873/18598400202_3af67ef38f_z_d.jpg', 0, 280, 75, 65, { filters: [{ type: 'blur', value: 2 }], crossOrigin: '' }),
  ], 230, 370)

  const renderPolylines = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderPolyline([{ x: 5, y: 10 }, { x: 45, y: 150 }, { x: 45, y: 10 }], { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderPolyline([{ x: 50, y: 10 }, { x: 90, y: 150 }, { x: 90, y: 10 }], { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderPolyline([{ x: 95, y: 10 }, { x: 135, y: 150 }, { x: 135, y: 10 }], { strokeColor: 0x00ff00 }),
    target.renderPolyline([{ x: 140, y: 10 }, { x: 180, y: 150 }, { x: 180, y: 10 }], { strokeWidth: 5 }),
    target.renderPolyline([{ x: 185, y: 10 }, { x: 225, y: 150 }, { x: 225, y: 10 }], { dashArray: [4] }),
    target.renderPolyline([{ x: 195, y: 10 }, { x: 215, y: 80 }, { x: 215, y: 10 }], { closed: true }),
  ], 230, 220)

  const renderPolygons = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderPolygon([{ x: 5, y: 10 }, { x: 45, y: 150 }, { x: 45, y: 10 }], { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
    target.renderPolygon([{ x: 50, y: 10 }, { x: 90, y: 150 }, { x: 90, y: 10 }], { fillColor: 0xff0000, strokeWidth: 0 }),
    target.renderPolygon([{ x: 95, y: 10 }, { x: 135, y: 150 }, { x: 135, y: 10 }], { strokeColor: 0x00ff00 }),
    target.renderPolygon([{ x: 140, y: 10 }, { x: 180, y: 150 }, { x: 180, y: 10 }], { strokeWidth: 5 }),
    target.renderPolygon([{ x: 185, y: 10 }, { x: 225, y: 150 }, { x: 225, y: 10 }], { dashArray: [4] }),
  ], 230, 190)

  const renderPathCommands = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderPathCommands([{ type: 'move', to: { x: 220, y: 10 } }, { type: 'arc', from: { x: 220, y: 80 }, to: { x: 150, y: 10 }, radius: 20 }, { type: 'line', to: { x: 150, y: 10 } }, { type: 'quadraticCurve', cp: { x: 150, y: 90 }, to: { x: 110, y: 70 } }, { type: 'bezierCurve', cp1: { x: 70, y: 20 }, cp2: { x: 40, y: 80 }, to: { x: 10, y: 10 } }, { type: 'ellipseArc', rx: 30, ry: 20, angle: 0, largeArc: false, sweep: true, to: { x: 50, y: 30 } }], { strokeColor: 0x00ff00 }),
    target.renderPathCommands([{ type: 'move', to: { x: 210, y: 10 } }, { type: 'arc', from: { x: 210, y: 80 }, to: { x: 160, y: 10 }, radius: 20 }, { type: 'line', to: { x: 160, y: 10 } }], { closed: true }),
  ], 230, 120)

  const renderGroups = <T,>(target: ReactRenderTarget<T>) => {
    const items = [
      target.renderCircle(50, 50, 20),
      target.renderCircle(50, 50, 35),
      target.renderText(0, 40, 'abc', 0xff0000, 30, 'monospace'),
      target.renderGroup([target.renderCircle(50, 50, 15),], { translate: { x: 20, y: 20 } })
    ]
    return target.renderResult([
      target.renderGroup(items, { opacity: 0.2, translate: { x: 10, y: 0 } }),
      target.renderRect(120, 10, 80, 80, { clip: () => target.renderGroup(items, { translate: { x: 100, y: 0 } }) }),
      target.renderCircle(180, 150, 50, { clip: () => target.renderGroup(items, { matrix: m3.multiply(m3.translation(150, 150), m3.scaling(0.7, 0.7)) }) }),
      target.renderPath([[{ x: 0, y: 200 }, { x: 120, y: 200 }, { x: 120, y: 300 }, { x: 0, y: 300 }, { x: 0, y: 200 }], [{ x: 55, y: 230 }, { x: 90, y: 220 }, { x: 90, y: 260 }, { x: 50, y: 260 }, { x: 55, y: 230 }]], { clip: () => target.renderGroup(items, { translate: { x: 10, y: 200 } }), strokeWidth: 0 }),
      target.renderPolygon([{ x: 55, y: 230 }, { x: 90, y: 220 }, { x: 90, y: 260 }, { x: 50, y: 260 }]),
      target.renderRect(30, 100, 80, 80, {
        clip: () => target.renderGroup([
          target.renderCircle(90, 50, 20, { fillPattern: { width: 10, height: 10, pattern: () => target.renderPath([[{ x: 0, y: 5 }, { x: 5, y: 0 }], [{ x: 10, y: 5 }, { x: 5, y: 10 }]], { strokeColor: 0x0000ff }) } }),
          target.renderCircle(30, 50, 20),
        ], { translate: { x: 10, y: 90 } })
      }),
      target.renderGroup(items, { translate: { x: 110, y: 200 }, base: { x: 50, y: 50 }, scale: { x: 0.6, y: 0.3 } }),
    ], 230, 550)
  }

  const renderRay = <T,>(target: ReactRenderTarget<T>) => target.renderResult([
    target.renderRay(50, 50, 30),
    target.renderRay(80, 50, 30, { bidirectional: true }),
    target.renderGroup([
      target.renderRay(60, 60, 30),
      target.renderGroup([
        target.renderRay(60, 60, 30),
      ], { translate: { x: 0, y: -20 } })
    ], { translate: { x: -20, y: 0 } })
  ], 230, 90)

  const { setOffset } = React.useContext(OffsetXContext)
  React.useEffect(() => {
    if (navigator.gpu) {
      setOffset?.(230)
    }
  }, [setOffset])
  return (
    <div>
      <div style={{
        display: 'flex',
        height: '40px',
        alignItems: 'center',
        fontSize: '25px',
        justifyContent: 'space-around',
      }}>
        <span>{reactSvgRenderTarget.type}</span>
        <span>{reactCanvasRenderTarget.type}</span>
        <span>{reactWebglRenderTarget.type}</span>
        {navigator.gpu && <span>{reactWebgpuRenderTarget.type}</span>}
      </div>
      {renderArcs(reactSvgRenderTarget)}
      {renderArcs(reactCanvasRenderTarget)}
      {renderArcs(reactWebglRenderTarget)}
      {navigator.gpu && renderArcs(reactWebgpuRenderTarget)}
      <br />
      {renderCircles(reactSvgRenderTarget)}
      {renderCircles(reactCanvasRenderTarget)}
      {renderCircles(reactWebglRenderTarget)}
      {navigator.gpu && renderCircles(reactWebgpuRenderTarget)}
      <br />
      {renderTexts(reactSvgRenderTarget)}
      {renderTexts(reactCanvasRenderTarget)}
      {renderTexts(reactWebglRenderTarget)}
      {navigator.gpu && renderTexts(reactWebgpuRenderTarget)}
      <br />
      {renderEllipseArcs(reactSvgRenderTarget)}
      {renderEllipseArcs(reactCanvasRenderTarget)}
      {renderEllipseArcs(reactWebglRenderTarget)}
      {navigator.gpu && renderEllipseArcs(reactWebgpuRenderTarget)}
      <br />
      {renderEllipses(reactSvgRenderTarget)}
      {renderEllipses(reactCanvasRenderTarget)}
      {renderEllipses(reactWebglRenderTarget)}
      {navigator.gpu && renderEllipses(reactWebgpuRenderTarget)}
      <br />
      {renderRects(reactSvgRenderTarget)}
      {renderRects(reactCanvasRenderTarget)}
      {renderRects(reactWebglRenderTarget)}
      {navigator.gpu && renderRects(reactWebgpuRenderTarget)}
      <br />
      {renderPaths(reactSvgRenderTarget)}
      {renderPaths(reactCanvasRenderTarget)}
      {renderPaths(reactWebglRenderTarget)}
      {navigator.gpu && renderPaths(reactWebgpuRenderTarget)}
      <br />
      {renderImages(reactSvgRenderTarget)}
      {renderImages(reactCanvasRenderTarget)}
      {renderImages(reactWebglRenderTarget)}
      {navigator.gpu && renderImages(reactWebgpuRenderTarget)}
      <br />
      {renderPolylines(reactSvgRenderTarget)}
      {renderPolylines(reactCanvasRenderTarget)}
      {renderPolylines(reactWebglRenderTarget)}
      {navigator.gpu && renderPolylines(reactWebgpuRenderTarget)}
      <br />
      {renderPolygons(reactSvgRenderTarget)}
      {renderPolygons(reactCanvasRenderTarget)}
      {renderPolygons(reactWebglRenderTarget)}
      {navigator.gpu && renderPolygons(reactWebgpuRenderTarget)}
      <br />
      {renderPathCommands(reactSvgRenderTarget)}
      {renderPathCommands(reactCanvasRenderTarget)}
      {renderPathCommands(reactWebglRenderTarget)}
      {navigator.gpu && renderPathCommands(reactWebgpuRenderTarget)}
      <br />
      {renderGroups(reactSvgRenderTarget)}
      {renderGroups(reactCanvasRenderTarget)}
      {renderGroups(reactWebglRenderTarget)}
      {navigator.gpu && renderGroups(reactWebgpuRenderTarget)}
      <br />
      {renderRay(reactSvgRenderTarget)}
      {renderRay(reactCanvasRenderTarget)}
      {renderRay(reactWebglRenderTarget)}
      {navigator.gpu && renderRay(reactWebgpuRenderTarget)}
    </div>
  )
}

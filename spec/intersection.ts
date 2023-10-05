import test from 'ava'
import { getCircleEllipseIntersectionPoints, getCircleQuadraticCurveIntersectionPoints, getEllipseQuadraticCurveIntersectionPoints, getLineQuadraticCurveIntersectionPoints, getPerpendicularPointRadianToEllipse, getTangencyPointToEllipse, getTwoEllipseIntersectionPoints, getTwoQuadraticCurveIntersectionPoints } from '../src'

test('getCircleEllipseIntersectionPoints', (t) => {
  t.snapshot(getCircleEllipseIntersectionPoints({ x: 1412, y: 122, r: 70 }, { cx: 1404, cy: 119, rx: 104, ry: 49, angle: 30 }))
})

test('getTwoEllipseIntersectionPoints', (t) => {
  t.snapshot(getTwoEllipseIntersectionPoints({ cx: 1417, cy: 128, rx: 115, ry: 40, angle: 128 }, { cx: 1404, cy: 119, rx: 104, ry: 49, angle: 30 }))
})

test('getTangencyPointToEllipse', (t) => {
  t.snapshot(getTangencyPointToEllipse({ x: 1294, y: 126 }, { cx: 1404, cy: 119, rx: 104, ry: 49, angle: 30 }))
  t.snapshot(getTangencyPointToEllipse({ x: 50, y: 100 }, { cx: 0, cy: 0, rx: 100, ry: 50, angle: 90 }))
})

test('getPerpendicularPointRadianToEllipse', (t) => {
  t.snapshot(getPerpendicularPointRadianToEllipse({ x: 1294, y: 126 }, { cx: 1404, cy: 119, rx: 104, ry: 49, angle: 30 }))
  t.snapshot(getPerpendicularPointRadianToEllipse({ x: 50, y: 100 }, { cx: 0, cy: 0, rx: 100, ry: 50, angle: 90 }))
})

test('getLineQuadraticCurveIntersectionPoints', (t) => {
  t.snapshot(getLineQuadraticCurveIntersectionPoints({ x: 1260, y: 443 }, { x: 1416, y: 557 }, { from: { x: 1250, y: 470 }, cp: { x: 1367, y: 419 }, to: { x: 1386, y: 587 } }))
})

test('getCircleQuadraticCurveIntersectionPoints', (t) => {
  t.snapshot(getCircleQuadraticCurveIntersectionPoints({ x: 1315, y: 500, r: 45 }, { from: { x: 1250, y: 470 }, cp: { x: 1367, y: 419 }, to: { x: 1386, y: 587 } }))
})

test('getEllipseQuadraticCurveIntersectionPoints', (t) => {
  t.snapshot(getEllipseQuadraticCurveIntersectionPoints({ cx: 1325, cy: 472, rx: 63, ry: 43, angle: 39 }, { from: { x: 1250, y: 470 }, cp: { x: 1367, y: 419 }, to: { x: 1386, y: 587 } }))
})

test('getTwoQuadraticCurveIntersectionPoints', (t) => {
  t.snapshot(getTwoQuadraticCurveIntersectionPoints({ from: { x: 1282, y: 440 }, cp: { x: 1312, y: 527 }, to: { x: 1419, y: 519 } }, { from: { x: 1250, y: 470 }, cp: { x: 1367, y: 419 }, to: { x: 1386, y: 587 } }))
})

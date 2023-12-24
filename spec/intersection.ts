import test from 'ava'
import { getCircleBezierCurveIntersectionPoints, getCircleEllipseIntersectionPoints, getCircleQuadraticCurveIntersectionPoints, getEllipseBezierCurveIntersectionPoints, getEllipseQuadraticCurveIntersectionPoints, getLineBezierCurveIntersectionPoints, getLineQuadraticCurveIntersectionPoints, getPartOfBezierCurve, getPartOfQuadraticCurve, getPerpendicularPointRadianToEllipse, getPerpendicularPointToBezierCurve, getPerpendicularPointToQuadraticCurve, getQuadraticCurveBezierCurveIntersectionPoints, getTangencyPointToBezierCurve, getTangencyPointToEllipse, getTangencyPointToQuadraticCurve, getTwoBezierCurveIntersectionPoints, getTwoEllipseIntersectionPoints, getTwoQuadraticCurveIntersectionPoints } from '../src'

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

test('getPerpendicularPointToQuadraticCurve', (t) => {
  t.snapshot(getPerpendicularPointToQuadraticCurve({ x: 1307, y: 539 }, { from: { x: 1250, y: 470 }, cp: { x: 1367, y: 419 }, to: { x: 1386, y: 587 } }))
})

test('getTangencyPointToQuadraticCurve', (t) => {
  t.snapshot(getTangencyPointToQuadraticCurve({ x: 1339, y: 457 }, { from: { x: 1250, y: 470 }, cp: { x: 1367, y: 419 }, to: { x: 1386, y: 587 } }))
})

test('getLineBezierCurveIntersectionPoints', (t) => {
  t.snapshot(getLineBezierCurveIntersectionPoints({ x: 1474, y: 497 }, { x: 1655, y: 560 }, { from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }))
})

test('getCircleBezierCurveIntersectionPoints', (t) => {
  t.snapshot(getCircleBezierCurveIntersectionPoints({ x: 1566, y: 524, r: 32 }, { from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }))
})

test('getEllipseBezierCurveIntersectionPoints', (t) => {
  t.snapshot(getEllipseBezierCurveIntersectionPoints({ cx: 1571, cy: 524, rx: 53, ry: 20, angle: 61 }, { from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }))
})

test('getQuadraticCurveBezierCurveIntersectionPoints', (t) => {
  t.snapshot(getQuadraticCurveBezierCurveIntersectionPoints({ from: { x: 1540, y: 574 }, cp: { x: 1459, y: 481 }, to: { x: 1625, y: 539 } }, { from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }))
})

test('getTwoBezierCurveIntersectionPoints', (t) => {
  t.snapshot(getTwoBezierCurveIntersectionPoints({ from: { x: 1512, y: 496 }, cp1: { x: 1503, y: 559 }, cp2: { x: 1604, y: 483 }, to: { x: 1632, y: 574 } }, { from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }))
  t.snapshot(getTwoBezierCurveIntersectionPoints(
    {
      "from": {
        "x": 1004.4942900665154,
        "y": -832.66819655683
      },
      "cp1": {
        "x": 1106.0791721671899,
        "y": -762.4564860174203
      },
      "cp2": {
        "x": 1361.2338884289577,
        "y": -891.4513703497585
      },
      "to": {
        "x": 1168.4503250311775,
        "y": -378.30688542331404
      }
    }, {
    "from": {
      "x": 899.1203467548669,
      "y": -1265.6782875336849
    },
    "cp1": {
      "x": 643.9656304930988,
      "y": -899.956527558484
    },
    "cp2": {
      "x": 1216.6462158806225,
      "y": -1061.5545145242704
    },
    "to": {
      "x": 1032.367809691568,
      "y": -491.7089815396553
    }
  },
  ))
})

test('getTangencyPointToBezierCurve', (t) => {
  t.snapshot(getTangencyPointToBezierCurve({ x: 1556, y: 494 }, { from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }))
})

test('getPerpendicularPointToBezierCurve', (t) => {
  t.snapshot(getPerpendicularPointToBezierCurve({ x: 1556, y: 494 }, { from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }))
})

test('getPartOfQuadraticCurve', (t) => {
  t.snapshot(getPartOfQuadraticCurve({ from: { x: 1540, y: 574 }, cp: { x: 1459, y: 481 }, to: { x: 1625, y: 539 } }, 0.2, 0.8))
})

test('getPartOfBezierCurve', (t) => {
  t.snapshot(getPartOfBezierCurve({ from: { x: 1498, y: 488 }, cp1: { x: 1547, y: 584 }, cp2: { x: 1637, y: 465 }, to: { x: 1620, y: 586 } }, 0.2, 0.8))
})

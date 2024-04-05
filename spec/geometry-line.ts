import test from 'ava'
import { GeometryLine, getNearestGeometryLines } from '../src'

const lines: GeometryLine[] = [
  {
    "type": "arc",
    "curve": {
      "x": 449.2808443495757,
      "y": 274.09241492405556,
      "r": 101.32361075190516,
      "startAngle": -90,
      "endAngle": -154.75338341707672,
      "counterclockwise": true
    }
  },
  [
    {
      "x": 346.7064646321841,
      "y": 172.76880417215045
    },
    {
      "x": 449.28084434957566,
      "y": 172.76880417215045
    }
  ],
  {
    "type": "arc",
    "curve": {
      "x": 449.2808443495757,
      "y": 71.44519342024529,
      "r": 101.32361075190516,
      "startAngle": 154.75338341707672,
      "endAngle": 90,
      "counterclockwise": true
    }
  },
  {
    "type": "arc",
    "curve": {
      "x": 347.95723359767055,
      "y": 172.7688041721499,
      "r": 101.32361075190516,
      "startAngle": 3.268496584496461e-13,
      "endAngle": -64.75338341707639,
      "counterclockwise": true
    }
  },
  [
    {
      "x": 449.28084434957566,
      "y": 172.76880417215045
    },
    {
      "x": 449.28084434957566,
      "y": 61.48381736974602
    }
  ],
  {
    "type": "arc",
    "curve": {
      "x": 550.604455101481,
      "y": 172.7688041721499,
      "r": 101.32361075190516,
      "startAngle": 244.7533834170764,
      "endAngle": 179.99999999999966,
      "counterclockwise": true
    }
  },
]

test('getNearestGeometryLines', t => {
  t.snapshot(getNearestGeometryLines({ x: 459.28084434957566, y: 182.76880417215045 }, lines))
  t.snapshot(getNearestGeometryLines({ x: 512, y: 184 }, lines))
  t.snapshot(getNearestGeometryLines({ x: 460, y: 231 }, lines))
})

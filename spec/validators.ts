import test from 'ava'
import { validate, number, optional, or, string, and, minItems, isRecord, Path, ValidationResult, boolean } from '../src'

interface Point {
  x: number
  y: number
  z?: number
}
const Point = {
  x: number,
  y: number,
  z: optional(number),
}

test('basic', (t) => {
  t.deepEqual(validate({ x: 1, y: 2 }, Point), true)
  t.deepEqual(validate({ x: 1, y: 2, z: 3 }, Point), true)
  t.deepEqual(validate({ x: 1, y: '' }, Point), { path: ['y'], expect: "number" })
  t.deepEqual(validate({ x: 1, y: 2, z: '' }, Point), { path: ['z'], expect: "number" })
})

test('remove additional properties', (t) => {
  const point = { x: 1, y: 2, a: 3 }
  t.deepEqual(validate(point, Point), true)
  t.deepEqual(point, { x: 1, y: 2 })
})

interface Content1 {
  pointOrId: string | Point
}
const Content1 = {
  pointOrId: or(string, Point)
}

test('or', (t) => {
  t.deepEqual(validate({ pointOrId: 'a' }, Content1), true)
  t.deepEqual(validate({ pointOrId: { x: 1, y: 1 } }, Content1), true)
  t.deepEqual(validate({ pointOrId: { x: 1, z: 1 } }, Content1), { path: ['pointOrId'], expect: "or", args: [{ path: [], expect: "string" }, { path: ['y'], expect: "number" }] })
})

interface ColoredPoint extends Point {
  color: string
}
const ColoredPoint = and(Point, {
  color: string
})

test('inherit', (t) => {
  t.deepEqual(validate({ x: 1, y: 2, color: 'red' }, ColoredPoint), true)
  t.deepEqual(validate({ x: 1, y: 2, color1: 'red' }, ColoredPoint), { path: ['color'], expect: "string" })
})

interface Line {
  p1: Point
  p2: Point
}
const Line = {
  p1: Point,
  p2: Point,
}
interface Content2 {
  lines: Line[]
}
const Content2 = {
  lines: minItems(2, [Line]),
}

test('complex', (t) => {
  t.deepEqual(validate({
    lines: [
      {
        p1: { x: 1, y: 1 },
        p2: { x: 2, y: 2 },
      },
      {
        p1: { x: 3, y: '3' },
        p2: { x: 4, y: 4 },
      }
    ]
  }, Content2), { path: ['lines', 1, 'p1', 'y'], expect: "number" })
  t.deepEqual(validate({
    lines: [
      {
        p1: { x: 1, y: 1 },
        p2: { x: 2, y: 2 },
      },
    ]
  }, Content2), { path: ['lines'], expect: "minItems", args: [2] })
})

interface Text {
  type: 'text'
  text: string
}
const Text = {
  type: 'text',
  text: string,
}
interface Image {
  type: 'image'
  url: string
}
const Image = {
  type: 'image',
  url: string,
}
type Content3 = Text | Image
const Content3 = (v: unknown, path: Path): ValidationResult => {
  if (!isRecord(v)) return { path, expect: 'object' }
  if (v.type === 'text') return validate(v, Text, path)
  if (v.type === 'image') return validate(v, Image, path)
  return { path: [...path, 'type'], expect: 'text or image' }
}

test('tagged', (t) => {
  t.deepEqual(validate({ type: 'text', text: 1 }, Content3), { path: ['text'], expect: "string" })
  t.deepEqual(validate({ type: 'image', url: 1 }, Content3), { path: ['url'], expect: "string" })
  t.deepEqual(validate({ type: 'image1' }, Content3), { path: ['type'], expect: "text or image" })
})

interface Shape<T extends string> {
  type: T
  visible: boolean
}
interface Circle extends Shape<'circle'> {
  x: number
  y: number
  radius: number
}
const Shape = (T: string) => ({
  type: T,
  visible: boolean,
})
const Circle = and(Shape('circle'), {
  x: number,
  y: number,
  radius: number,
})

test('generic', (t) => {
  t.deepEqual(validate({ type: 'circle', visible: true, x: 0, y: 0, radius: 10 }, Circle), true)
  t.deepEqual(validate({ type: 'rect', visible: true, x: 0, y: 0, radius: 10 }, Circle), { path: ['type'], expect: "literal", args: ['circle'] })
  t.deepEqual(validate({ type: 'circle', x: 0, y: 0, radius: 10 }, Circle), { path: ['visible'], expect: "boolean" })
  t.deepEqual(validate({ type: 'circle', visible: true, x: 'a', y: 0, radius: 10 }, Circle), { path: ['x'], expect: "number" })
})

# composable-type-validator

```ts
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
validate({ x: 1, y: 2 }, Point) // true
validate({ x: 1, y: 2, z: 3 }, Point) // true
validate({ x: 1, y: '' }, Point) // { path: ['y'], expect: "number" }
validate({ x: 1, y: 2, z: '' }, Point) // { path: ['z'], expect: "number" }
```

Remove additional properties

```ts
const point = { x: 1, y: 2, a: 3 }
validate(point, Point) // true
console.info(point) // { x: 1, y: 2 }
```

`Or` type:

```ts
interface Content1 {
  pointOrId: string | Point
}
const Content1 = {
  pointOrId: or(string, Point)
}
validate({ pointOrId: 'a' }, Content1) // true
validate({ pointOrId: { x: 1, y: 1 } }, Content1) // true
validate({ pointOrId: { x: 1, z: 1 } }, Content1) // { path: ['pointOrId'], expect: "or" }
```

Inherit types:

```ts
interface ColoredPoint extends Point {
  color: string
}
const ColoredPoint = and(Point, {
  color: string
})
validate({ x: 1, y: 2, color: 'red' }, ColoredPoint) // true
validate({ x: 1, y: 2, color1: 'red' }, ColoredPoint) // { path: ['color'], expect: "string" }
```

Complex types:

```ts
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
validate({
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
}, Polyline) // { path: ['lines', 1, 'p1', 'y'], expect: "number" }
validate({
  lines: [
    {
      p1: { x: 1, y: 1 },
      p2: { x: 2, y: 2 },
    },
  ]
}, Polyline) // { path: ['lines'], expect: "minItems", args: [2] }
```

Tagged types:

```ts
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
  if (!isRecord(v)) return [path, 'object']
  if (v.type === 'text') return validate(v, Text, path)
  if (v.type === 'image') return validate(v, Image, path)
  return [[...path, 'type'], 'text or image']
}
validate({ type: 'text', text: 1 }, Content3) // { path: ['text'], expect: "string" }
validate({ type: 'image', url: 1 }, Content3) // { path: ['url'], expect: "string" }
validate({ type: 'image1' }, Content3) // { path: ['type'], expect: "text or image" }
```

Generic types:

```ts
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
validate({ type: 'circle', visible: true, x: 0, y: 0, radius: 10 }, Circle) // true
validate({ type: 'rect', visible: true, x: 0, y: 0, radius: 10 }, Circle) // { path: ['type'], expect: "literal", args: ['circle'] }
validate({ type: 'circle', x: 0, y: 0, radius: 10 }, Circle) // { path: ['visible'], expect: "boolean" }
validate({ type: 'circle', visible: true, x: 'a', y: 0, radius: 10 }, Circle) // { path: ['x'], expect: "number" }
```

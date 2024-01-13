import { isRecord } from "./is-record";
import { Position } from "./position";
import { Path, ValidationResult, validate, number, boolean } from "./validators";

export type PathCommand = {
  type: 'move'
  to: Position
} |
{
  type: 'line'
  to: Position
} |
{
  type: 'arc'
  from: Position
  to: Position
  radius: number
} |
{
  type: 'ellipseArc'
  rx: number
  ry: number
  angle: number
  largeArc: boolean
  sweep: boolean
  to: Position
} |
{
  type: 'bezierCurve'
  cp1: Position
  cp2: Position
  to: Position
} |
{
  type: 'quadraticCurve'
  cp: Position
  to: Position
} |
{
  type: 'close'
}

export const PathCommand = (v: unknown, path: Path): ValidationResult => {
  if (!isRecord(v)) return { path, expect: 'object' }
  if (v.type === 'move') return validate(v, {
    type: 'move',
    to: Position,
  }, path)
  if (v.type === 'line') return validate(v, {
    type: 'line',
    to: Position,
  }, path)
  if (v.type === 'arc') return validate(v, {
    type: 'arc',
    from: Position,
    to: Position,
    radius: number,
  }, path)
  if (v.type === 'ellipseArc') return validate(v, {
    type: 'ellipseArc',
    rx: number,
    ry: number,
    angle: number,
    largeArc: boolean,
    sweep: boolean,
    to: Position,
  }, path)
  if (v.type === 'bezierCurve') return validate(v, {
    type: 'bezierCurve',
    cp1: Position,
    cp2: Position,
    to: Position,
  }, path)
  if (v.type === 'quadraticCurve') return validate(v, {
    type: 'quadraticCurve',
    cp: Position,
    to: Position,
  }, path)
  if (v.type === 'close') return validate(v, {
    type: 'close',
  }, path)
  return { path: [...path, 'type'], expect: 'or', args: ['move', 'line', 'arc', 'ellipseArc', 'bezierCurve', 'quadraticCurve', 'close'] }
}

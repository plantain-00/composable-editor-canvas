import { arcToPolyline } from "./circle";
import { getTwoNumbersDistance, largerOrEqual, lessOrEqual } from "./math";
import { getPointAndPolygonMaximumDistance } from "./position";
import { Position } from "./position";

import { minimum, number, and } from "./validators";

export interface Size {
  width: number
  height: number
}

export const Size = {
  width: /* @__PURE__ */ minimum(0, number),
  height: /* @__PURE__ */ minimum(0, number),
}

export interface Region extends Position, Size { }

export const Region = /* @__PURE__ */ and(Position, Size)

export interface TwoPointsFormRegion {
  start: Position
  end: Position
}

export function getTwoPointsFormRegion(p1: Position, p2: Position): TwoPointsFormRegion {
  return {
    start: {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
    },
    end: {
      x: Math.max(p1.x, p2.x),
      y: Math.max(p1.y, p2.y),
    },
  }
}

export function getRegion(p1: Position, p2: Position): Region {
  return {
    x: Math.min(p1.x, p2.x),
    y: Math.min(p1.y, p2.y),
    width: getTwoNumbersDistance(p1.x, p2.x),
    height: getTwoNumbersDistance(p1.y, p2.y),
  }
}

export function getTwoPointsFormRegionSize(region: TwoPointsFormRegion): Size {
  return {
    width: getTwoNumbersDistance(region.start.x, region.end.x),
    height: getTwoNumbersDistance(region.start.y, region.end.y),
  }
}

export function pointIsInRegion(point: Position, region: TwoPointsFormRegion) {
  return largerOrEqual(point.x, region.start.x) && largerOrEqual(point.y, region.start.y) && lessOrEqual(point.x, region.end.x) && lessOrEqual(point.y, region.end.y)
}

export function getPolygonFromTwoPointsFormRegion(region: TwoPointsFormRegion) {
  return [
    region.start,
    { x: region.start.x, y: region.end.y },
    region.end,
    { x: region.end.x, y: region.start.y },
  ]
}

export function getPolygonFromRegion(region: Region) {
  return [
    { x: region.x - region.width / 2, y: region.y - region.height / 2 },
    { x: region.x + region.width / 2, y: region.y - region.height / 2 },
    { x: region.x + region.width / 2, y: region.y + region.height / 2 },
    { x: region.x - region.width / 2, y: region.y + region.height / 2 },
  ]
}

export function getPointAndRegionMaximumDistance(position: Position, region: TwoPointsFormRegion) {
  return getPointAndPolygonMaximumDistance(position, getPolygonFromTwoPointsFormRegion(region));
}

export function getRoundedRectPoints(content: Region, radius: number, angleDelta: number): Position[] {
  return [
    ...arcToPolyline({
      x: content.x + content.width / 2 - radius,
      y: content.y - content.height / 2 + radius,
      r: radius,
      startAngle: -90,
      endAngle: 0,
    }, angleDelta),
    ...arcToPolyline({
      x: content.x + content.width / 2 - radius,
      y: content.y + content.height / 2 - radius,
      r: radius,
      startAngle: 0,
      endAngle: 90,
    }, angleDelta),
    ...arcToPolyline({
      x: content.x - content.width / 2 + radius,
      y: content.y + content.height / 2 - radius,
      r: radius,
      startAngle: 90,
      endAngle: 180,
    }, angleDelta),
    ...arcToPolyline({
      x: content.x - content.width / 2 + radius,
      y: content.y - content.height / 2 + radius,
      r: radius,
      startAngle: 180,
      endAngle: 270,
    }, angleDelta),
  ]
}

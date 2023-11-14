import * as verb from 'verb-nurbs-web'

declare module 'verb-nurbs-web' {
  export declare module geom {
    declare class Ellipse extends verb.geom.NurbsCurve {
      constructor(center: core.Data.Point, xaxis: core.Data.Vector, yaxis: core.Data.Vector);
    }
    declare class BezierCurve extends verb.geom.NurbsCurve {
      constructor(points: core.Data.Point[]);
    }
  }
}
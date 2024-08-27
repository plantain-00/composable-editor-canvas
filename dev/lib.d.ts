import * as verb from 'verb-nurbs-web'

declare module 'verb-nurbs-web' {
  export namespace geom {
    declare class Ellipse extends verb.geom.NurbsCurve {
      constructor(center: core.Data.Point, xaxis: core.Data.Vector, yaxis: core.Data.Vector);
    }
    declare class BezierCurve extends verb.geom.NurbsCurve {
      constructor(points: core.Data.Point[]);
    }
    declare class NurbsSurface {
      static byKnotsControlPointsWeights(degreeU: number, degreeV: number, knotsU: number[], knotsV: number[], controlPoints: core.Data.Point[][], weights?: number[][]): NurbsSurface
      point(u: number, v: number): core.Data.Point
      normal(u: number, v: number): core.Data.Point
      tessellate() : core.Data.MeshData
      asNurbs(): core.Data.NurbsSurfaceData;
      domainU(): core.Data.Interval<number>
      domainV(): core.Data.Interval<number>;
      degreeU: number;
      degreeV: number;
      serialize(): string;
      derivatives(u: number, v: number, numDerivs?: number): Array<Array<core.Data.Vector>>;
      isocurve(u : number, useV : boolean) : NurbsCurve
    }
  }
}
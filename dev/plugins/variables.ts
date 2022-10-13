export const pluginScripts = [
`// dev/plugins/regular-polygon.plugin.tsx
function getModel(ctx) {
  function getRegularPolygonGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const angle = -(content.angle ?? 0);
      const p0 = ctx.rotatePositionByCenter({ x: content.x + content.radius, y: content.y }, content, angle);
      const points = [];
      for (let i = 0; i < content.count; i++) {
        points.push(ctx.rotatePositionByCenter(p0, content, 360 / content.count * i));
      }
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        points,
        lines,
        bounding: ctx.getPointsBounding(points),
        regions: content.fillColor !== void 0 ? [
          {
            lines,
            points
          }
        ] : void 0,
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray)
      };
    });
  }
  const React = ctx.React;
  return {
    type: "regular polygon",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    render({ content, target, color, strokeWidth }) {
      const colorField = content.fillColor !== void 0 ? "fillColor" : "strokeColor";
      if (content.fillColor !== void 0) {
        strokeWidth = 0;
      }
      const { points } = getRegularPolygonGeometriesFromCache(content);
      return target.renderPolygon(points, { [colorField]: color, strokeWidth });
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getRegularPolygonGeometriesFromCache(content);
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRegularPolygonContent(c)) {
                  return;
                }
                c.x += cursor.x - start.x;
                c.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            ...points.map((p) => ({
              x: p.x,
              y: p.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRegularPolygonContent(c)) {
                  return;
                }
                c.radius = ctx.getTwoPointsDistance(cursor, c);
                c.angle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }))
          ]
        };
      });
    },
    getGeometries: getRegularPolygonGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.x,
          setValue: (v) => update((c) => {
            if (isRegularPolygonContent(c)) {
              c.x = v;
            }
          })
        }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.y,
          setValue: (v) => update((c) => {
            if (isRegularPolygonContent(c)) {
              c.y = v;
            }
          })
        }),
        radius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.radius,
          setValue: (v) => update((c) => {
            if (isRegularPolygonContent(c)) {
              c.radius = v;
            }
          })
        }),
        count: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.count,
          setValue: (v) => update((c) => {
            if (isRegularPolygonContent(c)) {
              c.count = v;
            }
          })
        }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.angle,
          setValue: (v) => update((c) => {
            if (isRegularPolygonContent(c)) {
              c.angle = v;
            }
          })
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update)
      };
    }
  };
}
function isRegularPolygonContent(content) {
  return content.type === "regular polygon";
}
function getCommand(ctx) {
  return {
    name: "create regular polygon",
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === "create regular polygon",
        ([p0, p1]) => onEnd({
          updateContents: (contents) => {
            contents.push({
              type: "regular polygon",
              x: p0.x,
              y: p0.y,
              radius: ctx.getTwoPointsDistance(p0, p1),
              count: 5,
              angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI
            });
          }
        }),
        {
          once: true
        }
      );
      const assistentContents = [];
      if (line) {
        const [p0, p1] = line;
        assistentContents.push({
          type: "regular polygon",
          x: p0.x,
          y: p0.y,
          radius: ctx.getTwoPointsDistance(p0, p1),
          count: 5,
          angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/plugins/ring.plugin.tsx
function getModel(ctx) {
  function getRingGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points1 = ctx.arcToPolyline({ ...content, r: content.outerRadius, startAngle: 0, endAngle: 360 }, ctx.angleDelta);
      const points2 = ctx.arcToPolyline({ ...content, r: content.innerRadius, startAngle: 0, endAngle: 360 }, ctx.angleDelta);
      const points = [...points1, ...points2];
      const lines1 = Array.from(ctx.iteratePolygonLines(points1));
      const lines2 = Array.from(ctx.iteratePolygonLines(points2));
      return {
        points,
        lines: [...lines1, ...lines1],
        bounding: ctx.getPointsBounding(points),
        regions: content.fillColor !== void 0 ? [
          {
            lines: lines1,
            points: points1
          },
          {
            lines: lines2,
            points: points2
          }
        ] : void 0,
        renderingLines: [
          ...ctx.dashedPolylineToLines(ctx.polygonToPolyline(points1), content.dashArray),
          ...ctx.dashedPolylineToLines(ctx.polygonToPolyline(points2), content.dashArray)
        ]
      };
    });
  }
  const React = ctx.React;
  return {
    type: "ring",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    render({ content, target, color, strokeWidth }) {
      const colorField = content.fillColor !== void 0 ? "fillColor" : "strokeColor";
      if (content.fillColor !== void 0) {
        strokeWidth = 0;
      }
      const { renderingLines, regions } = getRingGeometriesFromCache(content);
      if (regions) {
        return target.renderPath([regions[0].points, regions[1].points], { [colorField]: color, strokeWidth });
      }
      return target.renderGroup(renderingLines.map((r) => target.renderPolyline(r, { [colorField]: color, strokeWidth })));
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRingContent(c)) {
                  return;
                }
                c.x += cursor.x - start.x;
                c.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }
          ]
        };
      });
    },
    getGeometries: getRingGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.x,
          setValue: (v) => update((c) => {
            if (isRingContent(c)) {
              c.x = v;
            }
          })
        }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.y,
          setValue: (v) => update((c) => {
            if (isRingContent(c)) {
              c.y = v;
            }
          })
        }),
        outerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.outerRadius,
          setValue: (v) => update((c) => {
            if (isRingContent(c)) {
              c.outerRadius = v;
            }
          })
        }),
        innerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.innerRadius,
          setValue: (v) => update((c) => {
            if (isRingContent(c)) {
              c.innerRadius = v;
            }
          })
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update)
      };
    }
  };
}
function isRingContent(content) {
  return content.type === "ring";
}
function getCommand(ctx) {
  return {
    name: "create ring",
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === "create ring",
        (c) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(c[0], c[1]);
            contents.push({
              type: "ring",
              x: c[0].x,
              y: c[0].y,
              outerRadius,
              innerRadius: outerRadius * 0.5
            });
          }
        }),
        {
          once: true
        }
      );
      const assistentContents = [];
      if (line) {
        const outerRadius = ctx.getTwoPointsDistance(line[0], line[1]);
        assistentContents.push({
          type: "ring",
          x: line[0].x,
          y: line[0].y,
          outerRadius,
          innerRadius: outerRadius * 0.5
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel
};
`,
`var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/b-spline/index.js
var require_b_spline = __commonJS({
  "node_modules/b-spline/index.js"(exports, module) {
    function interpolate(t, degree, points, knots, weights, result) {
      var i, j, s, l;
      var n = points.length;
      var d = points[0].length;
      if (degree < 1)
        throw new Error("degree must be at least 1 (linear)");
      if (degree > n - 1)
        throw new Error("degree must be less than or equal to point count - 1");
      if (!weights) {
        weights = [];
        for (i = 0; i < n; i++) {
          weights[i] = 1;
        }
      }
      if (!knots) {
        var knots = [];
        for (i = 0; i < n + degree + 1; i++) {
          knots[i] = i;
        }
      } else {
        if (knots.length !== n + degree + 1)
          throw new Error("bad knot vector length");
      }
      var domain = [
        degree,
        knots.length - 1 - degree
      ];
      var low = knots[domain[0]];
      var high = knots[domain[1]];
      t = t * (high - low) + low;
      if (t < low || t > high)
        throw new Error("out of bounds");
      for (s = domain[0]; s < domain[1]; s++) {
        if (t >= knots[s] && t <= knots[s + 1]) {
          break;
        }
      }
      var v = [];
      for (i = 0; i < n; i++) {
        v[i] = [];
        for (j = 0; j < d; j++) {
          v[i][j] = points[i][j] * weights[i];
        }
        v[i][d] = weights[i];
      }
      var alpha;
      for (l = 1; l <= degree + 1; l++) {
        for (i = s; i > s - degree - 1 + l; i--) {
          alpha = (t - knots[i]) / (knots[i + degree + 1 - l] - knots[i]);
          for (j = 0; j < d + 1; j++) {
            v[i][j] = (1 - alpha) * v[i - 1][j] + alpha * v[i][j];
          }
        }
      }
      var result = result || [];
      for (i = 0; i < d; i++) {
        result[i] = v[s][i] / v[s][d];
      }
      return result;
    }
    module.exports = interpolate;
  }
});

// dev/plugins/spline.plugin.tsx
var import_b_spline = __toESM(require_b_spline());
function getModel(ctx) {
  function getSplineGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const inputPoints = content.points.map((p) => [p.x, p.y]);
      let points = [];
      if (inputPoints.length > 2) {
        if (content.fitting) {
          const controlPoints = ctx.getBezierSplineControlPointsOfPoints(content.points);
          for (let i = 0; i < controlPoints.length; i++) {
            points.push(
              content.points[i],
              ...ctx.getBezierCurvePoints(content.points[i], ...controlPoints[i], content.points[i + 1], splineSegmentCount)
            );
          }
          points.push(content.points[content.points.length - 1]);
        } else {
          const degree = 2;
          const knots = [];
          for (let i = 0; i < inputPoints.length + degree + 1; i++) {
            if (i < degree + 1) {
              knots.push(0);
            } else if (i < inputPoints.length) {
              knots.push(i - degree);
            } else {
              knots.push(inputPoints.length - degree);
            }
          }
          for (let t = 0; t <= splineSegmentCount; t++) {
            const p = (0, import_b_spline.default)(t / splineSegmentCount, degree, inputPoints, knots);
            points.push({ x: p[0], y: p[1] });
          }
        }
      } else {
        points = content.points;
      }
      return {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
      };
    });
  }
  const React = ctx.React;
  return {
    type: "spline",
    ...ctx.strokeModel,
    move(content, offset) {
      for (const point of content.points) {
        point.x += offset.x;
        point.y += offset.y;
      }
    },
    rotate(content, center, angle) {
      content.points = content.points.map((p) => ctx.rotatePositionByCenter(p, center, -angle));
    },
    mirror(content, line) {
      content.points = content.points.map((p) => ctx.getSymmetryPoint(p, line));
    },
    render({ content, color, target, strokeWidth }) {
      const { points } = getSplineGeometries(content);
      return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth });
    },
    renderIfSelected({ content, color, target, strokeWidth }) {
      return target.renderPolyline(content.points, { strokeColor: color, dashArray: [4], strokeWidth });
    },
    getOperatorRenderPosition(content) {
      return content.points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isSplineContent, false, true) }));
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => content.points.map((p) => ({ ...p, type: "endpoint" })));
    },
    getGeometries: getSplineGeometries,
    propertyPanel(content, update) {
      return {
        points: /* @__PURE__ */ React.createElement(ctx.ArrayEditor, {
          inline: true,
          ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
            if (isSplineContent(c)) {
              v(c);
            }
          })),
          items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
            inline: true,
            properties: {
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                value: f.x,
                setValue: (v) => update((c) => {
                  if (isSplineContent(c)) {
                    c.points[i].x = v;
                  }
                })
              }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                value: f.y,
                setValue: (v) => update((c) => {
                  if (isSplineContent(c)) {
                    c.points[i].y = v;
                  }
                })
              })
            }
          }))
        }),
        fitting: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
          value: content.fitting === true,
          setValue: (v) => update((c) => {
            if (isSplineContent(c)) {
              c.fitting = v ? true : void 0;
            }
          })
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update)
      };
    }
  };
}
function isSplineContent(content) {
  return content.type === "spline";
}
var splineSegmentCount = 100;
function getCommand(ctx) {
  return {
    name: "create spline",
    type: [
      { name: "spline", hotkey: "SPL" },
      { name: "spline fitting" }
    ],
    useCommand({ onEnd, type, scale }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === "spline" || type === "spline fitting",
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, type: "spline", fitting: type === "spline fitting" })
        })
      );
      const assistentContents = [];
      if (line) {
        assistentContents.push(
          { points: line, type: "spline", fitting: type === "spline fitting" },
          { points: line, type: "polyline", dashArray: [4 / scale] }
        );
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/plugins/star.plugin.tsx
function getModel(ctx) {
  function getStarGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const angle = -(content.angle ?? 0);
      const p0 = ctx.rotatePositionByCenter({ x: content.x + content.outerRadius, y: content.y }, content, angle);
      const p1 = ctx.rotatePositionByCenter({ x: content.x + content.innerRadius, y: content.y }, content, angle + 180 / content.count);
      const points = [];
      for (let i = 0; i < content.count; i++) {
        const angle2 = 360 / content.count * i;
        points.push(
          ctx.rotatePositionByCenter(p0, content, angle2),
          ctx.rotatePositionByCenter(p1, content, angle2)
        );
      }
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        points,
        lines,
        bounding: ctx.getPointsBounding(points),
        regions: content.fillColor !== void 0 ? [
          {
            lines,
            points
          }
        ] : void 0,
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray)
      };
    });
  }
  const React = ctx.React;
  return {
    type: "star",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    render({ content, target, color, strokeWidth }) {
      const colorField = content.fillColor !== void 0 ? "fillColor" : "strokeColor";
      if (content.fillColor !== void 0) {
        strokeWidth = 0;
      }
      const { points } = getStarGeometriesFromCache(content);
      return target.renderPolygon(points, { [colorField]: color, strokeWidth });
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getStarGeometriesFromCache(content);
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isStarContent(c)) {
                  return;
                }
                c.x += cursor.x - start.x;
                c.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            ...points.map((p, i) => ({
              x: p.x,
              y: p.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isStarContent(c)) {
                  return;
                }
                if (i % 2 === 0) {
                  c.outerRadius = ctx.getTwoPointsDistance(cursor, c);
                } else {
                  c.innerRadius = ctx.getTwoPointsDistance(cursor, c);
                }
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }))
          ]
        };
      });
    },
    getGeometries: getStarGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.x,
          setValue: (v) => update((c) => {
            if (isStarContent(c)) {
              c.x = v;
            }
          })
        }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.y,
          setValue: (v) => update((c) => {
            if (isStarContent(c)) {
              c.y = v;
            }
          })
        }),
        outerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.outerRadius,
          setValue: (v) => update((c) => {
            if (isStarContent(c)) {
              c.outerRadius = v;
            }
          })
        }),
        innerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.innerRadius,
          setValue: (v) => update((c) => {
            if (isStarContent(c)) {
              c.innerRadius = v;
            }
          })
        }),
        count: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.count,
          setValue: (v) => update((c) => {
            if (isStarContent(c)) {
              c.count = v;
            }
          })
        }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.angle ?? 0,
          setValue: (v) => update((c) => {
            if (isStarContent(c)) {
              c.angle = v === 0 ? void 0 : v;
            }
          })
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update)
      };
    }
  };
}
function isStarContent(content) {
  return content.type === "star";
}
function getCommand(ctx) {
  return {
    name: "create star",
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === "create star",
        ([p0, p1]) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(p0, p1);
            contents.push({
              type: "star",
              x: p0.x,
              y: p0.y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
              count: 5,
              angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI
            });
          }
        }),
        {
          once: true
        }
      );
      const assistentContents = [];
      if (line) {
        const [p0, p1] = line;
        const outerRadius = ctx.getTwoPointsDistance(p0, p1);
        assistentContents.push({
          type: "star",
          x: p0.x,
          y: p0.y,
          outerRadius,
          innerRadius: outerRadius * 0.5,
          count: 5,
          angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel
};
`,
]
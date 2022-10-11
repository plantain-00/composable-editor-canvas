export const pluginScripts = [
`export function getModel(ctx) {
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
    subTypes: ["stroke", "fill"],
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
    getDefaultColor(content) {
      return content.fillColor !== void 0 ? content.fillColor : content.strokeColor;
    },
    getDefaultStrokeWidth(content) {
      return content.strokeWidth;
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
export function getCommand(ctx) {
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
`,
`export function getModel(ctx) {
  function getStarGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const p0 = { x: content.x, y: content.y - content.outerRadius };
      const p1 = ctx.rotatePositionByCenter({ x: content.x, y: content.y - content.innerRadius }, content, 180 / content.count);
      const points = [];
      for (let i = 0; i < content.count; i++) {
        const angle = 360 / content.count * i;
        points.push(
          ctx.rotatePositionByCenter(p0, content, angle),
          ctx.rotatePositionByCenter(p1, content, angle)
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
    subTypes: ["stroke", "fill"],
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
    getDefaultColor(content) {
      return content.fillColor !== void 0 ? content.fillColor : content.strokeColor;
    },
    getDefaultStrokeWidth(content) {
      return content.strokeWidth;
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
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
            }
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
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update)
      };
    }
  };
}
function isStarContent(content) {
  return content.type === "star";
}
export function getCommand(ctx) {
  return {
    name: "create star",
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === "create star",
        (c) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(c[0], c[1]);
            contents.push({
              type: "star",
              x: c[0].x,
              y: c[0].y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
              count: 5
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
          type: "star",
          x: line[0].x,
          y: line[0].y,
          outerRadius,
          innerRadius: outerRadius * 0.5,
          count: 5
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
`,
]
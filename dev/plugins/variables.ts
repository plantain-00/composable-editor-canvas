export const pluginScripts = [
`// dev/plugins/arrow.plugin.tsx
function getModel(ctx) {
  function getArrowGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [content.p1, content.p2];
      const arrow = ctx.getPointByLengthAndDirection(content.p2, ctx.dimensionStyle.arrowSize, content.p1);
      const arrowPoints = [
        content.p2,
        ctx.rotatePositionByCenter(arrow, content.p2, ctx.dimensionStyle.arrowAngle),
        ctx.rotatePositionByCenter(arrow, content.p2, -ctx.dimensionStyle.arrowAngle)
      ];
      return {
        points: [],
        lines: Array.from(ctx.iteratePolylineLines(points)),
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            points: arrowPoints,
            lines: Array.from(ctx.iteratePolygonLines(arrowPoints))
          }
        ],
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
      };
    });
  }
  const React = ctx.React;
  return {
    type: "arrow",
    ...ctx.strokeModel,
    move(content, offset) {
      content.p1.x += offset.x;
      content.p1.y += offset.y;
      content.p2.x += offset.x;
      content.p2.y += offset.y;
    },
    render({ content, target, color, strokeWidth }) {
      const { regions, renderingLines } = getArrowGeometriesFromCache(content);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth }));
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth, fillColor: color }));
        }
      }
      return target.renderGroup(children);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content.p1,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isArrowContent(c)) {
                  return;
                }
                c.p1.x += cursor.x - start.x;
                c.p1.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              ...content.p2,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isArrowContent(c)) {
                  return;
                }
                c.p2.x += cursor.x - start.x;
                c.p2.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }
          ]
        };
      });
    },
    getGeometries: getArrowGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        p1: /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
          inline: true,
          properties: {
            x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p1.x,
              setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p1.x = v;
                }
              })
            }),
            y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p1.y,
              setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p1.y = v;
                }
              })
            })
          }
        }),
        p2: /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
          inline: true,
          properties: {
            x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p2.x,
              setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p2.x = v;
                }
              })
            }),
            y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p2.y,
              setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p2.y = v;
                }
              })
            })
          }
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update)
      };
    }
  };
}
function isArrowContent(content) {
  return content.type === "arrow";
}
function getCommand(ctx) {
  return {
    name: "create arrow",
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === "create arrow",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "arrow",
            p1: c[0],
            p2: c[1]
          })
        }),
        {
          once: true
        }
      );
      const assistentContents = [];
      if (line) {
        assistentContents.push({
          type: "arrow",
          p1: line[0],
          p2: line[1]
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
  getModel,
  isArrowContent
};
`,
`// dev/plugins/block.plugin.tsx
function isBlockContent(content) {
  return content.type === "block";
}

// dev/plugins/block-reference.plugin.tsx
function getModel(ctx) {
  const blockLinesCache = new ctx.WeakmapCache2();
  const blockSnapPointsCache = new ctx.WeakmapCache2();
  function getBlock(id, contents) {
    return contents.find((c, i) => !!c && isBlockContent(c) && i === id);
  }
  function extractContentInBlockReference(target, content, block, contents) {
    const model = ctx.getModel(target.type);
    if (!model) {
      return void 0;
    }
    return ctx.produce(target, (draft) => {
      model.rotate?.(draft, block.base, content.angle, contents);
      model.move?.(draft, content);
    });
  }
  function getBlockReferenceGeometries(content, contents) {
    const block = getBlock(content.refId, contents);
    if (block) {
      return blockLinesCache.get(block, content, () => {
        const lines = [];
        const points = [];
        const renderingLines = [];
        block.contents.forEach((c) => {
          if (!c) {
            return;
          }
          const extracted = extractContentInBlockReference(c, content, block, contents);
          if (extracted) {
            const r = ctx.getModel(c.type)?.getGeometries?.(extracted);
            if (r) {
              lines.push(...r.lines);
              points.push(...r.points);
              if (r.renderingLines) {
                renderingLines.push(...r.renderingLines);
              }
            }
          }
        });
        return {
          lines,
          points,
          bounding: ctx.getPointsBounding(points),
          renderingLines
        };
      });
    }
    return { lines: [], points: [], renderingLines: [] };
  }
  const React = ctx.React;
  return {
    type: "block reference",
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    rotate(content, center, angle, contents) {
      const block = getBlock(content.refId, contents);
      if (block) {
        const p = ctx.rotatePositionByCenter({ x: content.x + block.base.x, y: content.y + block.base.y }, center, -angle);
        content.x = p.x - block.base.x;
        content.y = p.y - block.base.y;
        content.angle += angle;
      }
    },
    explode(content, contents) {
      const block = getBlock(content.refId, contents);
      if (block) {
        const result = [];
        block.contents.forEach((c) => {
          if (!c) {
            return;
          }
          const extracted = extractContentInBlockReference(c, content, block, contents);
          if (extracted) {
            result.push(extracted);
          }
        });
        return result;
      }
      return [];
    },
    mirror(content, line, angle, contents) {
      const block = getBlock(content.refId, contents);
      if (block) {
        const p = ctx.getSymmetryPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line);
        content.x = p.x - block.base.x;
        content.y = p.y - block.base.y;
        content.angle = 2 * angle - content.angle;
      }
    },
    render({ content, target, color, strokeWidth, contents }) {
      const block = getBlock(content.refId, contents);
      if (block) {
        const children = ctx.renderContainerChildren(block, target, strokeWidth, contents, color);
        return target.renderGroup(children, { translate: content, base: block.base, angle: content.angle });
      }
      return target.renderEmpty();
    },
    getOperatorRenderPosition(content, contents) {
      const block = getBlock(content.refId, contents);
      if (block) {
        return { x: content.x + block.base.x, y: content.y + block.base.y };
      }
      return content;
    },
    getEditPoints(content, contents) {
      const block = getBlock(content.refId, contents);
      if (!block) {
        return;
      }
      return ctx.getEditPointsFromCache(content, () => {
        const p = { x: content.x + block.base.x, y: content.y + block.base.y };
        return {
          editPoints: [
            {
              ...p,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isBlockReferenceContent(c)) {
                  return;
                }
                c.x += cursor.x - start.x;
                c.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [p, cursor] }] };
              }
            }
          ],
          angleSnapStartPoint: p
        };
      });
    },
    getSnapPoints(content, contents) {
      const block = getBlock(content.refId, contents);
      if (block) {
        return blockSnapPointsCache.get(block, content, () => {
          const result = [];
          block.contents.forEach((c) => {
            if (!c) {
              return;
            }
            const model = ctx.getModel(c.type);
            const extracted = extractContentInBlockReference(c, content, block, contents);
            if (extracted) {
              const r = model?.getSnapPoints?.(extracted, contents);
              if (r) {
                result.push(...r);
              }
            }
          });
          return result;
        });
      }
      return [];
    },
    getGeometries: getBlockReferenceGeometries,
    propertyPanel(content, update) {
      return {
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.x,
          setValue: (v) => update((c) => {
            if (isBlockReferenceContent(c)) {
              c.x = v;
            }
          })
        }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.y,
          setValue: (v) => update((c) => {
            if (isBlockReferenceContent(c)) {
              c.y = v;
            }
          })
        }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.angle,
          setValue: (v) => update((c) => {
            if (isBlockReferenceContent(c)) {
              c.angle = v;
            }
          })
        })
      };
    },
    getRefIds(content) {
      return [content.refId];
    },
    updateRefId(content, update) {
      const newRefId = update(content.refId);
      if (newRefId !== void 0) {
        content.refId = newRefId;
      }
    }
  };
}
function isBlockReferenceContent(content) {
  return content.type === "block reference";
}
function getCommand(ctx) {
  return {
    name: "create block reference",
    useCommand({ onEnd, type, scale }) {
      let message = "";
      if (type) {
        message = "specify target point";
      }
      const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message);
      return {
        onStart(p) {
          resetInput();
          onEnd({
            updateContents: (contents, selected) => {
              contents.push(
                ...contents.filter((c, i) => !!c && ctx.isSelected([i], selected) && isBlockContent(c)).map((block) => ({
                  type: "block reference",
                  refId: ctx.getContentIndex(block, contents),
                  x: p.x - block.base.x,
                  y: p.y - block.base.y,
                  angle: 0
                }))
              );
              setCursorPosition(void 0);
            }
          });
        },
        input,
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p);
          if (!type) {
            return;
          }
          setCursorPosition(p);
        },
        updateContent(content, contents) {
          if (!isBlockContent(content)) {
            return {};
          }
          if (cursorPosition) {
            return {
              newContents: [
                {
                  type: "block reference",
                  refId: ctx.getContentIndex(content, contents),
                  x: cursorPosition.x - content.base.x,
                  y: cursorPosition.y - content.base.y,
                  angle: 0
                }
              ],
              assistentContents: [
                {
                  type: "line",
                  dashArray: [4 / scale],
                  points: [{ x: content.base.x, y: content.base.y }, cursorPosition]
                }
              ]
            };
          }
          return {};
        }
      };
    },
    contentSelectable: isBlockContent,
    selectCount: 1,
    hotkey: "I"
  };
}
export {
  getCommand,
  getModel,
  isBlockReferenceContent
};
`,
`// dev/plugins/block.plugin.tsx
function getModel(ctx) {
  const React = ctx.React;
  return {
    type: "block",
    ...ctx.containerModel,
    explode(content) {
      return content.contents.filter((c) => !!c);
    },
    render({ content, target, color, strokeWidth, contents }) {
      const children = ctx.renderContainerChildren(content, target, strokeWidth, contents, color);
      return target.renderGroup(children);
    },
    getOperatorRenderPosition(content) {
      return content.base;
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: ctx.getContainerGeometries,
    propertyPanel(content, update) {
      return {
        base: /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
          inline: true,
          properties: {
            x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.base.x,
              setValue: (v) => update((c) => {
                if (isBlockContent(c)) {
                  c.base.x = v;
                }
              })
            }),
            y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.base.y,
              setValue: (v) => update((c) => {
                if (isBlockContent(c)) {
                  c.base.y = v;
                }
              })
            })
          }
        })
      };
    }
  };
}
function isBlockContent(content) {
  return content.type === "block";
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.getContentModel(content)?.getRefIds === void 0 && !ctx.contentIsReferenced(content, contents);
  }
  return {
    name: "create block",
    useCommand({ onEnd, type }) {
      let message = "";
      if (type) {
        message = "specify base point";
      }
      const { input, setInputPosition } = ctx.useCursorInput(message);
      return {
        onStart(p) {
          onEnd({
            updateContents: (contents, selected) => {
              const newContent = {
                type: "block",
                contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents)),
                base: p
              };
              contents.forEach((_, i) => {
                if (ctx.isSelected([i], selected)) {
                  contents[i] = void 0;
                }
              });
              contents.push(newContent);
            }
          });
        },
        input,
        onMove(_, p) {
          setInputPosition(p);
        }
      };
    },
    contentSelectable,
    hotkey: "B"
  };
}
export {
  getCommand,
  getModel,
  isBlockContent
};
`,
`// dev/plugins/break.plugin.tsx
function getCommand(ctx) {
  return {
    name: "break",
    execute(contents, selected) {
      const newContents = [];
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          let intersectionPoints = [];
          for (let i = 0; i < contents.length; i++) {
            const c = contents[i];
            if (c && i !== index) {
              const p = i < index ? [c, content] : [content, c];
              intersectionPoints.push(...ctx.getIntersectionPoints(...p, contents));
            }
          }
          intersectionPoints = ctx.deduplicatePosition(intersectionPoints);
          if (intersectionPoints.length > 0) {
            const result = ctx.getModel(content.type)?.break?.(content, intersectionPoints);
            if (result) {
              newContents.push(...result);
              contents[index] = void 0;
            }
          }
        }
      });
      contents.push(...newContents);
    },
    contentSelectable(content, contents) {
      const model = ctx.getModel(content.type);
      return model?.break !== void 0 && !ctx.contentIsReferenced(content, contents);
    },
    hotkey: "BR"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/plugins/chamfer.plugin.tsx
function getCommand(ctx) {
  function getChamfers(content1, content2, d1, d2) {
    const result = [];
    if (isLineContent(content1) && isLineContent(content2)) {
      const point = ctx.getTwoLinesIntersectionPoint(content1.points[0], content1.points[1], content2.points[0], content2.points[1]);
      if (point) {
        const p1 = [];
        const a1 = ctx.getPointByLengthAndDirectionSafely(point, d1, content1.points[0]);
        const b1 = ctx.getPointByLengthAndDirectionSafely(point, d1, content1.points[1]);
        if (a1) {
          p1.push(a1);
        }
        if (b1 && (!a1 || !ctx.isSamePoint(a1, b1))) {
          p1.push(b1);
        }
        const p2 = [];
        const a2 = ctx.getPointByLengthAndDirectionSafely(point, d2, content2.points[0]);
        const b2 = ctx.getPointByLengthAndDirectionSafely(point, d2, content2.points[1]);
        if (a2) {
          p2.push(a2);
        }
        if (b2 && (!a2 || !ctx.isSamePoint(a2, b2))) {
          p2.push(b2);
        }
        for (const c1 of p1) {
          for (const c2 of p2) {
            result.push([c1, c2]);
          }
        }
      }
    }
    return result;
  }
  const React = ctx.React;
  return {
    name: "chamfer",
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState([]);
      const [result, setResult] = React.useState();
      let message = "";
      if (type) {
        if (candidates.length > 0) {
          message = "select one result";
        } else {
          message = "input distance";
        }
      }
      const assistentContents = candidates.map((c) => ({
        type: "line",
        points: c,
        dashArray: c === result ? void 0 : [4 / scale]
      }));
      const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
        if (e.key === "Enter") {
          const position = text.split(",");
          if (position.length === 2) {
            const d1 = +position[0];
            const d2 = +position[1];
            if (!isNaN(d1) && !isNaN(d2)) {
              setCandidates(getChamfers(selected[0].content, selected[1].content, d1, d2));
              clearText();
            }
          } else {
            const d = +text;
            if (!isNaN(d)) {
              setCandidates(getChamfers(selected[0].content, selected[1].content, d, d));
              clearText();
            }
          }
        }
      } : void 0);
      const reset = () => {
        setCandidates([]);
        setResult(void 0);
        clearText();
        resetInput();
      };
      ctx.useKey((e) => e.key === "Escape", reset, [setCandidates]);
      return {
        onStart(p) {
          setCursorPosition(p);
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: "line", points: result });
              }
            });
            setCandidates([]);
          }
        },
        input,
        onMove(p, viewportPosition) {
          setCursorPosition(p);
          setInputPosition(viewportPosition || p);
          setResult(candidates.find((c) => ctx.getPointAndLineSegmentMinimumDistance(p, c[0], c[1]) < 5));
        },
        assistentContents
      };
    },
    selectCount: 2,
    contentSelectable: (c) => isLineContent(c),
    selectType: "select part",
    hotkey: "CHA"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/circle-arc.plugin.tsx
function getModel(ctx) {
  function getCircleGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const geometries = getArcGeometries({ ...content, startAngle: 0, endAngle: 360 });
      if (content.fillColor !== void 0) {
        return {
          lines: [],
          points: geometries.points,
          bounding: geometries.bounding,
          regions: [{
            lines: geometries.lines,
            points: geometries.points
          }],
          renderingLines: []
        };
      }
      return geometries;
    });
  }
  function getArcGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = ctx.arcToPolyline(content, ctx.angleDelta);
      return {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
      };
    });
  }
  const React = ctx.React;
  return [
    {
      type: "circle",
      ...ctx.strokeModel,
      ...ctx.fillModel,
      move(content, offset) {
        content.x += offset.x;
        content.y += offset.y;
      },
      rotate(content, center, angle) {
        const p = ctx.rotatePositionByCenter(content, center, -angle);
        content.x = p.x;
        content.y = p.y;
      },
      mirror(content, line) {
        const p = ctx.getSymmetryPoint(content, line);
        content.x = p.x;
        content.y = p.y;
      },
      break(content, points) {
        if (points.length < 2) {
          return;
        }
        const angles = points.map((p) => Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI);
        angles.sort((a, b) => a - b);
        return angles.map((a, i) => ({
          ...content,
          type: "arc",
          startAngle: a,
          endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1]
        }));
      },
      render({ content, color, target, strokeWidth }) {
        const colorField = content.fillColor !== void 0 ? "fillColor" : "strokeColor";
        if (content.fillColor !== void 0) {
          strokeWidth = 0;
        }
        if (content.dashArray) {
          const { points } = getCircleGeometries(content);
          return target.renderPolyline(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth });
        }
        return target.renderCircle(content.x, content.y, content.r, { [colorField]: color, strokeWidth });
      },
      getOperatorRenderPosition(content) {
        return content;
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const x = content.x;
          const y = content.y;
          const updateEdges = (c, { cursor, scale }) => {
            if (!isCircleContent(c)) {
              return;
            }
            c.r = ctx.getTwoPointsDistance(cursor, c);
            return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
          };
          return {
            editPoints: [
              {
                x,
                y,
                cursor: "move",
                update(c, { cursor, start, scale }) {
                  if (!isCircleContent(c)) {
                    return;
                  }
                  c.x += cursor.x - start.x;
                  c.y += cursor.y - start.y;
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              },
              {
                x: x - content.r,
                y,
                cursor: "ew-resize",
                update: updateEdges
              },
              {
                x,
                y: y - content.r,
                cursor: "ns-resize",
                update: updateEdges
              },
              {
                x: x + content.r,
                y,
                cursor: "ew-resize",
                update: updateEdges
              },
              {
                x,
                y: y + content.r,
                cursor: "ns-resize",
                update: updateEdges
              }
            ],
            angleSnapStartPoint: content
          };
        });
      },
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => [
          { x: content.x, y: content.y, type: "center" },
          { x: content.x - content.r, y: content.y, type: "endpoint" },
          { x: content.x + content.r, y: content.y, type: "endpoint" },
          { x: content.x, y: content.y - content.r, type: "endpoint" },
          { x: content.x, y: content.y + content.r, type: "endpoint" }
        ]);
      },
      getCircle(content) {
        return {
          circle: content,
          fill: content.fillColor !== void 0,
          bounding: {
            start: { x: content.x - content.r, y: content.y - content.r },
            end: { x: content.x + content.r, y: content.y + content.r }
          }
        };
      },
      getGeometries: getCircleGeometries,
      propertyPanel(content, update) {
        return {
          x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.x,
            setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.x = v;
              }
            })
          }),
          y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.y,
            setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.y = v;
              }
            })
          }),
          r: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.r,
            setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.r = v;
              }
            })
          }),
          ...ctx.getStrokeContentPropertyPanel(content, update),
          ...ctx.getFillContentPropertyPanel(content, update)
        };
      }
    },
    {
      type: "arc",
      ...ctx.strokeModel,
      move(content, offset) {
        content.x += offset.x;
        content.y += offset.y;
      },
      rotate(content, center, angle) {
        const p = ctx.rotatePositionByCenter(content, center, -angle);
        content.x = p.x;
        content.y = p.y;
        content.startAngle += angle;
        content.endAngle += angle;
      },
      mirror(content, line, angle) {
        const p = ctx.getSymmetryPoint(content, line);
        content.x = p.x;
        content.y = p.y;
        const startAngle = 2 * angle - content.endAngle;
        const endAngle = 2 * angle - content.startAngle;
        content.startAngle = startAngle;
        content.endAngle = endAngle;
      },
      break(content, points) {
        if (points.length === 0) {
          return;
        }
        const angles = points.map((p) => ctx.normalizeAngleInRange(Math.atan2(p.y - content.y, p.x - content.x) * 180 / Math.PI, content));
        angles.sort((a, b) => a - b);
        const result = [];
        if (!ctx.equals(angles[0], content.startAngle)) {
          result.push({
            ...content,
            type: "arc",
            startAngle: content.startAngle,
            endAngle: angles[0]
          });
        }
        angles.forEach((a, i) => {
          if (i === angles.length - 1) {
            if (!ctx.equals(a, content.endAngle)) {
              result.push({
                ...content,
                type: "arc",
                startAngle: a,
                endAngle: content.endAngle
              });
            }
          } else {
            result.push({
              ...content,
              type: "arc",
              startAngle: a,
              endAngle: angles[i + 1]
            });
          }
        });
        return result.length > 1 ? result : void 0;
      },
      render({ content, color, target, strokeWidth }) {
        if (content.dashArray) {
          const { points } = getArcGeometries(content);
          return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth });
        }
        return target.renderArc(content.x, content.y, content.r, content.startAngle, content.endAngle, { strokeColor: color, strokeWidth, counterclockwise: content.counterclockwise });
      },
      renderIfSelected({ content, color, target, strokeWidth }) {
        const { points } = getArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 });
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth });
      },
      getOperatorRenderPosition(content) {
        const { points } = getArcGeometries(content);
        return points[0];
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const x = content.x;
          const y = content.y;
          const startAngle = content.startAngle / 180 * Math.PI;
          const endAngle = content.endAngle / 180 * Math.PI;
          const middleAngle = (startAngle + endAngle) / 2;
          return {
            editPoints: [
              {
                x,
                y,
                cursor: "move",
                update(c, { cursor, start, scale }) {
                  if (!isArcContent(c)) {
                    return;
                  }
                  c.x += cursor.x - start.x;
                  c.y += cursor.y - start.y;
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              },
              {
                x: x + content.r * Math.cos(startAngle),
                y: y + content.r * Math.sin(startAngle),
                cursor: ctx.getResizeCursor(content.startAngle, "top"),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return;
                  }
                  c.startAngle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI;
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              },
              {
                x: x + content.r * Math.cos(endAngle),
                y: y + content.r * Math.sin(endAngle),
                cursor: ctx.getResizeCursor(content.endAngle, "top"),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return;
                  }
                  c.endAngle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI;
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              },
              {
                x: x + content.r * Math.cos(middleAngle),
                y: y + content.r * Math.sin(middleAngle),
                cursor: ctx.getResizeCursor((content.startAngle + content.endAngle) / 2, "right"),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return;
                  }
                  c.r = ctx.getTwoPointsDistance(cursor, c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              }
            ],
            angleSnapStartPoint: content
          };
        });
      },
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => {
          const startAngle = content.startAngle / 180 * Math.PI;
          const endAngle = content.endAngle / 180 * Math.PI;
          const middleAngle = (startAngle + endAngle) / 2;
          return [
            { x: content.x, y: content.y, type: "center" },
            { x: content.x + content.r * Math.cos(startAngle), y: content.y + content.r * Math.sin(startAngle), type: "endpoint" },
            { x: content.x + content.r * Math.cos(endAngle), y: content.y + content.r * Math.sin(endAngle), type: "endpoint" },
            { x: content.x + content.r * Math.cos(middleAngle), y: content.y + content.r * Math.sin(middleAngle), type: "midpoint" }
          ];
        });
      },
      getGeometries: getArcGeometries,
      propertyPanel(content, update) {
        return {
          x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.x,
            setValue: (v) => update((c) => {
              if (isArcContent(c)) {
                c.x = v;
              }
            })
          }),
          y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.y,
            setValue: (v) => update((c) => {
              if (isArcContent(c)) {
                c.y = v;
              }
            })
          }),
          r: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.r,
            setValue: (v) => update((c) => {
              if (isArcContent(c)) {
                c.r = v;
              }
            })
          }),
          startAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.startAngle,
            setValue: (v) => update((c) => {
              if (isArcContent(c)) {
                c.startAngle = v;
              }
            })
          }),
          endAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.endAngle,
            setValue: (v) => update((c) => {
              if (isArcContent(c)) {
                c.endAngle = v;
              }
            })
          }),
          counterclockwise: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
            value: content.counterclockwise === true,
            setValue: (v) => update((c) => {
              if (isArcContent(c)) {
                c.counterclockwise = v ? true : void 0;
              }
            })
          }),
          ...ctx.getStrokeContentPropertyPanel(content, update)
        };
      }
    }
  ];
}
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}
function getCommand(ctx) {
  return [
    {
      name: "create circle",
      type: [
        { name: "2 points" },
        { name: "3 points" },
        { name: "center radius", hotkey: "C" },
        { name: "center diameter" }
      ],
      useCommand({ onEnd, scale, type }) {
        const { circle, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = ctx.useCircleClickCreate(
          type === "2 points" || type === "3 points" || type === "center diameter" || type === "center radius" ? type : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: "circle" })
          })
        );
        const assistentContents = [];
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: "polygon", points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] });
          } else {
            assistentContents.push(
              { type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              {
                type: "text",
                x: (startPosition.x + cursorPosition.x) / 2 - 20,
                y: (startPosition.y + cursorPosition.y) / 2 + 4,
                text: ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                color: 16711680,
                fontSize: 16 / scale,
                fontFamily: "monospace"
              }
            );
          }
        }
        if (circle) {
          assistentContents.push({ ...circle, type: "circle" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition
        };
      },
      selectCount: 0
    },
    {
      name: "create arc",
      useCommand({ onEnd, type, scale }) {
        const { circle, arc, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = ctx.useCircleArcClickCreate(
          type === "create arc" ? "center radius" : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: "arc" })
          })
        );
        const assistentContents = [];
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: "polygon", points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] });
          } else {
            assistentContents.push(
              { type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              {
                type: "text",
                x: (startPosition.x + cursorPosition.x) / 2 - 20,
                y: (startPosition.y + cursorPosition.y) / 2 + 4,
                text: ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                color: 16711680,
                fontSize: 16 / scale,
                fontFamily: "monospace"
              }
            );
          }
        }
        if (arc) {
          assistentContents.push({ ...arc, dashArray: [4 / scale], type: "circle" });
          if (arc.startAngle !== arc.endAngle) {
            assistentContents.push(
              {
                type: "line",
                points: [
                  {
                    x: arc.x + arc.r * Math.cos(arc.startAngle / 180 * Math.PI),
                    y: arc.y + arc.r * Math.sin(arc.startAngle / 180 * Math.PI)
                  },
                  {
                    x: arc.x,
                    y: arc.y
                  }
                ],
                dashArray: [4 / scale]
              },
              {
                type: "line",
                points: [
                  {
                    x: arc.x,
                    y: arc.y
                  },
                  {
                    x: arc.x + arc.r * Math.cos(arc.endAngle / 180 * Math.PI),
                    y: arc.y + arc.r * Math.sin(arc.endAngle / 180 * Math.PI)
                  }
                ],
                dashArray: [4 / scale]
              }
            );
          }
          if (cursorPosition) {
            assistentContents.push({ type: "line", points: [arc, cursorPosition], dashArray: [4 / scale] });
          }
        }
        if (circle) {
          assistentContents.push({ ...circle, dashArray: [4 / scale], type: "circle" });
          if (cursorPosition) {
            assistentContents.push({ type: "line", points: [circle, cursorPosition], dashArray: [4 / scale] });
          }
        }
        if (arc && arc.startAngle !== arc.endAngle) {
          assistentContents.push({ ...arc, type: "arc" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition
        };
      },
      selectCount: 0,
      hotkey: "A"
    }
  ];
}
export {
  getCommand,
  getModel,
  isArcContent,
  isCircleContent
};
`,
`// dev/plugins/clone.plugin.tsx
function getCommand(ctx) {
  return {
    name: "clone",
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition } = ctx.useDragMove(
        () => onEnd({ repeatedly: true }),
        {
          repeatedly: true,
          transform,
          ignoreLeavingEvent: true
        }
      );
      let message = "";
      if (type) {
        message = startPosition ? "specify end point" : "specify start point";
      }
      const { input, setInputPosition } = ctx.useCursorInput(message);
      return {
        onStart,
        mask,
        input,
        onMove(_, p) {
          setInputPosition(p);
        },
        updateContent(content) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  ctx.getModel(d.type)?.move?.(d, offset);
                })
              ]
            };
          }
          return {};
        },
        assistentContents: startPosition && (offset.x !== 0 || offset.y !== 0) ? [
          {
            type: "line",
            dashArray: [4 / scale],
            points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
          }
        ] : void 0
      };
    },
    contentSelectable(content) {
      return ctx.getModel(content.type)?.move !== void 0;
    },
    hotkey: "CO"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/plugins/create-tangent-tangent-radius-circle.plugin.tsx
function getCommand(ctx) {
  function getTangentTangentRadiusCircles(content1, content2, radius) {
    const result = [];
    const content1IsCircle = isCircleContent(content1) || isArcContent(content1);
    const content2IsCircle = isCircleContent(content2) || isArcContent(content2);
    if (content1IsCircle && content2IsCircle) {
      result.push(...ctx.getCirclesTangentTo2Circles(content1, content2, radius).map((c) => ({ ...c, r: radius })));
    } else if (content1IsCircle && isLineContent(content2)) {
      result.push(...ctx.getCirclesTangentToLineAndCircle(content2.points[0], content2.points[1], content1, radius).map((c) => ({ ...c, r: radius })));
    } else if (content2IsCircle && isLineContent(content1)) {
      result.push(...ctx.getCirclesTangentToLineAndCircle(content1.points[0], content1.points[1], content2, radius).map((c) => ({ ...c, r: radius })));
    } else if (isLineContent(content1) && isLineContent(content2)) {
      result.push(...ctx.getCirclesTangentTo2Lines(content1.points[0], content1.points[1], content2.points[0], content2.points[1], radius).map((c) => ({ ...c, r: radius })));
    }
    return result;
  }
  const React = ctx.React;
  return {
    name: "create tangent tangent radius circle",
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState([]);
      const [result, setResult] = React.useState();
      let message = "";
      if (type) {
        if (candidates.length > 0) {
          message = "select one result";
        } else {
          message = "input radius";
        }
      }
      const assistentContents = candidates.map((c) => ({
        ...c,
        type: "circle",
        dashArray: c === result ? void 0 : [4 / scale]
      }));
      const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
        if (e.key === "Enter") {
          const radius = +text;
          if (!isNaN(radius)) {
            setCandidates(getTangentTangentRadiusCircles(selected[0].content, selected[1].content, radius));
            clearText();
          }
        }
      } : void 0);
      const reset = () => {
        setCandidates([]);
        setResult(void 0);
        clearText();
        resetInput();
      };
      ctx.useKey((e) => e.key === "Escape", reset, [setCandidates]);
      return {
        onStart(p) {
          setCursorPosition(p);
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: "circle", ...result });
              }
            });
            setCandidates([]);
          }
        },
        input,
        onMove(p, viewportPosition) {
          setCursorPosition(p);
          setInputPosition(viewportPosition || p);
          setResult(candidates.find((c) => ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(c, p), c.r) < 5));
        },
        assistentContents
      };
    },
    selectCount: 2,
    contentSelectable: (c) => isCircleContent(c) || isArcContent(c) || isLineContent(c),
    selectType: "select part"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/delete.plugin.tsx
function getCommand(ctx) {
  return {
    name: "delete",
    execute(contents, selected) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          contents[index] = void 0;
        }
      });
    },
    contentSelectable(content, contents) {
      return !ctx.contentIsReferenced(content, contents);
    },
    hotkey: "E"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/ellipse.plugin.tsx
function getModel(ctx) {
  function getEllipseGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = ctx.ellipseToPolygon(content, ctx.angleDelta);
      const lines = Array.from(ctx.iteratePolygonLines(points));
      const polylinePoints = ctx.polygonToPolyline(points);
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(polylinePoints, content.dashArray),
        regions: content.fillColor !== void 0 ? [
          {
            lines,
            points
          }
        ] : void 0
      };
    });
  }
  function getEllipseArcGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = ctx.ellipseArcToPolyline(content, ctx.angleDelta);
      return {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
      };
    });
  }
  const React = ctx.React;
  const ellipseModel = {
    type: "ellipse",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.cx += offset.x;
      content.cy += offset.y;
    },
    rotate(content, center, angle) {
      const p = ctx.rotatePositionByCenter({ x: content.cx, y: content.cy }, center, -angle);
      content.cx = p.x;
      content.cy = p.y;
      content.angle = (content.angle ?? 0) + angle;
    },
    mirror(content, line, angle) {
      const p = ctx.getSymmetryPoint({ x: content.cx, y: content.cy }, line);
      content.cx = p.x;
      content.cy = p.y;
      content.angle = 2 * angle - (content.angle ?? 0);
    },
    break(content, points) {
      if (points.length < 2) {
        return;
      }
      const angles = points.map((p) => ctx.getEllipseAngle(p, content));
      angles.sort((a, b) => a - b);
      return angles.map((a, i) => ({
        ...content,
        type: "ellipse arc",
        startAngle: a,
        endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1]
      }));
    },
    render({ content, color, target, strokeWidth }) {
      const colorField = content.fillColor !== void 0 ? "fillColor" : "strokeColor";
      if (content.fillColor !== void 0) {
        strokeWidth = 0;
      }
      if (content.dashArray) {
        const { points } = getEllipseGeometries(content);
        return target.renderPolygon(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth });
      }
      return target.renderEllipse(content.cx, content.cy, content.rx, content.ry, { [colorField]: color, angle: content.angle, strokeWidth });
    },
    getOperatorRenderPosition(content) {
      return { x: content.cx, y: content.cy };
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const center = { x: content.cx, y: content.cy };
        const rotate = -(content.angle ?? 0);
        const left = ctx.rotatePositionByCenter({ x: content.cx - content.rx, y: content.cy }, center, rotate);
        const right = ctx.rotatePositionByCenter({ x: content.cx + content.rx, y: content.cy }, center, rotate);
        const top = ctx.rotatePositionByCenter({ x: content.cx, y: content.cy - content.ry }, center, rotate);
        const bottom = ctx.rotatePositionByCenter({ x: content.cx, y: content.cy + content.ry }, center, rotate);
        return {
          editPoints: [
            {
              x: content.cx,
              y: content.cy,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isEllipseContent(c)) {
                  return;
                }
                c.cx += cursor.x - start.x;
                c.cy += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
              }
            },
            {
              x: left.x,
              y: left.y,
              cursor: ctx.getResizeCursor(-rotate, "left"),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return;
                }
                c.rx = ctx.getTwoPointsDistance(cursor, center);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
              }
            },
            {
              x: right.x,
              y: right.y,
              cursor: ctx.getResizeCursor(-rotate, "right"),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return;
                }
                c.rx = ctx.getTwoPointsDistance(cursor, center);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
              }
            },
            {
              x: top.x,
              y: top.y,
              cursor: ctx.getResizeCursor(-rotate, "top"),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return;
                }
                c.ry = ctx.getTwoPointsDistance(cursor, center);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
              }
            },
            {
              x: bottom.x,
              y: bottom.y,
              cursor: ctx.getResizeCursor(-rotate, "bottom"),
              update(c, { cursor, scale }) {
                if (!isEllipseContent(c)) {
                  return;
                }
                c.ry = ctx.getTwoPointsDistance(cursor, center);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
              }
            }
          ],
          angleSnapStartPoint: { x: content.cx, y: content.cy }
        };
      });
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => [
        { x: content.cx, y: content.cy, type: "center" },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content), type: "endpoint" },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content), type: "endpoint" },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content), type: "endpoint" },
        { ...ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content), type: "endpoint" }
      ]);
    },
    getGeometries: getEllipseGeometries,
    propertyPanel(content, update) {
      return {
        cx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.cx,
          setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.cx = v;
            }
          })
        }),
        cy: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.cy,
          setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.cy = v;
            }
          })
        }),
        rx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.rx,
          setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.rx = v;
            }
          })
        }),
        ry: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.ry,
          setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.ry = v;
            }
          })
        }),
        angle: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
          value: content.angle !== void 0,
          setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.angle = v ? 0 : void 0;
            }
          }),
          style: { marginRight: "5px" }
        }), content.angle !== void 0 && /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.angle,
          setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.angle = v;
            }
          })
        })),
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update)
      };
    }
  };
  return [
    ellipseModel,
    {
      type: "ellipse arc",
      ...ctx.strokeModel,
      move: ellipseModel.move,
      rotate: ellipseModel.rotate,
      mirror: ellipseModel.mirror,
      break(content, points) {
        if (points.length === 0) {
          return;
        }
        const angles = points.map((p) => ctx.normalizeAngleInRange(ctx.getEllipseAngle(p, content), content));
        angles.sort((a, b) => a - b);
        const result = [];
        if (!ctx.equals(angles[0], content.startAngle)) {
          result.push({
            ...content,
            type: "ellipse arc",
            startAngle: content.startAngle,
            endAngle: angles[0]
          });
        }
        angles.forEach((a, i) => {
          if (i === angles.length - 1) {
            if (!ctx.equals(a, content.endAngle)) {
              result.push({
                ...content,
                type: "ellipse arc",
                startAngle: a,
                endAngle: content.endAngle
              });
            }
          } else {
            result.push({
              ...content,
              type: "ellipse arc",
              startAngle: a,
              endAngle: angles[i + 1]
            });
          }
        });
        return result.length > 1 ? result : void 0;
      },
      render({ content, color, target, strokeWidth }) {
        const { points } = getEllipseArcGeometries(content);
        return target.renderPolyline(points, { strokeColor: color, dashArray: content.dashArray, strokeWidth });
      },
      renderIfSelected({ content, color, target, strokeWidth }) {
        const { points } = getEllipseArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 });
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth });
      },
      getOperatorRenderPosition(content) {
        const { points } = getEllipseArcGeometries(content);
        return points[0];
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const center = { x: content.cx, y: content.cy };
          const startAngle = content.startAngle / 180 * Math.PI;
          const endAngle = content.endAngle / 180 * Math.PI;
          const rotate = -(content.angle ?? 0);
          return {
            editPoints: [
              {
                x: content.cx,
                y: content.cy,
                cursor: "move",
                update(c, { cursor, start, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  c.cx += cursor.x - start.x;
                  c.cy += cursor.y - start.y;
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
                }
              },
              {
                ...ctx.rotatePositionByCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, center, rotate),
                cursor: ctx.getResizeCursor(content.startAngle - rotate, "top"),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  const p = ctx.rotatePositionByCenter(cursor, center, content.angle ?? 0);
                  c.startAngle = Math.atan2((p.y - content.cy) / content.ry, (p.x - content.cx) / content.rx) * 180 / Math.PI;
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
                }
              },
              {
                ...ctx.rotatePositionByCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, center, rotate),
                cursor: ctx.getResizeCursor(content.endAngle - rotate, "top"),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  const p = ctx.rotatePositionByCenter(cursor, center, content.angle ?? 0);
                  c.endAngle = Math.atan2((p.y - content.cy) / content.ry, (p.x - content.cx) / content.rx) * 180 / Math.PI;
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
                }
              }
            ],
            angleSnapStartPoint: center
          };
        });
      },
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => {
          const startAngle = content.startAngle / 180 * Math.PI;
          const endAngle = content.endAngle / 180 * Math.PI;
          const middleAngle = (startAngle + endAngle) / 2;
          return [
            { x: content.cx, y: content.cy, type: "center" },
            { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(startAngle), y: content.cy + content.ry * Math.sin(startAngle) }, content), type: "endpoint" },
            { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, content), type: "endpoint" },
            { ...ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx * Math.cos(middleAngle), y: content.cy + content.ry * Math.sin(middleAngle) }, content), type: "midpoint" }
          ];
        });
      },
      getGeometries: getEllipseArcGeometries,
      propertyPanel(content, update) {
        return {
          cx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.cx,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.cx = v;
              }
            })
          }),
          cy: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.cy,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.cy = v;
              }
            })
          }),
          rx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.rx,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.rx = v;
              }
            })
          }),
          ry: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.ry,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.ry = v;
              }
            })
          }),
          angle: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
            value: content.angle !== void 0,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.angle = v ? 0 : void 0;
              }
            }),
            style: { marginRight: "5px" }
          }), content.angle !== void 0 && /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.angle,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.angle = v;
              }
            })
          })),
          startAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.startAngle,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.startAngle = v;
              }
            })
          }),
          endAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.endAngle,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.endAngle = v;
              }
            })
          }),
          counterclockwise: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
            value: content.counterclockwise === true,
            setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.counterclockwise = v ? true : void 0;
              }
            })
          }),
          ...ctx.getStrokeContentPropertyPanel(content, update)
        };
      }
    }
  ];
}
function isEllipseContent(content) {
  return content.type === "ellipse";
}
function isEllipseArcContent(content) {
  return content.type === "ellipse arc";
}
function getCommand(ctx) {
  return [
    {
      name: "create ellipse",
      type: [
        { name: "ellipse center", hotkey: "EL" },
        { name: "ellipse endpoint" }
      ],
      useCommand({ onEnd, type, scale }) {
        const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = ctx.useEllipseClickCreate(
          type === "ellipse center" || type === "ellipse endpoint" ? type : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: "ellipse" })
          })
        );
        const assistentContents = [];
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: "line", points: [startPosition, middlePosition], dashArray: [4 / scale] });
            if (type === "ellipse center") {
              assistentContents.push({ type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] });
            } else if (ellipse) {
              assistentContents.push({ type: "line", points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4 / scale] });
            }
          } else {
            assistentContents.push({ type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] });
          }
        }
        if (ellipse) {
          assistentContents.push({ ...ellipse, type: "ellipse" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition
        };
      },
      selectCount: 0
    },
    {
      name: "create ellipse arc",
      useCommand({ onEnd, type, scale }) {
        const { ellipse, ellipseArc, onClick, onMove, input, startPosition, middlePosition, cursorPosition } = ctx.useEllipseArcClickCreate(
          type === "create ellipse arc" ? "ellipse center" : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, type: "ellipse arc" })
          })
        );
        const assistentContents = [];
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: "line", points: [startPosition, middlePosition], dashArray: [4 / scale] });
            const center = type === "create ellipse arc" ? startPosition : { x: (startPosition.x + middlePosition.x) / 2, y: (startPosition.y + middlePosition.y) / 2 };
            assistentContents.push({ type: "line", points: [center, cursorPosition], dashArray: [4 / scale] });
          } else {
            assistentContents.push({ type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] });
          }
        }
        if (ellipseArc) {
          assistentContents.push({ ...ellipseArc, dashArray: [4 / scale], type: "ellipse" });
          if (ellipseArc.startAngle !== ellipseArc.endAngle) {
            assistentContents.push(
              {
                type: "line",
                points: [
                  ctx.rotatePositionByEllipseCenter({
                    x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.startAngle / 180 * Math.PI),
                    y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.startAngle / 180 * Math.PI)
                  }, ellipseArc),
                  {
                    x: ellipseArc.cx,
                    y: ellipseArc.cy
                  }
                ],
                dashArray: [4 / scale]
              },
              {
                type: "line",
                points: [
                  {
                    x: ellipseArc.cx,
                    y: ellipseArc.cy
                  },
                  ctx.rotatePositionByEllipseCenter({
                    x: ellipseArc.cx + ellipseArc.rx * Math.cos(ellipseArc.endAngle / 180 * Math.PI),
                    y: ellipseArc.cy + ellipseArc.ry * Math.sin(ellipseArc.endAngle / 180 * Math.PI)
                  }, ellipseArc)
                ],
                dashArray: [4 / scale]
              }
            );
          }
          if (cursorPosition) {
            assistentContents.push({ type: "line", points: [{ x: ellipseArc.cx, y: ellipseArc.cy }, cursorPosition], dashArray: [4 / scale] });
          }
        } else if (ellipse) {
          assistentContents.push({ ...ellipse, dashArray: [4 / scale], type: "ellipse" });
          if (cursorPosition) {
            assistentContents.push({ type: "line", points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4 / scale] });
          }
        }
        if (ellipseArc && ellipseArc.startAngle !== ellipseArc.endAngle) {
          assistentContents.push({ ...ellipseArc, type: "ellipse arc" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition ?? startPosition
        };
      },
      selectCount: 0
    }
  ];
}
export {
  getCommand,
  getModel,
  isEllipseArcContent,
  isEllipseContent
};
`,
`// dev/plugins/explode.plugin.tsx
function getCommand(ctx) {
  return {
    name: "explode",
    execute(contents, selected) {
      const newContents = [];
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          const result = ctx.getModel(content.type)?.explode?.(content, contents);
          if (result) {
            newContents.push(...result);
            contents[index] = void 0;
          }
        }
      });
      contents.push(...newContents);
    },
    contentSelectable(content, contents) {
      const model = ctx.getModel(content.type);
      return model?.explode !== void 0 && !ctx.contentIsReferenced(content, contents);
    },
    hotkey: "X"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/fill.plugin.tsx
function getCommand(ctx) {
  return {
    name: "fill",
    execute(contents, selected) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          if (ctx.isFillContent(content)) {
            content.fillColor = 0;
          }
        }
      });
    },
    contentSelectable: ctx.isFillContent
  };
}
export {
  getCommand
};
`,
`// dev/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/plugins/fillet.plugin.tsx
function getCommand(ctx) {
  function getFillets(content1, content2, radius) {
    const result = [];
    if (isLineContent(content1) && isLineContent(content2)) {
      result.push(...ctx.getCirclesTangentTo2Lines(content1.points[0], content1.points[1], content2.points[0], content2.points[1], radius).map((c) => {
        const foot1 = ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]));
        const foot2 = ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]));
        const angle1 = Math.atan2(foot1.y - c.y, foot1.x - c.x) * 180 / Math.PI;
        const angle2 = Math.atan2(foot2.y - c.y, foot2.x - c.x) * 180 / Math.PI;
        const min = Math.min(angle1, angle2);
        const max = Math.max(angle1, angle2);
        if (max - min < 180) {
          return { ...c, r: radius, startAngle: min, endAngle: max };
        }
        return { ...c, r: radius, startAngle: max, endAngle: min + 360 };
      }));
    }
    return result;
  }
  const React = ctx.React;
  return {
    name: "fillet",
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState([]);
      const [result, setResult] = React.useState();
      let message = "";
      if (type) {
        if (candidates.length > 0) {
          message = "select one result";
        } else {
          message = "input radius";
        }
      }
      const assistentContents = candidates.map((c) => ({
        ...c,
        type: "arc",
        dashArray: c === result ? void 0 : [4 / scale]
      }));
      const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type && candidates.length == 0 ? (e, text) => {
        if (e.key === "Enter") {
          const radius = +text;
          if (!isNaN(radius)) {
            setCandidates(getFillets(selected[0].content, selected[1].content, radius));
            clearText();
          }
        }
      } : void 0);
      const reset = () => {
        setCandidates([]);
        setResult(void 0);
        clearText();
        resetInput();
      };
      ctx.useKey((e) => e.key === "Escape", reset, [setCandidates]);
      return {
        onStart(p) {
          setCursorPosition(p);
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: "arc", ...result });
              }
            });
            setCandidates([]);
          }
        },
        input,
        onMove(p, viewportPosition) {
          setCursorPosition(p);
          setInputPosition(viewportPosition || p);
          setResult(candidates.find((c) => ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(c, p), c.r) < 5));
        },
        assistentContents
      };
    },
    selectCount: 2,
    contentSelectable: (c) => isLineContent(c),
    selectType: "select part",
    hotkey: "F"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/group.plugin.tsx
function getModel(ctx) {
  return {
    type: "group",
    ...ctx.containerModel,
    move(content, offset) {
      content.contents.forEach((c) => {
        if (!c) {
          return;
        }
        ctx.getModel(c.type)?.move?.(c, offset);
      });
    },
    rotate(content, center, angle, contents) {
      content.contents.forEach((c) => {
        if (!c) {
          return;
        }
        ctx.getModel(c?.type)?.rotate?.(c, center, angle, contents);
      });
    },
    explode(content) {
      return content.contents.filter((c) => !!c);
    },
    mirror(content, line, angle, contents) {
      content.contents.forEach((c) => {
        if (!c) {
          return;
        }
        ctx.getModel(c.type)?.mirror?.(c, line, angle, contents);
      });
    },
    render({ content, target, color, strokeWidth, contents }) {
      const children = ctx.renderContainerChildren(content, target, strokeWidth, contents, color);
      return target.renderGroup(children);
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: ctx.getContainerGeometries
  };
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.getContentModel(content)?.getRefIds === void 0 && !ctx.contentIsReferenced(content, contents);
  }
  return {
    name: "create group",
    execute(contents, selected) {
      const newContent = {
        type: "group",
        contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents))
      };
      for (let i = contents.length; i >= 0; i--) {
        if (ctx.isSelected([i], selected)) {
          contents[i] = void 0;
        }
      }
      contents.push(newContent);
    },
    contentSelectable,
    hotkey: "G"
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/plugins/image.plugin.tsx
function getModel(ctx) {
  function getImageGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [
        { x: content.x, y: content.y + content.height },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x + content.width, y: content.y },
        { x: content.x, y: content.y }
      ];
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines: [],
        points: [],
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            lines,
            points
          }
        ],
        renderingLines: []
      };
    });
  }
  const React = ctx.React;
  return {
    type: "image",
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isImageContent(c)) {
                  return;
                }
                c.x += cursor.x - start.x;
                c.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
              }
            }
          ]
        };
      });
    },
    render({ content, target }) {
      return target.renderImage(content.url, content.x, content.y, content.width, content.height);
    },
    renderIfSelected({ content, color, target, strokeWidth }) {
      return target.renderRect(content.x, content.y, content.width, content.height, { strokeColor: color, dashArray: [4], strokeWidth });
    },
    getOperatorRenderPosition(content) {
      return content;
    },
    getGeometries: getImageGeometries,
    propertyPanel(content, update) {
      return {
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.x,
          setValue: (v) => update((c) => {
            if (isImageContent(c)) {
              c.x = v;
            }
          })
        }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.y,
          setValue: (v) => update((c) => {
            if (isImageContent(c)) {
              c.y = v;
            }
          })
        }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.width,
          setValue: (v) => update((c) => {
            if (isImageContent(c)) {
              c.width = v;
            }
          })
        }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.height,
          setValue: (v) => update((c) => {
            if (isImageContent(c)) {
              c.height = v;
            }
          })
        }),
        url: /* @__PURE__ */ React.createElement(ctx.StringEditor, {
          value: content.url,
          setValue: (v) => update((c) => {
            if (isImageContent(c)) {
              c.url = v;
            }
          })
        })
      };
    }
  };
}
function isImageContent(content) {
  return content.type === "image";
}
function getCommand(ctx) {
  return {
    name: "create image",
    useCommand({ onEnd, type }) {
      const { image, onClick, onMove, input } = ctx.useImageClickCreate(
        type === "create image",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "image",
            ...c
          })
        })
      );
      const assistentContents = [];
      if (image) {
        assistentContents.push({
          type: "image",
          ...image
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel,
  isImageContent
};
`,
`// dev/plugins/line-polyline.plugin.tsx
function getModel(ctx) {
  function getPolylineGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      return {
        lines: Array.from(ctx.iteratePolylineLines(content.points)),
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(content.points, content.dashArray)
      };
    });
  }
  const React = ctx.React;
  const lineModel = {
    type: "line",
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
    break(content, intersectionPoints) {
      const { lines } = getPolylineGeometries(content);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    render({ content, color, target, strokeWidth }) {
      return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth });
    },
    getOperatorRenderPosition(content) {
      return content.points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isLineContent) }));
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getPolylineGeometries(content);
        return [
          ...points.map((p) => ({ ...p, type: "endpoint" })),
          ...lines.map(([start, end]) => ({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            type: "midpoint"
          }))
        ];
      });
    },
    getGeometries: getPolylineGeometries,
    propertyPanel(content, update) {
      return {
        points: /* @__PURE__ */ React.createElement(ctx.ArrayEditor, {
          inline: true,
          ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
            if (isLineContent(c)) {
              v(c);
            }
          })),
          items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
            inline: true,
            properties: {
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                value: f.x,
                setValue: (v) => update((c) => {
                  if (isLineContent(c)) {
                    c.points[i].x = v;
                  }
                })
              }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                value: f.y,
                setValue: (v) => update((c) => {
                  if (isLineContent(c)) {
                    c.points[i].y = v;
                  }
                })
              })
            }
          }))
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update)
      };
    }
  };
  return [
    lineModel,
    {
      ...lineModel,
      type: "polyline",
      explode(content) {
        const { lines } = getPolylineGeometries(content);
        return lines.map((line) => ({ type: "line", points: line }));
      },
      render({ content, color, target, strokeWidth }) {
        return target.renderPolyline(content.points, { strokeColor: color, dashArray: content.dashArray, strokeWidth });
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolyLineContent) }));
      },
      canSelectPart: true,
      propertyPanel(content, update) {
        return {
          points: /* @__PURE__ */ React.createElement(ctx.ArrayEditor, {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
              if (isPolyLineContent(c)) {
                v(c);
              }
            })),
            items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
              inline: true,
              properties: {
                x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                  value: f.x,
                  setValue: (v) => update((c) => {
                    if (isPolyLineContent(c)) {
                      c.points[i].x = v;
                    }
                  })
                }),
                y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                  value: f.y,
                  setValue: (v) => update((c) => {
                    if (isPolyLineContent(c)) {
                      c.points[i].y = v;
                    }
                  })
                })
              }
            }))
          }),
          ...ctx.getStrokeContentPropertyPanel(content, update)
        };
      }
    }
  ];
}
function isLineContent(content) {
  return content.type === "line";
}
function isPolyLineContent(content) {
  return content.type === "polyline";
}
function getCommand(ctx) {
  return [
    {
      name: "create line",
      useCommand({ onEnd, scale, type }) {
        const { line, onClick, onMove, input, inputMode, lastPosition } = ctx.useLineClickCreate(
          type === "create line",
          (c) => onEnd({
            updateContents: (contents) => contents.push(...Array.from(ctx.iteratePolylineLines(c)).map((line2) => ({ points: line2, type: "line" })))
          })
        );
        const assistentContents = [];
        if (line && line.length > 1) {
          const start = line[line.length - 2];
          const end = line[line.length - 1];
          const r = ctx.getTwoPointsDistance(start, end);
          const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
          assistentContents.push(
            {
              type: "arc",
              x: start.x,
              y: start.y,
              r,
              dashArray: [4 / scale],
              startAngle: angle > 180 || angle < 0 ? angle : 0,
              endAngle: angle > 180 || angle < 0 ? 0 : angle
            },
            {
              type: "line",
              dashArray: [4 / scale],
              points: [start, { x: start.x + r, y: start.y }]
            },
            {
              type: "text",
              x: (start.x + end.x) / 2 - 20,
              y: (start.y + end.y) / 2 + 4,
              text: r.toFixed(2),
              color: inputMode === "length" ? 16711680 : 16764108,
              fontSize: 16 / scale,
              fontFamily: "monospace"
            },
            {
              type: "text",
              x: end.x + 10,
              y: end.y - 10,
              text: \`\${angle.toFixed(1)}\\xB0\`,
              color: inputMode === "angle" ? 16711680 : 16764108,
              fontSize: 16 / scale,
              fontFamily: "monospace"
            }
          );
        }
        if (line) {
          for (const lineSegment of ctx.iteratePolylineLines(line)) {
            assistentContents.push({ points: lineSegment, type: "line" });
          }
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition
        };
      },
      selectCount: 0,
      hotkey: "L"
    },
    {
      name: "create polyline",
      useCommand({ onEnd, scale, type }) {
        const { line, onClick, onMove, input, inputMode, lastPosition } = ctx.useLineClickCreate(
          type === "create polyline",
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, type: "polyline" })
          })
        );
        const assistentContents = [];
        if (line && line.length > 1) {
          const start = line[line.length - 2];
          const end = line[line.length - 1];
          const r = ctx.getTwoPointsDistance(start, end);
          const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
          assistentContents.push(
            {
              type: "arc",
              x: start.x,
              y: start.y,
              r,
              dashArray: [4 / scale],
              startAngle: angle > 180 || angle < 0 ? angle : 0,
              endAngle: angle > 180 || angle < 0 ? 0 : angle
            },
            {
              type: "line",
              dashArray: [4 / scale],
              points: [start, { x: start.x + r, y: start.y }]
            },
            {
              type: "text",
              x: (start.x + end.x) / 2 - 20,
              y: (start.y + end.y) / 2 + 4,
              text: r.toFixed(2),
              color: inputMode === "length" ? 16711680 : 16764108,
              fontSize: 16 / scale,
              fontFamily: "monospace"
            },
            {
              type: "text",
              x: end.x + 10,
              y: end.y - 10,
              text: \`\${angle.toFixed(1)}\\xB0\`,
              color: inputMode === "angle" ? 16711680 : 16764108,
              fontSize: 16 / scale,
              fontFamily: "monospace"
            }
          );
        }
        if (line) {
          assistentContents.push({ points: line, type: "polyline" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition
        };
      },
      selectCount: 0,
      hotkey: "PL"
    }
  ];
}
export {
  getCommand,
  getModel,
  isLineContent,
  isPolyLineContent
};
`,
`// dev/plugins/linear-dimension.plugin.tsx
function getModel(ctx) {
  function getLinearDimensionGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      return ctx.getLinearDimensionGeometries(content, ctx.dimensionStyle, getTextPosition);
    });
  }
  const textPositionMap = new ctx.WeakmapCache();
  function getTextPosition(content) {
    return textPositionMap.get(content, () => {
      return ctx.getLinearDimensionTextPosition(content, ctx.dimensionStyle.margin, ctx.getTextSizeFromCache);
    });
  }
  const React = ctx.React;
  return {
    type: "linear dimension",
    ...ctx.strokeModel,
    move(content, offset) {
      content.p1.x += offset.x;
      content.p1.y += offset.y;
      content.p2.x += offset.x;
      content.p2.y += offset.y;
      content.position.x += offset.x;
      content.position.y += offset.y;
    },
    render({ content, target, color, strokeWidth }) {
      const { regions, lines } = getLinearDimensionGeometriesFromCache(content);
      const children = [];
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth, dashArray: content.dashArray }));
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth, fillColor: color }));
        }
      }
      const { textPosition, text, textRotation } = getTextPosition(content);
      children.push(target.renderGroup(
        [
          target.renderText(textPosition.x, textPosition.y, text, color, content.fontSize, content.fontFamily, { cacheKey: content })
        ],
        {
          rotation: textRotation,
          base: textPosition
        }
      ));
      return target.renderGroup(children);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.position.x,
              y: content.position.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isLinearDimensionContent(c)) {
                  return;
                }
                c.position.x += cursor.x - start.x;
                c.position.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }
          ]
        };
      });
    },
    getGeometries: getLinearDimensionGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        p1: /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
          inline: true,
          properties: {
            x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p1.x,
              setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p1.x = v;
                }
              })
            }),
            y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p1.y,
              setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p1.y = v;
                }
              })
            })
          }
        }),
        p2: /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
          inline: true,
          properties: {
            x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p2.x,
              setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p2.x = v;
                }
              })
            }),
            y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.p2.y,
              setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p2.y = v;
                }
              })
            })
          }
        }),
        position: /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
          inline: true,
          properties: {
            x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.position.x,
              setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.position.x = v;
                }
              })
            }),
            y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.position.y,
              setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.position.y = v;
                }
              })
            })
          }
        }),
        direct: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
          value: content.direct === true,
          setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c)) {
              c.direct = v ? true : void 0;
            }
          })
        }),
        text: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
          value: content.text !== void 0,
          setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c)) {
              c.text = v ? "" : void 0;
            }
          }),
          style: { marginRight: "5px" }
        }), content.text !== void 0 && /* @__PURE__ */ React.createElement(ctx.StringEditor, {
          value: content.text,
          setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c)) {
              c.text = v;
            }
          })
        })),
        fontSize: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.fontSize,
          setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c)) {
              c.fontSize = v;
            }
          })
        }),
        fontFamily: /* @__PURE__ */ React.createElement(ctx.StringEditor, {
          value: content.fontFamily,
          setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c)) {
              c.fontFamily = v;
            }
          })
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update)
      };
    }
  };
}
function isLinearDimensionContent(content) {
  return content.type === "linear dimension";
}
function getCommand(ctx) {
  const React = ctx.React;
  return {
    name: "create linear dimension",
    selectCount: 0,
    useCommand({ onEnd, type, scale }) {
      const [p1, setP1] = React.useState();
      const [p2, setP2] = React.useState();
      const [direct, setDirect] = React.useState(false);
      const [result, setResult] = React.useState();
      const [text, setText] = React.useState();
      let message = "";
      if (type) {
        message = "input text";
      }
      const { input, cursorPosition, setCursorPosition, clearText, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text2) => {
        if (e.key === "Enter") {
          setText(text2);
          if (result) {
            setResult({ ...result, text: text2 });
          }
          clearText();
        }
      } : void 0);
      const reset = () => {
        setP1(void 0);
        setP2(void 0);
        setResult(void 0);
        resetInput();
        setText(void 0);
      };
      ctx.useKey((e) => e.key === "Escape", reset, [setResult]);
      const assistentContents = [];
      if (result) {
        assistentContents.push(result);
      } else if (p1 && cursorPosition) {
        assistentContents.push({ type: "line", points: [p1, cursorPosition], dashArray: [4 / scale] });
      }
      return {
        input,
        onStart(p) {
          if (!p1) {
            setP1(p);
          } else if (!p2) {
            setP2(p);
          } else if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push(result);
              },
              nextCommand: type
            });
            reset();
          }
        },
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p);
          setCursorPosition(p);
          if (type && p1 && p2) {
            setResult({
              type: "linear dimension",
              position: p,
              p1,
              p2,
              direct,
              fontSize: 16,
              fontFamily: "monospace",
              text
            });
          }
        },
        subcommand: type ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", {
          onClick: () => {
            if (result) {
              setResult({ ...result, direct: !direct });
            }
            setDirect(!direct);
          },
          style: { position: "relative" }
        }, direct ? "direct" : "axis")) : void 0,
        assistentContents,
        lastPosition: p2 ?? p1
      };
    }
  };
}
export {
  getCommand,
  getModel,
  isLinearDimensionContent
};
`,
`// dev/plugins/measure.plugin.tsx
function getCommand(ctx) {
  return {
    name: "measure",
    useCommand({ transform, type, scale }) {
      const { onStart, mask, startPosition } = ctx.useDragMove(void 0, {
        transform,
        ignoreLeavingEvent: true
      });
      let message = "";
      if (type) {
        message = startPosition ? "specify end point" : "specify start point";
      }
      const { input, setInputPosition, cursorPosition, setCursorPosition } = ctx.useCursorInput(message);
      const assistentContents = [];
      if (startPosition && cursorPosition) {
        const start = startPosition;
        const end = cursorPosition;
        const r = ctx.getTwoPointsDistance(start, end);
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
        assistentContents.push(
          {
            type: "arc",
            x: start.x,
            y: start.y,
            r,
            dashArray: [4 / scale],
            startAngle: angle > 180 || angle < 0 ? angle : 0,
            endAngle: angle > 180 || angle < 0 ? 0 : angle
          },
          {
            type: "line",
            dashArray: [4 / scale],
            points: [start, { x: start.x + r, y: start.y }]
          },
          {
            type: "text",
            x: (start.x + end.x) / 2 - 20,
            y: (start.y + end.y) / 2 + 4,
            text: r.toFixed(2),
            color: 16711680,
            fontSize: 16 / scale,
            fontFamily: "monospace"
          },
          {
            type: "text",
            x: end.x + 10,
            y: end.y - 10,
            text: \`\${angle.toFixed(1)}\\xB0\`,
            color: 16711680,
            fontSize: 16 / scale,
            fontFamily: "monospace"
          },
          {
            type: "line",
            points: [startPosition, cursorPosition]
          }
        );
      }
      return {
        onStart,
        mask,
        input,
        onMove(p, viewportPosition) {
          setCursorPosition(p);
          setInputPosition(viewportPosition ?? p);
        },
        assistentContents
      };
    },
    selectCount: 0
  };
}
export {
  getCommand
};
`,
`// dev/plugins/mirror.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  return {
    name: "mirror",
    useCommand({ onEnd, transform, type, scale }) {
      const [changeOriginal, setChangeOriginal] = React.useState(false);
      const { offset, onStart, mask, startPosition } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true
      });
      let message = "";
      if (type) {
        message = startPosition ? "specify second point" : "specify first point";
      }
      const { input, setInputPosition, clearText, setCursorPosition } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === "Enter") {
          if (text.toLowerCase() === "y" || text.toLowerCase() === "n") {
            setChangeOriginal(!changeOriginal);
            clearText();
          }
        }
      } : void 0);
      return {
        onStart,
        mask: type ? mask : void 0,
        input,
        subcommand: type ? /* @__PURE__ */ React.createElement("button", {
          onClick: (e) => {
            setChangeOriginal(!changeOriginal);
            e.stopPropagation();
          }
        }, changeOriginal ? "create new(N)" : "change original(Y)") : void 0,
        updateContent(content, contents) {
          if (startPosition && offset && (offset.x !== 0 || offset.y !== 0)) {
            const end = { x: startPosition.x + offset.x, y: startPosition.y + offset.y };
            const line = ctx.twoPointLineToGeneralFormLine(startPosition, end);
            const angle = Math.atan2(end.y - startPosition.y, end.x - startPosition.x) * 180 / Math.PI;
            if (changeOriginal) {
              const [, ...patches] = ctx.produceWithPatches(content, (draft) => {
                ctx.getModel(content.type)?.mirror?.(draft, line, angle, contents);
              });
              return {
                patches
              };
            }
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  ctx.getModel(d.type)?.mirror?.(d, line, angle, contents);
                })
              ]
            };
          }
          return {};
        },
        onMove(p, viewportPosition) {
          setCursorPosition(p);
          setInputPosition(viewportPosition || p);
        },
        assistentContents: startPosition && offset && (offset.x !== 0 || offset.y !== 0) ? [
          {
            type: "line",
            dashArray: [4 / scale],
            points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
          }
        ] : void 0
      };
    },
    contentSelectable(content) {
      return ctx.getModel(content.type)?.mirror !== void 0;
    },
    hotkey: "MI"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/move.plugin.tsx
function getCommand(ctx) {
  return {
    name: "move",
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true
      });
      let message = "";
      if (type) {
        message = startPosition ? "specify end point" : "specify start point";
      }
      const { input, setInputPosition } = ctx.useCursorInput(message);
      return {
        onStart,
        mask,
        input,
        onMove(_, p) {
          setInputPosition(p);
        },
        updateContent(content) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            const [, ...patches] = ctx.produceWithPatches(content, (draft) => {
              ctx.getModel(content.type)?.move?.(draft, offset);
            });
            return {
              patches
            };
          }
          return {};
        },
        assistentContents: startPosition && (offset.x !== 0 || offset.y !== 0) ? [
          {
            type: "line",
            dashArray: [4 / scale],
            points: [startPosition, { x: startPosition.x + offset.x, y: startPosition.y + offset.y }]
          }
        ] : void 0
      };
    },
    contentSelectable(content) {
      return ctx.getModel(content.type)?.move !== void 0;
    },
    hotkey: "M"
  };
}
export {
  getCommand
};
`,
`// dev/plugins/polygon.plugin.tsx
function getModel(ctx) {
  function getPolygonGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const lines = Array.from(ctx.iteratePolygonLines(content.points));
      return {
        lines,
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(content.points), content.dashArray),
        regions: content.fillColor !== void 0 ? [
          {
            lines,
            points: content.points
          }
        ] : void 0
      };
    });
  }
  const React = ctx.React;
  return {
    type: "polygon",
    ...ctx.strokeModel,
    ...ctx.fillModel,
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
    explode(content) {
      const { lines } = getPolygonGeometries(content);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    break(content, intersectionPoints) {
      const { lines } = getPolygonGeometries(content);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    render({ content, color, target, strokeWidth }) {
      const colorField = content.fillColor !== void 0 ? "fillColor" : "strokeColor";
      if (content.fillColor !== void 0) {
        strokeWidth = 0;
      }
      return target.renderPolygon(content.points, { [colorField]: color, dashArray: content.dashArray, strokeWidth });
    },
    getOperatorRenderPosition(content) {
      return content.points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolygonContent, true) }));
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getPolygonGeometries(content);
        return [
          ...points.map((p) => ({ ...p, type: "endpoint" })),
          ...lines.map(([start, end]) => ({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            type: "midpoint"
          }))
        ];
      });
    },
    getGeometries: getPolygonGeometries,
    canSelectPart: true,
    propertyPanel(content, update) {
      return {
        points: /* @__PURE__ */ React.createElement(ctx.ArrayEditor, {
          inline: true,
          ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
            if (isPolygonContent(c)) {
              v(c);
            }
          })),
          items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
            inline: true,
            properties: {
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                value: f.x,
                setValue: (v) => update((c) => {
                  if (isPolygonContent(c)) {
                    c.points[i].x = v;
                  }
                })
              }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
                value: f.y,
                setValue: (v) => update((c) => {
                  if (isPolygonContent(c)) {
                    c.points[i].y = v;
                  }
                })
              })
            }
          }))
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update),
        ...ctx.getFillContentPropertyPanel(content, update)
      };
    }
  };
}
function isPolygonContent(content) {
  return content.type === "polygon";
}
function getCommand(ctx) {
  const React = ctx.React;
  return {
    name: "create polygon",
    useCommand({ onEnd, type, scale }) {
      const [createType, setCreateType] = React.useState("point");
      const { polygon, onClick, onMove, input, startSetSides, startPosition, cursorPosition } = ctx.usePolygonClickCreate(
        type === "create polygon",
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, type: "polygon" })
        }),
        {
          toEdge: createType === "edge",
          setSidesKey: "S",
          switchTypeKey: "T",
          switchType: () => setCreateType(createType === "edge" ? "point" : "edge")
        }
      );
      const assistentContents = [];
      if (startPosition && cursorPosition) {
        assistentContents.push({ type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] });
      }
      if (polygon) {
        assistentContents.push({ points: polygon, type: "polygon" });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        subcommand: type === "create polygon" ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", {
          onClick: startSetSides,
          style: { position: "relative" }
        }, "set sides(S)"), /* @__PURE__ */ React.createElement("button", {
          onClick: () => setCreateType(createType === "edge" ? "point" : "edge"),
          style: { position: "relative" }
        }, createType, "(T)")) : void 0,
        assistentContents,
        lastPosition: startPosition
      };
    },
    selectCount: 0,
    hotkey: "POL"
  };
}
export {
  getCommand,
  getModel,
  isPolygonContent
};
`,
`// dev/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/plugins/radial-dimension.plugin.tsx
function getModel(ctx) {
  function getRadialDimensionReferenceGeometriesFromCache(content, contents) {
    const target = getRadialDimensionReferenceTarget(content.refId, contents);
    if (target) {
      return radialDimensionReferenceLinesCache.get(target, content, () => {
        return ctx.getRadialDimensionGeometries(content, target, ctx.dimensionStyle, getTextPosition);
      });
    }
    return { lines: [], points: [], renderingLines: [] };
  }
  const radialDimensionReferenceLinesCache = new ctx.WeakmapCache2();
  function getRadialDimensionReferenceTarget(id, contents) {
    return contents.find((c, i) => !!c && (isCircleContent(c) || isArcContent(c)) && i === id);
  }
  const textPositionMap = new ctx.WeakmapCache2();
  function getTextPosition(content, circle) {
    return textPositionMap.get(content, circle, () => {
      return ctx.getRadialDimensionTextPosition(content, circle, ctx.dimensionStyle.margin, ctx.getTextSizeFromCache);
    });
  }
  const React = ctx.React;
  return {
    type: "radial dimension reference",
    ...ctx.strokeModel,
    move(content, offset) {
      content.position.x += offset.x;
      content.position.y += offset.y;
    },
    render({ content, target, color, strokeWidth, contents }) {
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents);
      const children = [];
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor: color, strokeWidth, dashArray: content.dashArray }));
      }
      if (regions && regions.length > 0) {
        children.push(target.renderPolyline(regions[0].points, { strokeColor: color, strokeWidth, fillColor: color }));
      }
      const referenceTarget = getRadialDimensionReferenceTarget(content.refId, contents);
      if (referenceTarget) {
        const { textPosition, textRotation, text } = getTextPosition(content, referenceTarget);
        children.push(target.renderGroup(
          [
            target.renderText(textPosition.x, textPosition.y, text, color, content.fontSize, content.fontFamily)
          ],
          {
            rotation: textRotation,
            base: textPosition
          }
        ));
      }
      return target.renderGroup(children);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.position.x,
              y: content.position.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRadialDimensionReferenceContent(c)) {
                  return;
                }
                c.position.x += cursor.x - start.x;
                c.position.y += cursor.y - start.y;
                const target = getRadialDimensionReferenceTarget(c.refId, contents);
                if (!target || ctx.getTwoPointsDistance(target, c.position) > target.r) {
                  return;
                }
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [target, cursor] }] };
              }
            }
          ]
        };
      });
    },
    getGeometries: getRadialDimensionReferenceGeometriesFromCache,
    propertyPanel(content, update) {
      return {
        position: /* @__PURE__ */ React.createElement(ctx.ObjectEditor, {
          inline: true,
          properties: {
            x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.position.x,
              setValue: (v) => update((c) => {
                if (isRadialDimensionReferenceContent(c)) {
                  c.position.x = v;
                }
              })
            }),
            y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.position.y,
              setValue: (v) => update((c) => {
                if (isRadialDimensionReferenceContent(c)) {
                  c.position.y = v;
                }
              })
            })
          }
        }),
        text: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
          value: content.text !== void 0,
          setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.text = v ? "" : void 0;
            }
          }),
          style: { marginRight: "5px" }
        }), content.text !== void 0 && /* @__PURE__ */ React.createElement(ctx.StringEditor, {
          value: content.text,
          setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.text = v;
            }
          })
        })),
        fontSize: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.fontSize,
          setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.fontSize = v;
            }
          })
        }),
        fontFamily: /* @__PURE__ */ React.createElement(ctx.StringEditor, {
          value: content.fontFamily,
          setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.fontFamily = v;
            }
          })
        }),
        ...ctx.getStrokeContentPropertyPanel(content, update)
      };
    },
    getRefIds(content) {
      return [content.refId];
    },
    updateRefId(content, update) {
      const newRefId = update(content.refId);
      if (newRefId !== void 0) {
        content.refId = newRefId;
      }
    }
  };
}
function isRadialDimensionReferenceContent(content) {
  return content.type === "radial dimension reference";
}
function getCommand(ctx) {
  function contentSelectable(content) {
    return isArcContent(content) || isCircleContent(content);
  }
  const React = ctx.React;
  return {
    name: "create radial dimension",
    selectCount: 1,
    contentSelectable,
    useCommand({ onEnd, selected, type }) {
      const [result, setResult] = React.useState();
      const [text, setText] = React.useState();
      let message = "";
      if (type) {
        message = "input text";
      }
      const { input, clearText, setCursorPosition, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text2) => {
        if (e.key === "Enter") {
          setText(text2);
          if (result) {
            setResult({ ...result, text: text2 });
          }
          clearText();
        }
      } : void 0);
      const reset = () => {
        setResult(void 0);
        resetInput();
        setText(void 0);
      };
      ctx.useKey((e) => e.key === "Escape", reset, [setResult]);
      return {
        input,
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (!result.refId && selected.length > 0 && type) {
                  const content = selected[0].content;
                  if (contentSelectable(content)) {
                    result.refId = ctx.getContentIndex(content, contents);
                  }
                }
                if (result.refId) {
                  contents.push({
                    type: "radial dimension reference",
                    position: result.position,
                    fontSize: result.fontSize,
                    fontFamily: result.fontFamily,
                    refId: result.refId,
                    text: result.text
                  });
                }
              },
              nextCommand: type
            });
            reset();
          }
        },
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p);
          setCursorPosition(p);
          if (selected.length > 0 && type) {
            const content = selected[0].content;
            if (contentSelectable(content)) {
              setResult({
                type: "radial dimension reference",
                position: p,
                fontSize: 16,
                fontFamily: "monospace",
                refId: selected[0].path[0],
                text
              });
            }
          }
        },
        assistentContents: result ? [result] : void 0
      };
    }
  };
}
export {
  getCommand,
  getModel,
  isRadialDimensionReferenceContent
};
`,
`// dev/plugins/rect.plugin.tsx
function getModel(ctx) {
  function getRectGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [
        { x: content.x - content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y + content.height / 2 },
        { x: content.x - content.width / 2, y: content.y + content.height / 2 }
      ].map((p) => ctx.rotatePositionByCenter(p, content, -content.angle));
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray),
        regions: content.fillColor !== void 0 ? [
          {
            lines,
            points
          }
        ] : void 0
      };
    });
  }
  const React = ctx.React;
  return {
    type: "rect",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    rotate(content, center, angle) {
      const p = ctx.rotatePositionByCenter(content, center, -angle);
      content.x = p.x;
      content.y = p.y;
      content.angle += angle;
    },
    explode(content) {
      const { lines } = getRectGeometries(content);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    break(content, intersectionPoints) {
      const { lines } = getRectGeometries(content);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    mirror(content, line, angle) {
      const p = ctx.getSymmetryPoint(content, line);
      content.x = p.x;
      content.y = p.y;
      content.angle = 2 * angle - content.angle;
    },
    render({ content, color, target, strokeWidth }) {
      const colorField = content.fillColor !== void 0 ? "fillColor" : "strokeColor";
      if (content.fillColor !== void 0) {
        strokeWidth = 0;
      }
      if (content.dashArray) {
        const { points } = getRectGeometries(content);
        return target.renderPolygon(points, { [colorField]: color, dashArray: content.dashArray, strokeWidth });
      }
      return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { [colorField]: color, angle: content.angle, strokeWidth });
    },
    getOperatorRenderPosition(content) {
      const { points } = getRectGeometries(content);
      return points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points, lines } = getRectGeometries(content);
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: "center" },
            { ...points[0], direction: "left-top" },
            { ...points[1], direction: "right-top" },
            { ...points[2], direction: "right-bottom" },
            { ...points[3], direction: "left-bottom" },
            { ...ctx.getTwoPointCenter(...lines[0]), direction: "top" },
            { ...ctx.getTwoPointCenter(...lines[1]), direction: "right" },
            { ...ctx.getTwoPointCenter(...lines[2]), direction: "bottom" },
            { ...ctx.getTwoPointCenter(...lines[3]), direction: "left" }
          ].map((p) => ({
            x: p.x,
            y: p.y,
            cursor: ctx.getResizeCursor(content.angle, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isRectContent(c)) {
                return;
              }
              const offset = ctx.getResizeOffset(start, cursor, p.direction, -content.angle * Math.PI / 180);
              if (!offset) {
                return;
              }
              c.x += offset.x + offset.width / 2;
              c.y += offset.y + offset.height / 2;
              c.width += offset.width;
              c.height += offset.height;
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          }))
        };
      });
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getRectGeometries(content);
        return [
          { x: content.x, y: content.y, type: "center" },
          ...points.map((p) => ({ ...p, type: "endpoint" })),
          ...lines.map(([start, end]) => ({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            type: "midpoint"
          }))
        ];
      });
    },
    getGeometries: getRectGeometries,
    canSelectPart: true,
    propertyPanel(content, update) {
      return {
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.x,
          setValue: (v) => update((c) => {
            if (isRectContent(c)) {
              c.x = v;
            }
          })
        }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.y,
          setValue: (v) => update((c) => {
            if (isRectContent(c)) {
              c.y = v;
            }
          })
        }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.width,
          setValue: (v) => update((c) => {
            if (isRectContent(c)) {
              c.width = v;
            }
          })
        }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.height,
          setValue: (v) => update((c) => {
            if (isRectContent(c)) {
              c.height = v;
            }
          })
        }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.angle,
          setValue: (v) => update((c) => {
            if (isRectContent(c)) {
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
function isRectContent(content) {
  return content.type === "rect";
}
function getCommand(ctx) {
  return {
    name: "create rect",
    useCommand({ onEnd, type }) {
      const { line, onClick, onMove, input, lastPosition } = ctx.useLineClickCreate(
        type === "create rect",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "rect",
            x: (c[0].x + c[1].x) / 2,
            y: (c[0].y + c[1].y) / 2,
            width: Math.abs(c[0].x - c[1].x),
            height: Math.abs(c[0].y - c[1].y),
            angle: 0
          })
        }),
        {
          once: true
        }
      );
      const assistentContents = [];
      if (line) {
        assistentContents.push({
          type: "rect",
          x: (line[0].x + line[1].x) / 2,
          y: (line[0].y + line[1].y) / 2,
          width: Math.abs(line[0].x - line[1].x),
          height: Math.abs(line[0].y - line[1].y),
          angle: 0
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
    selectCount: 0,
    hotkey: "REC"
  };
}
export {
  getCommand,
  getModel,
  isRectContent
};
`,
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
  getModel,
  isRegularPolygonContent
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
  getModel,
  isRingContent
};
`,
`// dev/plugins/rotate.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  return {
    name: "rotate",
    useCommand({ onEnd, transform, type, scale }) {
      const [changeOriginal, setChangeOriginal] = React.useState(true);
      const { offset, onStart, mask, center: startPosition } = ctx.useDragRotate(
        onEnd,
        {
          transform,
          transformOffset: (f) => f - 90,
          ignoreLeavingEvent: true
        }
      );
      let message = "";
      if (type) {
        message = startPosition ? "specify angle point" : "specify center point";
      }
      const { input, setInputPosition } = ctx.useCursorInput(message);
      let assistentContents;
      if (startPosition && offset?.angle !== void 0) {
        const r = ctx.getTwoPointsDistance(startPosition, offset);
        assistentContents = [
          {
            type: "line",
            dashArray: [4 / scale],
            points: [startPosition, offset]
          },
          {
            type: "arc",
            x: startPosition.x,
            y: startPosition.y,
            r,
            dashArray: [4 / scale],
            startAngle: offset.angle > 180 || offset.angle < 0 ? offset.angle : 0,
            endAngle: offset.angle > 180 || offset.angle < 0 ? 0 : offset.angle
          },
          {
            type: "line",
            dashArray: [4 / scale],
            points: [startPosition, { x: startPosition.x + r, y: startPosition.y }]
          }
        ];
      }
      return {
        onStart,
        mask,
        input,
        onMove(_, p) {
          setInputPosition(p);
        },
        subcommand: type ? /* @__PURE__ */ React.createElement("button", {
          onClick: (e) => {
            setChangeOriginal(!changeOriginal);
            e.stopPropagation();
          }
        }, changeOriginal ? "create new(N)" : "change original(Y)") : void 0,
        updateContent(content, contents) {
          if (startPosition && offset?.angle !== void 0) {
            const angle = offset.angle;
            if (!changeOriginal) {
              return {
                newContents: [
                  ctx.produce(content, (d) => {
                    ctx.getModel(d.type)?.rotate?.(d, startPosition, angle, contents);
                  })
                ]
              };
            }
            const [, ...patches] = ctx.produceWithPatches(content, (draft) => {
              ctx.getModel(content.type)?.rotate?.(draft, startPosition, angle, contents);
            });
            return {
              patches
            };
          }
          return {};
        },
        assistentContents
      };
    },
    contentSelectable(content) {
      return ctx.getModel(content.type)?.rotate !== void 0;
    },
    hotkey: "RO"
  };
}
export {
  getCommand
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
  getModel,
  isSplineContent
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
  getModel,
  isStarContent
};
`,
`// dev/plugins/start-edit-container.plugin.tsx
function getCommand(ctx) {
  function contentSelectable(c) {
    return ctx.isContainerContent(c);
  }
  return {
    name: "start edit container",
    execute(contents, selected, setEditingContentPath) {
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          setEditingContentPath(contentSelectable(content) ? [index, "contents"] : void 0);
        }
      });
    },
    contentSelectable,
    selectCount: 1
  };
}
export {
  getCommand
};
`,
`// dev/plugins/text.plugin.tsx
function getModel(ctx) {
  function getTextGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const size = ctx.getTextSize(\`\${content.fontSize}px \${content.fontFamily}\`, content.text);
      if (!size) {
        throw "not supported";
      }
      const points = [
        { x: content.x, y: content.y - size.height },
        { x: content.x + size.width, y: content.y - size.height },
        { x: content.x + size.width, y: content.y },
        { x: content.x, y: content.y }
      ];
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines: [],
        points: [],
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            lines,
            points
          }
        ],
        renderingLines: []
      };
    });
  }
  const React = ctx.React;
  return {
    type: "text",
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    getColor(content) {
      return content.color;
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isTextContent(c)) {
                  return;
                }
                c.x += cursor.x - start.x;
                c.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
              }
            }
          ]
        };
      });
    },
    render({ content, target, color }) {
      return target.renderText(content.x, content.y, content.text, color ?? content.color, content.fontSize, content.fontFamily, { cacheKey: content });
    },
    getGeometries: getTextGeometries,
    propertyPanel(content, update) {
      return {
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.x,
          setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.x = v;
            }
          })
        }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.y,
          setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.y = v;
            }
          })
        }),
        fontSize: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          value: content.fontSize,
          setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.fontSize = v;
            }
          })
        }),
        fontFamily: /* @__PURE__ */ React.createElement(ctx.StringEditor, {
          value: content.fontFamily,
          setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.fontFamily = v;
            }
          })
        }),
        text: /* @__PURE__ */ React.createElement(ctx.StringEditor, {
          value: content.text,
          setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.text = v;
            }
          })
        }),
        color: /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
          type: "color",
          value: content.color,
          setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.color = v;
            }
          })
        })
      };
    }
  };
}
function isTextContent(content) {
  return content.type === "text";
}
function getCommand(ctx) {
  return {
    name: "create text",
    useCommand({ onEnd, type, scale }) {
      const { text, onClick, onMove, input } = ctx.useTextClickCreate(
        type === "create text",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "text",
            ...c
          })
        }),
        {
          scale
        }
      );
      const assistentContents = [];
      if (text) {
        assistentContents.push({
          type: "text",
          ...text
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents
      };
    },
    selectCount: 0,
    hotkey: "T"
  };
}
export {
  getCommand,
  getModel,
  isTextContent
};
`,
]
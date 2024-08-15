export const pluginScripts = [
`// dev/cad-editor/plugins/arrow.plugin.tsx
function getModel(ctx) {
  const ArrowContent = ctx.and(ctx.BaseContent("arrow"), ctx.StrokeFields, ctx.ArrowFields, {
    p1: ctx.Position,
    p2: ctx.Position,
    ref1: ctx.optional(ctx.PositionRef),
    ref2: ctx.optional(ctx.PositionRef)
  });
  const getRefIds = (content) => {
    var _a, _b;
    return [...ctx.getStrokeRefIds(content), ...ctx.toRefIds([(_a = content.ref1) == null ? void 0 : _a.id, (_b = content.ref2) == null ? void 0 : _b.id])];
  };
  function getArrowGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      var _a, _b;
      const p1 = (_a = ctx.getRefPosition(content.ref1, contents, [content])) != null ? _a : content.p1;
      const p2 = (_b = ctx.getRefPosition(content.ref2, contents, [content])) != null ? _b : content.p2;
      const { arrowPoints, endPoint } = ctx.getArrowPoints(p1, p2, content);
      const points = [p1, endPoint];
      return {
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
    ...ctx.arrowModel,
    move(content, offset) {
      ctx.movePoint(content.p1, offset);
      ctx.movePoint(content.p2, offset);
    },
    rotate(content, center, angle) {
      ctx.rotatePoint(content.p1, center, angle);
      ctx.rotatePoint(content.p2, center, angle);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content.p1, center, sx, sy);
      ctx.scalePoint(content.p2, center, sx, sy);
    },
    skew(content, center, sx, sy) {
      ctx.skewPoint(content.p1, center, sx, sy);
      ctx.skewPoint(content.p2, center, sx, sy);
    },
    mirror(content, line) {
      ctx.mirrorPoint(content.p1, line);
      ctx.mirrorPoint(content.p2, line);
    },
    render(content, renderCtx) {
      const { options, target, contents, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { regions, renderingLines } = getArrowGeometriesFromCache(content, contents);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options));
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolygon(regions[i].points, fillOptions));
        }
      }
      return target.renderGroup(children);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content.p1,
              cursor: "move",
              update(c, { cursor, start, scale, target }) {
                if (!isArrowContent(c)) {
                  return;
                }
                c.p1.x += cursor.x - start.x;
                c.p1.y += cursor.y - start.y;
                c.ref1 = ctx.getSnapTargetRef(target, contents);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              ...content.p2,
              cursor: "move",
              update(c, { cursor, start, scale, target }) {
                if (!isArrowContent(c)) {
                  return;
                }
                c.p2.x += cursor.x - start.x;
                c.p2.y += cursor.y - start.y;
                c.ref2 = ctx.getSnapTargetRef(target, contents);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }
          ]
        };
      });
    },
    getGeometries: getArrowGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      var _a, _b;
      return {
        p1: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p, ref) => update((c) => {
                if (isArrowContent(c)) {
                  c.p1.x = p.x;
                  c.p1.y = p.y;
                  c.ref1 = ref;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p1.x, setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p1.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p1.y, setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p1.y = v;
                }
              }) })
            }
          }
        ),
        p2: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p, ref) => update((c) => {
                if (isArrowContent(c)) {
                  c.p2.x = p.x;
                  c.p2.y = p.y;
                  c.ref2 = ref;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p2.x, setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p2.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p2.y, setValue: (v) => update((c) => {
                if (isArrowContent(c)) {
                  c.p2.y = v;
                }
              }) })
            }
          }
        ),
        ref1: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.ref1 !== void 0, readOnly: content.ref1 === void 0, setValue: (v) => update((c) => {
            if (isArrowContent(c) && !v) {
              c.ref1 = void 0;
            }
          }) }),
          content.ref1 !== void 0 && typeof content.ref1.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref1.id, setValue: (v) => update((c) => {
            if (isArrowContent(c) && c.ref1) {
              c.ref1.id = v;
            }
          }) }) : void 0,
          content.ref1 !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref1.snapIndex, setValue: (v) => update((c) => {
            if (isArrowContent(c) && c.ref1) {
              c.ref1.snapIndex = v;
            }
          }) }) : void 0,
          ((_a = content.ref1) == null ? void 0 : _a.param) !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { readOnly: true, value: content.ref1.param }) : void 0
        ],
        ref2: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.ref2 !== void 0, readOnly: content.ref2 === void 0, setValue: (v) => update((c) => {
            if (isArrowContent(c) && !v) {
              c.ref2 = void 0;
            }
          }) }),
          content.ref2 !== void 0 && typeof content.ref2.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref2.id, setValue: (v) => update((c) => {
            if (isArrowContent(c) && c.ref2) {
              c.ref2.id = v;
            }
          }) }) : void 0,
          content.ref2 !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref2.snapIndex, setValue: (v) => update((c) => {
            if (isArrowContent(c) && c.ref2) {
              c.ref2.snapIndex = v;
            }
          }) }) : void 0,
          ((_b = content.ref2) == null ? void 0 : _b.param) !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { readOnly: true, value: content.ref2.param }) : void 0
        ],
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, ArrowContent, p),
    getRefIds,
    updateRefId(content, update) {
      if (content.ref1) {
        const newRefId = update(content.ref1.id);
        if (newRefId !== void 0) {
          content.ref1.id = newRefId;
        }
      }
      if (content.ref2) {
        const newRefId = update(content.ref2.id);
        if (newRefId !== void 0) {
          content.ref2.id = newRefId;
        }
      }
      ctx.updateStrokeRefIds(content, update);
    },
    deleteRefId(content, ids) {
      if (content.ref1 && ids.includes(content.ref1.id)) {
        content.ref1 = void 0;
      }
      if (content.ref2 && ids.includes(content.ref2.id)) {
        content.ref2 = void 0;
      }
      ctx.deleteStrokeRefIds(content, ids);
    },
    reverse: (content) => ({
      ...content,
      p1: content.p2,
      p2: content.p1,
      ref1: content.ref2,
      ref2: content.ref1
    })
  };
}
function isArrowContent(content) {
  return content.type === "arrow";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("g", { transform: "" }, /* @__PURE__ */ React.createElement("polyline", { points: "12,86 81,20", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "88,14 72,39 62,28", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" })));
  return {
    name: "create arrow",
    hotkey: "AR",
    icon,
    useCommand({ onEnd, type, strokeStyleId }) {
      const { line, positionTargets, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create arrow",
        (c, targets) => onEnd({
          updateContents: (contents) => contents.push({
            type: "arrow",
            p1: c[0],
            p2: c[1],
            ref1: targets[0],
            ref2: targets[1],
            strokeStyleId
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
          p2: line[1],
          ref1: positionTargets[0],
          ref2: positionTargets[1],
          strokeStyleId
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
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
`// dev/cad-editor/plugins/block.plugin.tsx
function getModel(ctx) {
  const React = ctx.React;
  const BlockContent = ctx.and(ctx.BaseContent("block"), ctx.ContainerFields, {
    base: ctx.Position
  });
  const BlockReferenceContent = ctx.and(ctx.BaseContent("block reference"), ctx.Position, ctx.VariableValuesFields, {
    refId: ctx.ContentRef,
    angle: ctx.number,
    scale: ctx.optional(ctx.or(ctx.number, ctx.Position))
  });
  const getBlockRefIds = (content) => ctx.toRefIds(content.contents);
  const getBlockReferenceRefIds = (content) => ctx.toRefId(content.refId, true);
  const blockModel = {
    type: "block",
    ...ctx.containerModel,
    explode: ctx.getContainerExplode,
    render: ctx.getContainerRender,
    renderIfSelected: (content, renderCtx) => ctx.getContainerRenderIfSelected(content, renderCtx, [content], getBlockRefIds),
    getOperatorRenderPosition(content) {
      return content.base;
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content.base,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isBlockContent(c)) {
                  return;
                }
                c.base.x += cursor.x - start.x;
                c.base.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content.base, cursor] }] };
              }
            }
          ],
          angleSnapStartPoint: content.base
        };
      });
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: (content, contents) => ctx.getContainerGeometries(content, contents, getBlockRefIds, [content]),
    propertyPanel(content, update, _, { acquirePoint }) {
      return {
        base: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                if (isBlockContent(c)) {
                  c.base.x = p.x, c.base.y = p.y;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.base.x, setValue: (v) => update((c) => {
                if (isBlockContent(c)) {
                  c.base.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.base.y, setValue: (v) => update((c) => {
                if (isBlockContent(c)) {
                  c.base.y = v;
                }
              }) })
            }
          }
        ),
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update)
      };
    },
    isValid: (c, p) => ctx.validate(c, BlockContent, p),
    getRefIds: getBlockRefIds
  };
  const blockSnapPointsCache = new ctx.WeakmapCache2();
  function extractContentInBlockReference(target, content, block, contents) {
    let model = ctx.getContentModel(target);
    if (!model) {
      return void 0;
    }
    let newResult;
    const result = ctx.produce(target, (draft) => {
      var _a, _b, _c;
      const scale = ctx.getScaleOptionsScale(content);
      if (scale) {
        const r = (_a = model == null ? void 0 : model.scale) == null ? void 0 : _a.call(model, draft, block.base, scale.x, scale.y, contents);
        if (r) {
          model = ctx.getContentModel(r);
          newResult = r;
          draft = r;
        }
      }
      if (content.angle) {
        (_b = model == null ? void 0 : model.rotate) == null ? void 0 : _b.call(model, draft, block.base, content.angle, contents);
      }
      (_c = model == null ? void 0 : model.move) == null ? void 0 : _c.call(model, draft, content);
    });
    return newResult || result;
  }
  function getBlockReferenceGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getBlockReferenceRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        const lines = [];
        const boundings = [];
        const renderingLines = [];
        const regions = [];
        block.contents.forEach((c) => {
          var _a, _b;
          if (!c) {
            return;
          }
          const extracted = extractContentInBlockReference(c, content, block, contents);
          if (extracted) {
            const r = (_b = (_a = ctx.getContentModel(extracted)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, extracted, contents);
            if (r) {
              lines.push(...r.lines);
              if (r.bounding) {
                boundings.push(r.bounding);
              }
              if (r.renderingLines) {
                renderingLines.push(...r.renderingLines);
              }
              if (r.regions) {
                regions.push(...r.regions);
              }
            }
          }
        });
        return {
          lines,
          bounding: ctx.mergeBoundingsUnsafe(boundings),
          renderingLines,
          regions
        };
      }
      return { lines: [], renderingLines: [] };
    });
  }
  const blockReferenceModel = {
    type: "block reference",
    ...ctx.variableValuesModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    rotate(content, center, angle, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        const p = ctx.rotatePoint({ x: content.x + block.base.x, y: content.y + block.base.y }, center, angle);
        content.x = p.x - block.base.x;
        content.y = p.y - block.base.y;
        content.angle += angle;
      }
    },
    scale(content, center, sx, sy, contents) {
      var _a, _b;
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        const p = { x: content.x + block.base.x, y: content.y + block.base.y };
        ctx.scalePoint(p, center, sx, sy);
        content.x = p.x - block.base.x;
        content.y = p.y - block.base.y;
        const scale = ctx.getScaleOptionsScale(content);
        content.scale = {
          x: ((_a = scale == null ? void 0 : scale.x) != null ? _a : 1) * sx,
          y: ((_b = scale == null ? void 0 : scale.y) != null ? _b : 1) * sy
        };
      }
    },
    explode(content, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent);
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
      var _a, _b;
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        const p = ctx.mirrorPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line);
        content.x = p.x - block.base.x;
        content.y = p.y - block.base.y;
        content.angle = 2 * angle - content.angle;
        const scale = ctx.getScaleOptionsScale(content);
        content.scale = {
          x: (_a = scale == null ? void 0 : scale.x) != null ? _a : 1,
          y: -((_b = scale == null ? void 0 : scale.y) != null ? _b : 1)
        };
      }
    },
    render(content, renderCtx) {
      const block = ctx.getReference(content.refId, renderCtx.contents, isBlockContent);
      if (block) {
        const children = ctx.renderContainerChildren({ ...block, variableValues: content.variableValues }, renderCtx);
        return renderCtx.target.renderGroup(children, { translate: content, base: block.base, angle: content.angle, scale: content.scale });
      }
      return renderCtx.target.renderEmpty();
    },
    renderIfSelected(content, renderCtx) {
      const block = ctx.getReference(content.refId, renderCtx.contents, isBlockContent);
      if (block) {
        const children = ctx.renderContainerIfSelected(block, renderCtx, [content], getBlockRefIds);
        return renderCtx.target.renderGroup([children], { translate: content, base: block.base, angle: content.angle, scale: content.scale });
      }
      return renderCtx.target.renderEmpty();
    },
    getOperatorRenderPosition(content, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        return { x: content.x + block.base.x, y: content.y + block.base.y };
      }
      return content;
    },
    getEditPoints(content, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent);
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
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        return blockSnapPointsCache.get(block, content, () => {
          const result = [];
          block.contents.forEach((c) => {
            var _a;
            if (!c) {
              return;
            }
            const model = ctx.getContentModel(c);
            const extracted = extractContentInBlockReference(c, content, block, contents);
            if (extracted) {
              const r = (_a = model == null ? void 0 : model.getSnapPoints) == null ? void 0 : _a.call(model, extracted, contents);
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      var _a, _b;
      let variableNames = [];
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        variableNames = ctx.getContainerVariableNames(block);
      }
      const scale = ctx.getScaleOptionsScale(content);
      return {
        refId: typeof content.refId === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.refId, setValue: (v) => update((c) => {
          if (isBlockReferenceContent(c)) {
            c.refId = v;
          }
        }) }) : [],
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isBlockReferenceContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isBlockReferenceContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isBlockReferenceContent(c)) {
            c.y = v;
          }
        }) }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.angle, setValue: (v) => update((c) => {
          if (isBlockReferenceContent(c)) {
            c.angle = v;
          }
        }) }),
        sx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_a = scale == null ? void 0 : scale.x) != null ? _a : 1, setValue: (v) => update((c) => {
          var _a2;
          if (isBlockReferenceContent(c)) {
            c.scale = { x: v, y: (_a2 = scale == null ? void 0 : scale.y) != null ? _a2 : v };
          }
        }) }),
        sy: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_b = scale == null ? void 0 : scale.y) != null ? _b : 1, setValue: (v) => update((c) => {
          var _a2;
          if (isBlockReferenceContent(c)) {
            c.scale = { x: (_a2 = scale == null ? void 0 : scale.x) != null ? _a2 : v, y: v };
          }
        }) }),
        ...ctx.getVariableValuesContentPropertyPanel(content, variableNames, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, BlockReferenceContent, p),
    getRefIds: getBlockReferenceRefIds,
    updateRefId(content, update) {
      const newRefId = update(content.refId);
      if (newRefId !== void 0) {
        content.refId = newRefId;
      }
    }
  };
  return [
    blockModel,
    blockReferenceModel
  ];
}
function isBlockContent(content) {
  return content.type === "block";
}
function isBlockReferenceContent(content) {
  return content.type === "block reference";
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.contentIsDeletable(content, contents);
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 576 512" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H456.6C467.6 12.9 488.3 0 512 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM456.6 96H119.4c-5.6 9.7-13.7 17.8-23.4 23.4V392.6c9.7 5.6 17.8 13.7 23.4 23.4H456.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4zM128 160c0-17.7 14.3-32 32-32H288c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V160zM256 320h32c35.3 0 64-28.7 64-64V224h64c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H288c-17.7 0-32-14.3-32-32V320z" }));
  const referenceIcon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 640 512" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H328.6C339.6 12.9 360.3 0 384 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V232.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM119.4 96c-5.6 9.7-13.7 17.8-23.4 23.4V232.6c9.7 5.6 17.8 13.7 23.4 23.4H328.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4H119.4zm192 384c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V352h64v40.6c9.7 5.6 17.8 13.7 23.4 23.4H520.6c5.6-9.7 13.7-17.8 23.4-23.4V279.4c-9.7-5.6-17.8-13.7-23.4-23.4h-46c-5.4-15.4-14.6-28.9-26.5-39.6V192h72.6c11.1-19.1 31.7-32 55.4-32c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H311.4z" }));
  const blockCommand = {
    name: "create block",
    useCommand({ onEnd, type }) {
      let message = "";
      if (type) {
        message = "specify base point";
      }
      const { input, setInputPosition, resetInput } = ctx.useCursorInput(message);
      return {
        onStart(p) {
          onEnd({
            updateContents: (contents, selected) => {
              const newContent = {
                type: "block",
                contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents)),
                base: p
              };
              ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
              contents.push(newContent);
            }
          });
        },
        input,
        onMove(_, p) {
          setInputPosition(p);
        },
        reset: resetInput
      };
    },
    contentSelectable,
    hotkey: "B",
    icon
  };
  const blockReferenceCommand = {
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
        updateSelectedContent(content, contents) {
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
        },
        reset: resetInput
      };
    },
    contentSelectable: isBlockContent,
    selectCount: 1,
    icon: referenceIcon
  };
  return [blockCommand, blockReferenceCommand];
}
export {
  getCommand,
  getModel,
  isBlockContent,
  isBlockReferenceContent
};
`,
`// dev/cad-editor/plugins/break.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 640 512" }, /* @__PURE__ */ React.createElement("path", { fill: "currentColor", d: "M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L489.3 358.2l90.5-90.5c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114l-96 96-31.9-25C430.9 239.6 420.1 175.1 377 132c-52.2-52.3-134.5-56.2-191.3-11.7L38.8 5.1zM239 162c30.1-14.9 67.7-9.9 92.8 15.3c20 20 27.5 48.3 21.7 74.5L239 162zM406.6 416.4L220.9 270c-2.1 39.8 12.2 80.1 42.2 110c38.9 38.9 94.4 51 143.6 36.3zm-290-228.5L60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l61.8-61.8-50.6-39.9z" }));
  return {
    name: "break",
    execute({ contents, selected }) {
      const newContents = [];
      const indexes = [];
      contents.forEach((content, index) => {
        var _a, _b, _c, _d;
        if (content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true)) {
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
            const result = (_d = (_c = ctx.getContentModel(content)) == null ? void 0 : _c.break) == null ? void 0 : _d.call(_c, content, intersectionPoints, contents);
            if (result) {
              newContents.push(...result);
              indexes.push(index);
            }
          }
        }
      });
      ctx.deleteSelectedContents(contents, indexes);
      contents.push(...newContents);
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content);
      return (model == null ? void 0 : model.break) !== void 0 && ctx.contentIsDeletable(content, contents);
    },
    hotkey: "BR",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/brush.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 1024 1024", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "m199.04 672.64 193.984 112 224-387.968-193.92-112-224 388.032zm-23.872 60.16 32.896 148.288 144.896-45.696L175.168 732.8zM455.04 229.248l193.92 112 56.704-98.112-193.984-112-56.64 98.112zM104.32 708.8l384-665.024 304.768 175.936L409.152 884.8h.064l-248.448 78.336L104.32 708.8z", fill: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "600", y: "600", width: "400", height: "400", fill: "currentColor" }));
  return {
    name: "brush",
    useCommand({ onEnd, type, fillStyleId }) {
      const [hatch, setHatch] = React.useState();
      const [preview, setPreview] = React.useState();
      const [inputType, setInputType] = React.useState("circle");
      const assistentContents = [];
      const reset = () => {
        setHatch(void 0);
        setPreview(void 0);
      };
      if (hatch) {
        assistentContents.push({ type: "hatch", border: hatch.border, holes: hatch.holes, fillStyleId });
      }
      if (preview) {
        assistentContents.push({ type: "hatch", border: preview.border, holes: preview.holes, fillStyleId });
      }
      return {
        onMouseDown() {
          if (!type) return;
          if (!hatch) {
            setHatch(preview);
          }
        },
        onMove(p) {
          if (!type) return;
          let h;
          if (inputType === "circle") {
            h = { border: [{ type: "arc", curve: ctx.circleToArc({ x: Math.round(p.x), y: Math.round(p.y), r: 10 }) }], holes: [] };
          } else {
            h = { border: Array.from(ctx.iteratePolygonLines(ctx.getPolygonFromRegion({ x: Math.round(p.x), y: Math.round(p.y), width: 20, height: 20 }))), holes: [] };
          }
          if (hatch) {
            setHatch(ctx.getHatchesUnion(hatch, [h])[0]);
          }
          setPreview(h);
        },
        onMouseUp() {
          if (!type) return;
          if (hatch) {
            onEnd({
              updateContents: (contents) => contents.push({ type: "hatch", border: hatch.border, holes: hatch.holes, fillStyleId })
            });
            reset();
          }
        },
        assistentContents,
        subcommand: type === "brush" ? /* @__PURE__ */ React.createElement("span", null, ["circle", "rect"].map((m) => /* @__PURE__ */ React.createElement("button", { key: m, onClick: () => setInputType(m), style: { position: "relative" } }, m))) : void 0,
        reset
      };
    },
    selectCount: 0,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/cad-editor/plugins/center-line.plugin.tsx
function getModel(ctx) {
  const CenterLineReferenceContent = ctx.and(ctx.BaseContent("center line"), {
    ref1: ctx.PartRef,
    ref2: ctx.PartRef
  });
  const getRefIds = (content) => ctx.toRefIds([content.ref1.id, content.ref2.id], true);
  function getCenterLineGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      const ref1 = ctx.getRefPart(content.ref1, contents, isLineContent);
      const ref2 = ctx.getRefPart(content.ref2, contents, isLineContent);
      if (ref1 && ref2) {
        const line = ctx.maximumBy([
          [ctx.getTwoPointCenter(ref1.points[0], ref2.points[0]), ctx.getTwoPointCenter(ref1.points[1], ref2.points[1])],
          [ctx.getTwoPointCenter(ref1.points[0], ref2.points[1]), ctx.getTwoPointCenter(ref1.points[1], ref2.points[0])]
        ], (v) => ctx.getTwoPointsDistance(...v));
        return {
          lines: [line],
          bounding: ctx.getPointsBounding(line),
          renderingLines: ctx.dashedPolylineToLines(line, [8, 4])
        };
      }
      return { lines: [], renderingLines: [] };
    });
  }
  const React = ctx.React;
  return {
    type: "center line",
    render(content, renderCtx) {
      const { options, target, contents } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { renderingLines } = getCenterLineGeometriesFromCache(content, contents);
      return target.renderGroup(renderingLines.map((line) => target.renderPolyline(line, options)));
    },
    getGeometries: getCenterLineGeometriesFromCache,
    propertyPanel(content, update, contents, { acquireContent }) {
      return {
        ref1: [
          /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquireContent({ count: 1, part: true, selectable: (v) => contentSelectable(ctx.getContentByIndex(contents, v)) }, (r) => update((c) => {
            if (isCenterLineContent(c)) {
              c.ref1 = r[0];
            }
          })) }, "select"),
          typeof content.ref1.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref1.id, setValue: (v) => update((c) => {
            if (isCenterLineContent(c)) {
              c.ref1.id = v;
            }
          }) }) : void 0,
          content.ref1.partIndex !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref1.partIndex, setValue: (v) => update((c) => {
            if (isCenterLineContent(c)) {
              c.ref1.partIndex = v;
            }
          }) }) : void 0
        ],
        ref2: [
          /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquireContent({ count: 1, part: true, selectable: (v) => contentSelectable(ctx.getContentByIndex(contents, v)) }, (r) => update((c) => {
            if (isCenterLineContent(c)) {
              c.ref2 = r[0];
            }
          })) }, "select"),
          typeof content.ref2.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref2.id, setValue: (v) => update((c) => {
            if (isCenterLineContent(c)) {
              c.ref2.id = v;
            }
          }) }) : void 0,
          content.ref2.partIndex !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref2.partIndex, setValue: (v) => update((c) => {
            if (isCenterLineContent(c)) {
              c.ref2.partIndex = v;
            }
          }) }) : void 0
        ]
      };
    },
    isValid: (c, p) => ctx.validate(c, CenterLineReferenceContent, p),
    getRefIds,
    updateRefId(content, update) {
      const newRefId1 = update(content.ref1.id);
      if (newRefId1 !== void 0) {
        content.ref1.id = newRefId1;
      }
      const newRefId2 = update(content.ref2.id);
      if (newRefId2 !== void 0) {
        content.ref2.id = newRefId2;
      }
    }
  };
}
function isCenterLineContent(content) {
  return content.type === "center line";
}
function contentSelectable(content) {
  return !!content && isLineContent(content);
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "48,0 48,100", strokeWidth: "5", strokeDasharray: "8", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "100,0 100,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "0,1 0,99", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create center line",
    icon,
    contentSelectable,
    selectCount: 2,
    selectType: "select part",
    execute({ contents, selected }) {
      contents.push({
        type: "center line",
        ref1: {
          id: selected[0][0],
          partIndex: selected[0][1]
        },
        ref2: {
          id: selected[1][0],
          partIndex: selected[1][1]
        }
      });
    }
  };
}
export {
  getCommand,
  getModel,
  isCenterLineContent
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/center-mark.plugin.tsx
function getModel(ctx) {
  const CenterMarkReferenceContent = ctx.and(ctx.BaseContent("center mark"), {
    ref: ctx.PartRef
  });
  const getRefIds = (content) => ctx.toRefId(content.ref.id, true);
  function getCenterMarkGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      const target = ctx.getRefPart(content.ref, contents, contentSelectable);
      if (target) {
        const lines = [
          [{ x: target.x - target.r, y: target.y }, { x: target.x + target.r, y: target.y }],
          [{ x: target.x, y: target.y - target.r }, { x: target.x, y: target.y + target.r }]
        ];
        return {
          lines,
          bounding: ctx.getPointsBounding(lines.flat()),
          renderingLines: lines.map((line) => ctx.dashedPolylineToLines(line, [8, 4])).flat()
        };
      }
      return { lines: [], renderingLines: [] };
    });
  }
  const React = ctx.React;
  return {
    type: "center mark",
    render(content, renderCtx) {
      const { options, target, contents } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { renderingLines } = getCenterMarkGeometriesFromCache(content, contents);
      return target.renderGroup(renderingLines.map((line) => target.renderPolyline(line, options)));
    },
    getGeometries: getCenterMarkGeometriesFromCache,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquireContent }) {
      return {
        ref: [
          /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquireContent({ count: 1, part: true, selectable: (v) => contentSelectable(ctx.getContentByIndex(contents, v)) }, (r) => update((c) => {
            if (isCenterMarkContent(c)) {
              c.ref = r[0];
            }
          })) }, "select"),
          typeof content.ref.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref.id, setValue: (v) => update((c) => {
            if (isCenterMarkContent(c)) {
              c.ref.id = v;
            }
          }) }) : void 0,
          content.ref.partIndex !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref.partIndex, setValue: (v) => update((c) => {
            if (isCenterMarkContent(c)) {
              c.ref.partIndex = v;
            }
          }) }) : void 0
        ]
      };
    },
    isValid: (c, p) => ctx.validate(c, CenterMarkReferenceContent, p),
    getRefIds,
    updateRefId(content, update) {
      const newRefId = update(content.ref.id);
      if (newRefId !== void 0) {
        content.ref.id = newRefId;
      }
    }
  };
}
function isCenterMarkContent(content) {
  return content.type === "center mark";
}
function contentSelectable(content) {
  return !!content && (isArcContent(content) || isCircleContent(content));
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "48,0 48,100", strokeWidth: "5", strokeDasharray: "8", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "0,49 100,49", strokeWidth: "5", strokeDasharray: "8", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create center mark",
    icon,
    contentSelectable,
    selectType: "select part",
    execute({ contents, selected }) {
      contents.push(...selected.map(([index, partIndex]) => ({
        type: "center mark",
        ref: {
          id: index,
          partIndex
        }
      })));
    }
  };
}
export {
  getCommand,
  getModel,
  isCenterMarkContent
};
`,
`// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/cad-editor/plugins/chamfer.plugin.tsx
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
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "11,12 57,12 86,41 86,86", strokeWidth: "3", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }));
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
        assistentContents,
        reset
      };
    },
    selectCount: 2,
    contentSelectable: (c) => isLineContent(c),
    selectType: "select part",
    hotkey: "CHA",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}
function isPolyLineContent(content) {
  return content.type === "polyline";
}

// dev/cad-editor/plugins/circle-arc.plugin.tsx
function getModel(ctx) {
  const CircleContent = ctx.and(ctx.BaseContent("circle"), ctx.StrokeFields, ctx.FillFields, ctx.Circle, {
    xExpression: ctx.optional(ctx.string),
    yExpression: ctx.optional(ctx.string),
    rExpression: ctx.optional(ctx.string)
  });
  const ArcContent = ctx.and(ctx.BaseContent("arc"), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.Arc);
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const circleGeometriesCache = new ctx.WeakmapValuesCache();
  const arcGeometriesCache = new ctx.WeakmapValuesCache();
  function getCircleGeometries(content, contents, time) {
    const quadrantPoints = ctx.getCircleQuadrantPoints(content);
    if (time && (content.xExpression || content.yExpression || content.rExpression)) {
      const x = ctx.getTimeExpressionValue(content.xExpression, time, content.x);
      const y = ctx.getTimeExpressionValue(content.yExpression, time, content.y);
      const r = ctx.getTimeExpressionValue(content.rExpression, time, content.r);
      return { quadrantPoints, ...getArcGeometries(ctx.circleToArc({ ...content, x, y, r }), contents) };
    }
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return circleGeometriesCache.get(content, refs, () => {
      return { quadrantPoints, ...getArcGeometries(ctx.circleToArc(content), contents) };
    });
  }
  function getArcGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return arcGeometriesCache.get(content, refs, () => {
      var _a;
      const points = ctx.arcToPolyline(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const middleAngle = ctx.getTwoNumberCenter(content.startAngle, ctx.getFormattedEndAngle(content));
      const geometries = {
        lines: [{ type: "arc", curve: content }],
        points,
        start: ctx.getArcPointAtAngle(content, content.startAngle),
        end: ctx.getArcPointAtAngle(content, content.endAngle),
        middle: ctx.getArcPointAtAngle(content, middleAngle),
        bounding: ctx.getArcBounding(content),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
      };
      if (ctx.hasFill(content)) {
        return {
          ...geometries,
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
  const React = ctx.React;
  return [
    {
      type: "circle",
      ...ctx.strokeModel,
      ...ctx.fillModel,
      move(content, offset) {
        ctx.movePoint(content, offset);
      },
      rotate(content, center, angle) {
        ctx.rotatePoint(content, center, angle);
      },
      scale(content, center, sx, sy) {
        if (sx !== sy && !ctx.isZero(sx + sy)) {
          const ellipse = {
            ...content,
            type: "ellipse",
            cx: content.x,
            cy: content.y,
            rx: content.r,
            ry: content.r
          };
          ctx.scaleEllipse(ellipse, center, sx, sy);
          return ellipse;
        }
        ctx.scalePoint(content, center, sx, sy);
        content.r *= Math.abs(sx);
        return;
      },
      skew(content, center, sx, sy) {
        const ellipse = {
          ...content,
          type: "ellipse",
          cx: content.x,
          cy: content.y,
          rx: content.r,
          ry: content.r
        };
        ctx.skewEllipse(ellipse, center, sx, sy);
        return ellipse;
      },
      mirror(content, line) {
        ctx.mirrorPoint(content, line);
      },
      offset(content, point, distance) {
        if (!distance) {
          distance = ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(point, content), content.r);
        }
        return ctx.getParallelCirclesByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfCircle(point, content))];
      },
      break(content, points) {
        if (points.length < 2) {
          return;
        }
        const angles = points.map((p) => ctx.radianToAngle(ctx.getCircleRadian(p, content)));
        angles.sort((a, b) => a - b);
        return angles.map((a, i) => ({
          ...content,
          type: "arc",
          startAngle: a,
          endAngle: i === angles.length - 1 ? angles[0] + 360 : angles[i + 1]
        }));
      },
      render(content, renderCtx) {
        const { options, dashed, time, contents, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
        if (dashed) {
          const { points } = getCircleGeometries(content, contents, time);
          return target.renderPolyline(points, options);
        }
        const x = ctx.getTimeExpressionValue(content.xExpression, time, content.x);
        const y = ctx.getTimeExpressionValue(content.yExpression, time, content.y);
        const r = ctx.getTimeExpressionValue(content.rExpression, time, content.r);
        return target.renderCircle(x, y, r, options);
      },
      getOperatorRenderPosition(content) {
        return content;
      },
      getEditPoints(content, contents) {
        return ctx.getEditPointsFromCache(content, () => {
          const x = content.x;
          const y = content.y;
          const { quadrantPoints } = getCircleGeometries(content, contents);
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
                type: "move",
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
                ...quadrantPoints[0],
                cursor: "ew-resize",
                update: updateEdges
              },
              {
                ...quadrantPoints[1],
                cursor: "ns-resize",
                update: updateEdges
              },
              {
                ...quadrantPoints[2],
                cursor: "ew-resize",
                update: updateEdges
              },
              {
                ...quadrantPoints[3],
                cursor: "ns-resize",
                update: updateEdges
              }
            ],
            angleSnapStartPoint: content
          };
        });
      },
      getSnapPoints(content, contents) {
        const { quadrantPoints } = getCircleGeometries(content, contents);
        return ctx.getSnapPointsFromCache(content, () => [
          { x: content.x, y: content.y, type: "center" },
          ...quadrantPoints.map((p) => ({ ...p, type: "endpoint" }))
        ]);
      },
      getGeometries: getCircleGeometries,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
            if (isCircleContent(c)) {
              c.x = p.x, c.y = p.y;
            }
          })) }, "canvas"),
          x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
            if (isCircleContent(c)) {
              c.x = v;
            }
          }) }),
          y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
            if (isCircleContent(c)) {
              c.y = v;
            }
          }) }),
          r: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.r, setValue: (v) => update((c) => {
            if (isCircleContent(c)) {
              c.r = v;
            }
          }) }),
          xExpression: [
            /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.xExpression !== void 0, setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.xExpression = v ? "" : void 0;
              }
            }) }),
            content.xExpression !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.xExpression, setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.xExpression = v;
              }
            }) }) : void 0
          ],
          yExpression: [
            /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.yExpression !== void 0, setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.yExpression = v ? "" : void 0;
              }
            }) }),
            content.yExpression !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.yExpression, setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.yExpression = v;
              }
            }) }) : void 0
          ],
          rExpression: [
            /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.rExpression !== void 0, setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.rExpression = v ? "" : void 0;
              }
            }) }),
            content.rExpression !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.rExpression, setValue: (v) => update((c) => {
              if (isCircleContent(c)) {
                c.rExpression = v;
              }
            }) }) : void 0
          ],
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents)
        };
      },
      isValid: (c, p) => ctx.validate(c, CircleContent, p),
      getRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
      deleteRefId: ctx.deleteStrokeAndFillRefIds,
      isPointIn: (content, point) => ctx.getTwoPointsDistance(content, point) < content.r,
      getArea: (content) => Math.PI * content.r ** 2
    },
    {
      type: "arc",
      ...ctx.strokeModel,
      ...ctx.fillModel,
      ...ctx.angleDeltaModel,
      move(content, offset) {
        ctx.movePoint(content, offset);
      },
      rotate(content, center, angle) {
        ctx.rotateArc(content, center, angle);
      },
      scale(content, center, sx, sy) {
        if (sx !== sy && !ctx.isZero(sx + sy)) {
          const ellipse = {
            ...content,
            type: "ellipse arc",
            cx: content.x,
            cy: content.y,
            rx: content.r,
            ry: content.r
          };
          ctx.scaleEllipseArc(ellipse, center, sx, sy);
          return ellipse;
        }
        ctx.scalePoint(content, center, sx, sy);
        content.r *= Math.abs(sx);
        return;
      },
      skew(content, center, sx, sy) {
        const ellipse = {
          ...content,
          type: "ellipse arc",
          cx: content.x,
          cy: content.y,
          rx: content.r,
          ry: content.r
        };
        ctx.skewEllipseArc(ellipse, center, sx, sy);
        return ellipse;
      },
      mirror(content, line, angle) {
        ctx.mirrorArc(content, line, angle);
      },
      offset(content, point, distance) {
        if (!distance) {
          distance = ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(point, content), content.r);
        }
        return ctx.getParallelArcsByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfArc(point, content))];
      },
      break(content, points) {
        if (points.length === 0) {
          return;
        }
        const angles = points.map((p) => ctx.normalizeAngleInRange(ctx.radianToAngle(ctx.getCircleRadian(p, content)), content));
        angles.sort((a, b) => a - b);
        const result = [];
        if (!ctx.isSameNumber(angles[0], content.startAngle)) {
          result.push({
            ...content,
            type: "arc",
            startAngle: content.startAngle,
            endAngle: angles[0]
          });
        }
        angles.forEach((a, i) => {
          if (i === angles.length - 1) {
            if (!ctx.isSameNumber(a, content.endAngle)) {
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
      join(content, target) {
        if (isArcContent(target)) {
          return ctx.mergeArc(content, target);
        }
        if (isLineContent(target) || isPolyLineContent(target)) {
          const newLines = ctx.mergeGeometryLines([{ type: "arc", curve: content }], Array.from(ctx.iteratePolylineLines(target.points)));
          if (newLines) {
            return ctx.geometryLinesToPline(newLines);
          }
        }
        return;
      },
      extend(content, point) {
        const angle = ctx.radianToAngle(ctx.getCircleRadian(point, content));
        const endAngle = ctx.getFormattedEndAngle({ startAngle: content.startAngle, endAngle: angle });
        const startAngle = ctx.getFormattedStartAngle({ startAngle: angle, endAngle: content.endAngle });
        const angle1 = Math.abs(endAngle - content.startAngle);
        const angle2 = Math.abs(content.endAngle - startAngle);
        if (angle1 < angle2) {
          content.endAngle = endAngle;
        } else {
          content.startAngle = startAngle;
        }
      },
      render(content, renderCtx) {
        const { options, dashed, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
        if (dashed) {
          return target.renderPolyline(getArcGeometries(content, renderCtx.contents).points, options);
        }
        return target.renderArc(content.x, content.y, content.r, content.startAngle, content.endAngle, { ...options, counterclockwise: content.counterclockwise });
      },
      renderIfSelected(content, { color, target, strokeWidth, contents }) {
        const { points } = getArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle }, contents);
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth });
      },
      getOperatorRenderPosition(content, contents) {
        const { points } = getArcGeometries(content, contents);
        return points[0];
      },
      getEditPoints(content, contents) {
        return ctx.getEditPointsFromCache(content, () => {
          const { start, end, middle } = getArcGeometries(content, contents);
          return {
            editPoints: [
              {
                x: content.x,
                y: content.y,
                cursor: "move",
                type: "move",
                update(c, { cursor, start: start2, scale }) {
                  if (!isArcContent(c)) {
                    return;
                  }
                  c.x += cursor.x - start2.x;
                  c.y += cursor.y - start2.y;
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              },
              {
                ...start,
                cursor: ctx.getResizeCursor(content.startAngle, "top"),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return;
                  }
                  c.startAngle = ctx.radianToAngle(ctx.getCircleRadian(cursor, c));
                  c.r = ctx.getTwoPointsDistance(cursor, c);
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              },
              {
                ...end,
                cursor: ctx.getResizeCursor(content.endAngle, "top"),
                update(c, { cursor, scale }) {
                  if (!isArcContent(c)) {
                    return;
                  }
                  c.endAngle = ctx.radianToAngle(ctx.getCircleRadian(cursor, c));
                  c.r = ctx.getTwoPointsDistance(cursor, c);
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
                }
              },
              {
                ...middle,
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
      getSnapPoints(content, contents) {
        return ctx.getSnapPointsFromCache(content, () => {
          const { start, end, middle } = getArcGeometries(content, contents);
          return [
            { x: content.x, y: content.y, type: "center" },
            { ...start, type: "endpoint" },
            { ...end, type: "endpoint" },
            { ...middle, type: "midpoint" }
          ];
        });
      },
      getGeometries: getArcGeometries,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
            if (isArcContent(c)) {
              c.x = p.x, c.y = p.y;
            }
          })) }, "canvas"),
          x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
            if (isArcContent(c)) {
              c.x = v;
            }
          }) }),
          y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
            if (isArcContent(c)) {
              c.y = v;
            }
          }) }),
          r: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.r, setValue: (v) => update((c) => {
            if (isArcContent(c)) {
              c.r = v;
            }
          }) }),
          startAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.startAngle, setValue: (v) => update((c) => {
            if (isArcContent(c)) {
              c.startAngle = v;
            }
          }) }),
          endAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.endAngle, setValue: (v) => update((c) => {
            if (isArcContent(c)) {
              c.endAngle = v;
            }
          }) }),
          counterclockwise: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.counterclockwise === true, setValue: (v) => update((c) => {
            if (isArcContent(c)) {
              c.counterclockwise = v ? true : void 0;
            }
          }) }),
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents),
          ...ctx.getAngleDeltaContentPropertyPanel(content, update)
        };
      },
      isValid: (c, p) => ctx.validate(c, ArcContent, p),
      getRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
      deleteRefId: ctx.deleteStrokeAndFillRefIds,
      getArea: (content) => {
        const radian = ctx.angleToRadian(content.endAngle - content.startAngle);
        return content.r ** 2 * (radian - Math.sin(radian)) / 2;
      },
      reverse: (content) => ctx.reverseArc(content)
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
  const React = ctx.React;
  const circleIcon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "44", cy: "48", r: "39", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "44,48 66,15", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "44", cy: "48", r: "39", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "20", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }), /* @__PURE__ */ React.createElement("circle", { cx: "72", cy: "76", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }));
  const icon3 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "44", cy: "48", r: "39", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "20", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }), /* @__PURE__ */ React.createElement("circle", { cx: "36", cy: "87", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }), /* @__PURE__ */ React.createElement("circle", { cx: "80", cy: "28", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }));
  const circleIcon4 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "44", cy: "48", r: "39", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "25,82 66,15", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }));
  const arcIcon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("path", { d: "M 31 80 A 35 35 0 1 0 25 24", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }));
  return [
    {
      name: "create circle",
      type: [
        { name: "2 points", icon: icon2 },
        { name: "3 points", icon: icon3 },
        { name: "center radius", hotkey: "C", icon: circleIcon },
        { name: "center diameter", icon: circleIcon4 }
      ],
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { circle, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useCircleClickCreate(
          type === "2 points" || type === "3 points" || type === "center diameter" || type === "center radius" ? type : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: "circle" })
          })
        );
        const assistentContents = [];
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: "polygon", points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] });
          } else {
            assistentContents.push(
              { type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              ...ctx.getAssistentText(
                ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                16 / scale,
                (startPosition.x + cursorPosition.x) / 2 - 20,
                (startPosition.y + cursorPosition.y) / 2 + 4
              )
            );
          }
        }
        if (circle) {
          assistentContents.push({ ...circle, strokeStyleId, fillStyleId, type: "circle" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition != null ? middlePosition : startPosition,
          reset
        };
      },
      selectCount: 0
    },
    {
      name: "create arc",
      useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
        const { circle, arc, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useCircleArcClickCreate(
          type === "create arc" ? "center radius" : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: "arc" })
          })
        );
        const assistentContents = [];
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: "polygon", points: [startPosition, middlePosition, cursorPosition], dashArray: [4 / scale] });
          } else {
            assistentContents.push(
              { type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] },
              ...ctx.getAssistentText(
                ctx.getTwoPointsDistance(startPosition, cursorPosition).toFixed(2),
                16 / scale,
                (startPosition.x + cursorPosition.x) / 2 - 20,
                (startPosition.y + cursorPosition.y) / 2 + 4
              )
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
                    x: arc.x + arc.r * Math.cos(ctx.angleToRadian(arc.startAngle)),
                    y: arc.y + arc.r * Math.sin(ctx.angleToRadian(arc.startAngle))
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
                    x: arc.x + arc.r * Math.cos(ctx.angleToRadian(arc.endAngle)),
                    y: arc.y + arc.r * Math.sin(ctx.angleToRadian(arc.endAngle))
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
          assistentContents.push({ ...arc, strokeStyleId, fillStyleId, type: "arc" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition != null ? middlePosition : startPosition,
          reset
        };
      },
      selectCount: 0,
      hotkey: "A",
      icon: arcIcon
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
`// dev/cad-editor/plugins/clip.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("mask", { id: "clip" }, /* @__PURE__ */ React.createElement("path", { d: "M 1 1 L 1 100 L 103 100 L 103 1", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "white", stroke: "currentColor", fillRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M 91 70 L 91 73 L 91 75 L 90 78 L 90 80 L 89 82 L 88 84 L 86 86 L 85 88 L 83 90 L 81 91 L 79 93 L 77 94 L 75 95 L 73 96 L 71 97 L 68 97 L 66 98 L 64 98 L 61 98 L 59 97 L 57 97 L 54 96 L 52 95 L 50 94 L 48 93 L 46 91 L 44 90 L 43 88 L 41 86 L 40 84 L 39 82 L 38 80 L 37 78 L 37 75 L 36 73 L 36 70 L 36 68 L 37 66 L 37 63 L 38 61 L 39 59 L 40 57 L 41 55 L 43 53 L 44 51 L 46 49 L 48 48 L 50 47 L 52 46 L 54 45 L 57 44 L 59 43 L 61 43 L 64 43 L 66 43 L 68 43 L 71 44 L 73 45 L 75 46 L 77 47 L 79 48 L 81 49 L 83 51 L 85 53 L 86 55 L 88 57 L 89 59 L 90 61 L 90 63 L 91 66 L 91 68 L 91 70", fill: "black" })), /* @__PURE__ */ React.createElement("g", { mask: "url(#clip)" }, /* @__PURE__ */ React.createElement("polygon", { points: "83,99 77,64 103,38 67,33 51,1 35,33 1,39 25,64 19,100 51,83", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "currentColor", stroke: "currentColor" })));
  return {
    name: "clip",
    icon,
    useCommand({ type, onEnd, acquireContent, selected, contents }) {
      const target = React.useRef();
      const border = React.useRef();
      const reset = () => {
        target.current = void 0;
        border.current = void 0;
      };
      React.useEffect(() => {
        if (!type) return;
        if (!target.current) {
          target.current = selected[0].path;
          acquireContent(
            {
              count: 1,
              selectable: (v) => {
                var _a, _b;
                const content = ctx.getContentByIndex(contents, v);
                if (!content) return false;
                const geometries = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents);
                if (!geometries) return false;
                return geometries.lines.length > 0;
              }
            },
            (r) => {
              border.current = ctx.getRefPart(r[0], contents, (c) => c !== selected[0].content);
            }
          );
        } else if (border.current) {
          onEnd({
            updateContents(contents2) {
              if (target.current) {
                const content = contents2[target.current[0]];
                if (content && ctx.isClipContent(content) && border.current) {
                  content.clip = {
                    border: border.current
                  };
                }
              }
            }
          });
          reset();
        }
      }, [type]);
      return {
        onStart() {
        },
        reset
      };
    },
    selectCount: 1,
    contentSelectable(content) {
      return ctx.isClipContent(content) && !content.readonly;
    }
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/clone.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "8", y: "27", width: "62", height: "65", strokeWidth: "3", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "30", y: "8", width: "62", height: "65", strokeWidth: "3", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "clone",
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition, resetDragMove } = ctx.useDragMove(
        () => onEnd({}),
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
      const { input, setInputPosition, resetInput } = ctx.useCursorInput(message);
      const reset = () => {
        resetDragMove();
        resetInput();
      };
      return {
        onStart: (s) => onStart(s),
        mask,
        reset,
        input,
        onMove(_, p) {
          setInputPosition(p);
        },
        updateSelectedContent(content) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  var _a, _b;
                  (_b = (_a = ctx.getContentModel(d)) == null ? void 0 : _a.move) == null ? void 0 : _b.call(_a, d, offset);
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
      var _a;
      return ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.move) !== void 0;
    },
    hotkey: "CO",
    icon,
    repeatedly: true
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}
function isPolyLineContent(content) {
  return content.type === "polyline";
}

// dev/cad-editor/plugins/ellipse.plugin.tsx
function isEllipseArcContent(content) {
  return content.type === "ellipse arc";
}

// dev/cad-editor/plugins/combined-path.plugin.tsx
function getModel(ctx) {
  const CombinedPathContent = ctx.and(ctx.BaseContent("combined path"), ctx.ContainerFields, ctx.StrokeFields, ctx.FillFields);
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const getGeometries = (content, contents) => {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      const lines = [];
      const result = [];
      const boundings = [];
      content.contents.forEach((c) => {
        var _a, _b, _c, _d;
        if (!c) {
          return;
        }
        const r = (_b = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, c, contents);
        if (r) {
          lines.push(...r.lines);
          if (r.bounding) {
            boundings.push(r.bounding.start, r.bounding.end);
          }
        }
        if (isLineContent(c) || isPolyLineContent(c)) {
          result.push({ points: c.points });
        } else if (isArcContent(c)) {
          result.push({ points: ctx.arcToPolyline(c, (_c = c.angleDelta) != null ? _c : ctx.defaultAngleDelta) });
        } else if (isEllipseArcContent(c)) {
          result.push({ points: ctx.ellipseArcToPolyline(c, (_d = c.angleDelta) != null ? _d : ctx.defaultAngleDelta) });
        }
      });
      ctx.mergePolylinesToPolyline(result);
      const renderingLines = result.map((m) => m.points);
      const points = renderingLines.flat();
      return {
        lines,
        bounding: ctx.getPointsBounding(boundings),
        renderingLines,
        regions: ctx.hasFill(content) ? [{
          lines,
          points
        }] : void 0
      };
    });
  };
  return {
    type: "combined path",
    ...ctx.containerModel,
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move: ctx.getContainerMove,
    rotate: ctx.getContainerRotate,
    scale: ctx.getContainerScale,
    explode: ctx.getContainerExplode,
    mirror: ctx.getContainerMirror,
    render(content, renderCtx) {
      const geometries = getGeometries(content, renderCtx.contents);
      const { options } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      return renderCtx.target.renderGroup(geometries.renderingLines.map((line) => {
        return renderCtx.target.renderPolyline(line, options);
      }));
    },
    renderIfSelected: (content, renderCtx) => ctx.getContainerRenderIfSelected(content, renderCtx, [content], getRefIds),
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, CombinedPathContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds
  };
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.contentIsDeletable(content, contents) && (isLineContent(content) || isArcContent(content) || isPolyLineContent(content) || isEllipseArcContent(content));
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "36,93 40,92 43,90 47,88 51,86 55,84 58,81 62,79 65,76 69,73 72,70 75,67 78,64 80,60 83,57 85,54 86,51 88,47 89,44 90,41 90,38 91,36 90,33 90,31 89,28 88,26 87,25 85,23 83,22 81,21 78,20 76,20 73,20 69,20 66,20 63,21 59,22 55,23 52,25 48,27 44,29 40,31 37,34 33,36 30,39 26,42 23,45 20,48 17,51 15,55 12,58 10,61 9,64 36,93", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "create combined path",
    execute({ contents, selected, strokeStyleId, fillStyleId }) {
      const newContent = {
        type: "combined path",
        strokeStyleId,
        fillStyleId,
        contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents))
      };
      ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
      contents.push(newContent);
    },
    contentSelectable,
    icon
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/cad-editor/plugins/compress.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "10", y: "44", width: "81", height: "20", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "9", y: "69", width: "81", height: "20", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "42,6 57,6 57,31 73,31 51,44 27,32 42,32", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "compress",
    execute({ contents }) {
      var _a, _b;
      const newIndexes = [];
      let validContentCount = 0;
      const invalidContentsIndex = [];
      const contentIsValid = (d) => {
        var _a2, _b2;
        return !!d && ((_b2 = (_a2 = ctx.getContentModel(d)) == null ? void 0 : _a2.isValid(d)) != null ? _b2 : true) === true;
      };
      contents.forEach((d, i) => {
        if (contentIsValid(d)) {
          newIndexes.push(validContentCount);
          if (ctx.isContainerContent(d)) {
            d.contents = d.contents.filter((c) => contentIsValid(c));
          }
          validContentCount++;
        } else {
          newIndexes.push(void 0);
          invalidContentsIndex.unshift(i);
        }
      });
      invalidContentsIndex.forEach((i) => {
        contents.splice(i, 1);
      });
      for (const content of ctx.iterateAllContents(contents)) {
        (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.updateRefId) == null ? void 0 : _b.call(_a, content, (refId) => typeof refId === "number" ? newIndexes[refId] : void 0);
      }
      ctx.contentIndexCache.clear();
    },
    selectCount: 0,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/coordinate-axis.plugin.tsx
function getModel(ctx) {
  const CoordinateAxisContent = ctx.and(ctx.BaseContent("coordinate axis"), ctx.StrokeFields, ctx.ArrowFields, ctx.Position, ctx.Bounding, {
    flipY: ctx.optional(ctx.boolean)
  });
  const getRefIds = (content) => ctx.getStrokeRefIds(content);
  function getGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      const yMin = content.flipY ? -content.yMax : content.yMin;
      const yMax = content.flipY ? -content.yMin : content.yMax;
      const lines = [
        [
          { x: content.x + content.xMin, y: content.y },
          { x: content.x + content.xMax, y: content.y }
        ],
        [
          { x: content.x, y: content.y + yMin },
          { x: content.x, y: content.y + yMax }
        ]
      ];
      const areas = [];
      const renderingLines = [];
      lines.forEach(([p1, p2], i) => {
        if (content.flipY && i === 1) {
          [p2, p1] = [p1, p2];
        }
        const { arrowPoints, endPoint } = ctx.getArrowPoints(p1, p2, content);
        areas.push(arrowPoints);
        lines[i][content.flipY && i === 1 ? 0 : 1] = endPoint;
        renderingLines.push(...ctx.dashedPolylineToLines(lines[i], content.dashArray));
      });
      return {
        lines,
        bounding: {
          start: {
            x: content.x + Math.min(0, content.xMin, content.xMax),
            y: content.y + Math.min(0, yMin, yMax)
          },
          end: {
            x: content.x + Math.max(0, content.xMin, content.xMax),
            y: content.y + Math.max(0, yMin, yMax)
          }
        },
        regions: areas.map((e) => ({
          points: e,
          lines: Array.from(ctx.iteratePolygonLines(e))
        })),
        renderingLines
      };
    });
  }
  const React = ctx.React;
  return {
    type: "coordinate axis",
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    render(content, renderCtx) {
      const { options, target, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { regions, renderingLines } = getGeometriesFromCache(content, renderCtx.contents);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options));
      }
      if (regions) {
        for (let i = 0; i < regions.length; i++) {
          children.push(target.renderPolygon(regions[i].points, fillOptions));
        }
      }
      return target.renderGroup(children);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isCoordinateAxisContent(c)) {
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
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.y = v;
          }
        }) }),
        xMin: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.xMin, setValue: (v) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.xMin = v;
          }
        }) }),
        xMax: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.xMax, setValue: (v) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.xMax = v;
          }
        }) }),
        yMin: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.yMin, setValue: (v) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.yMin = v;
          }
        }) }),
        yMax: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.yMax, setValue: (v) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.yMax = v;
          }
        }) }),
        flipY: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.flipY === true, setValue: (v) => update((c) => {
          if (isCoordinateAxisContent(c)) {
            c.flipY = v ? true : void 0;
          }
        }) }),
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, CoordinateAxisContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds
  };
}
function isCoordinateAxisContent(content) {
  return content.type === "coordinate axis";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "0,50 95,50", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "50,5 50,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "100,50 82,58 82,42", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "50,0 58,18 42,18", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "create coordinate axis",
    selectCount: 0,
    icon,
    useCommand({ onEnd, type }) {
      const [result, setResult] = React.useState();
      const reset = () => {
        setResult(void 0);
      };
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result);
                }
              }
            });
            reset();
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: "coordinate axis",
              x: p.x,
              y: p.y,
              xMin: -50,
              xMax: 50,
              yMin: -50,
              yMax: 50,
              flipY: true
            });
          }
        },
        assistentContents: result ? [result] : void 0,
        reset
      };
    }
  };
}
export {
  getCommand,
  getModel,
  isCoordinateAxisContent
};
`,
`// dev/cad-editor/plugins/copy-paste.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const CopyData = {
    contents: ctx.minItems(0, [{
      id: ctx.number,
      content: ctx.Content
    }]),
    center: ctx.Position
  };
  const cutOrCopyCommand = {
    name: "copy",
    execute({ contents, selected, type }) {
      const ids = [];
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          for (const id of ctx.iterateRefIds([index], contents)) {
            const index2 = ids.indexOf(id);
            if (index2 >= 0) {
              ids.splice(index2, 1);
            }
            ids.push(id);
          }
        }
      });
      if (type === "cut") {
        ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
      }
      const copiedContents = [];
      const boundingPoints = [];
      ids.forEach((id) => {
        var _a, _b;
        const content = contents[id];
        if (content) {
          const geometries = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents);
          if (geometries == null ? void 0 : geometries.bounding) {
            boundingPoints.push(geometries.bounding.start, geometries.bounding.end);
          }
          copiedContents.unshift({
            id,
            content
          });
        }
      });
      const bounding = ctx.getPointsBounding(boundingPoints);
      if (!bounding) {
        return;
      }
      const copyData = {
        contents: copiedContents,
        center: ctx.getTwoPointCenter(bounding.start, bounding.end)
      };
      navigator.clipboard.writeText(JSON.stringify(copyData));
    }
  };
  return [
    cutOrCopyCommand,
    {
      ...cutOrCopyCommand,
      name: "cut"
    },
    {
      name: "paste",
      useCommand({ onEnd, type }) {
        let message = "";
        if (type) {
          message = "specify target point";
        }
        const [copyData, setCopyData] = React.useState();
        const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message);
        ctx.useValueChanged(type, () => {
          if (type) {
            (async () => {
              try {
                const text = await navigator.clipboard.readText();
                const copyData2 = JSON.parse(text);
                const r = ctx.validate(copyData2, CopyData);
                if (r === true) {
                  setCopyData(copyData2);
                  return;
                } else {
                  console.info(r);
                  reset();
                  onEnd();
                }
              } catch (error) {
                console.info(error);
              }
            })();
          }
        });
        const reset = () => {
          setCopyData(void 0);
          resetInput();
          setCursorPosition(void 0);
          setInputPosition(void 0);
        };
        const assistentContents = [];
        if (cursorPosition && copyData) {
          const offset = {
            x: cursorPosition.x - copyData.center.x,
            y: cursorPosition.y - copyData.center.y
          };
          copyData.contents.forEach((c) => {
            assistentContents.push(ctx.produce(c.content, (draft) => {
              var _a, _b;
              const model = ctx.getContentModel(draft);
              (_a = model == null ? void 0 : model.move) == null ? void 0 : _a.call(model, draft, offset);
              (_b = model == null ? void 0 : model.updateRefId) == null ? void 0 : _b.call(model, draft, (d) => {
                if (typeof d === "number") {
                  const index = copyData.contents.findIndex((c2) => c2.id === d);
                  if (index >= 0 && index < assistentContents.length) {
                    return assistentContents[index];
                  }
                }
                return void 0;
              });
            }));
          });
        }
        return {
          onStart(p) {
            resetInput();
            onEnd({
              updateContents: (contents) => {
                if (copyData) {
                  const offset = {
                    x: p.x - copyData.center.x,
                    y: p.y - copyData.center.y
                  };
                  const idMap = {};
                  let id = contents.length;
                  copyData.contents.forEach((c) => {
                    idMap[c.id] = id++;
                  });
                  copyData.contents.forEach((c) => {
                    contents.push(ctx.produce(c.content, (draft) => {
                      var _a, _b;
                      const model = ctx.getContentModel(draft);
                      (_a = model == null ? void 0 : model.move) == null ? void 0 : _a.call(model, draft, offset);
                      (_b = model == null ? void 0 : model.updateRefId) == null ? void 0 : _b.call(model, draft, (d) => typeof d === "number" ? idMap[d] : void 0);
                    }));
                  });
                }
                reset();
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
          assistentContents,
          reset
        };
      },
      selectCount: 0
    }
  ];
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/create-tangent-tangent-line.plugin.tsx
function getCommand(ctx) {
  function getTangentTangentLines(content1, content2) {
    const content1IsCircle = isCircleContent(content1) || isArcContent(content1);
    const content2IsCircle = isCircleContent(content2) || isArcContent(content2);
    if (content1IsCircle && content2IsCircle) {
      return ctx.getLinesTangentTo2Circles(content1, content2);
    }
    return [];
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "78", cy: "80", r: "18", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "29", cy: "29", r: "27", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "92,70 51,13", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "create tangent tangent line",
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState();
      const [result, setResult] = React.useState();
      const assistentContents = (candidates || []).map((c) => ({
        points: c,
        type: "line",
        dashArray: c === result ? void 0 : [4 / scale]
      }));
      React.useEffect(() => {
        if (type && !candidates) {
          setCandidates(getTangentTangentLines(selected[0].content, selected[1].content));
        }
      }, [type, selected]);
      const reset = () => {
        setCandidates(void 0);
        setResult(void 0);
      };
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: "line", points: result });
              }
            });
            reset();
          }
        },
        onMove(p) {
          setResult(candidates == null ? void 0 : candidates.find((c) => ctx.getPointAndLineSegmentMinimumDistance(p, ...c) < 5));
        },
        assistentContents,
        reset
      };
    },
    selectCount: 2,
    contentSelectable: (c) => isCircleContent(c) || isArcContent(c),
    selectType: "select part",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/cad-editor/plugins/create-tangent-tangent-radius-circle.plugin.tsx
function getCommand(ctx) {
  function getTangentTangentRadiusCircles(content1, content2, radius) {
    const result = [];
    if (isCircleContent(content1) || isArcContent(content1)) {
      if (isCircleContent(content2) || isArcContent(content2)) {
        result.push(...ctx.getCirclesTangentTo2Circles(content1, content2, radius));
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (!line2) return [];
        result.push(...ctx.getCirclesTangentToLineAndCircle(line2, content1, radius));
      }
    } else if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]);
      if (!line1) return [];
      if (isCircleContent(content2) || isArcContent(content2)) {
        result.push(...ctx.getCirclesTangentToLineAndCircle(line1, content2, radius));
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (!line2) return [];
        result.push(...ctx.getCirclesTangentTo2Lines(line1, line2, radius));
      }
    }
    return result.map((c) => ({ ...c, r: radius }));
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "10,87 89,87", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "17", cy: "40", r: "16", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "60", cy: "57", r: "30", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  const contentSelectable = (c) => isCircleContent(c) || isArcContent(c) || isLineContent(c);
  const command = {
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
        assistentContents,
        reset
      };
    },
    selectCount: 2,
    contentSelectable,
    selectType: "select part",
    icon
  };
  return [
    command,
    {
      ...command,
      name: "create tangent tangent radius circle 2",
      useCommand({ onEnd, type, scale, contentVisible, contents, getContentsInRange }) {
        const [first, setFirst] = React.useState();
        const [second, setSecond] = React.useState();
        const [hovering, setHovering] = React.useState();
        const [result, setResult] = React.useState();
        let message = "";
        if (type) {
          if (!first) {
            message = "select first circle, arc or line";
          } else if (!second) {
            message = "select second circle, arc or line";
          } else {
            message = "input radius";
          }
        }
        const assistentContents = [];
        if (result) {
          assistentContents.push({ ...result, type: "circle", dashArray: [4 / scale] });
        }
        const selected = [];
        if (first) {
          selected.push(first.path);
        }
        if (second) {
          selected.push(second.path);
        }
        const getCandidate = (radius) => {
          if (!first || !second) return;
          const candidates = getTangentTangentRadiusCircles(first.content, second.content, radius);
          return ctx.minimumBy(candidates, (c) => ctx.getTwoPointsDistanceSquare(c, first.point) + ctx.getTwoPointsDistanceSquare(c, second.point));
        };
        const { input, setInputPosition, setCursorPosition, clearText, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
          if (e.key === "Enter") {
            const radius = +text;
            if (!isNaN(radius) && first && second) {
              const candidate = getCandidate(radius);
              if (!candidate) return;
              onEnd({
                updateContents: (contents2) => {
                  contents2.push({ type: "circle", ...candidate });
                }
              });
              reset();
            }
          }
        } : void 0);
        const reset = () => {
          setFirst(void 0);
          setSecond(void 0);
          setHovering(void 0);
          setResult(void 0);
          clearText();
          resetInput();
        };
        const selectContent = (p) => {
          const indexes = getContentsInRange({ start: p, end: p }).filter((c) => !!c).map((c) => ctx.getContentIndex(c, contents));
          const contentPath = ctx.getContentByClickPosition(contents, p, (c) => {
            const content = ctx.getContentByIndex(contents, c);
            return !!content && contentSelectable(content);
          }, ctx.getContentModel, true, contentVisible, indexes, 3 / scale);
          if (contentPath) {
            const content = ctx.getContentByIndex(contents, contentPath);
            if (content) {
              return { content, point: p, path: contentPath };
            }
          }
          return;
        };
        return {
          onStart(p) {
            if (!first) {
              setFirst(hovering);
              setHovering(void 0);
              return;
            } else if (!second) {
              setSecond(hovering);
              setHovering(void 0);
              return;
            }
            setCursorPosition(p);
            if (result) {
              onEnd({
                updateContents: (contents2) => {
                  contents2.push({ type: "circle", ...result });
                }
              });
              reset();
            }
          },
          input,
          onMove(p, viewportPosition) {
            setCursorPosition(p);
            setInputPosition(viewportPosition || p);
            if (!first) {
              setHovering(selectContent(p));
              return;
            } else if (!second) {
              setHovering(selectContent(p));
              return;
            }
            setResult(getCandidate(ctx.getTwoPointsDistance(second.point, p)));
          },
          assistentContents,
          selected,
          hovering: hovering ? [hovering.path] : void 0,
          reset
        };
      },
      selectCount: 0
    }
  ];
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/cad-editor/plugins/create-tangent-tangent-tangent-circle.plugin.tsx
function getCommand(ctx) {
  function getTangentTangentTangentCircles(content1, content2, content3) {
    const result = [];
    if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]);
      if (!line1) return [];
      if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (!line2) return [];
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
          if (!line3) return [];
          result.push(...ctx.getCirclesTangentTo3Lines(line1, line2, line3));
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineLineCircle(line1, line2, content3));
        }
      } else if (isCircleContent(content2) || isArcContent(content2)) {
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
          if (!line3) return [];
          result.push(...ctx.getCirclesTangentToLineLineCircle(line1, line3, content2));
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line1, content2, content3));
        }
      }
    } else if (isCircleContent(content1) || isArcContent(content1)) {
      if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (!line2) return [];
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
          if (!line3) return [];
          result.push(...ctx.getCirclesTangentToLineLineCircle(line2, line3, content1));
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line2, content1, content3));
        }
      } else if (isCircleContent(content2) || isArcContent(content2)) {
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
          if (!line3) return [];
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line3, content1, content2));
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentTo3Circles(content1, content2, content3));
        }
      }
    }
    return result;
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "0,8 100,8", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "99,19 60,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "0,22 44,98", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "50", cy: "42", r: "34", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "create tangent tangent tangent circle",
    useCommand({ onEnd, type, selected, scale }) {
      const [candidates, setCandidates] = React.useState();
      const [result, setResult] = React.useState();
      const assistentContents = (candidates || []).map((c) => ({
        ...c,
        type: "circle",
        dashArray: c === result ? void 0 : [4 / scale]
      }));
      const reset = () => {
        setCandidates(void 0);
        setResult(void 0);
      };
      React.useEffect(() => {
        if (type && !candidates) {
          setCandidates(getTangentTangentTangentCircles(selected[0].content, selected[1].content, selected[2].content));
        }
      }, [type, selected]);
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                contents.push({ type: "circle", ...result });
              }
            });
            setCandidates([]);
          }
        },
        onMove(p) {
          setResult(candidates == null ? void 0 : candidates.find((c) => ctx.getTwoNumbersDistance(ctx.getTwoPointsDistance(c, p), c.r) < 5));
        },
        assistentContents,
        reset
      };
    },
    selectCount: 3,
    contentSelectable: (c) => isLineContent(c) || isCircleContent(c) || isArcContent(c),
    selectType: "select part",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/delete.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "17,21 80,84", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "77,23 19,81", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "delete",
    execute({ contents, selected }) {
      ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
    },
    contentSelectable(content, contents) {
      return ctx.contentIsDeletable(content, contents);
    },
    hotkey: "E",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/diamond.plugin.tsx
function getModel(ctx) {
  const DiamondContent = ctx.and(ctx.BaseContent("diamond"), ctx.StrokeFields, ctx.FillFields, ctx.Region);
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      const points = [
        { x: content.x, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y },
        { x: content.x, y: content.y + content.height / 2 },
        { x: content.x - content.width / 2, y: content.y }
      ];
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray),
        regions: ctx.hasFill(content) ? [
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
    type: "diamond",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy);
      content.width *= sx;
      content.height *= sy;
    },
    skew(content, center, sx, sy, contents) {
      const points = ctx.produce(getGeometries(content, contents).points, (draft) => {
        for (const p of draft) {
          ctx.skewPoint(p, center, sx, sy);
        }
      });
      return { ...content, points, type: "polygon" };
    },
    explode(content, contents) {
      const { lines } = getGeometries(content, contents);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    offset(content, point, distance, contents) {
      var _a;
      if (!distance) {
        distance = Math.min(...getGeometries(content, contents).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point, contents)) ? -2 : 2;
      const scale = content.width / content.height;
      const height = distance / Math.sin(Math.atan(scale));
      const width = height * scale;
      return ctx.produce(content, (d) => {
        d.width += width;
        d.height += height;
      });
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getGeometries(content, renderCtx.contents);
      return target.renderPolygon(points, options);
    },
    getOperatorRenderPosition(content, contents) {
      const { points } = getGeometries(content, contents);
      return points[0];
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getGeometries(content, contents);
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: "center" },
            { ...points[0], direction: "top" },
            { ...points[1], direction: "right" },
            { ...points[2], direction: "bottom" },
            { ...points[3], direction: "left" }
          ].map((p) => ({
            x: p.x,
            y: p.y,
            cursor: ctx.getResizeCursor(0, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isDiamondContent(c)) {
                return;
              }
              const offset = ctx.getResizeOffset(start, cursor, p.direction);
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
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getGeometries(content, contents);
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
    getGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isDiamondContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isDiamondContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isDiamondContent(c)) {
            c.y = v;
          }
        }) }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.width, setValue: (v) => update((c) => {
          if (isDiamondContent(c)) {
            c.width = v;
          }
        }) }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.height, setValue: (v) => update((c) => {
          if (isDiamondContent(c)) {
            c.height = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, DiamondContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getGeometries(content, contents).points)
  };
}
function isDiamondContent(content) {
  return content.type === "diamond";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "52,5 97,50 52,96 6,50", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create diamond",
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId, scale }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create diamond",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "diamond",
            x: (c[0].x + c[1].x) / 2,
            y: (c[0].y + c[1].y) / 2,
            width: Math.abs(c[0].x - c[1].x),
            height: Math.abs(c[0].y - c[1].y),
            strokeStyleId,
            fillStyleId
          })
        }),
        {
          once: true
        }
      );
      const assistentContents = [];
      if (line) {
        assistentContents.push({
          type: "diamond",
          x: (line[0].x + line[1].x) / 2,
          y: (line[0].y + line[1].y) / 2,
          width: Math.abs(line[0].x - line[1].x),
          height: Math.abs(line[0].y - line[1].y),
          strokeStyleId,
          fillStyleId
        });
        assistentContents.push({
          type: "rect",
          x: (line[0].x + line[1].x) / 2,
          y: (line[0].y + line[1].y) / 2,
          width: Math.abs(line[0].x - line[1].x),
          height: Math.abs(line[0].y - line[1].y),
          angle: 0,
          dashArray: [4 / scale]
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel,
  isDiamondContent
};
`,
`// dev/cad-editor/plugins/difference.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "32", cy: "50", r: "32", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "65", cy: "50", r: "32", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("pattern", { id: "difference", patternUnits: "userSpaceOnUse", width: "10", height: "10" }, /* @__PURE__ */ React.createElement("path", { d: "M 0 5 L 5 0 M 10 5 L 5 10", strokeWidth: "1", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" })), /* @__PURE__ */ React.createElement("path", { d: "M 49 78 L 46 79 L 44 81 L 41 81 L 38 82 L 35 82 L 32 82 L 30 82 L 27 82 L 24 81 L 21 81 L 19 79 L 16 78 L 14 77 L 12 75 L 10 73 L 8 71 L 6 69 L 4 66 L 3 64 L 2 61 L 1 58 L 0 56 L 0 53 L 0 50 L 0 47 L 0 44 L 1 42 L 2 39 L 3 36 L 4 34 L 6 31 L 8 29 L 10 27 L 12 25 L 14 23 L 16 22 L 19 21 L 21 19 L 24 19 L 27 18 L 30 18 L 32 18 L 35 18 L 38 18 L 41 19 L 44 19 L 46 21 L 49 22 L 49 22 L 46 23 L 44 25 L 42 27 L 40 29 L 38 31 L 37 34 L 36 36 L 34 39 L 34 42 L 33 44 L 33 47 L 32 50 L 33 53 L 33 56 L 34 58 L 34 61 L 36 64 L 37 66 L 38 69 L 40 71 L 42 73 L 44 75 L 46 77 L 49 78", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", fill: "url(#difference)", stroke: "currentColor", fillRule: "evenodd" }));
  return {
    name: "difference",
    execute({ contents, selected }) {
      var _a, _b, _c, _d;
      const first = contents[selected[0][0]];
      if (!first) return;
      const firstGeometries = (_b = (_a = ctx.getContentModel(first)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, first, contents);
      if (!firstGeometries) return;
      const second = contents[selected[1][0]];
      if (!second) return;
      const secondGeometries = (_d = (_c = ctx.getContentModel(second)) == null ? void 0 : _c.getGeometries) == null ? void 0 : _d.call(_c, second, contents);
      if (!secondGeometries) return;
      if (firstGeometries.regions && secondGeometries.regions) {
        const result = firstGeometries.regions.map((r) => ctx.getHatchesDifference({ border: r.lines, holes: r.holes || [] }, (secondGeometries.regions || []).map((g) => ({ border: g.lines, holes: g.holes || [] })))).flat();
        ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
        contents.push(...result.map((r) => ({ ...first, type: "hatch", border: r.border, holes: r.holes, ref: void 0 })));
        return;
      }
      const lines = ctx.getGeometryLinesDifferenceLines(firstGeometries.lines, secondGeometries.lines);
      ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
      const allLines = ctx.getSeparatedGeometryLines(lines);
      contents.push(...allLines.map((n) => ({ type: "geometry lines", lines: n })));
    },
    contentSelectable(content, contents) {
      return ctx.contentIsDeletable(content, contents);
    },
    selectCount: 2,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/edit-container.plugin.tsx
function getCommand(ctx) {
  function contentSelectable(c) {
    return !c.readonly && ctx.isContainerContent(c);
  }
  const React = ctx.React;
  const startIcon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "42,73 42,74 41,75 41,77 41,78 40,79 39,81 39,82 38,83 37,84 36,85 35,86 34,86 32,87 31,88 30,88 28,88 27,89 26,89 24,89 23,88 21,88 20,88 19,87 17,86 16,86 15,85 14,84 13,83 12,82 12,81 11,79 10,78 10,77 10,75 9,74 9,73 9,71 10,70 10,68 10,67 11,66 12,64 12,63 13,62 14,61 15,60 16,59 17,59 19,58 20,57 21,57 23,57 24,56 25,56 27,56 28,57 30,57 31,57 32,58 34,59 35,59 36,60 37,61 38,62 39,63 39,64 40,66 41,67 41,68 41,70 42,71 42,73", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "12,10 76,10 76,45 12,45", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "70,93 93,52 46,52", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  const startCommand = {
    name: "start edit container",
    icon: startIcon,
    execute({ contents, selected, setEditingContentPath }) {
      contents.forEach((content, index) => {
        var _a, _b;
        if (content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true)) {
          setEditingContentPath(contentSelectable(content) ? [index, "contents"] : void 0);
        }
      });
    },
    contentSelectable,
    selectCount: 1
  };
  const cancelIcon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "37,82 32,77 45,64 34,52 22,65 16,58 4,90", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "83,40 78,34 65,46 53,35 67,24 61,17 94,8", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "60,82 66,78 53,64 64,53 76,66 83,60 93,93", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "17,38 22,32 35,45 46,34 34,23 40,16 7,5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  const cancelCommand = {
    name: "cancel edit container",
    execute({ setEditingContentPath }) {
      setEditingContentPath(void 0);
    },
    selectCount: 0,
    icon: cancelIcon
  };
  return [startCommand, cancelCommand];
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/ellipse.plugin.tsx
function getModel(ctx) {
  const EllipseContent = ctx.and(ctx.BaseContent("ellipse"), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.Ellipse);
  const EllipseArcContent = ctx.and(ctx.BaseContent("ellipse arc"), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.EllipseArc);
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const ellipseGeometriesCache = new ctx.WeakmapValuesCache();
  const ellipseArcGeometriesCache = new ctx.WeakmapValuesCache();
  function getEllipseGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ellipseGeometriesCache.get(content, refs, () => {
      var _a;
      const points = ctx.ellipseToPolygon(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const lines = Array.from(ctx.iteratePolygonLines(points));
      const polylinePoints = ctx.polygonToPolyline(points);
      const center = ctx.getEllipseCenter(content);
      const left = ctx.rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content);
      const right = ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content);
      const top = ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content);
      const bottom = ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content);
      const focus = ctx.getEllipseFocus(content);
      return {
        lines: [{
          type: "ellipse arc",
          curve: ctx.ellipseToEllipseArc(content)
        }],
        points,
        center,
        left,
        right,
        top,
        bottom,
        focus,
        bounding: ctx.getEllipseBounding(content),
        renderingLines: ctx.dashedPolylineToLines(polylinePoints, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points
          }
        ] : void 0
      };
    });
  }
  function getEllipseArcGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ellipseArcGeometriesCache.get(content, refs, () => {
      var _a;
      const points = ctx.ellipseArcToPolyline(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const lines = Array.from(ctx.iteratePolylineLines(points));
      const center = ctx.getEllipseCenter(content);
      const focus = ctx.getEllipseFocus(content);
      const startRadian = ctx.angleToRadian(content.startAngle);
      const endRadian = ctx.angleToRadian(content.endAngle);
      const middleRadian = (startRadian + endRadian) / 2;
      return {
        lines: [{
          type: "ellipse arc",
          curve: content
        }],
        points,
        center,
        focus,
        start: ctx.getEllipsePointAtRadian(content, startRadian),
        end: ctx.getEllipsePointAtRadian(content, endRadian),
        middle: ctx.getEllipsePointAtRadian(content, middleRadian),
        bounding: ctx.getEllipseArcBounding(content),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points
          }
        ] : void 0
      };
    });
  }
  const React = ctx.React;
  const ellipseModel = {
    type: "ellipse",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.angleDeltaModel,
    move(content, offset) {
      ctx.moveEllipse(content, offset);
    },
    rotate(content, center, angle) {
      ctx.rotateEllipse(content, center, angle);
    },
    scale(content, center, sx, sy) {
      ctx.scaleEllipse(content, center, sx, sy);
    },
    skew(content, center, sx, sy) {
      ctx.skewEllipse(content, center, sx, sy);
    },
    mirror(content, line, angle) {
      ctx.mirrorEllipse(content, line, angle);
    },
    offset(content, point, distance, contents) {
      if (!distance) {
        distance = Math.min(...getEllipseGeometries(content, contents).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      return ctx.getParallelEllipsesByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfEllipse(point, content))];
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
    render(content, renderCtx) {
      const { options, target, dashed } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      if (dashed) {
        const { points } = getEllipseGeometries(content, renderCtx.contents);
        return target.renderPolygon(points, options);
      }
      return target.renderEllipse(content.cx, content.cy, content.rx, content.ry, { ...options, angle: content.angle });
    },
    getOperatorRenderPosition(content) {
      return ctx.getEllipseCenter(content);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        var _a;
        const { center, left, right, top, bottom } = getEllipseGeometries(content, contents);
        const rotate = -((_a = content.angle) != null ? _a : 0);
        return {
          editPoints: [
            {
              x: content.cx,
              y: content.cy,
              cursor: "move",
              type: "move",
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
          angleSnapStartPoint: ctx.getEllipseCenter(content)
        };
      });
    },
    getSnapPoints(content, contents) {
      const { center, left, right, top, bottom, focus } = getEllipseGeometries(content, contents);
      return ctx.getSnapPointsFromCache(content, () => [
        { ...center, type: "center" },
        { ...left, type: "endpoint" },
        { ...right, type: "endpoint" },
        { ...top, type: "endpoint" },
        { ...bottom, type: "endpoint" },
        ...focus.map((p) => ({ ...p, type: "center" }))
      ]);
    },
    getGeometries: getEllipseGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isEllipseContent(c)) {
            c.cx = p.x, c.cy = p.y;
          }
        })) }, "canvas"),
        cx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.cx, setValue: (v) => update((c) => {
          if (isEllipseContent(c)) {
            c.cx = v;
          }
        }) }),
        cy: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.cy, setValue: (v) => update((c) => {
          if (isEllipseContent(c)) {
            c.cy = v;
          }
        }) }),
        rx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.rx, setValue: (v) => update((c) => {
          if (isEllipseContent(c)) {
            c.rx = v;
          }
        }) }),
        ry: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ry, setValue: (v) => update((c) => {
          if (isEllipseContent(c)) {
            c.ry = v;
          }
        }) }),
        angle: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.angle !== void 0, setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.angle = v ? 0 : void 0;
            }
          }) }),
          content.angle !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.angle, setValue: (v) => update((c) => {
            if (isEllipseContent(c)) {
              c.angle = v;
            }
          }) }) : void 0
        ],
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getAngleDeltaContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, EllipseContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getEllipseGeometries(content, contents).points),
    getArea: (content) => Math.PI * content.rx * content.ry
  };
  return [
    ellipseModel,
    {
      type: "ellipse arc",
      ...ctx.strokeModel,
      ...ctx.fillModel,
      ...ctx.angleDeltaModel,
      move: ellipseModel.move,
      rotate: ellipseModel.rotate,
      scale(content, center, sx, sy) {
        ctx.scaleEllipseArc(content, center, sx, sy);
      },
      skew(content, center, sx, sy) {
        ctx.skewEllipseArc(content, center, sx, sy);
      },
      mirror: ellipseModel.mirror,
      break(content, points) {
        if (points.length === 0) {
          return;
        }
        const angles = points.map((p) => ctx.normalizeAngleInRange(ctx.getEllipseAngle(p, content), content));
        angles.sort((a, b) => a - b);
        const result = [];
        if (!ctx.isSameNumber(angles[0], content.startAngle)) {
          result.push({
            ...content,
            type: "ellipse arc",
            startAngle: content.startAngle,
            endAngle: angles[0]
          });
        }
        angles.forEach((a, i) => {
          if (i === angles.length - 1) {
            if (!ctx.isSameNumber(a, content.endAngle)) {
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
      offset(content, point, distance, contents) {
        if (!distance) {
          distance = Math.min(...getEllipseArcGeometries(content, contents).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
        }
        return ctx.getParallelEllipseArcsByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfEllipseArc(point, content))];
      },
      join(content, target) {
        if (isEllipseArcContent(target)) {
          return ctx.mergeEllipseArc(content, target);
        }
        return;
      },
      extend(content, point) {
        const angle = ctx.getEllipseAngle(point, content);
        const endAngle = ctx.getFormattedEndAngle({ startAngle: content.startAngle, endAngle: angle });
        const startAngle = ctx.getFormattedStartAngle({ startAngle: angle, endAngle: content.endAngle });
        const angle1 = Math.abs(endAngle - content.startAngle);
        const angle2 = Math.abs(content.endAngle - startAngle);
        if (angle1 < angle2) {
          content.endAngle = endAngle;
        } else {
          content.startAngle = startAngle;
        }
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
        const { points } = getEllipseArcGeometries(content, renderCtx.contents);
        return target.renderPolyline(points, options);
      },
      renderIfSelected(content, { color, target, strokeWidth, contents }) {
        const { points } = getEllipseArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle }, contents);
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth });
      },
      getOperatorRenderPosition(content, contents) {
        const { points } = getEllipseArcGeometries(content, contents);
        return points[0];
      },
      getEditPoints(content, contents) {
        return ctx.getEditPointsFromCache(content, () => {
          var _a;
          const { center, start, end } = getEllipseArcGeometries(content, contents);
          const rotate = -((_a = content.angle) != null ? _a : 0);
          return {
            editPoints: [
              {
                x: content.cx,
                y: content.cy,
                cursor: "move",
                update(c, { cursor, start: start2, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  c.cx += cursor.x - start2.x;
                  c.cy += cursor.y - start2.y;
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
                }
              },
              {
                ...start,
                cursor: ctx.getResizeCursor(content.startAngle - rotate, "top"),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  c.startAngle = ctx.getEllipseAngle(cursor, content);
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
                }
              },
              {
                ...end,
                cursor: ctx.getResizeCursor(content.endAngle - rotate, "top"),
                update(c, { cursor, scale }) {
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  c.endAngle = ctx.getEllipseAngle(cursor, content);
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
                }
              }
            ],
            angleSnapStartPoint: center
          };
        });
      },
      getSnapPoints(content, contents) {
        return ctx.getSnapPointsFromCache(content, () => {
          const { center, start, end, middle, focus } = getEllipseArcGeometries(content, contents);
          return [
            { ...center, type: "center" },
            { ...start, type: "endpoint" },
            { ...end, type: "endpoint" },
            { ...middle, type: "midpoint" },
            ...focus.map((p) => ({ ...p, type: "center" }))
          ];
        });
      },
      getGeometries: getEllipseArcGeometries,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.cx = p.x, c.cy = p.y;
            }
          })) }, "canvas"),
          cx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.cx, setValue: (v) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.cx = v;
            }
          }) }),
          cy: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.cy, setValue: (v) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.cy = v;
            }
          }) }),
          rx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.rx, setValue: (v) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.rx = v;
            }
          }) }),
          ry: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ry, setValue: (v) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.ry = v;
            }
          }) }),
          angle: [
            /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.angle !== void 0, setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.angle = v ? 0 : void 0;
              }
            }) }),
            content.angle !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.angle, setValue: (v) => update((c) => {
              if (isEllipseArcContent(c)) {
                c.angle = v;
              }
            }) }) : void 0
          ],
          startAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.startAngle, setValue: (v) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.startAngle = v;
            }
          }) }),
          endAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.endAngle, setValue: (v) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.endAngle = v;
            }
          }) }),
          counterclockwise: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.counterclockwise === true, setValue: (v) => update((c) => {
            if (isEllipseArcContent(c)) {
              c.counterclockwise = v ? true : void 0;
            }
          }) }),
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents),
          ...ctx.getAngleDeltaContentPropertyPanel(content, update)
        };
      },
      isValid: (c, p) => ctx.validate(c, EllipseArcContent, p),
      getRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
      deleteRefId: ctx.deleteStrokeAndFillRefIds,
      getArea: (content) => {
        const radian = ctx.angleToRadian(content.endAngle - content.startAngle);
        return content.rx * content.ry * (radian - Math.sin(radian)) / 2;
      },
      reverse: (content) => ctx.reverseEllipseArc(content)
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
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("ellipse", { cx: "50", cy: "50", rx: "42", ry: "25", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "50", cy: "50", r: "10", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "92", cy: "50", r: "10", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("ellipse", { cx: "50", cy: "50", rx: "42", ry: "25", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "8", cy: "50", r: "10", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "92", cy: "50", r: "10", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  const icon3 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "7,71 8,69 8,66 9,64 10,61 12,58 14,55 16,52 18,49 21,46 23,43 27,40 30,38 33,35 37,32 40,30 44,28 48,25 51,23 55,22 59,20 62,19 66,18 69,17 72,16 76,16 78,16 81,16 84,17 86,17 88,18 89,19 91,21 92,22 92,24 93,26 93,29 92,31 92,34 91,36 90,39 88,42 86,45 84,48 82,51 79,54 77,57 73,60 70,62 67,65 63,68 60,70 56,72 52,75 49,77 45,78 41,80 38,81 34,82", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return [
    {
      name: "create ellipse",
      type: [
        { name: "ellipse center", hotkey: "EL", icon: icon1 },
        { name: "ellipse endpoint", icon: icon2 }
      ],
      useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
        const { ellipse, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useEllipseClickCreate(
          type === "ellipse center" || type === "ellipse endpoint" ? type : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: "ellipse" })
          })
        );
        const assistentContents = [];
        if (startPosition && cursorPosition) {
          if (middlePosition) {
            assistentContents.push({ type: "line", points: [startPosition, middlePosition], dashArray: [4 / scale] });
            if (type === "ellipse center") {
              assistentContents.push({ type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] });
            } else if (ellipse) {
              assistentContents.push({ type: "line", points: [ctx.getEllipseCenter(ellipse), cursorPosition], dashArray: [4 / scale] });
            }
          } else {
            assistentContents.push({ type: "line", points: [startPosition, cursorPosition], dashArray: [4 / scale] });
          }
        }
        if (ellipse) {
          assistentContents.push({ ...ellipse, strokeStyleId, fillStyleId, type: "ellipse" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition != null ? middlePosition : startPosition,
          reset
        };
      },
      selectCount: 0
    },
    {
      name: "create ellipse arc",
      useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
        const { ellipse, ellipseArc, onClick, onMove, input, startPosition, middlePosition, cursorPosition, reset } = ctx.useEllipseArcClickCreate(
          type === "create ellipse arc" ? "ellipse center" : void 0,
          (c) => onEnd({
            updateContents: (contents) => contents.push({ ...c, strokeStyleId, fillStyleId, type: "ellipse arc" })
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
                  ctx.getEllipsePointAtRadian(ellipseArc, ctx.angleToRadian(ellipseArc.startAngle)),
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
                  ctx.getEllipsePointAtRadian(ellipseArc, ctx.angleToRadian(ellipseArc.endAngle))
                ],
                dashArray: [4 / scale]
              }
            );
          }
          if (cursorPosition) {
            assistentContents.push({ type: "line", points: [ctx.getEllipseCenter(ellipseArc), cursorPosition], dashArray: [4 / scale] });
          }
        } else if (ellipse) {
          assistentContents.push({ ...ellipse, dashArray: [4 / scale], type: "ellipse" });
          if (cursorPosition) {
            assistentContents.push({ type: "line", points: [ctx.getEllipseCenter(ellipse), cursorPosition], dashArray: [4 / scale] });
          }
        }
        if (ellipseArc && ellipseArc.startAngle !== ellipseArc.endAngle) {
          assistentContents.push({ ...ellipseArc, strokeStyleId, fillStyleId, type: "ellipse arc" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition: middlePosition != null ? middlePosition : startPosition,
          reset
        };
      },
      selectCount: 0,
      icon: icon3
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
`// dev/cad-editor/plugins/coordinate-axis.plugin.tsx
function isCoordinateAxisContent(content) {
  return content.type === "coordinate axis";
}

// dev/cad-editor/plugins/equation.plugin.tsx
function getModel(ctx) {
  const EquationContent = ctx.and(ctx.BaseContent("equation"), ctx.StrokeFields, ctx.SegmentCountFields, {
    axisId: ctx.ContentRef,
    dependentVariable: ctx.or("x", "y"),
    expression: ctx.string
  });
  const getRefIds = (content) => [...ctx.getStrokeRefIds(content), ...ctx.toRefId(content.axisId, true)];
  const equationCache = new ctx.WeakmapValuesCache();
  function getGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return equationCache.get(content, refs, () => {
      var _a;
      const axis = ctx.getReference(content.axisId, contents, isCoordinateAxisContent);
      if (axis) {
        if (content.expression) {
          try {
            const expression = ctx.parseExpression(ctx.tokenizeExpression(content.expression));
            const points = [];
            const segmentCount = (_a = content.segmentCount) != null ? _a : ctx.defaultSegmentCount;
            if (content.dependentVariable === "y") {
              const step = (axis.xMax - axis.xMin) / segmentCount;
              for (let x = axis.xMin; x <= axis.xMax; x += step) {
                const y = ctx.evaluateExpression(expression, {
                  Math,
                  x
                });
                if (typeof y === "number" && !isNaN(y)) {
                  points.push({ x: x + axis.x, y: y * (axis.flipY ? -1 : 1) + axis.y });
                }
              }
            } else {
              const step = (axis.yMax - axis.yMin) / segmentCount;
              for (let y = axis.yMin; y <= axis.yMax; y += step) {
                const x = ctx.evaluateExpression(expression, {
                  Math,
                  y
                });
                if (typeof x === "number" && !isNaN(x)) {
                  points.push({ x: x + axis.x, y: y * (axis.flipY ? -1 : 1) + axis.y });
                }
              }
            }
            const lines = Array.from(ctx.iteratePolylineLines(points));
            return {
              points,
              lines,
              bounding: ctx.getPointsBounding(points),
              renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
            };
          } catch (e) {
            console.info(e);
          }
        }
        return { lines: [], points: [], renderingLines: [] };
      }
      return { lines: [], points: [], renderingLines: [] };
    });
  }
  const React = ctx.React;
  return {
    type: "equation",
    ...ctx.strokeModel,
    ...ctx.segmentCountModel,
    render(content, renderCtx) {
      const { options, contents, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getGeometriesFromCache(content, contents);
      return target.renderPolyline(points, options);
    },
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents) {
      return {
        dependentVariable: /* @__PURE__ */ React.createElement(ctx.EnumEditor, { value: content.dependentVariable, enums: ["x", "y"], setValue: (v) => update((c) => {
          if (isEquationContent(c)) {
            c.dependentVariable = v;
          }
        }) }),
        expression: /* @__PURE__ */ React.createElement(ctx.ExpressionEditor, { suggestionSources: ctx.math, validate: ctx.validateExpression, value: content.expression, setValue: (v) => update((c) => {
          if (isEquationContent(c)) {
            c.expression = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, EquationContent, p),
    getRefIds,
    updateRefId(content, update) {
      const newAxisId = update(content.axisId);
      if (newAxisId !== void 0) {
        content.axisId = newAxisId;
      }
      ctx.updateStrokeRefIds(content, update);
    },
    deleteRefId: ctx.deleteStrokeRefIds
  };
}
function isEquationContent(content) {
  return content.type === "equation";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "7,93 88,93", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,12 7,93", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "97,93 68,101 68,85", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,3 15,32 1,32", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,93 8,85 9,81 10,78 11,76 12,74 12,72 13,71 14,69 15,68 16,66 17,65 18,64 19,62 20,61 21,60 21,59 22,58 23,57 24,56 25,55 26,54 27,53 28,52 29,51 29,51 30,50 31,49 32,48 33,47 34,47 35,46 36,45 37,44 38,44 38,43 39,42 40,41 41,41 42,40 43,39 44,39 45,38 46,37 47,37 47,36 48,35 49,35 50,34 51,34 52,33 53,32 54,32 55,31 56,31 56,30 57,30 58,29 59,28 60,28 61,27 62,27 63,26 64,26 65,25 65,25 66,24 67,24 68,23 69,23 70,22 71,22 72,21 73,21 74,20 74,20 75,19 76,19 77,18 78,18 79,17 80,17 81,16 82,16 83,15 84,15 84,14 85,14 86,13 87,13 88,13 89,12 90,12 91,11 92,11 93,10 93,10 94,9 95,9 96,9", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create equation",
    icon,
    useCommand({ onEnd, type, selected }) {
      const [dependentVariable, setDependentVariable] = React.useState("y");
      const enabled = type === "create equation";
      let message = "";
      if (enabled) {
        message = dependentVariable === "x" ? "input f(y)" : "input f(x)";
      }
      const { input, setCursorPosition, clearText, setInputPosition, resetInput } = ctx.useCursorInput(message, enabled ? (e, text) => {
        if (e.key === "Enter") {
          onEnd({
            updateContents(contents) {
              contents.push({
                type: "equation",
                axisId: selected[0].path[0],
                dependentVariable,
                expression: text
              });
            }
          });
          clearText();
        }
      } : void 0);
      const reset = () => {
        resetInput();
        setDependentVariable("y");
      };
      return {
        input,
        onStart() {
        },
        onMove(p, viewportPosition) {
          setInputPosition(viewportPosition || p);
          setCursorPosition(p);
        },
        subcommand: enabled ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setDependentVariable(dependentVariable === "x" ? "y" : "x"), style: { position: "relative" } }, "f(", dependentVariable, ")")) : void 0,
        reset
      };
    },
    contentSelectable: isCoordinateAxisContent,
    selectCount: 1
  };
}
export {
  getCommand,
  getModel,
  isEquationContent
};
`,
`// dev/cad-editor/plugins/explode.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "17,11 83,11", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "80,91 16,91", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "9,84 9,19", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "90,19 90,85", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "explode",
    execute({ contents, selected }) {
      const newContents = [];
      const indexes = [];
      contents.forEach((content, index) => {
        var _a, _b, _c, _d;
        if (content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true)) {
          const result = (_d = (_c = ctx.getContentModel(content)) == null ? void 0 : _c.explode) == null ? void 0 : _d.call(_c, content, contents);
          if (result) {
            newContents.push(...result);
            indexes.push(index);
          }
        }
      });
      ctx.deleteSelectedContents(contents, indexes);
      contents.push(...newContents);
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content);
      return (model == null ? void 0 : model.explode) !== void 0 && ctx.contentIsDeletable(content, contents);
    },
    hotkey: "X",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/export-code.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "25,13 7,51 22,90", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "75,13 93,51 78,90", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "export code",
    execute({ contents, selected, width, height, transform }) {
      const result = [];
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          const model = ctx.getContentModel(content);
          if (model == null ? void 0 : model.render) {
            const code = model.render(content, {
              target: ctx.codeRenderTarget,
              transformColor: (c) => c,
              transformStrokeWidth: (w) => w,
              getFillColor: (c) => c.fillColor,
              getStrokeColor: (c) => {
                var _a;
                return (_a = c.strokeColor) != null ? _a : ctx.hasFill(c) ? void 0 : ctx.defaultStrokeColor;
              },
              getFillPattern: (c) => c.fillPattern ? {
                width: c.fillPattern.width,
                height: c.fillPattern.height,
                pattern: () => {
                  var _a, _b, _c, _d;
                  return ctx.codeRenderTarget.renderPath((_b = (_a = c.fillPattern) == null ? void 0 : _a.lines) != null ? _b : [], {
                    strokeColor: (_d = (_c = c.fillPattern) == null ? void 0 : _c.strokeColor) != null ? _d : ctx.defaultStrokeColor
                  });
                }
              } : void 0,
              contents
            });
            result.push(code);
          }
        }
      });
      navigator.clipboard.writeText(ctx.codeRenderTarget.renderResult(result, width, height, {
        transform
      }));
    },
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/export-jsx.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "25,13 7,51 22,90", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "75,13 93,51 78,90", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "64,15 51,90", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "export jsx",
    execute({ contents, selected }) {
      const result = [];
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          const model = ctx.getContentModel(content);
          if (model == null ? void 0 : model.render) {
            let color;
            if (ctx.isFillContent(content) && content.fillColor !== void 0) {
              color = content.fillColor;
            } else if (ctx.isStrokeContent(content)) {
              color = content.strokeColor;
            }
            color = color != null ? color : ctx.defaultStrokeColor;
            const svg = ctx.renderToStaticMarkup(model.render(content, {
              target: ctx.reactSvgRenderTarget,
              transformColor: (c) => c,
              transformStrokeWidth: (w) => w,
              getFillColor: (c) => c.fillColor,
              getStrokeColor: (c) => {
                var _a;
                return (_a = c.strokeColor) != null ? _a : ctx.hasFill(c) ? void 0 : ctx.defaultStrokeColor;
              },
              getFillPattern: (c) => c.fillPattern ? {
                width: c.fillPattern.width,
                height: c.fillPattern.height,
                pattern: () => {
                  var _a, _b, _c, _d;
                  return ctx.reactSvgRenderTarget.renderPath((_b = (_a = c.fillPattern) == null ? void 0 : _a.lines) != null ? _b : [], {
                    strokeColor: (_d = (_c = c.fillPattern) == null ? void 0 : _c.strokeColor) != null ? _d : ctx.defaultStrokeColor
                  });
                }
              } : void 0,
              contents
            })(index, 1, false, 100, 100));
            let jsx = "";
            for (let j = 0; j < svg.length; j++) {
              const c = svg[j];
              if (c === "-" && ctx.isLetter(svg[j + 1])) {
                jsx += svg[j + 1].toUpperCase();
                j++;
              } else {
                jsx += c;
              }
            }
            jsx = jsx.replaceAll(/[0-9]+\\.[0-9]+/g, (c) => Math.round(+c).toString());
            result.push(jsx.split(ctx.getColorString(color)).join("currentColor"));
          }
        }
      });
      navigator.clipboard.writeText(result.join("\\n"));
    },
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/export-png.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "51,0 51,60", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "51,60 83,28", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "51,60 21,31", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "11,84 91,84", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "export png",
    execute({ state, selected }) {
      const draws = [];
      const targets = [];
      state.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          const model = ctx.getContentModel(content);
          if (model == null ? void 0 : model.render) {
            targets.push(content);
            draws.push(model.render(content, {
              target: ctx.reactCanvasRenderTarget,
              transformColor: (c) => c,
              transformStrokeWidth: (w) => w,
              getFillColor: (c) => c.fillColor,
              getStrokeColor: (c) => {
                var _a;
                return (_a = c.strokeColor) != null ? _a : ctx.hasFill(c) ? void 0 : ctx.defaultStrokeColor;
              },
              getFillPattern: (c) => c.fillPattern ? {
                width: c.fillPattern.width,
                height: c.fillPattern.height,
                pattern: () => {
                  var _a, _b, _c, _d;
                  return ctx.reactCanvasRenderTarget.renderPath((_b = (_a = c.fillPattern) == null ? void 0 : _a.lines) != null ? _b : [], {
                    strokeColor: (_d = (_c = c.fillPattern) == null ? void 0 : _c.strokeColor) != null ? _d : ctx.defaultStrokeColor
                  });
                }
              } : void 0,
              contents: state
            }));
          }
        }
      });
      const width = window.innerWidth, height = window.innerHeight;
      const transform = ctx.zoomContentsToFit(width, height, targets, state, 0.8);
      if (!transform) return;
      const container = document.createElement("div");
      ctx.createRoot(container).render(/* @__PURE__ */ React.createElement(ctx.CanvasDrawCanvas, { width, height, draws, transform, onRender: () => {
        const child = container.children.item(0);
        if (child && child instanceof HTMLCanvasElement) {
          child.toBlob((blob) => {
            if (blob) {
              navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            }
          });
        }
      } }));
    },
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/extend.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "-0,0 101,0", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "56,-0 43,57", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "43,57 35,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "extend",
    useCommand({ onEnd, selected, contents, backgroundColor, setSelected, contentVisible }) {
      var _a;
      const [hovering, setHovering] = React.useState();
      const [trimHovering, setTrimHovering] = React.useState();
      const [shift, setShift] = React.useState(false);
      const reset = () => {
        setHovering(void 0);
        setTrimHovering(void 0);
      };
      const assistentContents = [];
      if (hovering) {
        assistentContents.push(hovering.content);
      } else if (trimHovering) {
        if (ctx.isStrokeContent(trimHovering.content)) {
          assistentContents.push({
            ...trimHovering.content,
            strokeWidth: ((_a = trimHovering.content.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(trimHovering.content)) + 2,
            strokeColor: backgroundColor,
            trueStrokeColor: true
          });
        }
      }
      return {
        onStart() {
          var _a2, _b, _c, _d, _e;
          if (hovering) {
            onEnd({
              updateContents(contents2) {
                var _a3, _b2;
                const content = ctx.getContentByIndex(contents2, hovering.path);
                if (content) {
                  (_b2 = (_a3 = ctx.getContentModel(content)) == null ? void 0 : _a3.extend) == null ? void 0 : _b2.call(_a3, content, hovering.point, contents2);
                }
              }
            });
          } else if (trimHovering) {
            const content = ctx.getContentByIndex(contents, trimHovering.path);
            if (content) {
              const points = [];
              const lines = (_c = (_b = (_a2 = ctx.getContentModel(trimHovering.content)) == null ? void 0 : _a2.getGeometries) == null ? void 0 : _b.call(_a2, trimHovering.content, contents)) == null ? void 0 : _c.lines;
              if (lines) {
                const { start, end } = ctx.getGeometryLinesStartAndEnd(lines);
                if (start && end) {
                  if (!ctx.isSamePoint(start, end)) {
                    points.push(start, end);
                  }
                } else if (start) {
                  points.push(start);
                } else if (end) {
                  points.push(end);
                }
              }
              if (points.length > 0) {
                const r = (_e = (_d = ctx.getContentModel(content)) == null ? void 0 : _d.break) == null ? void 0 : _e.call(_d, content, points, contents);
                if (r) {
                  const index = ctx.getContentIndex(content, contents);
                  const newContents = r.filter((c) => !ctx.deepEquals(trimHovering.content, c));
                  onEnd({
                    updateContents: (contents2) => {
                      contents2[index] = void 0;
                      contents2.push(...newContents);
                    }
                  });
                  const newSelected = selected.map((s) => s.path);
                  for (let i = 0; i < newContents.length; i++) {
                    newSelected.push([contents.length + i]);
                  }
                  setSelected(...newSelected);
                }
              }
            }
          }
          reset();
        },
        onMove(p) {
          var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
          for (const s of selected) {
            if (!contentVisible(s.content)) continue;
            const lines = (_c = (_b = (_a2 = ctx.getContentModel(s.content)) == null ? void 0 : _a2.getGeometries) == null ? void 0 : _b.call(_a2, s.content, contents)) == null ? void 0 : _c.lines;
            if (!lines) continue;
            if (!shift && ctx.isGeometryLinesClosed(lines)) continue;
            const lineIndex = lines.findIndex((line) => ctx.getPointAndGeometryLineMinimumDistance(p, line) < 5);
            if (lineIndex >= 0) {
              let direction;
              if (!shift) {
                if (lineIndex === 0) {
                  if (lines.length === 1) {
                    const { start, end } = ctx.getGeometryLineStartAndEnd(lines[0]);
                    if (!start) {
                      direction = "tail";
                    } else if (!end) {
                      direction = "head";
                    } else {
                      direction = ctx.getTwoPointsDistanceSquare(p, start) < ctx.getTwoPointsDistanceSquare(p, start) ? "head" : "tail";
                    }
                  } else {
                    direction = "head";
                  }
                } else if (lineIndex === lines.length - 1) {
                  direction = "tail";
                }
              }
              let points = [];
              if (shift) {
                for (const c of selected) {
                  if (c === s) continue;
                  if (!contentVisible(c.content)) continue;
                  const lines2 = (_f = (_e = (_d = ctx.getContentModel(c.content)) == null ? void 0 : _d.getGeometries) == null ? void 0 : _e.call(_d, c.content, contents)) == null ? void 0 : _f.lines;
                  if (lines2) {
                    for (let i = 0; i < lines.length; i++) {
                      for (const line of lines2) {
                        points.push(...ctx.getTwoGeometryLinesIntersectionPoint(lines[i], line));
                      }
                    }
                  }
                }
              } else if (direction) {
                for (const c of selected) {
                  if (c === s) continue;
                  if (!contentVisible(c.content)) continue;
                  const lines2 = (_i = (_h = (_g = ctx.getContentModel(c.content)) == null ? void 0 : _g.getGeometries) == null ? void 0 : _h.call(_g, c.content, contents)) == null ? void 0 : _i.lines;
                  if (lines2) {
                    for (const line of lines2) {
                      points.push(...ctx.getTwoGeometryLinesIntersectionPoint(lines[lineIndex], line, [{ [direction]: true }, { body: true }]));
                    }
                  }
                }
              }
              points = ctx.deduplicatePosition(points);
              if (shift) {
                let parts = [s.content];
                if (points.length > 0) {
                  parts = ((_k = (_j = ctx.getContentModel(s.content)) == null ? void 0 : _j.break) == null ? void 0 : _k.call(_j, s.content, points, contents)) || [s.content];
                }
                const content = parts.length === 1 ? parts[0] : parts.find((f) => {
                  var _a3, _b2, _c2;
                  return (_c2 = (_b2 = (_a3 = ctx.getContentModel(f)) == null ? void 0 : _a3.getGeometries) == null ? void 0 : _b2.call(_a3, f, contents)) == null ? void 0 : _c2.lines.some((n) => ctx.getPointAndGeometryLineMinimumDistance(p, n) < 5);
                });
                if (content) {
                  setTrimHovering({
                    ...s,
                    content
                  });
                  return;
                }
              } else if (points.length > 0 && direction) {
                const point = ctx.minimumBy(points, (n) => ctx.getTwoPointsDistanceSquare(n, p));
                setHovering({
                  ...s,
                  point,
                  content: ctx.produce(s.content, (draft) => {
                    var _a3, _b2;
                    (_b2 = (_a3 = ctx.getContentModel(s.content)) == null ? void 0 : _a3.extend) == null ? void 0 : _b2.call(_a3, draft, point, contents);
                  })
                });
                return;
              }
            }
          }
          setHovering(void 0);
          setTrimHovering(void 0);
        },
        onKeyDown(e) {
          setShift(e.shiftKey);
        },
        onKeyUp(e) {
          setShift(e.shiftKey);
        },
        reset,
        assistentContents,
        hovering: hovering ? [hovering.path] : trimHovering ? [trimHovering.path] : void 0
      };
    },
    contentSelectable(content, contents) {
      var _a, _b, _c, _d;
      return !content.readonly && !!((_d = (_c = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents)) == null ? void 0 : _c.lines) == null ? void 0 : _d.length);
    },
    icon,
    repeatedly: true
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/fill-style.plugin.tsx
function getModel(ctx) {
  function getGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, /* @__PURE__ */ new Set(), () => {
      const points = [
        { x: content.x, y: content.y },
        { x: content.x + content.width, y: content.y },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x, y: content.y + content.height }
      ];
      return {
        lines: [],
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            points,
            lines: Array.from(ctx.iteratePolygonLines(points))
          }
        ],
        renderingLines: []
      };
    });
  }
  const React = ctx.React;
  return {
    type: "fill style",
    ...ctx.fillModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy);
    },
    render(content, { target, getFillColor, transformColor, getFillPattern }) {
      const options = {
        strokeColor: content.isCurrent ? transformColor(16711680) : void 0,
        strokeWidth: content.isCurrent ? 1 : 0,
        fillColor: getFillColor(content),
        fillOpacity: content.fillOpacity,
        fillPattern: getFillPattern(content)
      };
      return target.renderRect(content.x, content.y, content.width, content.height, options);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!ctx.isFillStyleContent(c)) {
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
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        isCurrent: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.isCurrent === true, setValue: (v) => update((c, draft) => {
          if (ctx.isFillStyleContent(c)) {
            const currentFillStyle = ctx.getFillStyles(contents).find((s) => s.content.isCurrent);
            if (currentFillStyle) {
              const c2 = draft[currentFillStyle.index];
              if (c2 && ctx.isFillStyleContent(c2)) {
                c2.isCurrent = void 0;
              }
            }
            c.isCurrent = v ? true : void 0;
          }
        }) }),
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (ctx.isFillStyleContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (ctx.isFillStyleContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (ctx.isFillStyleContent(c)) {
            c.y = v;
          }
        }) }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.width, setValue: (v) => update((c) => {
          if (ctx.isFillStyleContent(c)) {
            c.width = v;
          }
        }) }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.height, setValue: (v) => update((c) => {
          if (ctx.isFillStyleContent(c)) {
            c.height = v;
          }
        }) }),
        ...ctx.getFillContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, ctx.FillStyleContent, p)
  };
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "5", y: "6", width: "89", height: "39", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("pattern", { id: "fill-style", patternUnits: "userSpaceOnUse", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { d: "M 0 10 L 10 0 M 20 10 L 10 20", strokeWidth: "1", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" })), /* @__PURE__ */ React.createElement("rect", { x: "5", y: "55", width: "89", height: "39", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "url(#fill-style)", stroke: "currentColor" }));
  return {
    name: "create fill style",
    selectCount: 0,
    icon,
    useCommand({ onEnd, type, scale }) {
      const [result, setResult] = React.useState();
      const reset = () => {
        setResult(void 0);
      };
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result);
                }
              }
            });
            reset();
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: "fill style",
              x: p.x,
              y: p.y,
              width: 100 / scale,
              height: 20 / scale,
              fillColor: 0
            });
          }
        },
        assistentContents: result ? [result] : void 0,
        reset
      };
    }
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/cad-editor/plugins/fillet.plugin.tsx
function getCommand(ctx) {
  function getFillets(content1, content2, radius) {
    const result = [];
    if (!contentSelectable(content1) || !contentSelectable(content2)) {
      return result;
    }
    const circles = [];
    if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]);
      if (!line1) return [];
      if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (!line2) return [];
        circles.push(...ctx.getCirclesTangentTo2Lines(line1, line2, radius).map((c) => ({
          center: c,
          foot1: ctx.getPerpendicularPoint(c, line1),
          foot2: ctx.getPerpendicularPoint(c, line2)
        })));
      } else if (isCircleContent(content2) || isArcContent(content2)) {
        circles.push(...ctx.getCirclesTangentToLineAndCircle(line1, content2, radius).map((c) => ({
          center: c,
          foot1: ctx.getPerpendicularPoint(c, line1),
          foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content2)[0]
        })));
      }
    } else if (isCircleContent(content1) || isArcContent(content1)) {
      if (isCircleContent(content2) || isArcContent(content2)) {
        circles.push(...ctx.getCirclesTangentTo2Circles(content1, content2, radius).map((c) => ({
          center: c,
          foot1: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content1)[0],
          foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content2)[0]
        })));
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (!line2) return [];
        circles.push(...ctx.getCirclesTangentToLineAndCircle(line2, content1, radius).map((c) => ({
          center: c,
          foot1: ctx.getPerpendicularPoint(c, line2),
          foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content1)[0]
        })));
      }
    }
    return circles.map(({ foot1, foot2, center: c }) => {
      const angle1 = ctx.radianToAngle(ctx.getTwoPointsRadian(foot1, c));
      const angle2 = ctx.radianToAngle(ctx.getTwoPointsRadian(foot2, c));
      const min = Math.min(angle1, angle2);
      const max = Math.max(angle1, angle2);
      if (max - min < 180) {
        return { ...c, r: radius, startAngle: min, endAngle: max };
      }
      return { ...c, r: radius, startAngle: max, endAngle: min + 360 };
    });
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "9,10 92,10", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "92,10 92,93", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("path", { d: "M 92 60 A 50 50 0 0 0 42 10", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
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
        assistentContents,
        reset
      };
    },
    selectCount: 2,
    contentSelectable,
    selectType: "select part",
    hotkey: "F",
    icon
  };
}
function contentSelectable(content) {
  return isLineContent(content) || isCircleContent(content) || isArcContent(content);
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/geometry-lines.plugin.tsx
function getModel(ctx) {
  const GeometryLinesContent = ctx.and(ctx.BaseContent("geometry lines"), ctx.StrokeFields, ctx.FillFields, {
    lines: [ctx.GeometryLine]
  });
  const refGeometriesCache = new ctx.WeakmapValuesCache();
  function getGeometryLinesGeometries(content) {
    return refGeometriesCache.get(content, [], () => {
      const points = ctx.getGeometryLinesPoints(content.lines);
      const rays = [];
      const endPoints = [];
      for (const line of content.lines) {
        if (!Array.isArray(line) && line.type === "ray") {
          rays.push(line.line);
        }
        const { start, end } = ctx.getGeometryLineStartAndEnd(line);
        if (start && endPoints.every((p) => !ctx.isSamePoint(p, start))) {
          endPoints.push(start);
        }
        if (end && endPoints.every((p) => !ctx.isSamePoint(p, end))) {
          endPoints.push(end);
        }
      }
      const geometries = {
        lines: content.lines,
        points,
        endPoints,
        rays,
        bounding: ctx.getGeometryLinesBounding(content.lines),
        renderingLines: rays.length > 0 ? [] : ctx.dashedPolylineToLines(points, content.dashArray),
        region: rays.length > 0 ? [] : void 0
      };
      if (ctx.hasFill(content)) {
        return {
          ...geometries,
          lines: [],
          regions: [{
            lines: geometries.lines,
            points
          }],
          renderingLines: []
        };
      }
      return geometries;
    });
  }
  return {
    type: "geometry lines",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      for (const line of content.lines) {
        ctx.moveGeometryLine(line, offset);
      }
    },
    rotate(content, center, angle) {
      for (const line of content.lines) {
        ctx.rotateGeometryLine(line, center, angle);
      }
    },
    scale(content, center, sx, sy) {
      ctx.scaleGeometryLines(content.lines, center, sx, sy);
    },
    skew(content, center, sx, sy) {
      ctx.skewGeometryLines(content.lines, center, sx, sy);
    },
    explode(content) {
      return content.lines.map((line) => ctx.geometryLineToContent(line));
    },
    break(content, intersectionPoints) {
      return ctx.breakGeometryLines(content.lines, intersectionPoints).map((lines) => ({ ...content, type: "geometry lines", lines }));
    },
    mirror(content, line, angle) {
      for (const n of content.lines) {
        ctx.mirrorGeometryLine(n, line, angle);
      }
    },
    offset(content, point, distance, _, lineJoin) {
      const newLines = ctx.trimGeometryLinesOffsetResult(ctx.getParallelGeometryLinesByDistancePoint(point, content.lines, distance, lineJoin), point);
      return newLines.map((n) => ctx.geometryLinesToPline(n));
    },
    join(content, target, contents) {
      var _a, _b, _c;
      const line2 = (_c = (_b = (_a = ctx.getContentModel(target)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, target, contents)) == null ? void 0 : _c.lines;
      if (!line2) return;
      const newLines = ctx.mergeGeometryLines(content.lines, line2);
      if (!newLines) return;
      return { ...content, lines: newLines };
    },
    extend(content, point) {
      ctx.extendGeometryLines(content.lines, point);
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { points, rays } = getGeometryLinesGeometries(content);
      return target.renderGroup([
        target.renderPath([points], options),
        ...rays.map((r) => target.renderRay(r.x, r.y, r.angle, { ...options, bidirectional: r.bidirectional }))
      ]);
    },
    getSnapPoints(content) {
      const { endPoints } = getGeometryLinesGeometries(content);
      return ctx.getSnapPointsFromCache(content, () => {
        return endPoints.map((p) => ({ ...p, type: "endpoint" }));
      });
    },
    getGeometries: getGeometryLinesGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isValid: (c, p) => ctx.validate(c, GeometryLinesContent, p),
    reverse(content) {
      const newLines = ctx.reverseGeometryLines(content.lines);
      return { ...content, lines: newLines };
    }
  };
}
function isGeometryLinesContent(content) {
  return content.type === "geometry lines";
}
function getCommand(ctx) {
  const React = ctx.React;
  return [
    {
      name: "create geometry lines",
      useCommand({ type, onEnd, width, height }) {
        const [json, setJson] = React.useState("");
        const reset = () => {
          setJson("");
        };
        return {
          reset,
          subcommand: type === "create geometry lines" ? /* @__PURE__ */ React.createElement("span", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(ctx.StringEditor, { textarea: true, value: json, style: { width: width * 0.7 + "px", height: height * 0.7 + "px" }, setValue: setJson }), /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => {
            if (json) {
              try {
                const lines = JSON.parse(json);
                const result = ctx.validate(lines, [ctx.GeometryLine]);
                if (result === true && lines.length > 0) {
                  const allLines = ctx.getSeparatedGeometryLines(lines);
                  onEnd({
                    updateContents: (contents) => {
                      contents.push(...allLines.map((n) => ({ type: "geometry lines", lines: n })));
                    }
                  });
                } else {
                  console.info(result);
                }
              } catch (error) {
                console.info(error);
              }
            }
          } }, "OK")) : void 0
        };
      },
      selectCount: 0
    }
  ];
}
export {
  getCommand,
  getModel,
  isGeometryLinesContent
};
`,
`// dev/cad-editor/plugins/group.plugin.tsx
function getModel(ctx) {
  const GroupContent = ctx.and(ctx.BaseContent("group"), ctx.ContainerFields, ctx.ClipFields);
  const getRefIds = (content) => ctx.toRefIds(content.contents);
  return {
    type: "group",
    ...ctx.containerModel,
    ...ctx.clipModel,
    move(content, offset) {
      var _a, _b;
      ctx.getContainerMove(content, offset);
      if (content.clip) {
        (_b = (_a = ctx.getContentModel(content.clip.border)) == null ? void 0 : _a.move) == null ? void 0 : _b.call(_a, content.clip.border, offset);
      }
    },
    rotate(content, center, angle, contents) {
      var _a, _b;
      ctx.getContainerRotate(content, center, angle, contents);
      if (content.clip) {
        (_b = (_a = ctx.getContentModel(content.clip.border)) == null ? void 0 : _a.rotate) == null ? void 0 : _b.call(_a, content.clip.border, center, angle, contents);
      }
    },
    scale(content, center, sx, sy, contents) {
      var _a, _b;
      ctx.getContainerScale(content, center, sx, sy, contents);
      if (content.clip) {
        return (_b = (_a = ctx.getContentModel(content.clip.border)) == null ? void 0 : _a.scale) == null ? void 0 : _b.call(_a, content.clip.border, center, sx, sy, contents);
      }
    },
    skew(content, center, sx, sy, contents) {
      var _a, _b;
      ctx.getContainerSkew(content, center, sx, sy, contents);
      if (content.clip) {
        return (_b = (_a = ctx.getContentModel(content.clip.border)) == null ? void 0 : _a.skew) == null ? void 0 : _b.call(_a, content.clip.border, center, sx, sy, contents);
      }
    },
    explode: ctx.getContainerExplode,
    mirror(content, line, angle, contents) {
      var _a, _b;
      ctx.getContainerMirror(content, line, angle, contents);
      if (content.clip) {
        (_b = (_a = ctx.getContentModel(content.clip.border)) == null ? void 0 : _a.mirror) == null ? void 0 : _b.call(_a, content.clip.border, line, angle, contents);
      }
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: ctx.getClipContentEditPoints(content, contents)
        };
      });
    },
    render: (content, renderCtx) => {
      return ctx.renderClipContent(content, ctx.getContainerRender(content, renderCtx), renderCtx);
    },
    renderIfSelected(content, renderCtx) {
      const result = ctx.getContainerRenderIfSelected(content, renderCtx, [content], getRefIds);
      return ctx.renderClipContentIfSelected(content, result, renderCtx);
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: (content, contents) => ctx.getContainerGeometries(content, contents, getRefIds, [content]),
    propertyPanel: (content, update, contents, { acquireContent }) => {
      return {
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
        ...ctx.getClipContentPropertyPanel(content, contents, acquireContent, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, GroupContent, p),
    getRefIds
  };
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.contentIsDeletable(content, contents);
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "73", r: "22", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "93,78 97,48 71,34 49,56 63,82", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "8", width: "50", height: "37", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create group",
    execute({ contents, selected }) {
      const newContent = {
        type: "group",
        contents: contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents))
      };
      ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
      contents.push(newContent);
    },
    contentSelectable,
    hotkey: "G",
    icon
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/cad-editor/plugins/hatch.plugin.tsx
function getModel(ctx) {
  const HatchContent = ctx.and(ctx.BaseContent("hatch"), ctx.FillFields, {
    border: [ctx.GeometryLine],
    holes: ctx.optional([[ctx.GeometryLine]]),
    ref: ctx.optional({
      point: ctx.Position,
      ids: [ctx.ContentRef]
    })
  });
  const getRefIds = (content) => {
    var _a;
    return [...ctx.getFillRefIds(content), ...ctx.toRefIds((_a = content.ref) == null ? void 0 : _a.ids)];
  };
  const refGeometriesCache = new ctx.WeakmapValuesCache();
  function getHatchGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return refGeometriesCache.get(content, refs, () => {
      let hatch = content;
      if (content.ref && content.ref.ids.length > 0) {
        const refContents = content.ref.ids.map((id) => ctx.getReference(id, contents)).filter((d) => !!d && !ctx.shallowEquals(d, content));
        if (refContents.length > 0) {
          const p = content.ref.point;
          const getGeometriesInRange = () => refContents.map((c) => ctx.getContentHatchGeometries(c, contents));
          const border = ctx.getHatchByPosition(p, getGeometriesInRange);
          if (border) {
            const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange);
            hatch = {
              border: border.lines,
              holes: holes == null ? void 0 : holes.holes
            };
          }
        }
      }
      const points = ctx.getGeometryLinesPoints(hatch.border);
      const holesPoints = (hatch.holes || []).map((h) => ctx.getGeometryLinesPoints(h));
      return {
        lines: [],
        border: points,
        holes: holesPoints,
        bounding: ctx.getGeometryLinesBounding(hatch.border),
        renderingLines: [],
        regions: [
          {
            lines: hatch.border,
            points,
            holes: hatch.holes,
            holesPoints
          }
        ]
      };
    });
  }
  const React = ctx.React;
  return {
    type: "hatch",
    ...ctx.fillModel,
    move(content, offset) {
      if (content.ref) {
        ctx.movePoint(content.ref.point, offset);
      }
      for (const line of content.border) {
        ctx.moveGeometryLine(line, offset);
      }
      if (content.holes) {
        for (const hole of content.holes) {
          for (const line of hole) {
            ctx.moveGeometryLine(line, offset);
          }
        }
      }
    },
    rotate(content, center, angle) {
      if (content.ref) {
        ctx.rotatePoint(content.ref.point, center, angle);
      }
      for (const line of content.border) {
        ctx.rotateGeometryLine(line, center, angle);
      }
      if (content.holes) {
        for (const hole of content.holes) {
          for (const line of hole) {
            ctx.rotateGeometryLine(line, center, angle);
          }
        }
      }
    },
    scale(content, center, sx, sy) {
      if (content.ref) {
        ctx.scalePoint(content.ref.point, center, sx, sy);
      }
      ctx.scaleGeometryLines(content.border, center, sx, sy);
      if (content.holes) {
        for (const hole of content.holes) {
          ctx.scaleGeometryLines(hole, center, sx, sy);
        }
      }
    },
    skew(content, center, sx, sy) {
      if (content.ref) {
        ctx.skewPoint(content.ref.point, center, sx, sy);
      }
      ctx.skewGeometryLines(content.border, center, sx, sy);
      if (content.holes) {
        for (const hole of content.holes) {
          ctx.skewGeometryLines(hole, center, sx, sy);
        }
      }
    },
    mirror(content, line, angle) {
      if (content.ref) {
        ctx.mirrorPoint(content.ref.point, line);
      }
      for (const b of content.border) {
        ctx.mirrorGeometryLine(b, line, angle);
      }
      if (content.holes) {
        for (const hole of content.holes) {
          for (const h of hole) {
            ctx.mirrorGeometryLine(h, line, angle);
          }
        }
      }
    },
    join(content, target) {
      var _a;
      if (isHatchContent(target)) {
        const result = (_a = ctx.mergeHatches({ border: content.border, holes: content.holes || [] }, { border: target.border, holes: target.holes || [] })) == null ? void 0 : _a[0];
        if (result) {
          return {
            ...content,
            border: result.border,
            holes: result.holes,
            ref: void 0
          };
        }
      }
      return;
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getFillRenderOptionsFromRenderContext(content, renderCtx);
      const { border, holes } = getHatchGeometries(content, renderCtx.contents);
      return target.renderPath([border, ...holes], options);
    },
    getGeometries: getHatchGeometries,
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const editPoints = [];
        if (content.ref) {
          editPoints.push({
            x: content.ref.point.x,
            y: content.ref.point.y,
            cursor: "move",
            update(c, { cursor, start }) {
              if (!isHatchContent(c) || !c.ref) {
                return;
              }
              c.ref.point.x += cursor.x - start.x;
              c.ref.point.y += cursor.y - start.y;
            }
          });
        }
        return { editPoints };
      });
    },
    propertyPanel(content, update, contents) {
      return {
        ref: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.ref !== void 0, readOnly: content.ref === void 0, setValue: (v) => update((c) => {
          if (isHatchContent(c) && !v) {
            c.ref = void 0;
          }
        }) }),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, HatchContent, p),
    getRefIds,
    updateRefId(content, update) {
      if (content.ref) {
        for (const [i, id] of content.ref.ids.entries()) {
          const newRefId = update(id);
          if (newRefId !== void 0) {
            content.ref.ids[i] = newRefId;
          }
        }
      }
      ctx.updateFillRefIds(content, update);
    },
    deleteRefId(content, ids) {
      if (content.ref) {
        for (const id of ids) {
          const index = content.ref.ids.indexOf(id);
          if (index >= 0) {
            content.ref.ids.splice(index, 1);
          }
        }
      }
      ctx.deleteFillRefIds(content, ids);
    }
  };
}
function isHatchContent(content) {
  return content.type === "hatch";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "1,24 100,24", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "1,72 100,72", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "27,1 27,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "75,0 75,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("pattern", { id: "hatch", patternUnits: "userSpaceOnUse", width: "10", height: "10" }, /* @__PURE__ */ React.createElement("path", { d: "M 0 5 L 5 0 M 10 5 L 5 10", strokeWidth: "1", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" })), /* @__PURE__ */ React.createElement("polygon", { points: "75,43 75,72 27,72 27,24 75,24 75,43", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", fill: "url(#hatch)", stroke: "currentColor" }));
  return [
    {
      name: "create hatch",
      icon,
      useCommand({ onEnd, contents, getContentsInRange, width, height, x, y, rotate, scale }) {
        const [hatch, setHatch] = React.useState();
        const reset = () => {
          setHatch(void 0);
        };
        return {
          onStart: () => {
            onEnd({
              updateContents: (contents2) => {
                if (hatch) {
                  contents2.push(hatch);
                }
              }
            });
          },
          onMove(p) {
            const lineSegment = ctx.getRayTransformedLineSegment({ x: p.x, y: p.y, angle: 0 }, width, height, { x, y, scale, rotate });
            if (!lineSegment) return;
            const getGeometriesInRange = (region) => getContentsInRange(region).map((c) => ctx.getContentHatchGeometries(c, contents));
            const border = ctx.getHatchByPosition(p, (line) => getGeometriesInRange(ctx.getGeometryLineBoundingFromCache(line)), lineSegment[1].x);
            if (border) {
              const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange);
              setHatch({
                type: "hatch",
                border: border.lines,
                holes: holes == null ? void 0 : holes.holes,
                ref: {
                  point: p,
                  ids: [...border.ids, ...(holes == null ? void 0 : holes.ids) || []]
                }
              });
            } else {
              setHatch(void 0);
            }
          },
          assistentContents: hatch ? [hatch] : void 0,
          reset
        };
      },
      selectCount: 0
    }
  ];
}
export {
  getCommand,
  getModel,
  isHatchContent
};
`,
`// dev/cad-editor/plugins/image.plugin.tsx
function getModel(ctx) {
  const ImageContent = ctx.and(ctx.BaseContent("image"), ctx.Image, ctx.ClipFields);
  function getImageGeometries(content) {
    return ctx.getGeometriesFromCache(content, /* @__PURE__ */ new Set(), () => {
      const points = [
        { x: content.x, y: content.y + content.height },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x + content.width, y: content.y },
        { x: content.x, y: content.y }
      ];
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines: [],
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
    ...ctx.clipModel,
    move(content, offset) {
      var _a, _b;
      ctx.movePoint(content, offset);
      if (content.clip) {
        (_b = (_a = ctx.getContentModel(content.clip.border)) == null ? void 0 : _a.move) == null ? void 0 : _b.call(_a, content.clip.border, offset);
      }
    },
    scale(content, center, sx, sy, contents) {
      var _a, _b;
      ctx.scalePoint(content, center, sx, sy);
      content.width *= sx;
      content.height *= sy;
      if (content.clip) {
        return (_b = (_a = ctx.getContentModel(content.clip.border)) == null ? void 0 : _a.scale) == null ? void 0 : _b.call(_a, content.clip.border, center, sx, sy, contents);
      }
    },
    getEditPoints(content, contents) {
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
            },
            ...ctx.getClipContentEditPoints(content, contents)
          ]
        };
      });
    },
    render(content, renderCtx) {
      const { target, isHoveringOrSelected, transformStrokeWidth } = renderCtx;
      const strokeWidth = transformStrokeWidth(0);
      const fuzzy = isHoveringOrSelected && strokeWidth !== 0;
      let image = target.renderImage(content.url, content.x, content.y, content.width, content.height);
      image = ctx.renderClipContent(content, image, renderCtx);
      if (fuzzy) {
        return target.renderGroup([
          target.renderRect(content.x, content.y, content.width, content.height, {
            strokeWidth,
            ...ctx.fuzzyStyle
          }),
          image
        ]);
      }
      return image;
    },
    renderIfSelected(content, renderCtx) {
      const { color, target, strokeWidth } = renderCtx;
      const result = target.renderRect(content.x, content.y, content.width, content.height, { strokeColor: color, dashArray: [4], strokeWidth });
      return ctx.renderClipContentIfSelected(content, result, renderCtx);
    },
    getOperatorRenderPosition(content) {
      return content;
    },
    getGeometries: getImageGeometries,
    propertyPanel(content, update, contents, { acquirePoint, acquireContent }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isImageContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isImageContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isImageContent(c)) {
            c.y = v;
          }
        }) }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.width, setValue: (v) => update((c) => {
          if (isImageContent(c)) {
            c.width = v;
          }
        }) }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.height, setValue: (v) => update((c) => {
          if (isImageContent(c)) {
            c.height = v;
          }
        }) }),
        url: /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.url, setValue: (v) => update((c) => {
          if (isImageContent(c)) {
            c.url = v;
          }
        }) }),
        ...ctx.getClipContentPropertyPanel(content, contents, acquireContent, update)
      };
    },
    editPanel(content, _scale, update, _contents, cancel) {
      const y = 100;
      return /* @__PURE__ */ React.createElement(
        ctx.ImageEditor,
        {
          style: {
            zIndex: 11
          },
          y,
          onCancel: cancel,
          src: content.url,
          width: window.innerWidth,
          height: window.innerHeight - y,
          onCpmplete: (url, width, height) => {
            update((c) => {
              if (isImageContent(c)) {
                c.url = url;
                c.width = width;
                c.height = height;
                cancel();
              }
            });
          }
        }
      );
    },
    isValid: (c, p) => ctx.validate(c, ImageContent, p)
  };
}
function isImageContent(content) {
  return content.type === "image";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "100,100 100,50 66,67 28,11 0,36 0,100", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "70", cy: "22", r: "13", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "create image",
    useCommand({ onEnd, type }) {
      const { image, onClick, onMove, input, reset } = ctx.useImageClickCreate(
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
        assistentContents,
        reset
      };
    },
    selectCount: 0,
    hotkey: "I",
    icon
  };
}
export {
  getCommand,
  getModel,
  isImageContent
};
`,
`// dev/cad-editor/plugins/intersection.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "32", cy: "50", r: "32", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "65", cy: "50", r: "32", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("pattern", { id: "intersection", patternUnits: "userSpaceOnUse", width: "10", height: "10" }, /* @__PURE__ */ React.createElement("path", { d: "M 0 5 L 5 0 M 10 5 L 5 10", strokeWidth: "1", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" })), /* @__PURE__ */ React.createElement("path", { d: "M 49 78 L 46 77 L 44 75 L 42 73 L 40 71 L 38 69 L 37 66 L 36 64 L 34 61 L 34 58 L 33 56 L 33 53 L 32 50 L 33 47 L 33 44 L 34 42 L 34 39 L 36 36 L 37 34 L 38 31 L 40 29 L 42 27 L 44 25 L 46 23 L 49 22 L 49 22 L 51 23 L 53 25 L 55 27 L 57 29 L 59 31 L 61 34 L 62 36 L 63 39 L 64 42 L 64 44 L 65 47 L 65 50 L 65 53 L 64 56 L 64 58 L 63 61 L 62 64 L 61 66 L 59 69 L 57 71 L 55 73 L 53 75 L 51 77 L 49 78", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", fill: "url(#intersection)", stroke: "currentColor", fillRule: "evenodd" }));
  return {
    name: "intersection",
    execute({ contents, selected }) {
      var _a, _b, _c, _d;
      const first = contents[selected[0][0]];
      if (!first) return;
      const firstGeometries = (_b = (_a = ctx.getContentModel(first)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, first, contents);
      if (!firstGeometries) return;
      const second = contents[selected[1][0]];
      if (!second) return;
      const secondGeometries = (_d = (_c = ctx.getContentModel(second)) == null ? void 0 : _c.getGeometries) == null ? void 0 : _d.call(_c, second, contents);
      if (!secondGeometries) return;
      if (firstGeometries.regions && secondGeometries.regions) {
        const result = firstGeometries.regions.map((r) => ctx.getHatchesIntersection({ border: r.lines, holes: r.holes || [] }, (secondGeometries.regions || []).map((g) => ({ border: g.lines, holes: g.holes || [] })))).flat();
        ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
        contents.push(...result.map((r) => ({ ...first, type: "hatch", border: r.border, holes: r.holes, ref: void 0 })));
        return;
      }
      let points = ctx.deduplicatePosition(ctx.getIntersectionPoints(first, second, contents));
      const lines = Array.from(ctx.iterateGeometryLinesIntersectionLines(firstGeometries.lines, secondGeometries.lines));
      const newContents = [];
      if (lines.length > 0) {
        points = points.filter((p) => !ctx.pointIsOnGeometryLines(p, lines));
        const allLines = ctx.getSeparatedGeometryLines(lines);
        newContents.push(...allLines.map((n) => ({ type: "geometry lines", lines: n })));
      }
      newContents.push(...points.map((n) => ({ type: "point", x: n.x, y: n.y })));
      if (newContents.length > 0) {
        ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
        contents.push(...newContents);
      }
    },
    contentSelectable(content, contents) {
      return ctx.contentIsDeletable(content, contents);
    },
    selectCount: 2,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/join.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "0,49 100,49", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "51,49 76,32 76,64", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "54,49 27,32 28,65", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "join",
    execute({ contents, selected }) {
      const source = new Set(contents.filter((content, index) => {
        var _a, _b;
        return !!content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true);
      }));
      const newContents = ctx.mergeItems(Array.from(source), (item1, item2) => {
        var _a, _b;
        return (_b = (_a = ctx.getContentModel(item1)) == null ? void 0 : _a.join) == null ? void 0 : _b.call(_a, item1, item2, contents);
      });
      ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
      contents.push(...newContents);
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content);
      return (model == null ? void 0 : model.join) !== void 0 && ctx.contentIsDeletable(content, contents);
    },
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/lead.plugin.tsx
function getModel(ctx) {
  const LeadContent = ctx.and(ctx.BaseContent("lead"), ctx.StrokeFields, ctx.ArrowFields, ctx.TextFields, {
    ref: ctx.optional(ctx.ContentRef),
    points: [ctx.Position],
    text: ctx.string,
    toleranceSymbolId: ctx.optional(ctx.number),
    bordered: ctx.optional(ctx.boolean)
  });
  const getRefIds = (content) => [...ctx.getStrokeRefIds(content), ...ctx.toRefId(content.ref)];
  const leadCache = new ctx.WeakmapValuesCache();
  function getLeadGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return leadCache.get(content, refs, () => {
      var _a, _b, _c;
      const ref = ctx.getReference(content.ref, contents, (c) => !ctx.shallowEquals(c, content));
      let p0 = content.points[0];
      let line;
      if (ref && content.points.length > 1) {
        const lines2 = (_c = (_b = (_a = ctx.getContentModel(ref)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, ref, contents)) == null ? void 0 : _c.lines;
        if (lines2) {
          const p = ctx.getPerpendicularPointToGeometryLines(content.points[1], lines2);
          if (p) {
            p0 = p.point;
            line = p.line;
          }
        }
      }
      let points;
      let arrow;
      if (content.points.length > 1) {
        const arrowPoints = ctx.getArrowPoints(content.points[1], p0, content);
        arrow = arrowPoints.arrowPoints;
        points = [arrowPoints.endPoint, ...content.points.slice(1)];
      } else {
        points = [];
      }
      let extendLine;
      if (line) {
        const { start, end } = ctx.getGeometryLineStartAndEnd(line);
        if (start && (!end || ctx.getTwoPointsDistance(start, p0) < ctx.getTwoPointsDistance(end, p0))) {
          const param0 = ctx.getGeometryLineParamAtPoint(p0, line, true);
          line = ctx.getPartOfGeometryLine(param0, 0, line);
          const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin);
          if (marginParam !== void 0) {
            extendLine = ctx.getPartOfGeometryLine(marginParam, 1, line);
          }
        } else if (end && (!start || ctx.getTwoPointsDistance(end, p0) < ctx.getTwoPointsDistance(start, p0))) {
          const param0 = ctx.getGeometryLineParamAtPoint(p0, line);
          line = ctx.getPartOfGeometryLine(param0, 1, line);
          const marginParam = ctx.getGeometryLineParamByLength(line, -ctx.dimensionStyle.margin);
          if (marginParam !== void 0) {
            extendLine = ctx.getPartOfGeometryLine(marginParam, 1, line);
          }
        }
      }
      const size = ctx.getTextSize(ctx.getTextStyleFont(content), content.text);
      if (!size) {
        throw "not supported";
      }
      const previous = content.points[content.points.length - 2];
      const last = content.points[content.points.length - 1];
      const right = !previous || previous.x <= last.x;
      const padding = content.fontSize / 4;
      const toleranceSymbol = content.toleranceSymbolId !== void 0 ? toleranceSymbols[content.toleranceSymbolId] : void 0;
      const width = (size.width + content.fontSize * (toleranceSymbol ? 1 : 0) + padding * (toleranceSymbol ? 4 : 2)) * (right ? 1 : -1);
      const height = Math.max(size.height, content.fontSize) / 2 + padding;
      const textPoints = [
        { x: last.x, y: last.y - height },
        { x: last.x + width, y: last.y - height },
        { x: last.x + width, y: last.y + height },
        { x: last.x, y: last.y + height }
      ];
      const lines = Array.from(ctx.iteratePolylineLines(points));
      const renderingLines = ctx.dashedPolylineToLines(points, content.dashArray);
      if (extendLine) {
        lines.push(extendLine);
        renderingLines.push(...ctx.dashedPolylineToLines(ctx.getGeometryLinesPoints([extendLine])));
      }
      return {
        lines,
        first: p0,
        last,
        right,
        padding,
        bounding: ctx.mergeBoundings([ctx.getGeometryLinesBounding(lines), ctx.getPointsBounding(textPoints)]),
        regions: [
          {
            points: textPoints,
            lines: Array.from(ctx.iteratePolygonLines(textPoints))
          },
          ...arrow ? [{
            points: arrow,
            lines: Array.from(ctx.iteratePolygonLines(arrow))
          }] : []
        ],
        renderingLines
      };
    });
  }
  const React = ctx.React;
  return {
    type: "lead",
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    ...ctx.textModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point, offset);
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point, center, angle);
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point, center, sx, sy);
      }
      content.fontSize *= Math.abs(sx);
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    render(content, renderCtx) {
      const { options, target, contents, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { regions, renderingLines, last, right, padding } = getLeadGeometriesFromCache(content, contents);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options));
      }
      if (regions && regions.length > 1) {
        children.push(target.renderPolygon(regions[1].points, fillOptions));
      }
      if (content.bordered && regions && regions.length > 0) {
        children.push(target.renderPolygon(regions[0].points, options));
      }
      const textStyleContent = ctx.getTextStyleContent(content, contents);
      const color = renderCtx.transformColor(textStyleContent.color);
      let cacheKey;
      if (renderCtx.isAssistence) {
        cacheKey = ctx.assistentTextCache.get(content.text, textStyleContent.fontSize, textStyleContent.color);
      }
      if (!cacheKey) {
        cacheKey = content;
      }
      let textX = last.x;
      const toleranceSymbol = content.toleranceSymbolId !== void 0 ? toleranceSymbols[content.toleranceSymbolId] : void 0;
      if (toleranceSymbol) {
        children.push(target.renderGroup([
          toleranceSymbol(target, textStyleContent.fontSize, options)
        ], { translate: { x: last.x + textStyleContent.fontSize * (right ? 0 : -1) + padding * (right ? 1 : -1), y: last.y - textStyleContent.fontSize / 2 } }));
        textX += (textStyleContent.fontSize + padding * 2) * (right ? 1 : -1);
        if (content.bordered && regions && regions.length > 0) {
          children.push(target.renderPolyline([{ x: textX, y: regions[0].points[0].y }, { x: textX, y: regions[0].points[2].y }], options));
        }
      }
      textX += padding * (right ? 1 : -1);
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(color, renderCtx);
      children.push(target.renderText(textX, last.y, content.text, color, textStyleContent.fontSize, textStyleContent.fontFamily, { cacheKey, ...textOptions, textBaseline: "middle", textAlign: right ? "left" : "right" }));
      return target.renderGroup(children);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const geometries = getLeadGeometriesFromCache(content, contents);
        return {
          editPoints: content.points.map((p, i) => {
            if (i === 0) {
              p = geometries.first;
            }
            return {
              ...p,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isLeadContent(c)) {
                  return;
                }
                c.points[i].x += cursor.x - start.x;
                c.points[i].y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            };
          })
        };
      });
    },
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const geometries = getLeadGeometriesFromCache(content, contents);
        return content.points.map((p, i) => {
          if (i === 0) {
            p = geometries.first;
          }
          return { ...p, type: "endpoint" };
        });
      });
    },
    getGeometries: getLeadGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      var _a;
      return {
        ref: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.ref !== void 0, readOnly: content.ref === void 0, setValue: (v) => update((c) => {
            if (isLeadContent(c) && !v) {
              c.ref = void 0;
            }
          }) }),
          typeof content.ref === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref, setValue: (v) => update((c) => {
            if (isLeadContent(c)) {
              c.ref = v;
            }
          }) }) : void 0
        ],
        points: /* @__PURE__ */ React.createElement(
          ctx.ArrayEditor,
          {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
              if (isLeadContent(c)) {
                v(c);
              }
            })),
            items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
              ctx.ObjectEditor,
              {
                inline: true,
                properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isLeadContent(c)) {
                      c.points[i].x = p.x, c.points[i].y = p.y;
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.x, setValue: (v) => update((c) => {
                    if (isLeadContent(c)) {
                      c.points[i].x = v;
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.y, setValue: (v) => update((c) => {
                    if (isLeadContent(c)) {
                      c.points[i].y = v;
                    }
                  }) })
                }
              }
            ))
          }
        ),
        text: /* @__PURE__ */ React.createElement(ctx.StringEditor, { textarea: true, value: content.text, setValue: (v) => update((c) => {
          if (isLeadContent(c)) {
            c.text = v;
          }
        }) }),
        toleranceSymbolId: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.toleranceSymbolId !== void 0, setValue: (v) => update((c) => {
            if (isLeadContent(c)) {
              c.toleranceSymbolId = v ? 0 : void 0;
            }
          }) }),
          content.toleranceSymbolId !== void 0 ? /* @__PURE__ */ React.createElement(
            ctx.EnumEditor,
            {
              enums: toleranceSymbols.map((_, i) => i),
              enumTitles: toleranceSymbols.map((s) => ctx.reactSvgRenderTarget.renderResult([s(ctx.reactSvgRenderTarget, 13)], 13, 13)),
              value: content.toleranceSymbolId,
              setValue: (v) => update((c) => {
                if (isLeadContent(c)) {
                  c.toleranceSymbolId = v;
                }
              })
            }
          ) : void 0
        ],
        bordered: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: (_a = content.bordered) != null ? _a : false, setValue: (v) => update((c) => {
          if (isLeadContent(c)) {
            c.bordered = v;
          }
        }) }),
        ...ctx.getTextContentPropertyPanel(content, update, contents),
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    editPanel(content, scale, update, contents, cancel, transformPosition) {
      const p = transformPosition(content.points[content.points.length - 1]);
      const textStyleContent = ctx.getTextStyleContent(content, contents);
      const fontSize = textStyleContent.fontSize * scale;
      return /* @__PURE__ */ React.createElement(
        ctx.StringEditor,
        {
          style: {
            zIndex: 10,
            position: "absolute",
            left: \`\${p.x - 1}px\`,
            top: \`\${p.y - fontSize - 1}px\`,
            fontSize: \`\${fontSize}px\`,
            fontFamily: content.fontFamily,
            color: ctx.getColorString(content.color),
            padding: "0px"
          },
          textarea: true,
          autoFocus: true,
          onCancel: cancel,
          value: content.text,
          setValue: (v) => {
            update((c) => {
              if (isLeadContent(c)) {
                c.text = v;
              }
            });
          }
        }
      );
    },
    isValid: (c, p) => ctx.validate(c, LeadContent, p),
    getRefIds,
    updateRefId(content, update) {
      if (content.ref !== void 0) {
        const newRefId = update(content.ref);
        if (newRefId !== void 0) {
          content.ref = newRefId;
        }
      }
      ctx.updateStrokeRefIds(content, update);
    },
    deleteRefId(content, ids) {
      if (content.ref && ids.includes(content.ref)) {
        content.ref = void 0;
      }
      ctx.deleteStrokeRefIds(content, ids);
    }
  };
}
function isLeadContent(content) {
  return content.type === "lead";
}
var toleranceSymbols = [
  (target, size, options) => target.renderPolyline([{ x: 0, y: size * 0.5 }, { x: size, y: size * 0.5 }], options),
  (target, size, options) => target.renderPolygon([{ x: 0, y: size }, { x: size * 0.7, y: size }, { x: size, y: 0 }, { x: size * 0.3, y: 0 }], options),
  (target, size, options) => target.renderCircle(size * 0.5, size * 0.5, size * 0.48, options),
  (target, size, options) => target.renderGroup([
    target.renderCircle(size * 0.5, size * 0.5, size * 0.25, options),
    target.renderPolyline([{ x: 0, y: size }, { x: size * 0.4, y: 0 }], options),
    target.renderPolyline([{ x: size, y: 0 }, { x: size * 0.6, y: size }], options)
  ]),
  (target, size, options) => target.renderArc(size * 0.5, size * 0.7, size * 0.48, -180, 0, options),
  (target, size, options) => target.renderArc(size * 0.5, size * 0.7, size * 0.48, -180, 0, { ...options, closed: true }),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: 0, y: size }, { x: size * 0.4, y: 0 }], options),
    target.renderPolyline([{ x: size, y: 0 }, { x: size * 0.6, y: size }], options)
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: 0, y: size }, { x: size, y: size }], options),
    target.renderPolyline([{ x: size * 0.5, y: 0 }, { x: size * 0.5, y: size }], options)
  ]),
  (target, size, options) => target.renderPolyline([{ x: size, y: size }, { x: 0, y: size }, { x: size, y: 0 }], options),
  (target, size, options) => target.renderGroup([
    target.renderCircle(size * 0.5, size * 0.5, size * 0.25, options),
    target.renderPolyline([{ x: size * 0.5, y: 0 }, { x: size * 0.5, y: size }], options),
    target.renderPolyline([{ x: 0, y: size * 0.5 }, { x: size, y: size * 0.5 }], options)
  ]),
  (target, size, options) => target.renderGroup([
    target.renderCircle(size * 0.5, size * 0.5, size * 0.25, options),
    target.renderCircle(size * 0.5, size * 0.5, size * 0.45, options)
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: 0, y: size * 0.5 }, { x: size, y: size * 0.5 }], options),
    target.renderPolyline([{ x: size * 0.25, y: size * 0.25 }, { x: size * 0.75, y: size * 0.25 }], options),
    target.renderPolyline([{ x: size * 0.25, y: size * 0.75 }, { x: size * 0.75, y: size * 0.75 }], options)
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: size * 0.2, y: size }, { x: size * 0.8, y: 0 }], options),
    target.renderPolyline([{ x: size * 0.35, y: size * 0.4 }, { x: size * 0.8, y: 0 }, { x: size * 0.65, y: size * 0.55 }], options)
  ]),
  (target, size, options) => target.renderGroup([
    target.renderPolyline([{ x: size * 0.4, y: 0 }, { x: 0, y: size }, { x: size * 0.6, y: size }, { x: size, y: 0 }], options),
    target.renderPolyline([{ x: 0, y: size * 0.4 }, { x: size * 0.4, y: 0 }, { x: size * 0.35, y: size * 0.55 }], options),
    target.renderPolyline([{ x: size * 0.6, y: size * 0.4 }, { x: size, y: 0 }, { x: size * 0.95, y: size * 0.55 }], options)
  ])
];
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "47,4 96,4", strokeWidth: "8", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "71,4 71,54", strokeWidth: "8", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "46,29 5,92", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "0,100 12,62 30,73", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "create lead",
    icon,
    useCommand({ onEnd, type, scale, textStyleId, transformPosition, contents }) {
      const [lead, setLead] = React.useState();
      const [editText, setEditText] = React.useState(false);
      let message = "";
      if (type && !editText) {
        message = "press Enter to end";
      }
      const { input, clearText, setCursorPosition, setInputPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === "Enter") {
          if (text) {
            clearText();
          } else if (lead) {
            setEditText(true);
            setLead(ctx.produce(lead, (draft) => {
              draft.text = "";
              draft.points.splice(draft.points.length - 1, 1);
            }));
            e.preventDefault();
          }
        }
      } : void 0);
      const reset = () => {
        setLead(void 0);
        resetInput();
        setEditText(false);
      };
      const assistentContents = [];
      let panel;
      if (type) {
        if (lead) {
          assistentContents.push(lead);
          if (editText) {
            const last = lead.points[lead.points.length - 1];
            const p = transformPosition(last);
            const textStyleContent = ctx.getTextStyleContent(lead, contents);
            const fontSize = textStyleContent.fontSize * scale;
            panel = /* @__PURE__ */ React.createElement(
              ctx.StringEditor,
              {
                style: {
                  zIndex: 10,
                  position: "absolute",
                  left: \`\${p.x - 1}px\`,
                  top: \`\${p.y - fontSize - 1}px\`,
                  fontSize: \`\${fontSize}px\`,
                  fontFamily: lead.fontFamily,
                  color: ctx.getColorString(lead.color),
                  padding: "0px"
                },
                textarea: true,
                autoFocus: true,
                onCancel: reset,
                value: lead.text,
                setValue: (v) => {
                  setLead(ctx.produce(lead, (draft) => {
                    draft.text = v;
                  }));
                }
              }
            );
          }
        }
      }
      return {
        input,
        onStart: (p, target) => {
          if (!type) return;
          if (!lead) {
            setLead({
              type: "lead",
              text: "abc",
              textStyleId,
              color: 0,
              fontSize: 16 / scale,
              fontFamily: "monospace",
              points: [p, p],
              ref: target == null ? void 0 : target.id
            });
          } else if (editText) {
            onEnd({
              updateContents: (contents2) => contents2.push(lead)
            });
            reset();
          } else {
            const last = lead.points[lead.points.length - 1];
            setLead(ctx.produce(lead, (draft) => {
              draft.points.push(last);
            }));
          }
        },
        onMove(p, viewportPosition) {
          if (!type) return;
          if (editText) return;
          setInputPosition(viewportPosition || p);
          setCursorPosition(p);
          if (lead) {
            setLead(ctx.produce(lead, (draft) => {
              draft.points[lead.points.length - 1] = p;
            }));
          }
        },
        assistentContents,
        reset,
        panel
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel,
  isLeadContent
};
`,
`// dev/cad-editor/plugins/light.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "50", cy: "50", r: "30", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "50,20 50,0", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "29,29 15,15", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "20,50 0,50", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "29,71 15,85", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "50,80 50,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "71,29 85,15", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "71,71 85,85", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "80,50 100,50", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "light",
    useCommand({ type, getContentsInRange, contents }) {
      const [startPosition, setStartPosition] = React.useState();
      const [path, setPath] = React.useState();
      const reset = () => {
        setStartPosition(void 0);
        setPath(void 0);
      };
      const assistentContents = [];
      if (path) {
        assistentContents.push({ type: "geometry lines", lines: path, strokeColor: 16711680 });
      }
      return {
        onStart(s) {
          if (!type) return;
          setStartPosition(s);
        },
        reset,
        onMove(p) {
          if (!type) return;
          if (!startPosition) return;
          setPath(ctx.getLightPath(
            { x: startPosition.x, y: startPosition.y, angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p, startPosition)) },
            (line) => {
              var _a, _b;
              const result = [];
              const region = ctx.getGeometryLineBoundingFromCache(line);
              for (const content of getContentsInRange(region)) {
                if (content) {
                  const geometries = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents);
                  if (geometries) {
                    result.push(geometries);
                  }
                }
              }
              return result;
            }
          ));
        },
        assistentContents
      };
    },
    selectCount: 0,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/line-polyline.plugin.tsx
function getModel(ctx) {
  const LineContent = ctx.and(ctx.BaseContent(ctx.or("line", "polyline")), ctx.StrokeFields, ctx.FillFields, {
    points: ctx.minItems(2, [ctx.Position])
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getPolylineGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      const lines = Array.from(ctx.iteratePolylineLines(content.points));
      return {
        lines,
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(content.points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points: content.points
          }
        ] : void 0
      };
    });
  }
  const React = ctx.React;
  const lineModel = {
    type: "line",
    ...ctx.strokeModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point, offset);
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point, center, angle);
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point, center, sx, sy);
      }
    },
    skew(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.skewPoint(point, center, sx, sy);
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    break(content, intersectionPoints, contents) {
      const { lines } = getPolylineGeometries(content, contents);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    offset(content, point, distance, contents) {
      const { lines } = getPolylineGeometries(content, contents);
      if (!distance) {
        distance = Math.min(...lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      const index = ctx.getLinesOffsetDirection(point, lines);
      const points = ctx.getParallelPolylineByDistance(lines, distance, index);
      return ctx.trimOffsetResult(points, point, false, contents).map((p) => ctx.produce(content, (d) => {
        d.points = p;
      }));
    },
    join(content, target, contents) {
      if (isLineContent(target) || isPolyLineContent(target)) {
        const lines = [
          ...getPolylineGeometries(content, contents).lines.map((n) => ({ type: "line", points: [...n] })),
          ...getPolylineGeometries(target, contents).lines.map((n) => ({ type: "line", points: [...n] }))
        ];
        ctx.mergePolylines(lines);
        if (lines.length === 1) {
          return {
            ...content,
            points: lines[0].points
          };
        }
      }
      if (isArcContent(target)) {
        const newLines = ctx.mergeGeometryLines([{ type: "arc", curve: target }], getPolylineGeometries(content, contents).lines);
        if (newLines) {
          return ctx.geometryLinesToPline(newLines);
        }
      }
      return;
    },
    extend(content, point, contents) {
      const { lines } = getPolylineGeometries(content, contents);
      if (ctx.pointIsOnRay(point, { ...lines[0][0], angle: ctx.radianToAngle(ctx.getTwoPointsRadian(lines[0][0], lines[0][1])) })) {
        content.points[0] = point;
      } else {
        content.points[content.points.length - 1] = point;
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      return target.renderPolyline(content.points, options);
    },
    getOperatorRenderPosition(content) {
      return content.points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isLineContent) }));
    },
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getPolylineGeometries(content, contents);
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: /* @__PURE__ */ React.createElement(
          ctx.ArrayEditor,
          {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
              if (isLineContent(c)) {
                v(c);
              }
            })),
            items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
              ctx.ObjectEditor,
              {
                inline: true,
                properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isLineContent(c)) {
                      c.points[i].x = p.x, c.points[i].y = p.y;
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.x, setValue: (v) => update((c) => {
                    if (isLineContent(c)) {
                      c.points[i].x = v;
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.y, setValue: (v) => update((c) => {
                    if (isLineContent(c)) {
                      c.points[i].y = v;
                    }
                  }) })
                }
              }
            ))
          }
        ),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, LineContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse()
    })
  };
  return [
    lineModel,
    {
      ...lineModel,
      type: "polyline",
      ...ctx.fillModel,
      explode(content, contents) {
        const { lines } = getPolylineGeometries(content, contents);
        return lines.map((line) => ({ type: "line", points: line }));
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
        return target.renderPolyline(content.points, options);
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolyLineContent) }));
      },
      canSelectPart: true,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          points: /* @__PURE__ */ React.createElement(
            ctx.ArrayEditor,
            {
              inline: true,
              ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
                if (isPolyLineContent(c)) {
                  v(c);
                }
              })),
              items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
                ctx.ObjectEditor,
                {
                  inline: true,
                  properties: {
                    from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                      if (isPolyLineContent(c)) {
                        c.points[i].x = p.x, c.points[i].y = p.y;
                      }
                    })) }, "canvas"),
                    x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.x, setValue: (v) => update((c) => {
                      if (isPolyLineContent(c)) {
                        c.points[i].x = v;
                      }
                    }) }),
                    y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.y, setValue: (v) => update((c) => {
                      if (isPolyLineContent(c)) {
                        c.points[i].y = v;
                      }
                    }) })
                  }
                }
              ))
            }
          ),
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getFillContentPropertyPanel(content, update, contents)
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
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "10", cy: "87", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }), /* @__PURE__ */ React.createElement("circle", { cx: "87", cy: "9", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }), /* @__PURE__ */ React.createElement("polyline", { points: "10,87 87,9", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "12,86 38,24 62,64 88,13", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return [
    {
      name: "create line",
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { line, onClick, onMove, input, inputMode, lastPosition, reset } = ctx.useLineClickCreate(
          type === "create line",
          (c) => onEnd({
            updateContents: (contents) => contents.push(...Array.from(ctx.iteratePolylineLines(c)).map((line2) => ({ points: line2, strokeStyleId, fillStyleId, type: "line" })))
          })
        );
        const assistentContents = [];
        if (line && line.length > 1) {
          const start = line[line.length - 2];
          const end = line[line.length - 1];
          const r = ctx.getTwoPointsDistance(start, end);
          const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, start));
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
            ...ctx.getAssistentText(
              r.toFixed(2),
              16 / scale,
              (start.x + end.x) / 2 - 20,
              (start.y + end.y) / 2 + 4,
              inputMode === "length" ? 16711680 : 16764108
            ),
            ...ctx.getAssistentText(
              \`\${angle.toFixed(1)}\\xB0\`,
              16 / scale,
              end.x + 10,
              end.y - 10,
              inputMode === "angle" ? 16711680 : 16764108
            )
          );
        }
        if (line) {
          for (const lineSegment of ctx.iteratePolylineLines(line)) {
            assistentContents.push({ points: lineSegment, strokeStyleId, fillStyleId, type: "line" });
          }
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition,
          reset
        };
      },
      selectCount: 0,
      hotkey: "L",
      icon: icon1
    },
    {
      name: "create polyline",
      useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
        const { line, onClick, onMove, input, inputMode, lastPosition, reset, positions } = ctx.useLineClickCreate(
          type === "create polyline",
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, strokeStyleId, fillStyleId, type: "polyline" })
          })
        );
        const assistentContents = [];
        if (line && line.length > 1) {
          const start = line[line.length - 2];
          const end = line[line.length - 1];
          const r = ctx.getTwoPointsDistance(start, end);
          const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, start));
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
            ...ctx.getAssistentText(
              r.toFixed(2),
              16 / scale,
              (start.x + end.x) / 2 - 20,
              (start.y + end.y) / 2 + 4,
              inputMode === "length" ? 16711680 : 16764108
            ),
            ...ctx.getAssistentText(
              \`\${angle.toFixed(1)}\\xB0\`,
              16 / scale,
              end.x + 10,
              end.y - 10,
              inputMode === "angle" ? 16711680 : 16764108
            )
          );
        }
        if (line) {
          assistentContents.push({ points: line, strokeStyleId, fillStyleId, type: "polyline" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition,
          reset,
          subcommand: type === "create polyline" && positions.length > 2 ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => {
                onEnd({
                  updateContents: (contents) => contents.push({ points: positions, type: "polygon" })
                });
                reset();
              },
              style: { position: "relative" }
            },
            "close"
          )) : void 0
        };
      },
      selectCount: 0,
      hotkey: "PL",
      icon: icon2
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
`// dev/cad-editor/plugins/linear-dimension.plugin.tsx
function getModel(ctx) {
  const LinearDimensionContent = ctx.and(ctx.BaseContent("linear dimension"), ctx.StrokeFields, ctx.ArrowFields, ctx.LinearDimension, {
    ref1: ctx.optional(ctx.PositionRef),
    ref2: ctx.optional(ctx.PositionRef)
  });
  const getRefIds = (content) => {
    var _a, _b;
    return [...ctx.getStrokeRefIds(content), ...ctx.toRefIds([(_a = content.ref1) == null ? void 0 : _a.id, (_b = content.ref2) == null ? void 0 : _b.id])];
  };
  const linearDimensionCache = new ctx.WeakmapValuesCache();
  const getLinearDimensionPositions = (content, contents) => {
    var _a, _b;
    const p1 = (_a = ctx.getRefPosition(content.ref1, contents, [content])) != null ? _a : content.p1;
    const p2 = (_b = ctx.getRefPosition(content.ref2, contents, [content])) != null ? _b : content.p2;
    return { p1, p2 };
  };
  function getLinearDimensionGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return linearDimensionCache.get(content, refs, () => {
      var _a, _b;
      const { p1, p2 } = getLinearDimensionPositions(content, contents);
      return ctx.getLinearDimensionGeometries({ ...content, p1, p2 }, {
        arrowAngle: (_a = content.arrowAngle) != null ? _a : ctx.dimensionStyle.arrowAngle,
        arrowSize: (_b = content.arrowSize) != null ? _b : ctx.dimensionStyle.arrowSize,
        margin: ctx.dimensionStyle.margin
      }, (c) => getTextPosition(c, contents));
    });
  }
  const textPositionMap = new ctx.WeakmapCache3();
  function getTextPosition(content, contents) {
    const { p1, p2 } = getLinearDimensionPositions(content, contents);
    return textPositionMap.get(content, p1, p2, () => {
      return ctx.getLinearDimensionTextPosition({ ...content, p1, p2 }, ctx.dimensionStyle.margin, ctx.getTextSizeFromCache);
    });
  }
  const React = ctx.React;
  return {
    type: "linear dimension",
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      ctx.movePoint(content.p1, offset);
      ctx.movePoint(content.p2, offset);
      ctx.movePoint(content.position, offset);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content.p1, center, sx, sy);
      ctx.scalePoint(content.p2, center, sx, sy);
      ctx.scalePoint(content.position, center, sx, sy);
    },
    render(content, renderCtx) {
      const { options, fillOptions, contents, target, strokeColor } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { regions, lines } = getLinearDimensionGeometriesFromCache(content, contents);
      const children = [];
      for (const line of lines) {
        children.push(target.renderPolyline(line, options));
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolygon(regions[i].points, fillOptions));
        }
      }
      const { textPosition, text, textRotation } = getTextPosition(content, contents);
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(strokeColor, renderCtx);
      children.push(target.renderGroup(
        [
          target.renderText(textPosition.x, textPosition.y, text, strokeColor, content.fontSize, content.fontFamily, { cacheKey: content, ...textOptions })
        ],
        {
          rotation: textRotation,
          base: textPosition
        }
      ));
      return target.renderGroup(children);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { p1, p2 } = getLinearDimensionPositions(content, contents);
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
            },
            {
              x: p1.x,
              y: p1.y,
              cursor: "move",
              update(c, { cursor, start, scale, target }) {
                if (!isLinearDimensionContent(c)) {
                  return;
                }
                c.p1.x = cursor.x;
                c.p1.y = cursor.y;
                c.ref1 = ctx.getSnapTargetRef(target, contents);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              x: p2.x,
              y: p2.y,
              cursor: "move",
              update(c, { cursor, start, scale, target }) {
                if (!isLinearDimensionContent(c)) {
                  return;
                }
                c.p2.x = cursor.x;
                c.p2.y = cursor.y;
                c.ref2 = ctx.getSnapTargetRef(target, contents);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }
          ]
        };
      });
    },
    getGeometries: getLinearDimensionGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      var _a, _b;
      return {
        p1: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p, ref) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p1.x = p.x;
                  c.p1.y = p.y;
                  c.ref1 = ref;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p1.x, setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p1.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p1.y, setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p1.y = v;
                }
              }) })
            }
          }
        ),
        p2: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p, ref) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p2.x = p.x;
                  c.p2.y = p.y;
                  c.ref2 = ref;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p2.x, setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p2.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p2.y, setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.p2.y = v;
                }
              }) })
            }
          }
        ),
        ref1: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.ref1 !== void 0, readOnly: content.ref1 === void 0, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c) && !v) {
              c.ref1 = void 0;
            }
          }) }),
          content.ref1 !== void 0 && typeof content.ref1.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref1.id, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c) && c.ref1) {
              c.ref1.id = v;
            }
          }) }) : void 0,
          content.ref1 !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref1.snapIndex, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c) && c.ref1) {
              c.ref1.snapIndex = v;
            }
          }) }) : void 0,
          ((_a = content.ref1) == null ? void 0 : _a.param) !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { readOnly: true, value: content.ref1.param }) : void 0
        ],
        ref2: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.ref2 !== void 0, readOnly: content.ref2 === void 0, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c) && !v) {
              c.ref2 = void 0;
            }
          }) }),
          content.ref2 !== void 0 && typeof content.ref2.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref2.id, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c) && c.ref2) {
              c.ref2.id = v;
            }
          }) }) : void 0,
          content.ref2 !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref2.snapIndex, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c) && c.ref2) {
              c.ref2.snapIndex = v;
            }
          }) }) : void 0,
          ((_b = content.ref2) == null ? void 0 : _b.param) !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { readOnly: true, value: content.ref2.param }) : void 0
        ],
        position: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.position.x = p.x, c.position.y = p.y;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.position.x, setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.position.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.position.y, setValue: (v) => update((c) => {
                if (isLinearDimensionContent(c)) {
                  c.position.y = v;
                }
              }) })
            }
          }
        ),
        direct: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.direct === true, setValue: (v) => update((c) => {
          if (isLinearDimensionContent(c)) {
            c.direct = v ? true : void 0;
          }
        }) }),
        text: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.text !== void 0, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c)) {
              c.text = v ? "" : void 0;
            }
          }) }),
          content.text !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.text, setValue: (v) => update((c) => {
            if (isLinearDimensionContent(c)) {
              c.text = v;
            }
          }) }) : void 0
        ],
        fontSize: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.fontSize, setValue: (v) => update((c) => {
          if (isLinearDimensionContent(c)) {
            c.fontSize = v;
          }
        }) }),
        fontFamily: /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.fontFamily, setValue: (v) => update((c) => {
          if (isLinearDimensionContent(c)) {
            c.fontFamily = v;
          }
        }) }),
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, LinearDimensionContent, p),
    getRefIds,
    updateRefId(content, update) {
      if (content.ref1) {
        const newRefId = update(content.ref1.id);
        if (newRefId !== void 0) {
          content.ref1.id = newRefId;
        }
      }
      if (content.ref2) {
        const newRefId = update(content.ref2.id);
        if (newRefId !== void 0) {
          content.ref2.id = newRefId;
        }
      }
      ctx.updateStrokeRefIds(content, update);
    },
    deleteRefId(content, ids) {
      if (content.ref1 && ids.includes(content.ref1.id)) {
        content.ref1 = void 0;
      }
      if (content.ref2 && ids.includes(content.ref2.id)) {
        content.ref2 = void 0;
      }
      ctx.deleteStrokeRefIds(content, ids);
    }
  };
}
function isLinearDimensionContent(content) {
  return content.type === "linear dimension";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "15", cy: "83", r: "10", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "82", cy: "84", r: "10", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "15,83 14,7", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "82,84 82,6", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "14,25 81,25", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "66,34 83,24 65,15", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "29,34 12,25 29,15", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "create linear dimension",
    selectCount: 0,
    useCommand({ onEnd, type, scale, strokeStyleId }) {
      const [p1, setP1] = React.useState();
      const [p2, setP2] = React.useState();
      const [p1Target, setP1Target] = React.useState();
      const [p2Target, setP2Target] = React.useState();
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
        setP1Target(void 0);
        setP2Target(void 0);
        setResult(void 0);
        resetInput();
        setText(void 0);
      };
      const assistentContents = [];
      if (result) {
        assistentContents.push(result);
      } else if (p1 && cursorPosition) {
        assistentContents.push({ type: "line", points: [p1, cursorPosition], dashArray: [4 / scale] });
      }
      return {
        input,
        reset,
        onStart(p, target) {
          if (!p1) {
            setP1(p);
            setP1Target(target);
          } else if (!p2) {
            setP2(p);
            setP2Target(target);
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
              ref1: p1Target,
              ref2: p2Target,
              strokeStyleId,
              direct,
              fontSize: 16,
              fontFamily: "monospace",
              text
            });
          }
        },
        subcommand: type ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", { onClick: () => {
          if (result) {
            setResult({ ...result, direct: !direct });
          }
          setDirect(!direct);
        }, style: { position: "relative" } }, direct ? "direct" : "axis")) : void 0,
        assistentContents,
        lastPosition: p2 != null ? p2 : p1
      };
    },
    icon
  };
}
export {
  getCommand,
  getModel,
  isLinearDimensionContent
};
`,
`// dev/cad-editor/plugins/measure.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "9,14 43,92", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "94,14 93,21 92,28 91,36 88,43 86,49 82,56 78,62 74,68 69,74 63,79 57,83 51,87 44,91", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "9,14 94,14", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "measure",
    useCommand({ transform, type, scale }) {
      const { onStart, mask, startPosition, resetDragMove } = ctx.useDragMove(void 0, {
        transform,
        ignoreLeavingEvent: true
      });
      let message = "";
      if (type) {
        message = startPosition ? "specify end point" : "specify start point";
      }
      const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message);
      const reset = () => {
        resetDragMove();
        resetInput();
      };
      const assistentContents = [];
      if (startPosition && cursorPosition) {
        const start = startPosition;
        const end = cursorPosition;
        const r = ctx.getTwoPointsDistance(start, end);
        const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, start));
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
          ...ctx.getAssistentText(
            r.toFixed(2),
            16 / scale,
            (start.x + end.x) / 2 - 20,
            (start.y + end.y) / 2 + 4
          ),
          ...ctx.getAssistentText(
            \`\${angle.toFixed(1)}\\xB0\`,
            16 / scale,
            end.x + 10,
            end.y - 10
          ),
          {
            type: "line",
            points: [startPosition, cursorPosition]
          }
        );
      }
      return {
        onStart: (s) => onStart(s),
        mask,
        input,
        reset,
        onMove(p, viewportPosition) {
          setCursorPosition(p);
          setInputPosition(viewportPosition != null ? viewportPosition : p);
        },
        assistentContents
      };
    },
    selectCount: 0,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/mirror.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "9,91 38,46 9,10", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "50,0 50,100", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "90,91 62,46 91,10", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "mirror",
    useCommand({ onEnd, transform, type, scale }) {
      const [changeOriginal, setChangeOriginal] = React.useState(false);
      const { offset, onStart, mask, startPosition, resetDragMove } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true
      });
      let message = "";
      if (type) {
        message = startPosition ? "specify second point" : "specify first point";
      }
      const { input, setInputPosition, clearText, setCursorPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === "Enter") {
          if (text.toLowerCase() === "y" || text.toLowerCase() === "n") {
            setChangeOriginal(!changeOriginal);
            clearText();
          }
        }
      } : void 0);
      const reset = () => {
        resetDragMove();
        resetInput();
      };
      return {
        onStart: (s) => onStart(s),
        mask: type ? mask : void 0,
        input,
        reset,
        subcommand: type ? /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: (e) => {
              setChangeOriginal(!changeOriginal);
              e.stopPropagation();
            }
          },
          changeOriginal ? "create new(N)" : "change original(Y)"
        ) : void 0,
        updateSelectedContent(content, contents, selected) {
          if (startPosition && offset && (offset.x !== 0 || offset.y !== 0)) {
            const end = { x: startPosition.x + offset.x, y: startPosition.y + offset.y };
            const line = ctx.twoPointLineToGeneralFormLine(startPosition, end);
            if (!line) return {};
            const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, startPosition));
            if (changeOriginal) {
              const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
                var _a, _b;
                (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.mirror) == null ? void 0 : _b.call(_a, draft, line, angle, contents);
              });
              const assistentContents = ctx.updateReferencedContents(content, newContent, contents, selected);
              return {
                patches,
                assistentContents
              };
            }
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  var _a, _b;
                  (_b = (_a = ctx.getContentModel(d)) == null ? void 0 : _a.mirror) == null ? void 0 : _b.call(_a, d, line, angle, contents);
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
      var _a;
      return !content.readonly && ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.mirror) !== void 0;
    },
    hotkey: "MI",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/move.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "9,60 55,60 55,91 9,91", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "44", y: "10", width: "46", height: "31", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "move",
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition, resetDragMove } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true
      });
      let message = "";
      if (type) {
        message = startPosition ? "specify end point" : "specify start point";
      }
      const { input, setInputPosition, resetInput } = ctx.useCursorInput(message);
      const reset = () => {
        resetDragMove();
        resetInput();
      };
      return {
        onStart: (s) => onStart(s),
        mask,
        input,
        onMove(_, p) {
          setInputPosition(p);
        },
        reset,
        updateSelectedContent(content, contents, selected) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              var _a, _b;
              (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.move) == null ? void 0 : _b.call(_a, draft, offset);
            });
            const assistentContents = ctx.updateReferencedContents(content, newContent, contents, selected);
            return {
              patches,
              assistentContents
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
      var _a;
      return !content.readonly && ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.move) !== void 0;
    },
    hotkey: "M",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/nurbs.plugin.tsx
function getModel(ctx) {
  const NurbsContent = ctx.and(ctx.BaseContent("nurbs"), ctx.StrokeFields, ctx.FillFields, ctx.SegmentCountFields, ctx.Nurbs);
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getNurbsGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      var _a;
      let points;
      const nurbsSegmentCount = (_a = content.segmentCount) != null ? _a : ctx.defaultSegmentCount;
      let lines;
      if (content.points.length > 2) {
        if (!content.weights && !content.knots && (content.degree === 2 || content.points.length === 3)) {
          lines = ctx.getQuadraticSplineCurves(content.points).map((c) => ({ type: "quadratic curve", curve: c }));
          points = ctx.getGeometryLinesPoints(lines, nurbsSegmentCount);
        } else if (!content.weights && !content.knots && content.degree === 3) {
          lines = ctx.getBezierSplineCurves(content.points, false).map((c) => ({ type: "bezier curve", curve: c }));
          points = ctx.getGeometryLinesPoints(lines, nurbsSegmentCount);
        } else if (!content.weights && !content.knots && content.degree === 1) {
          points = content.points;
          lines = Array.from(ctx.iteratePolylineLines(points));
        } else {
          lines = [{
            type: "nurbs curve",
            curve: {
              degree: content.degree,
              points: content.points,
              knots: content.knots || ctx.getDefaultNurbsKnots(content.points.length, content.degree),
              weights: content.weights
            }
          }];
          points = ctx.getGeometryLinesPoints(lines, nurbsSegmentCount);
        }
      } else {
        points = content.points;
        lines = Array.from(ctx.iteratePolylineLines(points));
      }
      return {
        lines,
        points,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points: content.points
          }
        ] : void 0
      };
    });
  }
  const React = ctx.React;
  const nurbsModel = {
    type: "nurbs",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.segmentCountModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point, offset);
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point, center, angle);
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    break(content, intersectionPoints, contents) {
      const lines = getNurbsGeometries(content, contents).lines;
      const result = ctx.breakGeometryLines(lines, intersectionPoints);
      return result.map((r) => r.map((t) => ctx.geometryLineToContent(t))).flat();
    },
    offset(content, point, distance, contents) {
      const lines = getNurbsGeometries(content, contents).lines;
      return ctx.trimGeometryLinesOffsetResult(ctx.getParallelGeometryLinesByDistancePoint(point, lines, distance), point).map((r) => r.map((n) => ctx.geometryLineToContent(n))).flat();
    },
    render(content, renderCtx) {
      const { points } = getNurbsGeometries(content, renderCtx.contents);
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      return target.renderPolyline(points, options);
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      return target.renderPolyline(content.points, { strokeColor: color, dashArray: [4], strokeWidth });
    },
    getOperatorRenderPosition(content) {
      return content.points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isNurbsContent, false, true) }));
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => content.points.map((p) => ({ ...p, type: "endpoint" })));
    },
    getGeometries: getNurbsGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: /* @__PURE__ */ React.createElement(
          ctx.ArrayEditor,
          {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
              if (isNurbsContent(c)) {
                v(c);
                if (c.points.length !== content.points.length) {
                  c.knots = void 0;
                  c.weights = void 0;
                }
              }
            })),
            items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
              ctx.ObjectEditor,
              {
                inline: true,
                properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isNurbsContent(c)) {
                      c.points[i].x = p.x, c.points[i].y = p.y;
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.x, setValue: (v) => update((c) => {
                    if (isNurbsContent(c)) {
                      c.points[i].x = v;
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.y, setValue: (v) => update((c) => {
                    if (isNurbsContent(c)) {
                      c.points[i].y = v;
                    }
                  }) })
                }
              }
            ))
          }
        ),
        degree: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.degree, setValue: (v) => update((c) => {
          if (isNurbsContent(c) && Number.isInteger(v) && v >= 1) {
            c.degree = v;
            c.knots = void 0;
          }
        }) }),
        knots: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.knots !== void 0, setValue: (v) => update((c) => {
            if (isNurbsContent(c)) {
              c.knots = v ? ctx.getDefaultNurbsKnots(content.points.length, content.degree) : void 0;
            }
          }) }),
          content.knots !== void 0 ? /* @__PURE__ */ React.createElement(
            ctx.ArrayEditor,
            {
              inline: true,
              ...ctx.getArrayEditorProps((v) => v.knots || [], () => content.knots && content.knots.length > 0 ? content.knots[content.knots.length - 1] + 1 : 0, (v) => update((c) => {
                if (isNurbsContent(c)) {
                  v(c);
                }
              })),
              items: content.knots.map((f, i) => /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f, setValue: (v) => update((c) => {
                if (isNurbsContent(c) && c.knots) {
                  c.knots[i] = v;
                }
              }) }))
            }
          ) : void 0
        ],
        weights: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.weights !== void 0, setValue: (v) => update((c) => {
            if (isNurbsContent(c)) {
              c.weights = v ? ctx.getDefaultWeights(content.points.length) : void 0;
            }
          }) }),
          content.weights !== void 0 ? /* @__PURE__ */ React.createElement(
            ctx.ArrayEditor,
            {
              inline: true,
              ...ctx.getArrayEditorProps((v) => v.weights || [], 1, (v) => update((c) => {
                if (isNurbsContent(c)) {
                  v(c);
                }
              })),
              items: content.weights.map((f, i) => /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f, setValue: (v) => update((c) => {
                if (isNurbsContent(c) && c.weights) {
                  c.weights[i] = v;
                }
              }) }))
            }
          ) : void 0
        ],
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, NurbsContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    reverse: (content) => ctx.reverseNurbs(content)
  };
  return [
    nurbsModel
  ];
}
function isNurbsContent(content) {
  return content.type === "nurbs";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "13", cy: "22", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "79", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "63", cy: "22", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "85", cy: "80", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "13,22 14,24 14,26 15,29 15,31 16,33 17,34 17,36 18,38 18,40 19,41 20,43 20,44 21,46 22,47 22,49 23,50 23,51 24,52 25,53 25,54 26,55 27,56 27,56 28,57 29,58 29,58 30,59 31,59 31,59 32,60 33,60 33,60 34,60 35,60 35,60 36,60 37,60 37,59 38,59 39,58 39,58 40,57 41,57 41,56 42,55 43,55 43,54 44,53 45,52 46,51 46,49 47,48 48,47 48,46 49,46 50,45 50,44 51,44 52,43 53,43 53,42 54,42 55,42 56,41 56,41 57,41 58,41 59,41 59,41 60,42 61,42 62,42 63,43 63,43 64,44 65,44 66,45 67,46 67,47 68,47 69,48 70,49 71,51 71,52 72,53 73,54 74,56 75,57 76,59 76,60 77,62 78,64 79,65 80,67 81,69 82,71 82,73 83,75 84,78 85,80", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  const nurbsCommand = {
    name: "create nurbs",
    type: [
      { name: "nurbs", icon: icon1 }
    ],
    useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "nurbs",
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, type: "nurbs", degree: 2, strokeStyleId, fillStyleId })
        })
      );
      const assistentContents = [];
      if (line) {
        assistentContents.push(
          { points: line, type: "nurbs", strokeStyleId, fillStyleId, degree: 2 },
          { points: line, type: "polyline", dashArray: [4 / scale] }
        );
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
      };
    },
    selectCount: 0
  };
  return [
    nurbsCommand
  ];
}
export {
  getCommand,
  getModel,
  isNurbsContent
};
`,
`// dev/cad-editor/plugins/offset.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "8", y: "9", width: "82", height: "82", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "22", y: "23", width: "55", height: "55", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  function contentSelectable(content) {
    var _a;
    return ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.offset) !== void 0;
  }
  function getOffsetResult(content, p, offset, contents, lineJoin) {
    const model = ctx.getContentModel(content);
    if (model == null ? void 0 : model.offset) {
      const newContent = model.offset(content, p, offset, contents, lineJoin);
      if (Array.isArray(newContent)) {
        return newContent.filter((c) => model.isValid(c) === true);
      }
      if (newContent && model.isValid(newContent) === true) {
        return [newContent];
      }
    }
    return [];
  }
  return {
    name: "offset",
    useCommand({ onEnd, type, contents }) {
      let message = "";
      if (type) {
        message = "input offset or click to end";
      }
      const [lineJoin, setLineJoin] = React.useState(ctx.defaultLineJoin);
      const [offset, setOffset] = React.useState(0);
      const { input, clearText, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === "Enter") {
          const offset2 = +text;
          if (!isNaN(offset2) && offset2 >= 0) {
            setOffset(offset2);
            clearText();
          } else if (text.toUpperCase() === "T") {
            setOffset(0);
            clearText();
          }
        }
      } : void 0);
      return {
        onStart(p) {
          resetInput();
          onEnd({
            nextCommand: "offset",
            updateContents: (contents2, selected) => {
              const target = contents2.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c));
              for (const content of target) {
                if (content) {
                  contents2.push(...getOffsetResult(content, p, offset, contents2, lineJoin));
                }
              }
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
        updateSelectedContent(content) {
          if (cursorPosition) {
            const newContents = getOffsetResult(content, cursorPosition, offset, contents, lineJoin);
            if (newContents.length > 0) {
              return {
                newContents
              };
            }
          }
          return {};
        },
        subcommand: type === "offset" ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(ctx.EnumEditor, { value: lineJoin, enums: ["miter", "bevel", "round"], setValue: setLineJoin })) : void 0,
        reset: resetInput
      };
    },
    contentSelectable,
    selectCount: 1,
    icon,
    pointSnapDisabled: true
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/parabola.plugin.tsx
function getModel(ctx) {
  const ParabolaContent = ctx.and(ctx.BaseContent("parabola"), ctx.StrokeFields, ctx.ParabolaSegment, ctx.SegmentCountFields);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getParabolaGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(ctx.getStrokeRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      var _a;
      const segmentCount = (_a = content.segmentCount) != null ? _a : ctx.defaultSegmentCount;
      const rate = (content.t2 - content.t1) / segmentCount;
      const points = [];
      const matrix = ctx.getCoordinateMatrix2D(content, ctx.getParabolaXAxisRadian(content));
      for (let i = 0; i <= segmentCount; i++) {
        const vec = ctx.getCoordinateVec2D(ctx.getParabolaCoordinatePointAtParam(content, content.t1 + i * rate));
        const p = ctx.matrix.multiplyVec(matrix, vec);
        points.push(ctx.vec2ToPosition(ctx.slice2(p)));
      }
      const lines = [
        { type: "parabola curve", curve: content }
      ];
      return {
        lines,
        points,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
      };
    });
  }
  const React = ctx.React;
  return {
    type: "parabola",
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getParabolaGeometries(content, renderCtx.contents);
      return target.renderPolyline(points, options);
    },
    getGeometries: getParabolaGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isParabolaContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isParabolaContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isParabolaContent(c)) {
            c.y = v;
          }
        }) }),
        p: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.p, setValue: (v) => update((c) => {
          if (isParabolaContent(c) && v > 0) {
            c.p = v;
          }
        }) }),
        t1: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.t1, setValue: (v) => update((c) => {
          if (isParabolaContent(c)) {
            c.t1 = v;
          }
        }) }),
        t2: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.t2, setValue: (v) => update((c) => {
          if (isParabolaContent(c)) {
            c.t2 = v;
          }
        }) }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.angle, setValue: (v) => update((c) => {
          if (isParabolaContent(c)) {
            c.angle = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, ParabolaContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds
  };
}
function isParabolaContent(content) {
  return content.type === "parabola";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "99,3 98,7 97,10 96,14 95,18 94,21 93,25 92,28 91,31 90,34 89,38 88,41 87,44 86,46 85,49 84,52 83,55 82,57 81,60 80,62 79,64 78,67 77,69 76,71 75,73 75,75 74,77 73,79 72,80 71,82 70,84 69,85 68,87 67,88 66,89 65,90 64,91 63,93 62,93 61,94 60,95 59,96 58,97 57,97 56,98 55,98 54,98 53,99 52,99 51,99 50,99 49,99 48,99 47,99 46,98 45,98 44,98 43,97 42,97 41,96 40,95 39,94 38,93 37,93 36,91 35,90 34,89 33,88 32,87 31,85 30,84 29,82 28,80 27,79 26,77 26,75 25,73 24,71 23,69 22,67 21,64 20,62 19,60 18,57 17,55 16,52 15,49 14,46 13,44 12,41 11,38 10,34 9,31 8,28 7,25 6,21 5,18 4,14 3,10 2,7 1,3", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "create parabola",
    icon,
    useCommand({ onEnd, type, strokeStyleId }) {
      const [content, setContent] = React.useState();
      const [status, setStatus] = React.useState("position");
      const reset = () => {
        setContent(void 0);
        setStatus("position");
      };
      const assistentContents = [];
      if (content) {
        assistentContents.push(content);
      }
      return {
        onStart() {
          if (type !== "create parabola") return;
          if (status === "position") {
            setStatus("angle");
          } else if (status === "angle") {
            setStatus("t1");
          } else if (status === "t1") {
            setStatus("t2");
          } else if (status === "t2") {
            onEnd({
              updateContents: (contents) => contents.push(content)
            });
            reset();
          }
        },
        onMove(p) {
          if (type !== "create parabola") return;
          if (!content) {
            setContent({
              type: "parabola",
              x: p.x,
              y: p.y,
              p: 0.01,
              t1: -100,
              t2: 100,
              angle: -90,
              strokeStyleId
            });
          } else if (status === "position") {
            setContent({
              ...content,
              x: p.x,
              y: p.y
            });
          } else if (status === "angle") {
            setContent({
              ...content,
              angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p, content))
            });
          } else if (status === "t1") {
            const x = ctx.getPerpendicularParamToLine2D(p, content, ctx.getParabolaXAxisRadian(content));
            const y = ctx.getPerpendicularParamToLine2D(p, content, ctx.angleToRadian(content.angle));
            setContent({
              ...content,
              t1: x,
              p: Math.abs(y) / x / x / 2
            });
          } else if (status === "t2") {
            setContent({
              ...content,
              t2: ctx.minimumBy(ctx.getPerpendicularParamsToParabola(p, content), (t) => ctx.getTwoPointsDistanceSquare(p, ctx.getParabolaPointAtParam(content, t)))
            });
          }
        },
        assistentContents,
        reset
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel,
  isParabolaContent
};
`,
`// dev/cad-editor/plugins/coordinate-axis.plugin.tsx
function isCoordinateAxisContent(content) {
  return content.type === "coordinate axis";
}

// dev/cad-editor/plugins/parametric-equation.plugin.tsx
function getModel(ctx) {
  const ParametricEquationContent = ctx.and(ctx.BaseContent("parametric equation"), ctx.StrokeFields, ctx.SegmentCountFields, {
    axisId: ctx.ContentRef,
    xExpression: ctx.string,
    yExpression: ctx.string,
    min: ctx.number,
    max: ctx.number
  });
  const getRefIds = (content) => [...ctx.getStrokeRefIds(content), ...ctx.toRefId(content.axisId, true)];
  const equationCache = new ctx.WeakmapValuesCache();
  function getGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return equationCache.get(content, refs, () => {
      var _a;
      const axis = ctx.getReference(content.axisId, contents, isCoordinateAxisContent);
      if (axis) {
        if (content.xExpression && content.yExpression) {
          try {
            const xExpression = ctx.parseExpression(ctx.tokenizeExpression(content.xExpression));
            const yExpression = ctx.parseExpression(ctx.tokenizeExpression(content.yExpression));
            const points = [];
            const segmentCount = (_a = content.segmentCount) != null ? _a : ctx.defaultSegmentCount;
            const step = (content.max - content.min) / segmentCount;
            for (let t = content.min; t <= content.max; t += step) {
              const x = ctx.evaluateExpression(xExpression, { Math, t });
              const y = ctx.evaluateExpression(yExpression, { Math, t });
              if (typeof x === "number" && !isNaN(x) && typeof y === "number" && !isNaN(y)) {
                points.push({ x: x + axis.x, y: y * (axis.flipY ? -1 : 1) + axis.y });
              }
            }
            const lines = Array.from(ctx.iteratePolylineLines(points));
            return {
              points,
              lines,
              bounding: ctx.getPointsBounding(points),
              renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
            };
          } catch (e) {
            console.info(e);
          }
        }
        return { lines: [], points: [], renderingLines: [] };
      }
      return { lines: [], points: [], renderingLines: [] };
    });
  }
  const React = ctx.React;
  return {
    type: "parametric equation",
    ...ctx.strokeModel,
    ...ctx.segmentCountModel,
    render(content, renderCtx) {
      const { options, contents, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getGeometriesFromCache(content, contents);
      return target.renderPolyline(points, options);
    },
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents) {
      return {
        xExpression: /* @__PURE__ */ React.createElement(ctx.ExpressionEditor, { suggestionSources: ctx.math, validate: ctx.validateExpression, value: content.xExpression, setValue: (v) => update((c) => {
          if (isParametricEquationContent(c)) {
            c.xExpression = v;
          }
        }) }),
        yExpression: /* @__PURE__ */ React.createElement(ctx.ExpressionEditor, { suggestionSources: ctx.math, validate: ctx.validateExpression, value: content.yExpression, setValue: (v) => update((c) => {
          if (isParametricEquationContent(c)) {
            c.yExpression = v;
          }
        }) }),
        min: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.min, setValue: (v) => update((c) => {
          if (isParametricEquationContent(c)) {
            c.min = v;
          }
        }) }),
        max: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.max, setValue: (v) => update((c) => {
          if (isParametricEquationContent(c)) {
            c.max = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, ParametricEquationContent, p),
    getRefIds,
    updateRefId(content, update) {
      const newAxisId = update(content.axisId);
      if (newAxisId !== void 0) {
        content.axisId = newAxisId;
      }
      ctx.updateStrokeRefIds(content, update);
    },
    deleteRefId: ctx.deleteStrokeRefIds
  };
}
function isParametricEquationContent(content) {
  return content.type === "parametric equation";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "7,93 88,93", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,12 7,93", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "97,93 68,101 68,85", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,3 15,32 1,32", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "76,49 76,47 76,46 76,44 76,43 75,41 75,40 74,38 73,37 73,35 72,34 71,33 70,32 69,31 67,29 66,29 65,28 64,27 62,26 61,26 59,25 58,25 56,24 55,24 53,24 51,24 50,24 48,24 47,24 45,25 44,25 42,26 41,26 39,27 38,28 37,29 36,29 34,31 33,32 32,33 31,34 30,35 30,37 29,38 28,40 28,41 27,43 27,44 27,46 27,47 26,49 27,50 27,52 27,53 27,55 28,56 28,58 29,59 30,61 30,62 31,63 32,65 33,66 34,67 36,68 37,69 38,70 39,71 41,71 42,72 44,73 45,73 47,73 48,74 50,74 51,74 53,74 55,74 56,73 58,73 59,73 61,72 62,71 64,71 65,70 66,69 67,68 69,67 70,66 71,65 72,63 73,62 73,61 74,59 75,58 75,56 76,55 76,53 76,52 76,50 76,49", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "create parametric equation",
    icon,
    execute({ contents, selected }) {
      contents.push({
        type: "parametric equation",
        axisId: selected[0][0],
        min: 0,
        max: Math.PI * 2,
        xExpression: "25 + 25 * Math.cos(t)",
        yExpression: "25 + 25 * Math.sin(t)"
      });
    },
    contentSelectable: isCoordinateAxisContent,
    selectCount: 1
  };
}
export {
  getCommand,
  getModel,
  isParametricEquationContent
};
`,
`// dev/cad-editor/plugins/path-array.plugin.tsx
function getModel(ctx) {
  const PathArrayContent = ctx.and(ctx.BaseContent("path array"), ctx.ContainerFields, {
    path: ctx.PartRef,
    length: ctx.number,
    aligned: ctx.optional(ctx.boolean)
  });
  const getRefIds = (content) => [...ctx.toRefId(content.path.id, true), ...ctx.toRefIds(content.contents)];
  const allContentsCache = new ctx.WeakmapCache2();
  const getAllContentsFromCache = (content, contents) => {
    const path = ctx.getRefPart(content.path, contents, (c) => !ctx.shallowEquals(c, content));
    if (!path) return [];
    return allContentsCache.get(content, path, () => {
      var _a, _b, _c, _d;
      const lines = (_b = (_a = ctx.getContentModel(path)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, path, contents).lines;
      if (!lines) return [];
      const boundings = [];
      for (const child of content.contents) {
        if (child) {
          const geometries = (_d = (_c = ctx.getContentModel(child)) == null ? void 0 : _c.getGeometries) == null ? void 0 : _d.call(_c, child, contents);
          if (geometries == null ? void 0 : geometries.bounding) {
            boundings.push(geometries.bounding);
          }
        }
      }
      const bounding = ctx.mergeBoundingsUnsafe(boundings);
      const center = ctx.getTwoPointCenter(bounding.start, bounding.end);
      const result = [];
      const lengths = lines.map((line) => ctx.getGeometryLineLength(line) || 0);
      const totalLength = lengths.reduce((p, c) => p + c, 0);
      for (let length = 0; length <= totalLength; length += content.length) {
        const r = ctx.getGeometryLinesPointAndTangentRadianByLength(lines, length, lengths);
        if (r) {
          result.push(...content.contents.map((child) => {
            var _a2, _b2;
            if (!child) return;
            const model = ctx.getContentModel(child);
            if (!model) return;
            const bounding2 = (_b2 = (_a2 = model.getGeometries) == null ? void 0 : _a2.call(model, child, contents)) == null ? void 0 : _b2.bounding;
            if (!bounding2) return;
            const move = model.move;
            if (!move) return;
            return ctx.produce(child, (draft) => {
              var _a3;
              move(draft, { x: -center.x + r.point.x, y: -center.y + r.point.y });
              if (content.aligned) {
                (_a3 = model.rotate) == null ? void 0 : _a3.call(model, draft, r.point, ctx.radianToAngle(r.radian), contents);
              }
            });
          }));
        }
      }
      return result;
    });
  };
  const getGeometries = (content, contents) => ctx.getContentsGeometries(content, contents, getRefIds, [content], (c) => getAllContentsFromCache(c, contents));
  const React = ctx.React;
  return {
    type: "path array",
    ...ctx.containerModel,
    move: ctx.getContainerMove,
    rotate: ctx.getContainerRotate,
    scale: ctx.getContainerScale,
    explode(content, contents) {
      return ctx.getContentsExplode(getAllContentsFromCache(content, contents));
    },
    break(content, points, contents) {
      return ctx.getContentsBreak(getAllContentsFromCache(content, contents), points, contents);
    },
    render(content, renderCtx) {
      return renderCtx.target.renderGroup(ctx.renderContainerChildren({ contents: getAllContentsFromCache(content, renderCtx.contents), variableValues: content.variableValues }, renderCtx));
    },
    getSnapPoints(content, contents) {
      return ctx.getContentsSnapPoints(content, contents, (c) => getAllContentsFromCache(c, contents));
    },
    getGeometries,
    propertyPanel(content, update, contents, { acquireContent }) {
      return {
        path: [
          /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquireContent({ count: 1, selectable: (v) => pathContentSelectable(ctx, ctx.getContentByIndex(contents, v), contents) }, (r) => update((c) => {
            if (isPathArrayContent(c)) {
              c.path = r[0];
            }
          })) }, "select"),
          typeof content.path.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.path.id, setValue: (v) => update((c) => {
            if (isPathArrayContent(c)) {
              c.path.id = v;
            }
          }) }) : void 0
        ],
        length: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.length, setValue: (v) => update((c) => {
          if (isPathArrayContent(c)) {
            c.length = v;
          }
        }) }),
        aligned: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.aligned === true, setValue: (v) => update((c) => {
          if (isPathArrayContent(c)) {
            c.aligned = v ? true : void 0;
          }
        }) }),
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update)
      };
    },
    getRefIds,
    updateRefId(content, update) {
      if (content.path) {
        const newRefId = update(content.path.id);
        if (newRefId !== void 0) {
          content.path.id = newRefId;
        }
      }
    },
    isValid: (c, p) => ctx.validate(c, PathArrayContent, p)
  };
}
function isPathArrayContent(content) {
  return content.type === "path array";
}
function pathContentSelectable(ctx, content, contents) {
  var _a, _b;
  if (!content) return false;
  const geometries = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents);
  if (!geometries) return false;
  return geometries.lines.length > 0;
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.contentIsDeletable(content, contents);
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "11,89 92,8", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "89", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "36", cy: "64", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "61", cy: "39", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "86", cy: "14", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "create path array",
    useCommand({ type, onEnd, acquireContent, selected, contents }) {
      const target = React.useRef();
      const path = React.useRef();
      const reset = () => {
        target.current = void 0;
        path.current = void 0;
      };
      React.useEffect(() => {
        if (!type) return;
        if (!target.current) {
          target.current = selected.map((s) => s.path);
          acquireContent(
            {
              count: 1,
              selectable: (v) => {
                const content = ctx.getContentByIndex(contents, v);
                if (!content) return false;
                return pathContentSelectable(ctx, content, contents);
              }
            },
            (r) => {
              path.current = r[0];
            }
          );
        } else if (path.current) {
          const children = target.current.map((c) => contents[c[0]]);
          const bounding = ctx.getContentsBounding(children, contents);
          if (bounding) {
            const length = ctx.getTwoPointsDistance(bounding.start, bounding.end);
            onEnd({
              updateContents(contents2) {
                if (target.current && path.current) {
                  contents2.push({
                    type: "path array",
                    contents: children,
                    path: path.current,
                    length
                  });
                  ctx.deleteSelectedContents(contents2, target.current.map((c) => c[0]));
                }
              }
            });
          }
          reset();
        }
      }, [type]);
      return {
        onStart() {
        },
        reset
      };
    },
    contentSelectable,
    icon
  };
}
export {
  getCommand,
  getModel,
  isPathArrayContent
};
`,
`// dev/cad-editor/plugins/path.plugin.tsx
function getModel(ctx) {
  const PathContent = ctx.and(ctx.BaseContent("path"), ctx.StrokeFields, ctx.FillFields, {
    commands: [ctx.PathCommand]
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  function getPathGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      const lines = ctx.pathCommandsToGeometryLines(content.commands)[0];
      const points = ctx.getGeometryLinesPoints(lines);
      return {
        lines,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
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
    type: "path",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          ctx.movePoint(command.to, offset);
        }
        if (command.type === "arc") {
          ctx.movePoint(command.from, offset);
        } else if (command.type === "bezierCurve") {
          ctx.movePoint(command.cp1, offset);
          ctx.movePoint(command.cp2, offset);
        } else if (command.type === "quadraticCurve") {
          ctx.movePoint(command.cp, offset);
        }
      }
    },
    rotate(content, center, angle) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          ctx.rotatePoint(command.to, center, angle);
        }
        if (command.type === "arc") {
          ctx.rotatePoint(command.from, center, angle);
        } else if (command.type === "bezierCurve") {
          ctx.rotatePoint(command.cp1, center, angle);
          ctx.rotatePoint(command.cp2, center, angle);
        } else if (command.type === "quadraticCurve") {
          ctx.rotatePoint(command.cp, center, angle);
        }
      }
    },
    scale(content, center, sx, sy) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          ctx.scalePoint(command.to, center, sx, sy);
        }
        if (command.type === "arc") {
          ctx.scalePoint(command.from, center, sx, sy);
        } else if (command.type === "bezierCurve") {
          ctx.scalePoint(command.cp1, center, sx, sy);
          ctx.scalePoint(command.cp2, center, sx, sy);
        } else if (command.type === "quadraticCurve") {
          ctx.scalePoint(command.cp, center, sx, sy);
        }
      }
    },
    skew(content, center, sx, sy) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          ctx.skewPoint(command.to, center, sx, sy);
        }
        if (command.type === "arc") {
          ctx.skewPoint(command.from, center, sx, sy);
        } else if (command.type === "bezierCurve") {
          ctx.skewPoint(command.cp1, center, sx, sy);
          ctx.skewPoint(command.cp2, center, sx, sy);
        } else if (command.type === "quadraticCurve") {
          ctx.skewPoint(command.cp, center, sx, sy);
        }
      }
    },
    mirror(content, line) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          ctx.mirrorPoint(command.to, line);
        }
        if (command.type === "arc") {
          ctx.mirrorPoint(command.from, line);
        } else if (command.type === "bezierCurve") {
          ctx.mirrorPoint(command.cp1, line);
          ctx.mirrorPoint(command.cp2, line);
        } else if (command.type === "quadraticCurve") {
          ctx.mirrorPoint(command.cp, line);
        }
      }
    },
    break(content, intersectionPoints, contents) {
      const lines = getPathGeometriesFromCache(content, contents).lines;
      return ctx.breakGeometryLinesToPathCommands(lines, intersectionPoints);
    },
    offset(content, point, distance, contents, lineJoin) {
      const lines = getPathGeometriesFromCache(content, contents).lines;
      const newLines = ctx.trimGeometryLinesOffsetResult(ctx.getParallelGeometryLinesByDistancePoint(point, lines, distance, lineJoin), point);
      return newLines.map((n) => ({
        ...content,
        commands: ctx.geometryLineToPathCommands(n)
      }));
    },
    extend(content, point, contents) {
      const lines = getPathGeometriesFromCache(content, contents).lines;
      const newLines = ctx.produce(lines, (draft) => ctx.extendGeometryLines(draft, point));
      content.commands = ctx.geometryLineToPathCommands(newLines);
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      return target.renderPathCommands(content.commands, options);
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      const points = [];
      content.commands.forEach((c, i) => {
        const last = ctx.getPathCommandEndPoint(content.commands, i - 1);
        if (last) {
          if (c.type === "quadraticCurve") {
            points.push([last, c.cp, c.to]);
          } else if (c.type === "bezierCurve") {
            points.push([last, c.cp1, c.cp2, c.to]);
          } else if (c.type === "arc") {
            points.push([last, c.from, c.to]);
          } else if (c.type === "ellipseArc") {
            points.push([last, c.to]);
          }
        }
      });
      return target.renderPath(points, { strokeColor: color, dashArray: [4], strokeWidth });
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const editPoints = [];
        content.commands.forEach((command, i) => {
          if (command.type === "arc") {
            editPoints.push({
              ...command.from,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isPathContent(c)) {
                  return;
                }
                const m = c.commands[i];
                if (m.type !== "arc") {
                  return;
                }
                m.from.x += cursor.x - start.x;
                m.from.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            });
          } else if (command.type === "bezierCurve") {
            editPoints.push(
              {
                ...command.cp1,
                cursor: "move",
                update(c, { cursor, start, scale }) {
                  if (!isPathContent(c)) {
                    return;
                  }
                  const m = c.commands[i];
                  if (m.type !== "bezierCurve") {
                    return;
                  }
                  m.cp1.x += cursor.x - start.x;
                  m.cp1.y += cursor.y - start.y;
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
                }
              },
              {
                ...command.cp2,
                cursor: "move",
                update(c, { cursor, start, scale }) {
                  if (!isPathContent(c)) {
                    return;
                  }
                  const m = c.commands[i];
                  if (m.type !== "bezierCurve") {
                    return;
                  }
                  m.cp2.x += cursor.x - start.x;
                  m.cp2.y += cursor.y - start.y;
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
                }
              }
            );
          } else if (command.type === "quadraticCurve") {
            editPoints.push({
              ...command.cp,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isPathContent(c)) {
                  return;
                }
                const m = c.commands[i];
                if (m.type !== "quadraticCurve") {
                  return;
                }
                m.cp.x += cursor.x - start.x;
                m.cp.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            });
          }
          if (command.type !== "close") {
            editPoints.push({
              ...command.to,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isPathContent(c)) {
                  return;
                }
                const m = c.commands[i];
                if (m.type === "close") {
                  return;
                }
                m.to.x += cursor.x - start.x;
                m.to.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            });
          }
        });
        return {
          editPoints
        };
      });
    },
    getGeometries: getPathGeometriesFromCache,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        commands: /* @__PURE__ */ React.createElement(
          ctx.ArrayEditor,
          {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.commands, { type: "line", to: { x: 0, y: 0 } }, (v) => update((c) => {
              if (isPathContent(c)) {
                v(c);
              }
            })),
            items: content.commands.map((f, i) => {
              const properties = {
                type: /* @__PURE__ */ React.createElement(ctx.EnumEditor, { select: true, value: f.type, enums: ["move", "line", "arc", "ellipseArc", "bezierCurve", "quadraticCurve", "close"], setValue: (v) => update((c) => {
                  if (isPathContent(c)) {
                    if (v === "move" || v === "line") {
                      c.commands[i] = {
                        type: v,
                        to: { x: 0, y: 0 }
                      };
                    } else if (v === "arc") {
                      c.commands[i] = {
                        type: v,
                        radius: 10,
                        from: { x: 0, y: 0 },
                        to: { x: 0, y: 0 }
                      };
                    } else if (v === "ellipseArc") {
                      c.commands[i] = {
                        type: v,
                        rx: 10,
                        ry: 10,
                        angle: 0,
                        sweep: true,
                        largeArc: true,
                        to: { x: 0, y: 0 }
                      };
                    } else if (v === "bezierCurve") {
                      c.commands[i] = {
                        type: v,
                        cp1: { x: 0, y: 0 },
                        cp2: { x: 0, y: 0 },
                        to: { x: 0, y: 0 }
                      };
                    } else if (v === "quadraticCurve") {
                      c.commands[i] = {
                        type: v,
                        cp: { x: 0, y: 0 },
                        to: { x: 0, y: 0 }
                      };
                    } else if (v === "close") {
                      c.commands[i] = {
                        type: v
                      };
                    }
                  }
                }) })
              };
              if (f.type === "arc") {
                properties.from = /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { inline: true, properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "arc") {
                        m.from.x = p.x;
                        m.from.y = p.y;
                      }
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.from.x, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "arc") {
                        m.from.x = v;
                      }
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.from.y, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "arc") {
                        m.from.y = v;
                      }
                    }
                  }) })
                } });
                properties.radius = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.radius, setValue: (v) => update((c) => {
                  if (isPathContent(c)) {
                    const m = c.commands[i];
                    if (m.type === "arc") {
                      m.radius = v;
                    }
                  }
                }) });
              } else if (f.type === "ellipseArc") {
                properties.rx = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.rx, setValue: (v) => update((c) => {
                  if (isPathContent(c)) {
                    const m = c.commands[i];
                    if (m.type === "ellipseArc") {
                      m.rx = v;
                    }
                  }
                }) });
                properties.ry = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.ry, setValue: (v) => update((c) => {
                  if (isPathContent(c)) {
                    const m = c.commands[i];
                    if (m.type === "ellipseArc") {
                      m.ry = v;
                    }
                  }
                }) });
                properties.angle = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.angle, setValue: (v) => update((c) => {
                  if (isPathContent(c)) {
                    const m = c.commands[i];
                    if (m.type === "ellipseArc") {
                      m.angle = v;
                    }
                  }
                }) });
                properties.largeArc = /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: f.largeArc, setValue: (v) => update((c) => {
                  if (isPathContent(c)) {
                    const m = c.commands[i];
                    if (m.type === "ellipseArc") {
                      m.largeArc = v;
                    }
                  }
                }) });
                properties.sweep = /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: f.sweep, setValue: (v) => update((c) => {
                  if (isPathContent(c)) {
                    const m = c.commands[i];
                    if (m.type === "ellipseArc") {
                      m.sweep = v;
                    }
                  }
                }) });
              } else if (f.type === "bezierCurve") {
                properties.cp1 = /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { inline: true, properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "bezierCurve") {
                        m.cp1.x = p.x;
                        m.cp1.y = p.y;
                      }
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.cp1.x, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "bezierCurve") {
                        m.cp1.x = v;
                      }
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.cp1.y, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "bezierCurve") {
                        m.cp1.y = v;
                      }
                    }
                  }) })
                } });
                properties.cp2 = /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { inline: true, properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "bezierCurve") {
                        m.cp2.x = p.x;
                        m.cp2.y = p.y;
                      }
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.cp2.x, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "bezierCurve") {
                        m.cp2.x = v;
                      }
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.cp2.y, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "bezierCurve") {
                        m.cp2.y = v;
                      }
                    }
                  }) })
                } });
              } else if (f.type === "quadraticCurve") {
                properties.cp = /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { inline: true, properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "quadraticCurve") {
                        m.cp.x = p.x;
                        m.cp.y = p.y;
                      }
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.cp.x, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "quadraticCurve") {
                        m.cp.x = v;
                      }
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.cp.y, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type === "quadraticCurve") {
                        m.cp.y = v;
                      }
                    }
                  }) })
                } });
              }
              if (f.type !== "close") {
                properties.to = /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { inline: true, properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type !== "close") {
                        m.to.x = p.x;
                        m.to.y = p.y;
                      }
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.to.x, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type !== "close") {
                        m.to.x = v;
                      }
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.to.y, setValue: (v) => update((c) => {
                    if (isPathContent(c)) {
                      const m = c.commands[i];
                      if (m.type !== "close") {
                        m.to.y = v;
                      }
                    }
                  }) })
                } });
              }
              return /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { inline: true, properties });
            })
          }
        ),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, PathContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    reverse: (content, contents) => ({
      ...content,
      commands: ctx.geometryLineToPathCommands(ctx.reverseGeometryLines(getPathGeometriesFromCache(content, contents).lines))
    })
  };
}
function isPathContent(content) {
  return content.type === "path";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("path", { d: " M 8 8 L 40 7 A 50 50 0 0 1 91 57 Q 91 91, 17 90 C 50 72, 50 31, 8 24 Z", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create path",
    hotkey: "P",
    icon,
    useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
      const { path, controlPoint, controlPoint2, preview, onClick, onMove, input, setInputType, cursorPosition, reset } = ctx.usePathClickCreate(
        type === "create path",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "path",
            strokeStyleId,
            fillStyleId,
            commands: c
          })
        })
      );
      const assistentContents = [];
      if (preview.length > 1) {
        assistentContents.push({
          type: "path",
          strokeStyleId,
          fillStyleId,
          commands: preview
        });
      }
      const last = ctx.getPathCommandEndPoint(path, path.length - 1);
      if (last) {
        if (controlPoint) {
          assistentContents.push({ type: "line", points: [last, controlPoint], dashArray: [4 / scale] });
          if (controlPoint2) {
            assistentContents.push({ type: "line", points: [controlPoint, controlPoint2], dashArray: [4 / scale] });
            if (cursorPosition) {
              assistentContents.push({ type: "line", points: [controlPoint2, cursorPosition], dashArray: [4 / scale] });
            }
          } else {
            if (cursorPosition) {
              assistentContents.push({ type: "line", points: [controlPoint, cursorPosition], dashArray: [4 / scale] });
            }
          }
        } else if (cursorPosition) {
          assistentContents.push({ type: "line", points: [last, cursorPosition], dashArray: [4 / scale] });
        }
      }
      return {
        onStart: onClick,
        input,
        onMove,
        reset,
        subcommand: type === "create path" ? /* @__PURE__ */ React.createElement("span", null, ["line", "arc", "bezierCurve", "quadraticCurve", "close"].map((m) => /* @__PURE__ */ React.createElement("button", { key: m, onClick: () => setInputType(m), style: { position: "relative" } }, m))) : void 0,
        assistentContents
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel,
  isPathContent
};
`,
`// dev/cad-editor/plugins/pen.plugin.tsx
function getModel(ctx) {
  const PenContent = ctx.and(ctx.BaseContent("pen"), ctx.StrokeFields, {
    points: ctx.minItems(2, [ctx.Position])
  });
  const getRefIds = (content) => ctx.getStrokeRefIds(content);
  function getGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      const lines = Array.from(ctx.iteratePolylineLines(content.points));
      return {
        lines,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(content.points, content.dashArray)
      };
    });
  }
  return {
    type: "pen",
    ...ctx.strokeModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point, offset);
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point, center, angle);
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point, center, sx, sy);
      }
    },
    skew(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.skewPoint(point, center, sx, sy);
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      return target.renderPolyline(content.points, options);
    },
    getGeometries,
    propertyPanel(content, update, contents) {
      return ctx.getStrokeContentPropertyPanel(content, update, contents);
    },
    isValid: (c, p) => ctx.validate(c, PenContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse()
    })
  };
}
function isPenContent(content) {
  return content.type === "pen";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 1024 1024", xmlns: "http://www.w3.org/2000/svg" }, /* @__PURE__ */ React.createElement("path", { d: "m199.04 672.64 193.984 112 224-387.968-193.92-112-224 388.032zm-23.872 60.16 32.896 148.288 144.896-45.696L175.168 732.8zM455.04 229.248l193.92 112 56.704-98.112-193.984-112-56.64 98.112zM104.32 708.8l384-665.024 304.768 175.936L409.152 884.8h.064l-248.448 78.336L104.32 708.8zm384 254.272v-64h448v64h-448z", fill: "currentColor" }));
  return {
    name: "create pen",
    useCommand({ onEnd, type, strokeStyleId }) {
      const { reset, points, onClick, onMove } = ctx.usePenClickCreate(
        type === "create pen",
        () => onEnd({
          updateContents: (contents) => contents.push({ points, strokeStyleId, type: "pen" })
        })
      );
      const assistentContents = [];
      if (points.length > 1) {
        assistentContents.push({ points, strokeStyleId, type: "pen" });
      }
      return {
        onStart: onClick,
        onMove,
        assistentContents,
        reset
      };
    },
    selectCount: 0,
    icon
  };
}
export {
  getCommand,
  getModel,
  isPenContent
};
`,
`// dev/cad-editor/plugins/pline.plugin.tsx
function getModel(ctx) {
  const PlineContent = ctx.and(ctx.BaseContent("pline"), ctx.StrokeFields, ctx.FillFields, {
    points: ctx.minItems(2, [{ point: ctx.Position, bulge: ctx.number }]),
    closed: ctx.optional(ctx.boolean)
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getPlineGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      const lines = [];
      const centers = [];
      const middles = [];
      for (let i = 0; i < content.points.length; i++) {
        const p = content.points[i];
        if (i === content.points.length - 1) {
          if (content.closed) {
            lines.push(ctx.getGeometryLineByStartEndBulge(p.point, content.points[0].point, p.bulge));
          }
        } else {
          lines.push(ctx.getGeometryLineByStartEndBulge(p.point, content.points[i + 1].point, p.bulge));
        }
      }
      for (const line of lines) {
        if (Array.isArray(line)) {
          middles.push(ctx.getTwoPointCenter(...line));
        } else if (line.type === "arc") {
          centers.push(line.curve);
          middles.push(ctx.getArcPointAtAngle(line.curve, ctx.getTwoNumberCenter(line.curve.startAngle, ctx.getFormattedEndAngle(line.curve))));
        }
      }
      const points = ctx.getGeometryLinesPoints(lines);
      return {
        lines,
        points,
        centers,
        middles,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
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
    type: "pline",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point.point, offset);
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point.point, center, angle);
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point.point, center, sx, sy);
      }
    },
    skew(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.skewPoint(point.point, center, sx, sy);
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point.point, line);
        point.bulge *= -1;
      }
    },
    break(content, intersectionPoints, contents) {
      const { lines } = getPlineGeometries(content, contents);
      const newLines = ctx.breakGeometryLines(lines, intersectionPoints);
      return newLines.map((line) => ctx.geometryLinesToPline(line));
    },
    explode(content, contents) {
      const { lines } = getPlineGeometries(content, contents);
      return lines.map((line) => ctx.geometryLineToContent(line));
    },
    offset(content, point, distance, contents, lineJoin) {
      const { lines } = getPlineGeometries(content, contents);
      const newLines = ctx.trimGeometryLinesOffsetResult(ctx.getParallelGeometryLinesByDistancePoint(point, lines, distance, lineJoin), point);
      return newLines.map((n) => ctx.geometryLinesToPline(n));
    },
    join(content, target, contents) {
      var _a, _b, _c;
      const { lines } = getPlineGeometries(content, contents);
      const line2 = (_c = (_b = (_a = ctx.getContentModel(target)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, target, contents)) == null ? void 0 : _c.lines;
      if (!line2) return;
      const newLines = ctx.mergeGeometryLines(lines, line2);
      if (!newLines) return;
      return ctx.geometryLinesToPline(newLines);
    },
    extend(content, point, contents) {
      if (content.closed) return;
      const { lines } = getPlineGeometries(content, contents);
      const first = lines[0], last = lines[lines.length - 1];
      if (Array.isArray(first)) {
        if (ctx.pointIsOnRay(point, { ...first[0], angle: ctx.radianToAngle(ctx.getTwoPointsRadian(...first)) })) {
          content.points[0].point = point;
        }
      } else if (first.type === "arc") {
        if (ctx.pointIsOnCircle(point, first.curve)) {
          content.points[0].point = point;
          content.points[0].bulge = ctx.getArcBulge({ ...first.curve, startAngle: ctx.radianToAngle(ctx.getCircleRadian(point, first.curve)) }, point);
        }
      }
      if (Array.isArray(last)) {
        if (ctx.pointIsOnRay(point, { ...last[1], angle: ctx.radianToAngle(ctx.getTwoPointsRadian(last[1], last[0])) })) {
          content.points[content.points.length - 1].point = point;
        }
      } else if (last.type === "arc") {
        if (ctx.pointIsOnCircle(point, last.curve)) {
          content.points[content.points.length - 1].point = point;
          content.points[content.points.length - 2].bulge = ctx.getArcBulge({ ...last.curve, endAngle: ctx.radianToAngle(ctx.getCircleRadian(point, last.curve)) }, void 0, point);
        }
      }
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      return target.renderPath([getPlineGeometries(content, renderCtx.contents).points], options);
    },
    getOperatorRenderPosition(content) {
      return content.points[0].point;
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { middles } = getPlineGeometries(content, contents);
        const endpoints = content.points.map((p, i) => ({
          x: p.point.x,
          y: p.point.y,
          cursor: "move",
          type: "move",
          update(c, { cursor, start, scale }) {
            if (!isPlineContent(c)) {
              return;
            }
            c.points[i].point.x += cursor.x - start.x;
            c.points[i].point.y += cursor.y - start.y;
            return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [p.point, cursor] }] };
          },
          menu: [
            {
              title: "Remove",
              execute(draft) {
                if (isPlineContent(draft)) {
                  draft.points.splice(i, 1);
                }
              }
            },
            ...i === 0 || i === content.points.length - 1 ? [{
              title: "Add",
              update(c, { cursor, scale }) {
                if (!isPlineContent(c)) {
                  return;
                }
                c.points.splice(i === 0 ? 0 : i + 1, 0, { point: { x: cursor.x, y: cursor.y }, bulge: 0 });
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [p.point, cursor] }] };
              }
            }] : []
          ]
        }));
        const midpoints = middles.map((p, i) => ({
          x: p.x,
          y: p.y,
          cursor: "move",
          type: "move",
          update(c, { cursor, start, scale }) {
            if (!isPlineContent(c)) {
              return;
            }
            const j = i === content.points.length - 1 ? 0 : i + 1;
            if (ctx.isZero(content.points[i].bulge)) {
              c.points[i].point.x += cursor.x - start.x;
              c.points[i].point.y += cursor.y - start.y;
              c.points[j].point.x += cursor.x - start.x;
              c.points[j].point.y += cursor.y - start.y;
            } else {
              const bulge = ctx.getArcBulgeByStartEndPoint(content.points[i].point, content.points[j].point, cursor);
              if (bulge !== void 0) {
                c.points[i].bulge = bulge;
              }
            }
            return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [p, cursor] }] };
          },
          menu: [
            {
              title: "Add",
              update(c, { cursor, scale }) {
                if (!isPlineContent(c)) {
                  return;
                }
                c.points.splice(i + 1, 0, { point: { x: cursor.x, y: cursor.y }, bulge: 0 });
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [p, cursor] }] };
              }
            },
            ctx.isZero(content.points[i].bulge) ? {
              title: "To Arc",
              update(c, { cursor, scale }) {
                if (!isPlineContent(c)) {
                  return;
                }
                const j = i === content.points.length - 1 ? 0 : i + 1;
                const bulge = ctx.getArcBulgeByStartEndPoint(content.points[i].point, content.points[j].point, cursor);
                if (bulge !== void 0) {
                  c.points[i].bulge = bulge;
                }
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [p, cursor] }] };
              }
            } : {
              title: "To Line",
              execute(draft) {
                if (isPlineContent(draft)) {
                  draft.points[i].bulge = 0;
                }
              }
            }
          ]
        }));
        return {
          editPoints: [
            ...endpoints,
            ...midpoints
          ]
        };
      });
    },
    getSnapPoints(content, contents) {
      const { centers, middles } = getPlineGeometries(content, contents);
      return ctx.getSnapPointsFromCache(content, () => {
        return [
          ...content.points.map((p) => ({ ...p.point, type: "endpoint" })),
          ...centers.map((p) => ({ ...p, type: "center" })),
          ...middles.map((p) => ({ ...p, type: "midpoint" }))
        ];
      });
    },
    getGeometries: getPlineGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      var _a;
      return {
        points: /* @__PURE__ */ React.createElement(
          ctx.ArrayEditor,
          {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.points, { point: { x: 0, y: 0 }, bulge: 0 }, (v) => update((c) => {
              if (isPlineContent(c)) {
                v(c);
              }
            })),
            items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
              ctx.ObjectEditor,
              {
                inline: true,
                properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isPlineContent(c)) {
                      c.points[i].point.x = p.x, c.points[i].point.y = p.y;
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.point.x, setValue: (v) => update((c) => {
                    if (isPlineContent(c)) {
                      c.points[i].point.x = v;
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.point.y, setValue: (v) => update((c) => {
                    if (isPlineContent(c)) {
                      c.points[i].point.y = v;
                    }
                  }) }),
                  bulge: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.bulge, setValue: (v) => update((c) => {
                    if (isPlineContent(c)) {
                      c.points[i].bulge = v;
                    }
                  }) }),
                  radius: f.bulge ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: ctx.getArcByStartEndBulge(f.point, (content.points[i + 1] || content.points[0]).point, f.bulge).r, setValue: (v) => update((c) => {
                    if (isPlineContent(c)) {
                      c.points[i].bulge = ctx.getArcBulgeByStartEndRadius(f.point, (content.points[i + 1] || content.points[0]).point, v, f.bulge) || 0;
                    }
                  }) }) : []
                }
              }
            ))
          }
        ),
        closed: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: (_a = content.closed) != null ? _a : false, setValue: (v) => update((c) => {
          if (isPlineContent(c)) {
            c.closed = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, PlineContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse().map((p, i, points) => ({
        point: p.point,
        bulge: -points[i === points.length - 1 ? 0 : i + 1].bulge
      }))
    }),
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getPlineGeometries(content, contents).points)
  };
}
function isPlineContent(content) {
  return content.type === "pline";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "6,92 56,92", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("path", { d: "M 54 15 A 38 38 0 0 1 55 92", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "create pline",
    useCommand({ onEnd, scale, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, inputMode, lastPosition, reset, positions } = ctx.useLineClickCreate(
        type === "create pline",
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c.map((p) => ({ point: p, bulge: 0 })), strokeStyleId, fillStyleId, type: "pline" })
        })
      );
      const assistentContents = [];
      if (line && line.length > 1) {
        const start = line[line.length - 2];
        const end = line[line.length - 1];
        const r = ctx.getTwoPointsDistance(start, end);
        const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, start));
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
          ...ctx.getAssistentText(
            r.toFixed(2),
            16 / scale,
            (start.x + end.x) / 2 - 20,
            (start.y + end.y) / 2 + 4,
            inputMode === "length" ? 16711680 : 16764108
          ),
          ...ctx.getAssistentText(
            \`\${angle.toFixed(1)}\\xB0\`,
            16 / scale,
            end.x + 10,
            end.y - 10,
            inputMode === "angle" ? 16711680 : 16764108
          )
        );
      }
      if (line) {
        assistentContents.push({ points: line, strokeStyleId, fillStyleId, type: "polyline" });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset,
        subcommand: type === "create pline" && positions.length > 2 ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              onEnd({
                updateContents: (contents) => contents.push({ points: positions, type: "polygon" })
              });
              reset();
            },
            style: { position: "relative" }
          },
          "close"
        )) : void 0
      };
    },
    selectCount: 0,
    icon
  };
}
export {
  getCommand,
  getModel,
  isPlineContent
};
`,
`// dev/cad-editor/plugins/point.plugin.tsx
function getModel(ctx) {
  const PointContent = ctx.and(ctx.BaseContent("point"), ctx.Position);
  function getPointGeometries(content) {
    return ctx.getGeometriesFromCache(content, /* @__PURE__ */ new Set(), () => {
      return {
        lines: [[content, content]],
        bounding: ctx.getPointsBounding([content]),
        renderingLines: [],
        regions: []
      };
    });
  }
  const React = ctx.React;
  return {
    type: "point",
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    rotate(content, center, angle) {
      ctx.rotatePoint(content, center, angle);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy);
    },
    skew(content, center, sx, sy) {
      ctx.skewPoint(content, center, sx, sy);
    },
    mirror(content, line) {
      ctx.mirrorPoint(content, line);
    },
    render(content, { target, isHoveringOrSelected, transformStrokeWidth }) {
      const strokeWidth = transformStrokeWidth(1);
      const fuzzy = isHoveringOrSelected && strokeWidth !== 1;
      const result = target.renderCircle(content.x, content.y, 1, { fillColor: 0 });
      if (fuzzy) {
        return target.renderGroup([
          target.renderCircle(content.x, content.y, strokeWidth, {
            fillColor: 0,
            strokeWidth: 0,
            fillOpacity: ctx.fuzzyStyle.strokeOpacity
          }),
          result
        ]);
      }
      return result;
    },
    getOperatorRenderPosition(content) {
      return content;
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: "move",
              type: "move",
              update(c, { cursor, start, scale }) {
                if (!isPointContent(c)) {
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
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => [{ x: content.x, y: content.y, type: "endpoint" }]);
    },
    getGeometries: getPointGeometries,
    propertyPanel(content, update, _, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isPointContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isPointContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isPointContent(c)) {
            c.y = v;
          }
        }) })
      };
    },
    isValid: (c, p) => ctx.validate(c, PointContent, p)
  };
}
function isPointContent(content) {
  return content.type === "point";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "44", cy: "48", r: "4", strokeWidth: "2", vectorEffect: "non-scaling-stroke", fill: "none", stroke: "currentColor" }));
  return [
    {
      name: "create point",
      icon,
      useCommand({ type, onEnd }) {
        const [point, setPoint] = React.useState();
        const reset = () => {
          setPoint(void 0);
        };
        const assistentContents = [];
        if (point) {
          assistentContents.push({ ...point, type: "point" });
        }
        return {
          onStart: (p) => {
            onEnd({
              updateContents: (contents) => contents.push({ x: p.x, y: p.y, type: "point" })
            });
          },
          onMove(p) {
            if (!type) return;
            setPoint(p);
          },
          assistentContents,
          reset
        };
      },
      selectCount: 0
    }
  ];
}
export {
  getCommand,
  getModel,
  isPointContent
};
`,
`// dev/cad-editor/plugins/polar-array.plugin.tsx
function getModel(ctx) {
  const PolarArrayContent = ctx.and(ctx.BaseContent("polar array"), ctx.ContainerFields, {
    center: ctx.Position,
    itemCount: ctx.number,
    itemAngle: ctx.number,
    rowCount: ctx.number,
    rowSpacing: ctx.number
  });
  const getRefIds = (content) => ctx.toRefIds(content.contents);
  const getAllContentsFromCache = (content, contents) => {
    return ctx.allContentsCache.get(content, () => {
      const result = [];
      const bounding = ctx.getContentsBounding(content.contents, contents);
      if (!bounding) return result;
      const base = {
        x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
        y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y)
      };
      for (let i = 0; i < content.rowCount; i++) {
        for (let j = 0; j < content.itemCount; j++) {
          const angle = j * content.itemAngle;
          if (i === 0 && j === 0) {
            result.push(...content.contents);
          } else {
            result.push(...content.contents.map((c) => {
              if (!c) return;
              const model = ctx.getContentModel(c);
              const rotate = model == null ? void 0 : model.rotate;
              if (!rotate) return;
              const move = model.move;
              if (!move) return;
              return ctx.produce(c, (draft) => {
                if (i !== 0) {
                  const center = ctx.getPointByLengthAndDirection(base, -i * content.rowSpacing, content.center);
                  move(draft, {
                    x: center.x - base.x,
                    y: center.y - base.y
                  });
                }
                rotate(draft, content.center, angle, contents);
              });
            }));
          }
        }
      }
      return result;
    });
  };
  const getGeometries = (content, contents) => ctx.getContentsGeometries(content, contents, getRefIds, [content], (c) => getAllContentsFromCache(c, contents));
  const React = ctx.React;
  return {
    type: "polar array",
    ...ctx.containerModel,
    move(content, offset) {
      ctx.getContainerMove(content, offset);
      ctx.movePoint(content.center, offset);
    },
    rotate(content, center, angle, contents) {
      ctx.rotatePoint(content.center, center, angle);
      content.contents.forEach((c) => {
        var _a, _b;
        if (!c) return;
        (_b = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.rotate) == null ? void 0 : _b.call(_a, c, center, angle, contents);
      });
    },
    scale(content, center, sx, sy, contents) {
      ctx.scalePoint(content.center, center, sx, sy);
      ctx.getContainerScale(content, center, sx, sy, contents);
    },
    skew(content, center, sx, sy, contents) {
      ctx.skewPoint(content.center, center, sx, sy);
      ctx.getContainerSkew(content, center, sx, sy, contents);
    },
    explode(content, contents) {
      return ctx.getContentsExplode(getAllContentsFromCache(content, contents));
    },
    break(content, points, contents) {
      return ctx.getContentsBreak(getAllContentsFromCache(content, contents), points, contents);
    },
    render(content, renderCtx) {
      return renderCtx.target.renderGroup(ctx.renderContainerChildren({ contents: getAllContentsFromCache(content, renderCtx.contents), variableValues: content.variableValues }, renderCtx));
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const bounding = ctx.getContentsBounding(content.contents, contents);
        if (!bounding) {
          return { editPoints: [] };
        }
        const base = {
          x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
          y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y)
        };
        const editPoints = [
          {
            ...base,
            cursor: "move",
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return;
              }
              ctx.getContainerMove(c, {
                x: cursor.x - start.x,
                y: cursor.y - start.y
              });
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          },
          {
            x: content.center.x,
            y: content.center.y,
            cursor: "move",
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return;
              }
              c.center.x += cursor.x - start.x;
              c.center.y += cursor.y - start.y;
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          }
        ];
        if (content.rowCount > 1) {
          const p = ctx.getPointByLengthAndDirection(base, -content.rowSpacing, content.center);
          editPoints.push({
            ...p,
            cursor: "move",
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return;
              }
              c.rowSpacing = ctx.getTwoPointsDistance(cursor, base);
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          });
        }
        if (content.rowCount > 2) {
          const p = ctx.getPointByLengthAndDirection(base, -(content.rowCount - 1) * content.rowSpacing, content.center);
          editPoints.push({
            ...p,
            cursor: "move",
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return;
              }
              c.rowCount = Math.round(ctx.getTwoPointsDistance(cursor, base) / c.rowSpacing) + 1;
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          });
        }
        if (content.itemCount > 1) {
          const p = ctx.rotatePositionByCenter(base, content.center, -content.itemAngle);
          editPoints.push({
            ...p,
            cursor: "move",
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return;
              }
              c.itemAngle = ctx.radianToAngle(ctx.getTwoPointsRadian(cursor, content.center) - ctx.getTwoPointsRadian(base, content.center));
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          });
        }
        if (content.itemCount > 2) {
          const p = ctx.rotatePositionByCenter(base, content.center, -(content.itemCount - 1) * content.itemAngle);
          editPoints.push({
            ...p,
            cursor: "move",
            update(c, { cursor, start, scale }) {
              if (!isPolarArrayContent(c)) {
                return;
              }
              let angle = ctx.radianToAngle(ctx.getTwoPointsRadian(cursor, content.center) - ctx.getTwoPointsRadian(base, content.center));
              if (c.itemAngle > 0) {
                if (angle < 0) {
                  angle += 360;
                }
              } else {
                if (angle > 0) {
                  angle -= 360;
                }
              }
              c.itemCount = Math.round(angle / c.itemAngle) + 1;
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          });
        }
        return {
          editPoints
        };
      });
    },
    getSnapPoints(content, contents) {
      return ctx.getContentsSnapPoints(content, contents, (c) => getAllContentsFromCache(c, contents));
    },
    getGeometries,
    propertyPanel(content, update, _, { acquirePoint }) {
      return {
        center: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                if (isPolarArrayContent(c)) {
                  c.center.x = p.x, c.center.y = p.y;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.center.x, setValue: (v) => update((c) => {
                if (isPolarArrayContent(c)) {
                  c.center.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.center.y, setValue: (v) => update((c) => {
                if (isPolarArrayContent(c)) {
                  c.center.y = v;
                }
              }) })
            }
          }
        ),
        rowCount: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.rowCount, setValue: (v) => update((c) => {
          if (isPolarArrayContent(c)) {
            c.rowCount = v;
          }
        }) }),
        itemCount: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.itemCount, setValue: (v) => update((c) => {
          if (isPolarArrayContent(c)) {
            c.itemCount = v;
          }
        }) }),
        rowSpacing: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.rowSpacing, setValue: (v) => update((c) => {
          if (isPolarArrayContent(c)) {
            c.rowSpacing = v;
          }
        }) }),
        itemAngle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.itemAngle, setValue: (v) => update((c) => {
          if (isPolarArrayContent(c)) {
            c.itemAngle = v;
          }
        }) }),
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update)
      };
    },
    isValid: (c, p) => ctx.validate(c, PolarArrayContent, p),
    getRefIds
  };
}
function isPolarArrayContent(content) {
  return content.type === "polar array";
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.contentIsDeletable(content, contents);
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "30", cy: "22", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "67", cy: "23", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "82", cy: "53", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "67", cy: "81", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "79", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "13", cy: "50", r: "12", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create polar array",
    useCommand({ onEnd, type, scale, contents }) {
      let message = "";
      if (type) {
        message = "specify target point";
      }
      const { input, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message);
      return {
        onStart(p) {
          resetInput();
          onEnd({
            updateContents: (contents2, selected) => {
              const target = contents2.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents2));
              const bounding = ctx.getContentsBounding(target, contents2);
              if (!bounding) return;
              const newContent = {
                type: "polar array",
                center: p,
                contents: target,
                rowCount: 1,
                rowSpacing: ctx.getTwoPointsDistance(bounding.end, bounding.start) * 1.5,
                itemCount: 6,
                itemAngle: 60
              };
              ctx.deleteSelectedContents(contents2, selected.map((c) => c[0]));
              contents2.push(newContent);
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
        updateSelectedContent(content) {
          var _a, _b;
          if (cursorPosition) {
            const bounding = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents).bounding;
            if (!bounding) return {};
            const base = {
              x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
              y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y)
            };
            return {
              newContents: [
                {
                  type: "polar array",
                  center: cursorPosition,
                  contents: [content],
                  rowCount: 1,
                  rowSpacing: ctx.getTwoPointsDistance(bounding.end, bounding.start) * 1.5,
                  itemCount: 6,
                  itemAngle: 60
                }
              ],
              assistentContents: [
                {
                  type: "line",
                  dashArray: [4 / scale],
                  points: [base, cursorPosition]
                }
              ]
            };
          }
          return {};
        },
        reset: resetInput
      };
    },
    contentSelectable,
    icon
  };
}
export {
  getCommand,
  getModel,
  isPolarArrayContent
};
`,
`// dev/cad-editor/plugins/polygon.plugin.tsx
function getModel(ctx) {
  const PolygonContent = ctx.and(ctx.BaseContent("polygon"), ctx.StrokeFields, ctx.FillFields, {
    points: [ctx.Position]
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getPolygonGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      const lines = Array.from(ctx.iteratePolygonLines(content.points));
      return {
        lines,
        points: content.points,
        bounding: ctx.getPointsBounding(content.points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(content.points), content.dashArray),
        regions: ctx.hasFill(content) ? [
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
        ctx.movePoint(point, offset);
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point, center, angle);
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point, center, sx, sy);
      }
    },
    skew(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.skewPoint(point, center, sx, sy);
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    explode(content, contents) {
      const { lines } = getPolygonGeometries(content, contents);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    break(content, intersectionPoints, contents) {
      const { lines } = getPolygonGeometries(content, contents);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    offset(content, point, distance, contents) {
      const { lines } = getPolygonGeometries(content, contents);
      if (!distance) {
        distance = Math.min(...lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      const index = ctx.getLinesOffsetDirection(point, lines);
      const points = ctx.getParallelPolylineByDistance(lines, distance, index);
      return ctx.trimOffsetResult(points.slice(0, points.length - 1), point, true, contents).map((p) => ctx.produce(content, (d) => {
        d.points = p;
      }));
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      return target.renderPolygon(content.points, options);
    },
    getOperatorRenderPosition(content) {
      return content.points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolygonContent, true) }));
    },
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getPolygonGeometries(content, contents);
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: /* @__PURE__ */ React.createElement(
          ctx.ArrayEditor,
          {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
              if (isPolygonContent(c)) {
                v(c);
              }
            })),
            items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
              ctx.ObjectEditor,
              {
                inline: true,
                properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isPolygonContent(c)) {
                      c.points[i].x = p.x, c.points[i].y = p.y;
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.x, setValue: (v) => update((c) => {
                    if (isPolygonContent(c)) {
                      c.points[i].x = v;
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.y, setValue: (v) => update((c) => {
                    if (isPolygonContent(c)) {
                      c.points[i].y = v;
                    }
                  }) })
                }
              }
            ))
          }
        ),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, PolygonContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, content.points)
  };
}
function isPolygonContent(content) {
  return content.type === "polygon";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "10,81 86,83 88,39 52,10 12,35", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create polygon",
    useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
      const [createType, setCreateType] = React.useState("point");
      const { polygon, onClick, onMove, input, startSetSides, startPosition, cursorPosition, reset } = ctx.usePolygonClickCreate(
        type === "create polygon",
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, strokeStyleId, fillStyleId, type: "polygon" })
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
        assistentContents.push({ points: polygon, strokeStyleId, fillStyleId, type: "polygon" });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        reset,
        subcommand: type === "create polygon" ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", { onClick: startSetSides, style: { position: "relative" } }, "set sides(S)"), /* @__PURE__ */ React.createElement("button", { onClick: () => setCreateType(createType === "edge" ? "point" : "edge"), style: { position: "relative" } }, createType, "(T)")) : void 0,
        assistentContents,
        lastPosition: startPosition
      };
    },
    selectCount: 0,
    hotkey: "POL",
    icon
  };
}
export {
  getCommand,
  getModel,
  isPolygonContent
};
`,
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/radial-dimension.plugin.tsx
function getModel(ctx) {
  const RadialDimensionReferenceContent = ctx.and(ctx.BaseContent("radial dimension reference"), ctx.StrokeFields, ctx.ArrowFields, ctx.RadialDimension, {
    ref: ctx.PartRef
  });
  const getRefIds = (content) => [...ctx.getStrokeRefIds(content), ...ctx.toRefId(content.ref.id, true)];
  const radialDimensionReferenceCache = new ctx.WeakmapValuesCache();
  function getRadialDimensionReferenceGeometriesFromCache(content, contents, patches) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return radialDimensionReferenceCache.get(content, refs, () => {
      var _a, _b;
      const target = ctx.getRefPart(content.ref, contents, contentSelectable, patches);
      if (target) {
        return ctx.getRadialDimensionGeometries(content, target, {
          arrowAngle: (_a = content.arrowAngle) != null ? _a : ctx.dimensionStyle.arrowAngle,
          arrowSize: (_b = content.arrowSize) != null ? _b : ctx.dimensionStyle.arrowSize,
          margin: ctx.dimensionStyle.margin
        }, getTextPosition);
      }
      return { lines: [], points: [], renderingLines: [] };
    });
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
    ...ctx.arrowModel,
    move(content, offset) {
      ctx.movePoint(content.position, offset);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content.position, center, sx, sy);
    },
    skew(content, center, sx, sy) {
      ctx.skewPoint(content.position, center, sx, sy);
    },
    render(content, renderCtx) {
      const { options, contents, target, fillOptions, strokeColor } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents, renderCtx.patches);
      const children = [];
      for (const line of lines) {
        children.push(target.renderPolyline(line, options));
      }
      if (regions && regions.length > 0) {
        children.push(target.renderPolygon(regions[0].points, fillOptions));
      }
      const referenceTarget = ctx.getRefPart(content.ref, contents, contentSelectable, renderCtx.patches);
      if (referenceTarget) {
        const { textPosition, textRotation, text } = getTextPosition(content, referenceTarget);
        const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(strokeColor, renderCtx);
        children.push(target.renderGroup(
          [
            target.renderText(textPosition.x, textPosition.y, text, strokeColor, content.fontSize, content.fontFamily, textOptions)
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
                const target = ctx.getRefPart(content.ref, contents, contentSelectable);
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
    propertyPanel(content, update, contents, { acquirePoint, acquireContent }) {
      return {
        ref: [
          /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquireContent({ count: 1, part: true, selectable: (v) => contentSelectable(ctx.getContentByIndex(contents, v)) }, (r) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.ref = r[0];
            }
          })) }, "select"),
          typeof content.ref.id === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref.id, setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.ref.id = v;
            }
          }) }) : void 0,
          content.ref.partIndex !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.ref.partIndex, setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.ref.partIndex = v;
            }
          }) }) : void 0
        ],
        position: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
              from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                if (isRadialDimensionReferenceContent(c)) {
                  c.position.x = p.x, c.position.y = p.y;
                }
              })) }, "canvas"),
              x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.position.x, setValue: (v) => update((c) => {
                if (isRadialDimensionReferenceContent(c)) {
                  c.position.x = v;
                }
              }) }),
              y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.position.y, setValue: (v) => update((c) => {
                if (isRadialDimensionReferenceContent(c)) {
                  c.position.y = v;
                }
              }) })
            }
          }
        ),
        text: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.text !== void 0, setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.text = v ? "" : void 0;
            }
          }) }),
          content.text !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.text, setValue: (v) => update((c) => {
            if (isRadialDimensionReferenceContent(c)) {
              c.text = v;
            }
          }) }) : void 0
        ],
        fontSize: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.fontSize, setValue: (v) => update((c) => {
          if (isRadialDimensionReferenceContent(c)) {
            c.fontSize = v;
          }
        }) }),
        fontFamily: /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.fontFamily, setValue: (v) => update((c) => {
          if (isRadialDimensionReferenceContent(c)) {
            c.fontFamily = v;
          }
        }) }),
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, RadialDimensionReferenceContent, p),
    getRefIds,
    updateRefId(content, update) {
      const newRefId = update(content.ref.id);
      if (newRefId !== void 0) {
        content.ref.id = newRefId;
      }
      ctx.updateStrokeRefIds(content, update);
    },
    deleteRefId: ctx.deleteStrokeRefIds
  };
}
function isRadialDimensionReferenceContent(content) {
  return content.type === "radial dimension reference";
}
function contentSelectable(content) {
  return !!content && (isArcContent(content) || isCircleContent(content));
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "36", cy: "64", r: "31", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "36,64 90,9", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "75,32 65,22 54,44", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "create radial dimension",
    selectCount: 1,
    selectType: "select part",
    icon,
    contentSelectable,
    useCommand({ onEnd, selected, type, strokeStyleId }) {
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
      return {
        input,
        onStart() {
          if (result) {
            onEnd({
              updateContents: (draft) => {
                if (selected.length > 0 && type) {
                  const { content, path } = selected[0];
                  if (contentSelectable(content)) {
                    result.ref = {
                      id: path[0],
                      partIndex: path[1]
                    };
                  }
                }
                draft.push({
                  type: "radial dimension reference",
                  position: result.position,
                  fontSize: result.fontSize,
                  fontFamily: result.fontFamily,
                  ref: result.ref,
                  text: result.text,
                  strokeStyleId
                });
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
            const { content, path } = selected[0];
            if (contentSelectable(content)) {
              setResult({
                type: "radial dimension reference",
                position: p,
                fontSize: 16,
                fontFamily: "monospace",
                ref: {
                  id: path[0],
                  partIndex: path[1]
                },
                text,
                strokeStyleId
              });
            }
          }
        },
        assistentContents: result ? [result] : void 0,
        reset
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
`// dev/cad-editor/plugins/ray.plugin.tsx
function getModel(ctx) {
  const RayContent = ctx.and(ctx.BaseContent("ray"), ctx.StrokeFields, ctx.Ray);
  const getRefIds = (content) => ctx.getStrokeRefIds(content);
  function getRayGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      return {
        lines: [{ type: "ray", line: content }],
        renderingLines: []
      };
    });
  }
  const React = ctx.React;
  const rayModel = {
    type: "ray",
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    rotate(content, center, angle) {
      ctx.rotatePoint(content, center, angle);
      content.angle += angle;
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy);
    },
    mirror(content, line, angle) {
      ctx.mirrorPoint(content, line);
      content.angle = 2 * angle - content.angle;
    },
    break(content, intersectionPoints, contents) {
      return ctx.breakGeometryLines(getRayGeometries(content, contents).lines, intersectionPoints).flat().map((n) => ctx.geometryLineToContent(n));
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = ctx.getPointAndRayNearestPointAndDistance(point, content).distance;
      }
      const index = ctx.pointSideToIndex(ctx.getPointSideOfGeometryLine(point, { type: "ray", line: content }));
      return ctx.getParallelRaysByDistance(content, distance)[index];
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      return target.renderRay(content.x, content.y, content.angle, { ...options, bidirectional: content.bidirectional });
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => ({
        editPoints: [{
          x: content.x,
          y: content.y,
          cursor: "move",
          type: "move",
          update(c, { cursor, start, scale }) {
            if (!isRayContent(c)) {
              return;
            }
            c.x += cursor.x - start.x;
            c.y += cursor.y - start.y;
            return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
          }
        }]
      }));
    },
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        return [{ x: content.x, y: content.y, type: "endpoint" }];
      });
    },
    getGeometries: getRayGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isRayContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isRayContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isRayContent(c)) {
            c.y = v;
          }
        }) }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.angle, setValue: (v) => update((c) => {
          if (isRayContent(c)) {
            c.angle = v;
          }
        }) }),
        bidirectional: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.bidirectional || false, setValue: (v) => update((c) => {
          if (isRayContent(c)) {
            c.bidirectional = v;
          }
        }) }),
        reversed: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.reversed || false, setValue: (v) => update((c) => {
          if (isRayContent(c)) {
            c.reversed = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, RayContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds,
    reverse: (content) => ({ ...content, ...ctx.reverseRay(content) })
  };
  return rayModel;
}
function isRayContent(content) {
  return content.type === "ray";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "10", cy: "87", r: "12", strokeWidth: "0", vectorEffect: "non-scaling-stroke", fill: "currentColor", stroke: "#000000" }), /* @__PURE__ */ React.createElement("polyline", { points: "10,87 87,9", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create ray",
    useCommand({ onEnd, type, strokeStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create ray",
        (c) => onEnd({
          updateContents: (contents) => contents.push({ type: "ray", x: c[0].x, y: c[0].y, angle: ctx.radianToAngle(ctx.getTwoPointsRadian(c[1], c[0])), strokeStyleId })
        }),
        { once: true }
      );
      const assistentContents = [];
      if (line && line.length > 1) {
        const start = line[line.length - 2];
        const end = line[line.length - 1];
        const angle = ctx.radianToAngle(ctx.getTwoPointsRadian(end, start));
        assistentContents.push({ type: "ray", x: start.x, y: start.y, angle, strokeStyleId });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
      };
    },
    selectCount: 0,
    icon
  };
}
export {
  getCommand,
  getModel,
  isRayContent
};
`,
`// dev/cad-editor/plugins/rect-array.plugin.tsx
function getModel(ctx) {
  const RectArrayContent = ctx.and(ctx.BaseContent("rect array"), ctx.ContainerFields, {
    rowCount: ctx.number,
    rowSpacing: ctx.number,
    columnCount: ctx.number,
    columnSpacing: ctx.number
  });
  const getRefIds = (content) => ctx.toRefIds(content.contents);
  const getAllContentsFromCache = (content) => {
    return ctx.allContentsCache.get(content, () => {
      const result = [];
      for (let i = 0; i < content.columnCount; i++) {
        const x = i * content.columnSpacing;
        for (let j = 0; j < content.rowCount; j++) {
          const y = j * content.rowSpacing;
          if (x === 0 && y === 0) {
            result.push(...content.contents);
          } else {
            result.push(...content.contents.map((c) => {
              var _a;
              if (!c) return;
              const move = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.move;
              if (!move) return;
              return ctx.produce(c, (draft) => {
                move(draft, { x, y });
              });
            }));
          }
        }
      }
      return result;
    });
  };
  const getGeometries = (content, contents) => ctx.getContentsGeometries(content, contents, getRefIds, [content], getAllContentsFromCache);
  const React = ctx.React;
  return {
    type: "rect array",
    ...ctx.containerModel,
    move: ctx.getContainerMove,
    rotate(content, center, angle, contents) {
      const x = content.columnSpacing * (content.columnCount - 1) * 0.5;
      const y = content.rowSpacing * (content.rowCount - 1) * 0.5;
      content.contents.forEach((c) => {
        var _a, _b, _c;
        if (!c) return;
        const m = ctx.getContentModel(c);
        if (!m) return;
        (_a = m.move) == null ? void 0 : _a.call(m, c, { x, y });
        (_b = m.rotate) == null ? void 0 : _b.call(m, c, center, angle, contents);
        (_c = m.move) == null ? void 0 : _c.call(m, c, { x: -x, y: -y });
      });
    },
    scale(content, center, sx, sy, contents) {
      ctx.getContainerScale(content, center, sx, sy, contents);
      content.rowSpacing *= sx;
      content.columnSpacing *= sy;
    },
    explode(content) {
      return ctx.getContentsExplode(getAllContentsFromCache(content));
    },
    break(content, points, contents) {
      return ctx.getContentsBreak(getAllContentsFromCache(content), points, contents);
    },
    render(content, renderCtx) {
      return renderCtx.target.renderGroup(ctx.renderContainerChildren({ contents: getAllContentsFromCache(content), variableValues: content.variableValues }, renderCtx));
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const bounding = ctx.getContentsBounding(content.contents, contents);
        if (!bounding) {
          return { editPoints: [] };
        }
        const base = {
          x: ctx.getTwoNumberCenter(bounding.start.x, bounding.end.x),
          y: ctx.getTwoNumberCenter(bounding.start.y, bounding.end.y)
        };
        return {
          editPoints: [
            {
              ...base,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return;
                }
                ctx.getContainerMove(c, {
                  x: cursor.x - start.x,
                  y: cursor.y - start.y
                });
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              x: base.x + content.columnSpacing,
              y: base.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return;
                }
                c.columnSpacing = cursor.x - base.x;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              x: base.x,
              y: base.y + content.rowSpacing,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return;
                }
                c.rowSpacing = cursor.y - base.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              x: base.x + content.columnSpacing * (content.columnCount - 1),
              y: base.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return;
                }
                let columnCount = Math.round((cursor.x - base.x) / content.columnSpacing);
                if (columnCount < 0) {
                  columnCount = -columnCount;
                  c.columnSpacing = -content.columnSpacing;
                }
                c.columnCount = columnCount + 1;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              x: base.x,
              y: base.y + content.rowSpacing * (content.rowCount - 1),
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return;
                }
                let rowCount = Math.round((cursor.y - base.y) / content.rowSpacing);
                if (rowCount < 0) {
                  rowCount = -rowCount;
                  c.rowSpacing = -content.rowSpacing;
                }
                c.rowCount = rowCount + 1;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            {
              x: base.x + content.columnSpacing * (content.columnCount - 1),
              y: base.y + content.rowSpacing * (content.rowCount - 1),
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isRectArrayContent(c)) {
                  return;
                }
                let rowCount = Math.round((cursor.y - base.y) / content.rowSpacing);
                if (rowCount < 0) {
                  rowCount = -rowCount;
                  c.rowSpacing = -content.rowSpacing;
                }
                let columnCount = Math.round((cursor.x - base.x) / content.columnSpacing);
                if (columnCount < 0) {
                  columnCount = -columnCount;
                  c.columnSpacing = -content.columnSpacing;
                }
                c.rowCount = rowCount + 1;
                c.columnCount = columnCount + 1;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }
          ]
        };
      });
    },
    getSnapPoints(content, contents) {
      return ctx.getContentsSnapPoints(content, contents, getAllContentsFromCache);
    },
    getGeometries,
    propertyPanel(content, update) {
      return {
        rowCount: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.rowCount, setValue: (v) => update((c) => {
          if (isRectArrayContent(c)) {
            c.rowCount = v;
          }
        }) }),
        columnCount: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.columnCount, setValue: (v) => update((c) => {
          if (isRectArrayContent(c)) {
            c.columnCount = v;
          }
        }) }),
        rowSpacing: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.rowSpacing, setValue: (v) => update((c) => {
          if (isRectArrayContent(c)) {
            c.rowSpacing = v;
          }
        }) }),
        columnSpacing: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.columnSpacing, setValue: (v) => update((c) => {
          if (isRectArrayContent(c)) {
            c.columnSpacing = v;
          }
        }) }),
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update)
      };
    },
    isValid: (c, p) => ctx.validate(c, RectArrayContent, p),
    getRefIds
  };
}
function isRectArrayContent(content) {
  return content.type === "rect array";
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return ctx.contentIsDeletable(content, contents);
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "70", width: "40", height: "27", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "58", y: "70", width: "40", height: "27", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "35", width: "40", height: "27", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "58", y: "35", width: "40", height: "27", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "0", width: "40", height: "27", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "58", y: "1", width: "40", height: "27", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create rect array",
    execute({ contents, selected }) {
      const target = contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents));
      const bounding = ctx.getContentsBounding(target, contents);
      if (!bounding) return;
      const size = ctx.getTwoPointsFormRegionSize(bounding);
      const newContent = {
        type: "rect array",
        contents: target,
        rowCount: 3,
        rowSpacing: -size.height * 1.5,
        columnCount: 4,
        columnSpacing: size.width * 1.5
      };
      ctx.deleteSelectedContents(contents, selected.map((c) => c[0]));
      contents.push(newContent);
    },
    contentSelectable,
    icon
  };
}
export {
  getCommand,
  getModel,
  isRectArrayContent
};
`,
`// dev/cad-editor/plugins/rect.plugin.tsx
function getModel(ctx) {
  const RectContent = ctx.and(ctx.BaseContent("rect"), ctx.StrokeFields, ctx.FillFields, ctx.Region, {
    angle: ctx.number
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getRectGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      const points = ctx.getPolygonFromRegion(content).map((p) => ctx.rotatePositionByCenter(p, content, -content.angle));
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines,
        points,
        midpoints: lines.map((line) => ctx.getTwoPointCenter(...line)),
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray),
        regions: ctx.hasFill(content) ? [
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
      ctx.movePoint(content, offset);
    },
    rotate(content, center, angle) {
      ctx.rotatePoint(content, center, angle);
      content.angle += angle;
    },
    scale(content, center, sx, sy, contents) {
      if (content.angle) {
        const points = ctx.produce(getRectGeometries(content, contents).points, (draft) => {
          for (const p of draft) {
            ctx.scalePoint(p, center, sx, sy);
          }
        });
        return { ...content, points, type: "polygon" };
      }
      ctx.scalePoint(content, center, sx, sy);
      content.width *= sx;
      content.height *= sy;
      return;
    },
    skew(content, center, sx, sy, contents) {
      const points = ctx.produce(getRectGeometries(content, contents).points, (draft) => {
        for (const p of draft) {
          ctx.skewPoint(p, center, sx, sy);
        }
      });
      return { ...content, points, type: "polygon" };
    },
    explode(content, contents) {
      const { lines } = getRectGeometries(content, contents);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    break(content, intersectionPoints, contents) {
      const { lines } = getRectGeometries(content, contents);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    mirror(content, line, angle) {
      ctx.mirrorPoint(content, line);
      content.angle = 2 * angle - content.angle;
    },
    offset(content, point, distance, contents) {
      var _a;
      if (!distance) {
        distance = Math.min(...getRectGeometries(content, contents).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= 2 * (((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point, contents)) ? -1 : 1);
      return ctx.produce(content, (d) => {
        d.width += distance;
        d.height += distance;
      });
    },
    render(content, renderCtx) {
      const { options, dashed, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      if (dashed) {
        const { points } = getRectGeometries(content, renderCtx.contents);
        return target.renderPolygon(points, options);
      }
      return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { ...options, angle: content.angle });
    },
    getOperatorRenderPosition(content, contents) {
      const { points } = getRectGeometries(content, contents);
      return points[0];
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points, midpoints } = getRectGeometries(content, contents);
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: "center" },
            { ...points[0], direction: "left-top" },
            { ...points[1], direction: "right-top" },
            { ...points[2], direction: "right-bottom" },
            { ...points[3], direction: "left-bottom" },
            { ...midpoints[0], direction: "top" },
            { ...midpoints[1], direction: "right" },
            { ...midpoints[2], direction: "bottom" },
            { ...midpoints[3] || midpoints[1], direction: "left" }
          ].map((p, i) => ({
            x: p.x,
            y: p.y,
            type: i === 0 ? "move" : void 0,
            cursor: ctx.getResizeCursor(content.angle, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isRectContent(c)) {
                return;
              }
              const offset = ctx.getResizeOffset(start, cursor, p.direction, -ctx.angleToRadian(content.angle));
              if (!offset) {
                return;
              }
              c.x += offset.x + offset.width / 2;
              c.y += offset.y + offset.height / 2;
              c.width = Math.abs(c.width + offset.width);
              c.height = Math.abs(c.height + offset.height);
              return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
            }
          }))
        };
      });
    },
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, midpoints } = getRectGeometries(content, contents);
        return [
          { x: content.x, y: content.y, type: "center" },
          ...points.map((p) => ({ ...p, type: "endpoint" })),
          ...midpoints.map((p) => ({ ...p, type: "midpoint" }))
        ];
      });
    },
    getGeometries: getRectGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isRectContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isRectContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isRectContent(c)) {
            c.y = v;
          }
        }) }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.width, setValue: (v) => update((c) => {
          if (isRectContent(c)) {
            c.width = v;
          }
        }) }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.height, setValue: (v) => update((c) => {
          if (isRectContent(c)) {
            c.height = v;
          }
        }) }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.angle, setValue: (v) => update((c) => {
          if (isRectContent(c)) {
            c.angle = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, RectContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getRectGeometries(content, contents).points),
    getArea: (content) => content.width * content.height
  };
}
function isRectContent(content) {
  return content.type === "rect";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "11", y: "26", width: "79", height: "48", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create rect",
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create rect",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "rect",
            x: (c[0].x + c[1].x) / 2,
            y: (c[0].y + c[1].y) / 2,
            width: Math.abs(c[0].x - c[1].x),
            height: Math.abs(c[0].y - c[1].y),
            angle: 0,
            strokeStyleId,
            fillStyleId
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
          angle: 0,
          strokeStyleId,
          fillStyleId
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
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
`// dev/cad-editor/plugins/regular-polygon.plugin.tsx
function getModel(ctx) {
  const RegularPolygonContent = ctx.and(ctx.BaseContent("regular polygon"), ctx.StrokeFields, ctx.FillFields, ctx.Position, {
    radius: ctx.number,
    count: ctx.number,
    angle: ctx.number
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getRegularPolygonGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      var _a;
      const angle = -((_a = content.angle) != null ? _a : 0);
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
        regions: ctx.hasFill(content) ? [
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
      ctx.movePoint(content, offset);
    },
    scale(content, center, sx, sy, contents) {
      if (sx !== sy) {
        const points = ctx.produce(getRegularPolygonGeometriesFromCache(content, contents).points, (draft) => {
          for (const p of draft) {
            ctx.scalePoint(p, center, sx, sy);
          }
        });
        return { ...content, points, type: "polygon" };
      }
      ctx.scalePoint(content, center, sx, sy);
      content.radius *= sx;
      return;
    },
    skew(content, center, sx, sy, contents) {
      const points = ctx.produce(getRegularPolygonGeometriesFromCache(content, contents).points, (draft) => {
        for (const p of draft) {
          ctx.skewPoint(p, center, sx, sy);
        }
      });
      return { ...content, points, type: "polygon" };
    },
    offset(content, point, distance, contents) {
      var _a;
      if (!distance) {
        distance = Math.min(...getRegularPolygonGeometriesFromCache(content, contents).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point, contents)) ? -1 : 1;
      const radius = distance / Math.cos(Math.PI / content.count);
      return ctx.produce(content, (d) => {
        d.radius += radius;
      });
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getRegularPolygonGeometriesFromCache(content, renderCtx.contents);
      return target.renderPolygon(points, options);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getRegularPolygonGeometriesFromCache(content, contents);
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              type: "move",
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
                c.angle = ctx.radianToAngle(ctx.getTwoPointsRadian(cursor, c));
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }))
          ]
        };
      });
    },
    getGeometries: getRegularPolygonGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isRegularPolygonContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isRegularPolygonContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isRegularPolygonContent(c)) {
            c.y = v;
          }
        }) }),
        radius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.radius, setValue: (v) => update((c) => {
          if (isRegularPolygonContent(c)) {
            c.radius = v;
          }
        }) }),
        count: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.count, setValue: (v) => update((c) => {
          if (isRegularPolygonContent(c)) {
            c.count = v;
          }
        }) }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.angle, setValue: (v) => update((c) => {
          if (isRegularPolygonContent(c)) {
            c.angle = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    canSelectPart: true,
    isValid: (c, p) => ctx.validate(c, RegularPolygonContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getRegularPolygonGeometriesFromCache(content, contents).points)
  };
}
function isRegularPolygonContent(content) {
  return content.type === "regular polygon";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "91,40 53,7 10,33 22,82 72,85", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create regular polygon",
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create regular polygon",
        ([p0, p1]) => onEnd({
          updateContents: (contents) => {
            contents.push({
              type: "regular polygon",
              x: p0.x,
              y: p0.y,
              radius: ctx.getTwoPointsDistance(p0, p1),
              count: 5,
              angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p1, p0)),
              strokeStyleId,
              fillStyleId
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
          angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p1, p0)),
          strokeStyleId,
          fillStyleId
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
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
`// dev/cad-editor/plugins/reverse.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "1,71 56,7", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "62,0 54,18 46,11", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "97,27 91,34", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "84,42 78,50", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "71,57 64,65", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "58,72 51,80", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "45,87 42,90", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "36,97 45,79 53,86", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "reverse",
    execute({ contents, selected }) {
      contents.forEach((content, index) => {
        var _a, _b, _c, _d;
        if (content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true)) {
          const result = (_d = (_c = ctx.getContentModel(content)) == null ? void 0 : _c.reverse) == null ? void 0 : _d.call(_c, content, contents);
          if (result) {
            contents[index] = result;
          }
        }
      });
    },
    contentSelectable(content) {
      var _a;
      return !content.readonly && ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.reverse) !== void 0;
    },
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/ring.plugin.tsx
function getModel(ctx) {
  const RingContent = ctx.and(ctx.BaseContent("ring"), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.Position, {
    outerRadius: ctx.number,
    innerRadius: ctx.number
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  function getRingGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      var _a;
      const angleDelta = (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta;
      const arc1 = ctx.circleToArc({ ...content, r: content.outerRadius });
      const arc2 = ctx.circleToArc({ ...content, r: content.innerRadius });
      const points1 = ctx.arcToPolyline(arc1, angleDelta);
      const points2 = ctx.arcToPolyline(arc2, angleDelta);
      const lines = [{ type: "arc", curve: arc1 }, { type: "arc", curve: arc2 }];
      return {
        lines,
        bounding: ctx.getCircleBounding({ ...content, r: content.outerRadius }),
        regions: ctx.hasFill(content) ? [
          {
            lines: [lines[0]],
            points: points1,
            holesPoints: [points2],
            holes: [[lines[1]]]
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
    ...ctx.angleDeltaModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy);
      content.innerRadius *= sx;
      content.outerRadius *= sx;
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { renderingLines, regions } = getRingGeometriesFromCache(content, renderCtx.contents);
      if (regions) {
        return target.renderPath([regions[0].points, ...regions[0].holesPoints || []], options);
      }
      return target.renderGroup(renderingLines.map((r) => target.renderPolyline(r, options)));
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isRingContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isRingContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isRingContent(c)) {
            c.y = v;
          }
        }) }),
        outerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.outerRadius, setValue: (v) => update((c) => {
          if (isRingContent(c)) {
            c.outerRadius = v;
          }
        }) }),
        innerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.innerRadius, setValue: (v) => update((c) => {
          if (isRingContent(c)) {
            c.innerRadius = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getAngleDeltaContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, RingContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds
  };
}
function isRingContent(content) {
  return content.type === "ring";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "91,50 91,53 91,57 90,60 89,64 87,67 86,70 84,74 82,76 79,79 76,82 74,84 70,86 67,87 64,89 60,90 57,91 53,91 50,91 46,91 42,91 39,90 35,89 32,87 29,86 25,84 23,82 20,79 17,76 15,74 13,70 12,67 10,64 9,60 8,57 8,53 8,50 8,46 8,42 9,39 10,35 12,32 13,29 15,25 17,23 20,20 23,17 25,15 29,13 32,12 35,10 39,9 42,8 46,8 49,8 53,8 57,8 60,9 64,10 67,12 70,13 74,15 76,17 79,20 82,23 84,25 86,29 87,32 89,35 90,39 91,42 91,46 91,49", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "70,50 70,51 70,53 70,55 69,57 68,58 68,60 67,62 66,63 64,64 63,66 62,67 60,68 58,68 57,69 55,70 53,70 51,70 50,70 48,70 46,70 44,70 42,69 41,68 39,68 37,67 36,66 35,64 33,63 32,62 31,60 31,58 30,57 29,55 29,53 29,51 29,50 29,48 29,46 29,44 30,42 31,41 31,39 32,37 33,36 35,35 36,33 37,32 39,31 41,31 42,30 44,29 46,29 48,29 49,29 51,29 53,29 55,29 57,30 58,31 60,31 62,32 63,33 64,35 66,36 67,37 68,39 68,41 69,42 70,44 70,46 70,48 70,49", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create ring",
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create ring",
        (c) => onEnd({
          updateContents: (contents) => {
            const outerRadius = ctx.getTwoPointsDistance(c[0], c[1]);
            contents.push({
              type: "ring",
              x: c[0].x,
              y: c[0].y,
              outerRadius,
              innerRadius: outerRadius * 0.5,
              strokeStyleId,
              fillStyleId
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
          innerRadius: outerRadius * 0.5,
          strokeStyleId,
          fillStyleId
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
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
`// dev/cad-editor/plugins/rotate.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "5,66 66,66 66,94 5,94", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "35", y: "26", width: "61", height: "28", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", transform: "rotate(56,66,40)" }));
  return {
    name: "rotate",
    icon,
    useCommand({ onEnd, transform, type, scale }) {
      const [changeOriginal, setChangeOriginal] = React.useState(true);
      const { offset, onStart, mask, center: startPosition, resetDragRotate } = ctx.useDragRotate(
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
      if (startPosition && (offset == null ? void 0 : offset.angle) !== void 0) {
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
        reset: resetDragRotate,
        subcommand: type ? /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: (e) => {
              setChangeOriginal(!changeOriginal);
              e.stopPropagation();
            }
          },
          changeOriginal ? "create new(N)" : "change original(Y)"
        ) : void 0,
        updateSelectedContent(content, contents, selected) {
          if (startPosition && (offset == null ? void 0 : offset.angle) !== void 0) {
            const angle = offset.angle;
            if (!changeOriginal) {
              return {
                newContents: [
                  ctx.produce(content, (d) => {
                    var _a, _b;
                    (_b = (_a = ctx.getContentModel(d)) == null ? void 0 : _a.rotate) == null ? void 0 : _b.call(_a, d, startPosition, angle, contents);
                  })
                ]
              };
            }
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              var _a, _b;
              (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.rotate) == null ? void 0 : _b.call(_a, draft, startPosition, angle, contents);
            });
            const assistentContents2 = ctx.updateReferencedContents(content, newContent, contents, selected);
            return {
              patches,
              assistentContents: assistentContents2
            };
          }
          return {};
        },
        assistentContents
      };
    },
    contentSelectable(content) {
      var _a;
      return !content.readonly && ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.rotate) !== void 0;
    },
    hotkey: "RO"
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/rounded-rect.plugin.tsx
function getModel(ctx) {
  const RoundedRectContent = ctx.and(ctx.BaseContent("rounded rect"), ctx.StrokeFields, ctx.FillFields, ctx.Region, ctx.AngleDeltaFields, {
    radius: ctx.number
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      var _a;
      const rectPoints = [
        { x: content.x - content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y + content.height / 2 },
        { x: content.x - content.width / 2, y: content.y + content.height / 2 }
      ];
      const points = ctx.getRoundedRectPoints(content, content.radius, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const lines = Array.from(ctx.iteratePolygonLines(points));
      const geometryLines = [
        { type: "arc", curve: { x: content.x - content.width / 2 + content.radius, y: content.y - content.height / 2 + content.radius, r: content.radius, startAngle: 180, endAngle: 270 } },
        [{ x: content.x - content.width / 2 + content.radius, y: content.y - content.height / 2 }, { x: content.x + content.width / 2 - content.radius, y: content.y - content.height / 2 }],
        { type: "arc", curve: { x: content.x + content.width / 2 - content.radius, y: content.y - content.height / 2 + content.radius, r: content.radius, startAngle: 270, endAngle: 360 } },
        [{ x: content.x + content.width / 2, y: content.y - content.height / 2 + content.radius }, { x: content.x + content.width / 2, y: content.y + content.height / 2 - content.radius }],
        { type: "arc", curve: { x: content.x + content.width / 2 - content.radius, y: content.y + content.height / 2 - content.radius, r: content.radius, startAngle: 0, endAngle: 90 } },
        [{ x: content.x + content.width / 2 - content.radius, y: content.y + content.height / 2 }, { x: content.x - content.width / 2 + content.radius, y: content.y + content.height / 2 }],
        { type: "arc", curve: { x: content.x - content.width / 2 + content.radius, y: content.y + content.height / 2 - content.radius, r: content.radius, startAngle: 80, endAngle: 180 } },
        [{ x: content.x - content.width / 2, y: content.y + content.height / 2 - content.radius }, { x: content.x - content.width / 2, y: content.y - content.height / 2 + content.radius }]
      ];
      return {
        lines: geometryLines,
        points: rectPoints,
        arcPoints: [
          { x: rectPoints[0].x + content.radius, y: rectPoints[0].y },
          { x: rectPoints[0].x, y: rectPoints[0].y + content.radius },
          { x: rectPoints[1].x - content.radius, y: rectPoints[1].y },
          { x: rectPoints[1].x, y: rectPoints[1].y + content.radius },
          { x: rectPoints[2].x - content.radius, y: rectPoints[2].y },
          { x: rectPoints[2].x, y: rectPoints[2].y - content.radius },
          { x: rectPoints[3].x + content.radius, y: rectPoints[3].y },
          { x: rectPoints[3].x, y: rectPoints[3].y - content.radius }
        ],
        bounding: ctx.getGeometryLinesBounding(geometryLines),
        renderingLines: ctx.dashedPolylineToLines(ctx.polygonToPolyline(points), content.dashArray),
        regions: ctx.hasFill(content) ? [
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
    type: "rounded rect",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.angleDeltaModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy);
      content.width *= sx;
      content.height *= sy;
      content.radius *= sx;
    },
    offset(content, point, distance, contents) {
      var _a;
      if (!distance) {
        distance = Math.min(...getGeometries(content, contents).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point, contents)) ? -2 : 2;
      return ctx.produce(content, (d) => {
        d.width += distance;
        d.height += distance;
      });
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { renderingLines } = getGeometries(content, renderCtx.contents);
      return target.renderPath(renderingLines, options);
    },
    renderIfSelected(content, { color, target, strokeWidth, contents }) {
      const { points, arcPoints } = getGeometries(content, contents);
      return target.renderGroup(points.map((p, i) => target.renderPolyline([arcPoints[2 * i], p, arcPoints[2 * i + 1]], { strokeColor: color, dashArray: [4], strokeWidth })));
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getGeometries(content, contents);
        return {
          editPoints: [
            { x: content.x, y: content.y, direction: "center" },
            { ...points[0], direction: "left-top" },
            { ...points[1], direction: "right-top" },
            { ...points[2], direction: "right-bottom" },
            { ...points[3], direction: "left-bottom" }
          ].map((p) => ({
            x: p.x,
            y: p.y,
            cursor: ctx.getResizeCursor(0, p.direction),
            update(c, { cursor, start, scale }) {
              if (!isRoundedRectContent(c)) {
                return;
              }
              const offset = ctx.getResizeOffset(start, cursor, p.direction);
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
    getSnapPoints(content, contents) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points } = getGeometries(content, contents);
        return [
          { x: content.x, y: content.y, type: "center" },
          ...points.map((p) => ({ ...p, type: "endpoint" })),
          ...Array.from(ctx.iteratePolygonLines(points)).map(([start, end]) => ({
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
            type: "midpoint"
          }))
        ];
      });
    },
    getGeometries,
    canSelectPart: true,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isRoundedRectContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isRoundedRectContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isRoundedRectContent(c)) {
            c.y = v;
          }
        }) }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.width, setValue: (v) => update((c) => {
          if (isRoundedRectContent(c)) {
            c.width = v;
          }
        }) }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.height, setValue: (v) => update((c) => {
          if (isRoundedRectContent(c)) {
            c.height = v;
          }
        }) }),
        radius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.radius, setValue: (v) => update((c) => {
          if (isRoundedRectContent(c)) {
            c.radius = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getAngleDeltaContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, RoundedRectContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getGeometries(content, contents).points)
  };
}
function isRoundedRectContent(content) {
  return content.type === "rounded rect";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("path", { d: "M 35 11 L 65 11 L 65 11 L 67 11 L 69 11 L 71 12 L 73 13 L 75 13 L 77 14 L 79 16 L 81 17 L 82 18 L 84 20 L 85 22 L 86 24 L 87 25 L 88 27 L 89 30 L 89 32 L 89 34 L 90 36 L 90 36 L 90 66 L 90 66 L 89 68 L 89 70 L 89 72 L 88 74 L 87 76 L 86 78 L 85 80 L 84 82 L 82 83 L 81 85 L 79 86 L 77 87 L 75 88 L 73 89 L 71 90 L 69 90 L 67 90 L 65 91 L 65 91 L 35 91 L 35 91 L 33 90 L 31 90 L 29 90 L 26 89 L 24 88 L 23 87 L 21 86 L 19 85 L 17 83 L 16 82 L 15 80 L 13 78 L 12 76 L 12 74 L 11 72 L 10 70 L 10 68 L 10 66 L 10 66 L 10 36 L 10 36 L 10 34 L 10 32 L 11 30 L 12 27 L 12 25 L 13 23 L 15 22 L 16 20 L 17 18 L 19 17 L 21 16 L 22 14 L 24 13 L 26 13 L 29 12 L 31 11 L 33 11 L 35 11", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" }));
  return {
    name: "create rounded rect",
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create rounded rect",
        (c) => onEnd({
          updateContents: (contents) => {
            const width = Math.abs(c[0].x - c[1].x);
            const height = Math.abs(c[0].y - c[1].y);
            contents.push({
              type: "rounded rect",
              x: (c[0].x + c[1].x) / 2,
              y: (c[0].y + c[1].y) / 2,
              width,
              height,
              radius: Math.round(Math.min(width, height) / 4),
              strokeStyleId,
              fillStyleId
            });
          }
        }),
        {
          once: true
        }
      );
      const assistentContents = [];
      if (line) {
        const width = Math.abs(line[0].x - line[1].x);
        const height = Math.abs(line[0].y - line[1].y);
        assistentContents.push({
          type: "rounded rect",
          x: (line[0].x + line[1].x) / 2,
          y: (line[0].y + line[1].y) / 2,
          width,
          height,
          radius: Math.round(Math.min(width, height) / 4),
          strokeStyleId,
          fillStyleId
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
      };
    },
    selectCount: 0
  };
}
export {
  getCommand,
  getModel,
  isRoundedRectContent
};
`,
`// dev/cad-editor/plugins/scale.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "12,11 91,11 91,90 12,90", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "40", y: "37", width: "42", height: "42", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "scale",
    useCommand({ onEnd, scale, type, selected, contents }) {
      const [data, setData] = React.useState();
      const [cursor, setCursor] = React.useState();
      let message = "";
      if (type) {
        message = data ? "specify scale" : "specify center point";
      }
      const { input, setInputPosition, resetInput, setCursorPosition } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === "Enter" && data) {
          const value = +text;
          if (!isNaN(value) && value > 0) {
            onEnd({
              updateContents(contents2, selected2) {
                contents2.forEach((content, index) => {
                  var _a, _b;
                  if (content && ctx.isSelected([index], selected2)) {
                    const result = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.scale) == null ? void 0 : _b.call(_a, content, data.center, value, value, contents2);
                    if (result) {
                      contents2[index] = result;
                    }
                  }
                });
              }
            });
            reset();
          }
        }
      } : void 0);
      const reset = () => {
        setData(void 0);
        setCursor(void 0);
        resetInput();
      };
      return {
        onStart(s) {
          var _a, _b, _c;
          if (!type) return;
          if (!data) {
            const boundings = [];
            for (const c of selected) {
              const bounding2 = (_c = (_b = (_a = ctx.getContentModel(c.content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, c.content, contents)) == null ? void 0 : _c.bounding;
              if (bounding2) {
                boundings.push(bounding2);
              }
            }
            const bounding = ctx.mergeBoundings(boundings);
            if (bounding) {
              const size = ctx.getTwoPointsFormRegionSize(bounding);
              setData({ center: s, size: Math.max(size.width, size.height) });
            }
          } else {
            onEnd();
            reset();
          }
        },
        onMove(p, c) {
          if (!type) return;
          setInputPosition(c || p);
          setCursorPosition(c || p);
          if (data) {
            setCursor(p);
          }
        },
        reset,
        input,
        updateSelectedContent(content, contents2, selected2) {
          if (data && cursor) {
            const sx = ctx.getTwoNumbersDistance(cursor.x, data.center.x) / data.size;
            const sy = ctx.getTwoNumbersDistance(cursor.y, data.center.y) / data.size;
            if (!sx || !sy) {
              return {};
            }
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              var _a, _b;
              return (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.scale) == null ? void 0 : _b.call(_a, draft, data.center, sx, sy, contents2);
            });
            const assistentContents = ctx.updateReferencedContents(content, newContent, contents2, selected2);
            return {
              patches,
              assistentContents
            };
          }
          return {};
        },
        assistentContents: data && cursor ? [
          {
            type: "line",
            dashArray: [4 / scale],
            points: [data.center, cursor]
          }
        ] : void 0
      };
    },
    contentSelectable(content) {
      var _a;
      return !content.readonly && ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.scale) !== void 0;
    },
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/shortest.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "24,50 24,56 23,61 22,67 20,72 18,77 15,82 12,87 9,91 5,95 1,99 -3,102 -8,105 -13,108 -18,110 -23,112 -29,113 -34,114 -40,114 -46,114 -51,113 -57,112 -62,110 -67,108 -72,105 -77,102 -81,99 -85,95 -89,91 -92,87 -95,82 -98,77 -100,72 -102,67 -103,61 -104,56 -104,50 -104,44 -103,39 -102,33 -100,28 -98,23 -95,18 -92,13 -89,9 -85,5 -81,1 -77,-2 -72,-5 -67,-8 -62,-10 -57,-12 -51,-13 -46,-14 -40,-14 -34,-14 -29,-13 -23,-12 -18,-10 -13,-8 -8,-5 -3,-2 1,1 5,5 9,9 12,13 15,18 18,23 20,28 22,33 23,39 24,44 24,50", strokeWidth: "4", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "204,50 204,56 203,61 202,67 200,72 198,77 195,82 192,87 189,91 185,95 181,99 177,102 172,105 167,108 162,110 157,112 151,113 146,114 140,114 134,114 129,113 123,112 118,110 113,108 108,105 103,102 99,99 95,95 91,91 88,87 85,82 82,77 80,72 78,67 77,61 76,56 76,50 76,44 77,39 78,33 80,28 82,23 85,18 88,13 91,9 95,5 99,1 103,-2 108,-5 113,-8 118,-10 123,-12 129,-13 134,-14 140,-14 146,-14 151,-13 157,-12 162,-10 167,-8 172,-5 177,-2 181,1 185,5 189,9 192,13 195,18 198,23 200,28 202,33 203,39 204,44 204,50", strokeWidth: "4", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "24,50 76,50", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "24", cy: "50", r: "6", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "76", cy: "50", r: "6", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "shortest",
    execute({ contents, selected }) {
      var _a, _b, _c, _d;
      const first = contents[selected[0][0]];
      if (!first) return;
      const firstGeometries = (_b = (_a = ctx.getContentModel(first)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, first, contents);
      if (!firstGeometries) return;
      const second = contents[selected[1][0]];
      if (!second) return;
      const secondGeometries = (_d = (_c = ctx.getContentModel(second)) == null ? void 0 : _c.getGeometries) == null ? void 0 : _d.call(_c, second, contents);
      if (!secondGeometries) return;
      const result = ctx.getShortestDistanceOfTwoGeometryLines(firstGeometries.lines, secondGeometries.lines);
      if (result && ctx.largerThan(result.distance, 0)) {
        contents.push({ type: "line", points: result.points });
      }
    },
    contentSelectable(content, contents) {
      return ctx.contentIsDeletable(content, contents);
    },
    selectCount: 2,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/skew.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "5", y: "5", width: "51", height: "89", strokeWidth: "5", strokeDasharray: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "40,5 92,5 57,95 5,95", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return {
    name: "skew",
    useCommand({ onEnd, scale, type, selected, contents }) {
      const [data, setData] = React.useState();
      const [cursor, setCursor] = React.useState();
      let message = "";
      if (type) {
        message = data ? "specify skew" : "specify center point";
      }
      const { input, setInputPosition, resetInput, setCursorPosition } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === "Enter" && data) {
          const value = +text;
          if (!isNaN(value)) {
            onEnd({
              updateContents(contents2, selected2) {
                contents2.forEach((content, index) => {
                  var _a, _b;
                  if (content && ctx.isSelected([index], selected2)) {
                    const result = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.skew) == null ? void 0 : _b.call(_a, content, data.center, value, 0, contents2);
                    if (result) {
                      contents2[index] = result;
                    }
                  }
                });
              }
            });
            reset();
          }
        }
      } : void 0);
      const reset = () => {
        setData(void 0);
        setCursor(void 0);
        resetInput();
      };
      return {
        onStart(s) {
          var _a, _b, _c;
          if (!type) return;
          if (!data) {
            const boundings = [];
            for (const c of selected) {
              const bounding2 = (_c = (_b = (_a = ctx.getContentModel(c.content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, c.content, contents)) == null ? void 0 : _c.bounding;
              if (bounding2) {
                boundings.push(bounding2);
              }
            }
            const bounding = ctx.mergeBoundings(boundings);
            if (bounding) {
              const size = ctx.getTwoPointsFormRegionSize(bounding);
              setData({ center: s, size: Math.max(size.width, size.height) });
            }
          } else {
            onEnd();
            reset();
          }
        },
        onMove(p, c) {
          if (!type) return;
          setInputPosition(c || p);
          setCursorPosition(c || p);
          if (data) {
            setCursor(p);
          }
        },
        reset,
        input,
        updateSelectedContent(content, contents2, selected2) {
          if (data && cursor) {
            const sx = (cursor.x - data.center.x) / data.size;
            if (!sx) {
              return {};
            }
            const sy = (cursor.y - data.center.y) / data.size;
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              var _a, _b;
              return (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.skew) == null ? void 0 : _b.call(_a, draft, data.center, sx, sy, contents2);
            });
            const assistentContents = ctx.updateReferencedContents(content, newContent, contents2, selected2);
            return {
              patches,
              assistentContents
            };
          }
          return {};
        },
        assistentContents: data && cursor ? [
          {
            type: "line",
            dashArray: [4 / scale],
            points: [data.center, cursor]
          }
        ] : void 0
      };
    },
    contentSelectable(content) {
      var _a;
      return !content.readonly && ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.skew) !== void 0;
    },
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/spline.plugin.tsx
function getModel(ctx) {
  const SplineContent = ctx.and(ctx.BaseContent("spline"), ctx.StrokeFields, ctx.FillFields, ctx.SegmentCountFields, {
    points: [ctx.Position],
    fitting: ctx.optional(ctx.or(ctx.boolean, "closed"))
  });
  const SplineArrowContent = ctx.and(ctx.BaseContent("spline arrow"), ctx.StrokeFields, ctx.SegmentCountFields, {
    points: [ctx.Position],
    fitting: ctx.optional(ctx.boolean)
  });
  const getSplineRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const getSplineArrowRefIds = (content) => ctx.getStrokeRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getSplineGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getSplineRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      var _a;
      let points;
      let lines;
      const splineSegmentCount = (_a = content.segmentCount) != null ? _a : ctx.defaultSegmentCount;
      if (content.points.length > 2) {
        if (content.fitting === "closed") {
          lines = ctx.getBezierSplineCurves([...content.points.slice(content.points.length - 3), ...content.points, ...content.points.slice(0, 3)]).map((c) => ({ type: "bezier curve", curve: c }));
          lines = lines.slice(3, lines.length - 2);
        } else if (content.fitting) {
          lines = ctx.getBezierSplineCurves(content.points).map((c) => ({ type: "bezier curve", curve: c }));
        } else if (content.points.length === 3) {
          lines = ctx.getQuadraticSplineCurves(content.points).map((c) => ({ type: "quadratic curve", curve: c }));
        } else {
          lines = ctx.getBezierSplineCurves(content.points, false).map((c) => ({ type: "bezier curve", curve: c }));
        }
        points = ctx.getGeometryLinesPoints(lines, splineSegmentCount);
      } else {
        points = content.points;
        lines = Array.from(ctx.iteratePolylineLines(points));
      }
      return {
        lines,
        points,
        bounding: ctx.getGeometryLinesBounding(lines),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: ctx.hasFill(content) ? [
          {
            lines,
            points: content.points
          }
        ] : void 0
      };
    });
  }
  function getSplineArrowGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getSplineArrowRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      const geometry = getSplineGeometries(content, contents);
      let arrowPoints;
      let points = geometry.points;
      if (content.points.length > 1) {
        const p1 = content.points[content.points.length - 2];
        const p2 = content.points[content.points.length - 1];
        const r = ctx.getArrowPoints(p1, p2, content);
        arrowPoints = r.arrowPoints;
        const index = points.findIndex((p) => ctx.getTwoPointsDistance(p, p2) < r.distance);
        points = [...points.slice(0, index), r.endPoint];
      }
      const lines = Array.from(ctx.iteratePolylineLines(points));
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray),
        regions: arrowPoints ? [
          {
            points: arrowPoints,
            lines: Array.from(ctx.iteratePolygonLines(arrowPoints))
          }
        ] : void 0
      };
    });
  }
  const React = ctx.React;
  const splineModel = {
    type: "spline",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    ...ctx.segmentCountModel,
    move(content, offset) {
      for (const point of content.points) {
        ctx.movePoint(point, offset);
      }
    },
    rotate(content, center, angle) {
      for (const point of content.points) {
        ctx.rotatePoint(point, center, angle);
      }
    },
    scale(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.scalePoint(point, center, sx, sy);
      }
    },
    skew(content, center, sx, sy) {
      for (const point of content.points) {
        ctx.skewPoint(point, center, sx, sy);
      }
    },
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    break(content, intersectionPoints, contents) {
      const lines = getSplineGeometries(content, contents).lines;
      return ctx.breakGeometryLinesToPathCommands(lines, intersectionPoints);
    },
    explode(content, contents) {
      const lines = getSplineGeometries(content, contents).lines;
      return [{ type: "path", commands: ctx.geometryLineToPathCommands(lines) }];
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getSplineGeometries(content, renderCtx.contents);
      return target.renderPolyline(points, options);
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        points: /* @__PURE__ */ React.createElement(
          ctx.ArrayEditor,
          {
            inline: true,
            ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
              if (isSplineContent(c)) {
                v(c);
              }
            })),
            items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
              ctx.ObjectEditor,
              {
                inline: true,
                properties: {
                  from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                    if (isSplineContent(c)) {
                      c.points[i].x = p.x, c.points[i].y = p.y;
                    }
                  })) }, "canvas"),
                  x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.x, setValue: (v) => update((c) => {
                    if (isSplineContent(c)) {
                      c.points[i].x = v;
                    }
                  }) }),
                  y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.y, setValue: (v) => update((c) => {
                    if (isSplineContent(c)) {
                      c.points[i].y = v;
                    }
                  }) })
                }
              }
            ))
          }
        ),
        fitting: /* @__PURE__ */ React.createElement(ctx.EnumEditor, { enums: ["true", "false", "closed"], value: content.fitting === "closed" ? "closed" : content.fitting ? "true" : "false", setValue: (v) => update((c) => {
          if (isSplineContent(c)) {
            c.fitting = v === "closed" ? "closed" : v === "true" ? true : void 0;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, SplineContent, p),
    getRefIds: getSplineRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    reverse: (content) => ({
      ...content,
      points: content.points.slice().reverse()
    })
  };
  return [
    splineModel,
    {
      type: "spline arrow",
      ...ctx.strokeModel,
      ...ctx.arrowModel,
      ...ctx.segmentCountModel,
      move: splineModel.move,
      rotate: splineModel.rotate,
      scale: splineModel.scale,
      mirror: splineModel.mirror,
      render(content, renderCtx) {
        const { options, target, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
        const { regions, renderingLines } = getSplineArrowGeometries(content, renderCtx.contents);
        const children = [];
        for (const line of renderingLines) {
          children.push(target.renderPolyline(line, options));
        }
        if (regions) {
          for (let i = 0; i < 2 && i < regions.length; i++) {
            children.push(target.renderPolyline(regions[i].points, fillOptions));
          }
        }
        return target.renderGroup(children);
      },
      renderIfSelected: splineModel.renderIfSelected,
      getOperatorRenderPosition: splineModel.getOperatorRenderPosition,
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isSplineArrowContent, false, true) }));
      },
      getSnapPoints: splineModel.getSnapPoints,
      getGeometries: getSplineArrowGeometries,
      propertyPanel(content, update, contents, { acquirePoint }) {
        return {
          points: /* @__PURE__ */ React.createElement(
            ctx.ArrayEditor,
            {
              inline: true,
              ...ctx.getArrayEditorProps((v) => v.points, { x: 0, y: 0 }, (v) => update((c) => {
                if (isSplineArrowContent(c)) {
                  v(c);
                }
              })),
              items: content.points.map((f, i) => /* @__PURE__ */ React.createElement(
                ctx.ObjectEditor,
                {
                  inline: true,
                  properties: {
                    from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
                      if (isSplineArrowContent(c)) {
                        c.points[i].x = p.x, c.points[i].y = p.y;
                      }
                    })) }, "canvas"),
                    x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.x, setValue: (v) => update((c) => {
                      if (isSplineArrowContent(c)) {
                        c.points[i].x = v;
                      }
                    }) }),
                    y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: f.y, setValue: (v) => update((c) => {
                      if (isSplineArrowContent(c)) {
                        c.points[i].y = v;
                      }
                    }) })
                  }
                }
              ))
            }
          ),
          fitting: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.fitting === true, setValue: (v) => update((c) => {
            if (isSplineArrowContent(c)) {
              c.fitting = v ? true : void 0;
            }
          }) }),
          ...ctx.getStrokeContentPropertyPanel(content, update, contents),
          ...ctx.getArrowContentPropertyPanel(content, update),
          ...ctx.getSegmentCountContentPropertyPanel(content, update)
        };
      },
      isValid: (c, p) => ctx.validate(c, SplineArrowContent, p),
      getRefIds: getSplineArrowRefIds,
      updateRefId: ctx.updateStrokeRefIds,
      deleteRefId: ctx.deleteStrokeRefIds,
      reverse: (content) => ({
        ...content,
        points: content.points.slice().reverse()
      })
    }
  ];
}
function isSplineContent(content) {
  return content.type === "spline";
}
function isSplineArrowContent(content) {
  return content.type === "spline arrow";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "13", cy: "22", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "79", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "63", cy: "22", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "85", cy: "80", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "13,22 14,24 14,26 15,29 15,31 16,33 17,34 17,36 18,38 18,40 19,41 20,43 20,44 21,46 22,47 22,49 23,50 23,51 24,52 25,53 25,54 26,55 27,56 27,56 28,57 29,58 29,58 30,59 31,59 31,59 32,60 33,60 33,60 34,60 35,60 35,60 36,60 37,60 37,59 38,59 39,58 39,58 40,57 41,57 41,56 42,55 43,55 43,54 44,53 45,52 46,51 46,49 47,48 48,47 48,46 49,46 50,45 50,44 51,44 52,43 53,43 53,42 54,42 55,42 56,41 56,41 57,41 58,41 59,41 59,41 60,42 61,42 62,42 63,43 63,43 64,44 65,44 66,45 67,46 67,47 68,47 69,48 70,49 71,51 71,52 72,53 73,54 74,56 75,57 76,59 76,60 77,62 78,64 79,65 80,67 81,69 82,71 82,73 83,75 84,78 85,80", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "13", cy: "22", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "79", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "63", cy: "22", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "85", cy: "80", r: "5", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "13,22 13,23 13,24 13,25 13,26 13,27 14,28 14,29 14,30 14,31 14,31 14,32 14,33 14,34 14,35 14,36 14,37 15,38 15,39 15,40 15,41 15,42 15,43 15,43 15,44 15,45 15,46 15,47 16,48 16,49 16,49 16,50 16,51 16,52 16,53 16,54 16,54 17,55 17,56 17,57 17,58 17,58 17,59 17,60 17,61 18,61 18,62 18,63 18,63 18,64 18,65 18,65 18,66 19,67 19,67 19,68 19,69 19,69 19,70 19,70 20,71 20,71 20,72 20,72 20,73 20,73 21,74 21,74 21,75 21,75 21,75 21,76 22,76 22,77 22,77 22,77 22,78 23,78 23,78 23,78 23,79 23,79 24,79 24,79 24,79 24,79 25,80 25,80 25,80 25,80 25,80 26,80 26,80 26,80 26,80 27,80 27,80 27,79 27,79 28,79 28,79 28,79 29,79 29,78 29,78 29,78 30,77 30,77 30,77 31,76 31,76 31,76 32,75 32,75 32,74 32,74 33,73 33,73 33,72 34,72 34,71 34,71 35,70 35,69 35,69 36,68 36,68 37,67 37,66 37,66 38,65 38,64 38,64 39,63 39,62 39,62 40,61 40,60 40,59 41,59 41,58 42,57 42,56 42,56 43,55 43,54 43,53 44,53 44,52 45,51 45,50 45,50 46,49 46,48 46,47 47,47 47,46 48,45 48,44 48,44 49,43 49,42 50,41 50,41 50,40 51,39 51,39 51,38 52,37 52,37 53,36 53,35 53,35 54,34 54,33 54,33 55,32 55,31 55,31 56,30 56,30 57,29 57,29 57,28 58,28 58,27 58,27 59,26 59,26 59,25 60,25 60,25 60,24 61,24 61,24 61,23 62,23 62,23 62,22 63,22 63,22 63,22 64,22 64,22 64,21 65,21 65,21 65,21 65,21 66,21 66,21 66,21 67,21 67,21 67,22 67,22 68,22 68,22 68,22 69,22 69,23 69,23 69,23 70,23 70,24 70,24 70,24 71,25 71,25 71,25 71,26 72,26 72,27 72,27 72,27 73,28 73,28 73,29 73,29 73,30 74,31 74,31 74,32 74,32 75,33 75,33 75,34 75,35 75,35 76,36 76,37 76,37 76,38 76,39 77,39 77,40 77,41 77,42 77,42 78,43 78,44 78,45 78,46 78,46 79,47 79,48 79,49 79,50 79,50 80,51 80,52 80,53 80,54 80,55 80,56 81,57 81,57 81,58 81,59 81,60 82,61 82,62 82,63 82,64 82,65 82,66 83,67 83,68 83,69 83,69 83,70 83,71 84,72 84,73 84,74 84,75 84,76 84,77 85,78 85,79 85,80", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  const icon3 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "8,93 8,90 8,87 8,83 8,81 8,78 9,75 9,72 9,70 9,67 10,65 10,62 10,60 11,58 11,56 12,54 12,53 13,51 13,49 14,48 15,46 15,45 16,44 17,43 17,42 18,41 19,40 20,39 21,39 22,38 23,38 24,38 25,38 26,37 27,37 28,38 29,38 30,38 32,38 33,39 34,40 36,40 37,41 38,42 40,43 41,44 43,45 44,46 46,48 47,49 49,51 51,53 52,54 54,55 55,57 57,58 58,59 60,60 61,61 62,62 64,62 65,63 66,63 68,64 69,64 70,64 71,64 72,64 73,64 74,64 75,64 76,63 77,63 78,62 79,62 80,61 81,60 81,59 82,58 83,56 83,55 84,54 85,52 85,51 86,49 86,47 87,45 87,43 88,41 88,39 88,37 89,34 89,32 89,29 89,26 90,24 90,21 90,18 90,17", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "90,8 98,37 82,37", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  const splineCommand = {
    name: "create spline",
    type: [
      { name: "spline", hotkey: "SPL", icon: icon1 },
      { name: "spline fitting", icon: icon2 }
    ],
    useCommand({ onEnd, type, scale, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "spline" || type === "spline fitting",
        (c) => onEnd({
          updateContents: (contents) => contents.push({ points: c, type: "spline", strokeStyleId, fillStyleId, fitting: type === "spline fitting" })
        })
      );
      const assistentContents = [];
      if (line) {
        assistentContents.push(
          { points: line, type: "spline", strokeStyleId, fillStyleId, fitting: type === "spline fitting" },
          { points: line, type: "polyline", dashArray: [4 / scale] }
        );
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
      };
    },
    selectCount: 0
  };
  return [
    splineCommand,
    {
      name: "create spline arrow",
      icon: icon3,
      useCommand({ onEnd, type, scale, strokeStyleId }) {
        const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
          type === "create spline arrow",
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, strokeStyleId, type: "spline arrow" })
          })
        );
        const assistentContents = [];
        if (line) {
          assistentContents.push(
            { points: line, strokeStyleId, type: "spline arrow" },
            { points: line, type: "polyline", dashArray: [4 / scale] }
          );
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition,
          reset
        };
      },
      selectCount: 0
    }
  ];
}
export {
  getCommand,
  getModel,
  isSplineArrowContent,
  isSplineContent
};
`,
`// dev/cad-editor/plugins/star.plugin.tsx
function getModel(ctx) {
  const StarContent = ctx.and(ctx.BaseContent("star"), ctx.StrokeFields, ctx.FillFields, ctx.Position, {
    outerRadius: ctx.number,
    innerRadius: ctx.number,
    count: ctx.number,
    angle: ctx.optional(ctx.number)
  });
  const getRefIds = (content) => ctx.getStrokeAndFillRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  function getStarGeometriesFromCache(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      var _a;
      const angle = -((_a = content.angle) != null ? _a : 0);
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
        regions: ctx.hasFill(content) ? [
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
      ctx.movePoint(content, offset);
    },
    scale(content, center, sx, sy, contents) {
      if (sx !== sy) {
        const points = ctx.produce(getStarGeometriesFromCache(content, contents).points, (draft) => {
          for (const p of draft) {
            ctx.scalePoint(p, center, sx, sy);
          }
        });
        return { ...content, points, type: "polygon" };
      }
      ctx.scalePoint(content, center, sx, sy);
      content.innerRadius *= sx;
      content.outerRadius *= sy;
      return;
    },
    skew(content, center, sx, sy, contents) {
      const points = ctx.produce(getStarGeometriesFromCache(content, contents).points, (draft) => {
        for (const p of draft) {
          ctx.skewPoint(p, center, sx, sy);
        }
      });
      return { ...content, points, type: "polygon" };
    },
    break(content, intersectionPoints, contents) {
      const { lines } = getStarGeometriesFromCache(content, contents);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    offset(content, point, distance, contents) {
      var _a;
      if (!distance) {
        distance = Math.min(...getStarGeometriesFromCache(content, contents).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point, contents)) ? -1 : 1;
      const angle = Math.PI / content.count;
      const length = Math.sqrt(content.innerRadius ** 2 + content.outerRadius ** 2 - 2 * content.innerRadius * content.outerRadius * Math.cos(angle));
      distance *= length / Math.sin(angle);
      return ctx.produce(content, (d) => {
        d.outerRadius += distance / content.innerRadius;
        d.innerRadius += distance / content.outerRadius;
      });
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getStarGeometriesFromCache(content, renderCtx.contents);
      return target.renderPolygon(points, options);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getStarGeometriesFromCache(content, contents);
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
    propertyPanel(content, update, contents, { acquirePoint }) {
      var _a;
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isStarContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isStarContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isStarContent(c)) {
            c.y = v;
          }
        }) }),
        outerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.outerRadius, setValue: (v) => update((c) => {
          if (isStarContent(c)) {
            c.outerRadius = v;
          }
        }) }),
        innerRadius: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.innerRadius, setValue: (v) => update((c) => {
          if (isStarContent(c)) {
            c.innerRadius = v;
          }
        }) }),
        count: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.count, setValue: (v) => update((c) => {
          if (isStarContent(c)) {
            c.count = v;
          }
        }) }),
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_a = content.angle) != null ? _a : 0, setValue: (v) => update((c) => {
          if (isStarContent(c)) {
            c.angle = v === 0 ? void 0 : v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, StarContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    deleteRefId: ctx.deleteStrokeAndFillRefIds,
    isPointIn: (content, point, contents) => ctx.pointInPolygon(point, getStarGeometriesFromCache(content, contents).points)
  };
}
function isStarContent(content) {
  return content.type === "star";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polygon", { points: "75,84 70,56 90,36 62,32 49,7 37,33 9,37 29,56 25,84 50,71", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create star",
    icon,
    useCommand({ onEnd, type, strokeStyleId, fillStyleId }) {
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
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
              angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p1, p0)),
              strokeStyleId,
              fillStyleId
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
          angle: ctx.radianToAngle(ctx.getTwoPointsRadian(p1, p0)),
          strokeStyleId,
          fillStyleId
        });
      }
      return {
        onStart: onClick,
        input,
        onMove,
        assistentContents,
        lastPosition,
        reset
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
`// dev/cad-editor/plugins/stroke-style.plugin.tsx
function getModel(ctx) {
  function getGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, /* @__PURE__ */ new Set(), () => {
      const points = [
        { x: content.x, y: content.y },
        { x: content.x + content.width, y: content.y },
        { x: content.x + content.width, y: content.y + content.height },
        { x: content.x, y: content.y + content.height }
      ];
      return {
        lines: [],
        bounding: ctx.getPointsBounding(points),
        regions: [
          {
            points,
            lines: Array.from(ctx.iteratePolygonLines(points))
          }
        ],
        renderingLines: []
      };
    });
  }
  const React = ctx.React;
  return {
    type: "stroke style",
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, transformColor }) {
      var _a;
      const options = {
        strokeColor: getStrokeColor(content),
        strokeWidth: transformStrokeWidth((_a = content.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        dashArray: content.dashArray,
        strokeOpacity: content.strokeOpacity
      };
      return target.renderGroup([
        target.renderRect(content.x, content.y, content.width, content.height, {
          strokeColor: transformColor(content.isCurrent ? 16711680 : 0)
        }),
        target.renderPolyline([
          { x: content.x, y: content.y + content.height / 2 },
          { x: content.x + content.width, y: content.y + content.height / 2 }
        ], options)
      ]);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!ctx.isStrokeStyleContent(c)) {
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
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        isCurrent: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.isCurrent === true, setValue: (v) => update((c, draft) => {
          if (ctx.isStrokeStyleContent(c)) {
            const currentStrokeStyle = ctx.getStrokeStyles(contents).find((s) => s.content.isCurrent);
            if (currentStrokeStyle) {
              const c2 = draft[currentStrokeStyle.index];
              if (c2 && ctx.isStrokeStyleContent(c2)) {
                c2.isCurrent = void 0;
              }
            }
            c.isCurrent = v ? true : void 0;
          }
        }) }),
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (ctx.isStrokeStyleContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (ctx.isStrokeStyleContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (ctx.isStrokeStyleContent(c)) {
            c.y = v;
          }
        }) }),
        width: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.width, setValue: (v) => update((c) => {
          if (ctx.isStrokeStyleContent(c)) {
            c.width = v;
          }
        }) }),
        height: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.height, setValue: (v) => update((c) => {
          if (ctx.isStrokeStyleContent(c)) {
            c.height = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, ctx.StrokeStyleContent, p)
  };
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "0,22 100,22", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "0,45 100,45", strokeWidth: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "0,65 100,65", strokeWidth: "5", strokeDasharray: "10 5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "0,81 100,81", strokeWidth: "5", strokeDasharray: "15", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create stroke style",
    selectCount: 0,
    icon,
    useCommand({ onEnd, type, scale }) {
      const [result, setResult] = React.useState();
      const reset = () => {
        setResult(void 0);
      };
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result);
                }
              }
            });
            reset();
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: "stroke style",
              x: p.x,
              y: p.y,
              width: 100 / scale,
              height: 20 / scale
            });
          }
        },
        assistentContents: result ? [result] : void 0,
        reset
      };
    }
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/cad-editor/plugins/table.plugin.tsx
function getModel(ctx) {
  const TableCellText = ctx.and(ctx.TextFields, {
    type: "table cell text",
    text: ctx.string,
    column: ctx.number
  });
  const TableRow = {
    height: ctx.number,
    cells: ctx.optional([TableCellText])
  };
  const MergedCell = {
    row: ctx.tuple(ctx.number, ctx.number),
    column: ctx.tuple(ctx.number, ctx.number)
  };
  const TableContent = ctx.and(ctx.BaseContent("table"), ctx.Position, ctx.StrokeFields, {
    rows: [TableRow],
    widths: [ctx.number],
    mergedCells: ctx.optional([MergedCell])
  });
  const getRefIds = (content) => ctx.getStrokeRefIds(content);
  const geometriesCache = new ctx.WeakmapValuesCache();
  const textLayoutResultCache = new ctx.WeakmapMap3Cache();
  const getGeometries = (content, contents) => {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return geometriesCache.get(content, refs, () => {
      const lines = [];
      const width = content.widths.reduce((p, c) => p + c, 0);
      const height = content.rows.reduce((p, c) => p + c.height, 0);
      lines.push([{ x: content.x, y: content.y }, { x: content.x + width, y: content.y }]);
      lines.push([{ x: content.x, y: content.y }, { x: content.x, y: content.y + height }]);
      const rows = [];
      const columns = [];
      const xs = [];
      const ys = [];
      const children = [];
      let x = content.x;
      content.widths.forEach((w) => {
        x += w;
        xs.push(x - w / 2);
      });
      let yStart = content.y;
      content.rows.forEach((row, i) => {
        const yMiddle = yStart + row.height / 2;
        const yEnd = yStart + row.height;
        ys.push(yMiddle);
        let xStart = content.x;
        content.widths.forEach((w, j) => {
          var _a, _b, _c;
          const xMiddle = xStart + w / 2;
          const xEnd = xStart + w;
          if (!((_a = content.mergedCells) == null ? void 0 : _a.some((c) => i >= c.row[0] && i < c.row[0] + c.row[1] - 1 && j >= c.column[0] && j < c.column[0] + c.column[1]))) {
            lines.push([{ x: xStart, y: yEnd }, { x: xEnd, y: yEnd }]);
            rows.push({ x: xMiddle, y: yEnd, index: i });
          }
          if (!((_b = content.mergedCells) == null ? void 0 : _b.some((c) => i >= c.row[0] && i < c.row[0] + c.row[1] && j >= c.column[0] && j < c.column[0] + c.column[1] - 1))) {
            lines.push([{ x: xEnd, y: yStart }, { x: xEnd, y: yEnd }]);
            columns.push({ x: xEnd, y: yMiddle, index: j });
          }
          const cell = (_c = content.mergedCells) == null ? void 0 : _c.find((c) => i >= c.row[0] && i < c.row[0] + c.row[1] && j >= c.column[0] && j < c.column[0] + c.column[1]);
          if (cell) {
            if (i === cell.row[0] && j === cell.column[0]) {
              const end = {
                x: xEnd,
                y: yEnd
              };
              for (let k = 1; k < cell.column[1] && k < content.widths.length - j; k++) {
                end.x += content.widths[j + k];
              }
              for (let k = 1; k < cell.row[1] && k < content.rows.length - i; k++) {
                end.y += content.rows[i + k].height;
              }
              children.push({
                row: i,
                column: j,
                x: xStart - content.x,
                y: yStart - content.y,
                width: end.x - xStart,
                height: end.y - yStart,
                region: ctx.getPolygonFromTwoPointsFormRegion({ start: { x: xStart, y: yStart }, end })
              });
            }
          } else {
            children.push({
              row: i,
              column: j,
              x: xStart - content.x,
              y: yStart - content.y,
              width: w,
              height: row.height,
              region: ctx.getPolygonFromTwoPointsFormRegion({ start: { x: xStart, y: yStart }, end: { x: xEnd, y: yEnd } })
            });
          }
          xStart = xEnd;
        });
        yStart = yEnd;
      });
      const bounding = { start: { x: content.x, y: content.y }, end: { x: content.x + width, y: content.y + height } };
      const polygon = ctx.getPolygonFromTwoPointsFormRegion(bounding);
      return {
        lines,
        rows,
        columns,
        xs,
        ys,
        bounding,
        renderingLines: lines.map((r) => ctx.dashedPolylineToLines(r, content.dashArray)).flat(),
        regions: [{
          points: polygon,
          lines: Array.from(ctx.iteratePolygonLines(polygon))
        }],
        children
      };
    });
  };
  const React = ctx.React;
  const tableModel = {
    type: "table",
    ...ctx.strokeModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    scale(content, center, sx, sy) {
      ctx.scalePoint(content, center, sx, sy);
      for (const row of content.rows) {
        row.height *= sy;
      }
      content.widths = content.widths.map((w) => w * sx);
    },
    render(content, renderCtx) {
      const geometries = getGeometries(content, renderCtx.contents);
      const { options, strokeColor } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(strokeColor, renderCtx);
      const children = geometries.renderingLines.map((line) => renderCtx.target.renderPolyline(line, options));
      content.rows.forEach((row, i) => {
        var _a;
        (_a = row.cells) == null ? void 0 : _a.forEach((cell) => {
          var _a2, _b;
          const child = geometries.children.find((f) => f.row === i && f.column === cell.column);
          if (!child) return;
          const { width, height } = child;
          const textStyleContent = ctx.getTextStyleContent(cell, renderCtx.contents);
          const textLayout = textLayoutResultCache.get(cell, textStyleContent, width, height, () => {
            var _a3, _b2, _c;
            const state = cell.text.split("");
            const getTextWidth = (text) => {
              var _a4, _b3;
              return (_b3 = (_a4 = ctx.getTextSizeFromCache(ctx.getTextStyleFont(textStyleContent), text)) == null ? void 0 : _a4.width) != null ? _b3 : 0;
            };
            return ctx.flowLayout({
              state,
              width,
              height,
              lineHeight: (_a3 = textStyleContent.lineHeight) != null ? _a3 : textStyleContent.fontSize * 1.2,
              getWidth: getTextWidth,
              align: (_b2 = textStyleContent.align) != null ? _b2 : "center",
              verticalAlign: (_c = textStyleContent.verticalAlign) != null ? _c : "middle",
              endContent: "",
              isNewLineContent: (c) => c === "\\n",
              isPartOfComposition: (c) => ctx.isWordCharactor(c),
              getComposition: (index) => ctx.getTextComposition(index, state, getTextWidth, (c) => c)
            });
          });
          const font = ctx.getTextStyleFont(textStyleContent);
          for (const { x, y, content: text } of textLayout.layoutResult) {
            const textWidth = (_b = (_a2 = ctx.getTextSizeFromCache(font, text)) == null ? void 0 : _a2.width) != null ? _b : 0;
            children.push(renderCtx.target.renderText(content.x + child.x + x + textWidth / 2, content.y + child.y + y + textStyleContent.fontSize, text, textStyleContent.color, textStyleContent.fontSize, textStyleContent.fontFamily, { textAlign: "center", cacheKey: cell, ...textOptions }));
          }
        });
      });
      return renderCtx.target.renderGroup(children);
    },
    getEditPoints(content, contents) {
      return ctx.getEditPointsFromCache(content, () => {
        const { rows, columns, xs, ys } = getGeometries(content, contents);
        return {
          editPoints: [
            {
              x: content.x,
              y: content.y,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isTableContent(c)) {
                  return;
                }
                c.x += cursor.x - start.x;
                c.y += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            },
            ...rows.map((p) => ({
              x: p.x,
              y: p.y,
              cursor: "row-resize",
              update(c, { cursor, start, scale }) {
                if (!isTableContent(c)) {
                  return;
                }
                c.rows[p.index].height += cursor.y - start.y;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            })),
            ...columns.map((p) => ({
              x: p.x,
              y: p.y,
              cursor: "col-resize",
              update(c, { cursor, start, scale }) {
                if (!isTableContent(c)) {
                  return;
                }
                c.widths[p.index] += cursor.x - start.x;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            })),
            ...xs.map((p, i) => ({
              x: p,
              y: content.y,
              cursor: "not-allowed",
              execute(c) {
                if (isTableContent(c)) {
                  deleteTableColumn(c, i);
                }
              }
            })),
            ...ys.map((p, i) => ({
              x: content.x,
              y: p,
              cursor: "not-allowed",
              execute(c) {
                if (isTableContent(c)) {
                  deleteTableRow(c, i);
                }
              }
            })),
            ...xs.map((p, i) => ({
              x: p + content.widths[i] / 2,
              y: content.y,
              cursor: "cell",
              execute(c) {
                if (isTableContent(c)) {
                  insertTableColumn(c, i);
                }
              }
            })),
            ...ys.map((p, i) => ({
              x: content.x,
              y: p + content.rows[i].height / 2,
              cursor: "cell",
              execute(c) {
                if (isTableContent(c)) {
                  insertTableRow(c, i);
                }
              }
            }))
          ]
        };
      });
    },
    getGeometries,
    propertyPanel(content, update, contents, options) {
      var _a, _b, _c, _d, _e;
      const properties = {};
      if (options.activeChild) {
        const [row, column] = options.activeChild;
        properties.row = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { readOnly: true, value: row });
        properties.column = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { readOnly: true, value: column });
        const mergedCell = (_b = (_a = content.mergedCells) == null ? void 0 : _a.find) == null ? void 0 : _b.call(_a, (c) => c.row[0] === row && c.column[0] === column);
        properties.rowSpan = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_c = mergedCell == null ? void 0 : mergedCell.row[1]) != null ? _c : 1, setValue: (v) => update((c) => {
          if (isTableContent(c)) {
            setTableRowSpan(c, row, column, v);
          }
        }) });
        properties.columnSpan = /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_d = mergedCell == null ? void 0 : mergedCell.column[1]) != null ? _d : 1, setValue: (v) => update((c) => {
          if (isTableContent(c)) {
            setTableColumnSpan(c, row, column, v);
          }
        }) });
        const cell = (_e = content.rows[row].cells) == null ? void 0 : _e.find((c) => c.column === column);
        if (cell) {
          Object.assign(properties, ctx.getTextContentPropertyPanel(cell, (f) => update((c) => {
            if (isTableContent(c)) {
              setTableCell(c, row, column, f);
            }
          }), contents));
        }
      }
      return {
        ...properties,
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isTableContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isTableContent(c)) {
            c.y = v;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    editPanel(content, scale, update, contents, cancel, transformPosition, activeChild) {
      var _a, _b, _c;
      const p = transformPosition(content);
      if (!activeChild) return /* @__PURE__ */ React.createElement(React.Fragment, null);
      const [row, column] = activeChild;
      const cell = (_a = content.rows[row].cells) == null ? void 0 : _a.find((c) => c.column === column);
      if (!cell) return /* @__PURE__ */ React.createElement(React.Fragment, null);
      const { children } = getGeometries(content, contents);
      const child = children.find((f) => f.row === row && f.column === column);
      if (!child) return /* @__PURE__ */ React.createElement(React.Fragment, null);
      const textStyleContent = ctx.getTextStyleContent(cell, contents);
      const fontSize = textStyleContent.fontSize * scale;
      return /* @__PURE__ */ React.createElement(
        ctx.SimpleTextEditor,
        {
          fontSize,
          width: child.width * scale,
          height: child.height * scale,
          color: textStyleContent.color,
          fontFamily: textStyleContent.fontFamily,
          align: (_b = textStyleContent.align) != null ? _b : "center",
          verticalAlign: (_c = textStyleContent.verticalAlign) != null ? _c : "middle",
          lineHeight: textStyleContent.lineHeight ? textStyleContent.lineHeight * scale : void 0,
          onCancel: cancel,
          x: p.x + child.x * scale,
          y: p.y + child.y * scale,
          borderWidth: 0,
          value: cell.text,
          setValue: (v) => update((c) => {
            if (isTableContent(c)) {
              setTableCell(c, row, column, (t) => t.text = v);
            }
          })
        }
      );
    },
    isValid: (c, p) => ctx.validate(c, TableContent, p),
    getRefIds,
    getChildByPoint(content, point, contents, { textStyleId }) {
      var _a;
      const { children } = getGeometries(content, contents);
      const child = children.find((c) => ctx.pointInPolygon(point, c.region));
      if (child) {
        if (!((_a = content.rows[child.row].cells) == null ? void 0 : _a.some((c) => c.column === child.column))) {
          const [, patches, reversePatches] = ctx.produceWithPatches(content, (draft) => {
            const row = draft.rows[child.row];
            if (!row.cells) {
              row.cells = [];
            }
            row.cells.push({
              type: "table cell text",
              textStyleId,
              text: "",
              color: 0,
              fontSize: 16,
              fontFamily: "monospace",
              column: child.column
            });
          });
          return {
            child: [child.row, child.column],
            patches: [patches, reversePatches]
          };
        }
        return {
          child: [child.row, child.column]
        };
      }
      return;
    }
  };
  return [
    tableModel,
    {
      type: "table cell text",
      ...ctx.textModel,
      isValid: (c, p) => ctx.validate(c, TableCellText, p)
    }
  ];
}
function isTableContent(content) {
  return content.type === "table";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "7,10 91,10", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,10 7,87", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "35,10 35,87", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "63,10 63,87", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "91,10 91,87", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,34 91,34", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,60 91,60", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "7,87 91,87", strokeWidth: "4", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create table",
    useCommand({ onEnd, strokeStyleId }) {
      const assistentContents = [];
      const [position, setPosition] = React.useState();
      const newContent = {
        type: "table",
        x: 0,
        y: 0,
        widths: [100, 100, 100],
        rows: [
          { height: 20 },
          { height: 20 },
          { height: 20 },
          { height: 20 }
        ],
        strokeStyleId
      };
      if (position) {
        assistentContents.push({
          ...newContent,
          x: position.x,
          y: position.y
        });
      }
      return {
        onStart(p) {
          onEnd({
            updateContents: (contents) => {
              contents.push({
                ...newContent,
                x: p.x,
                y: p.y
              });
            }
          });
        },
        onMove(p) {
          setPosition(p);
        },
        assistentContents,
        reset() {
          setPosition(void 0);
        }
      };
    },
    selectCount: 0,
    icon
  };
}
function deleteTableColumn(c, i) {
  c.widths.splice(i, 1);
  if (c.mergedCells) {
    const indexes = [];
    c.mergedCells.forEach((cell, k) => {
      if (i < cell.column[0]) {
        cell.column[0]--;
      } else if (i === cell.column[0]) {
        indexes.unshift(k);
      } else if (i < cell.column[0] + cell.column[1]) {
        cell.column[1]--;
      }
    });
    indexes.forEach((d) => {
      var _a;
      return (_a = c.mergedCells) == null ? void 0 : _a.splice(d, 1);
    });
  }
}
function deleteTableRow(c, i) {
  c.rows.splice(i, 1);
  if (c.mergedCells) {
    const indexes = [];
    c.mergedCells.forEach((cell, k) => {
      if (i < cell.row[0]) {
        cell.row[0]--;
      } else if (i === cell.row[0]) {
        indexes.unshift(k);
      } else if (i < cell.row[0] + cell.row[1]) {
        cell.row[1]--;
      }
    });
    indexes.forEach((d) => {
      var _a;
      return (_a = c.mergedCells) == null ? void 0 : _a.splice(d, 1);
    });
  }
}
function setTableRowSpan(c, row, column, v) {
  if (!c.mergedCells) c.mergedCells = [];
  const index = c.mergedCells.findIndex((m) => m.row[0] === row && m.column[0] === column);
  if (index < 0) {
    c.mergedCells.push({ row: [row, v], column: [column, 1] });
  } else if (v <= 1 && c.mergedCells[index].column[1] <= 1) {
    c.mergedCells.splice(index, 1);
    if (c.mergedCells.length === 0) c.mergedCells = void 0;
  } else {
    c.mergedCells[index].row[1] = v;
  }
}
function setTableColumnSpan(c, row, column, v) {
  if (!c.mergedCells) c.mergedCells = [];
  const index = c.mergedCells.findIndex((m) => m.row[0] === row && m.column[0] === column);
  if (index < 0) {
    c.mergedCells.push({ row: [row, 1], column: [column, v] });
  } else if (v <= 1 && c.mergedCells[index].row[1] <= 1) {
    c.mergedCells.splice(index, 1);
    if (c.mergedCells.length === 0) c.mergedCells = void 0;
  } else {
    c.mergedCells[index].column[1] = v;
  }
}
function insertTableColumn(c, i) {
  var _a;
  c.widths.splice(i, 0, c.widths[i]);
  (_a = c.mergedCells) == null ? void 0 : _a.forEach((cell) => {
    if (i < cell.column[0]) {
      cell.column[0]++;
    } else if (i < cell.column[0] + cell.column[1] - 1) {
      cell.column[1]++;
    }
  });
}
function insertTableRow(c, i) {
  var _a;
  c.rows.splice(i, 0, c.rows[i]);
  (_a = c.mergedCells) == null ? void 0 : _a.forEach((cell) => {
    if (i < cell.row[0]) {
      cell.row[0]++;
    } else if (i < cell.row[0] + cell.row[1] - 1) {
      cell.row[1]++;
    }
  });
}
function setTableCell(c, row, column, update) {
  var _a;
  const t = (_a = c.rows[row].cells) == null ? void 0 : _a.find((c2) => c2.column === column);
  if (t) {
    update(t);
  }
}
export {
  getCommand,
  getModel,
  isTableContent
};
`,
`// dev/cad-editor/plugins/text-style.plugin.tsx
function getModel(ctx) {
  const geometriesCache = new ctx.WeakmapCache();
  function getGeometriesFromCache(content) {
    return geometriesCache.get(content, () => {
      var _a, _b;
      const text = \`\${content.fontFamily} \${content.fontSize} \${ctx.getColorString(content.color)}\`;
      const width = (_b = (_a = ctx.getTextSizeFromCache(ctx.getTextStyleFont(content), text)) == null ? void 0 : _a.width) != null ? _b : 0;
      const height = content.fontSize * 1.2;
      const points = ctx.getPolygonFromTwoPointsFormRegion({ start: content, end: { x: content.x + width, y: content.y + height } });
      return {
        lines: [],
        bounding: ctx.getPointsBounding(points),
        text,
        width,
        height,
        regions: [
          {
            points,
            lines: Array.from(ctx.iteratePolygonLines(points))
          }
        ],
        renderingLines: []
      };
    });
  }
  const React = ctx.React;
  return {
    type: "text style",
    ...ctx.textModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    render(content, { target, transformColor }) {
      const { width, height, text } = getGeometriesFromCache(content);
      return target.renderGroup([
        target.renderRect(content.x, content.y, width, height, {
          strokeColor: transformColor(content.isCurrent ? 16711680 : 0)
        }),
        target.renderText(content.x, content.y, text, content.color, content.fontSize, content.fontFamily, { textBaseline: "top" })
      ]);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!ctx.isTextStyleContent(c)) {
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
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents, { acquirePoint }) {
      return {
        isCurrent: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.isCurrent === true, setValue: (v) => update((c, draft) => {
          if (ctx.isTextStyleContent(c)) {
            const currentTextStyle = ctx.getTextStyles(contents).find((s) => s.content.isCurrent);
            if (currentTextStyle) {
              const c2 = draft[currentTextStyle.index];
              if (c2 && ctx.isTextStyleContent(c2)) {
                c2.isCurrent = void 0;
              }
            }
            c.isCurrent = v ? true : void 0;
          }
        }) }),
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (ctx.isTextStyleContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (ctx.isTextStyleContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (ctx.isTextStyleContent(c)) {
            c.y = v;
          }
        }) }),
        ...ctx.getTextContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, ctx.TextStyleContent, p)
  };
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "6,7 40,7", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "23,7 23,43", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "61,7 82,7", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "72,7 72,26", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "51,49 90,49", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "71,47 71,94", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "11,71 32,71", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "21,71 21,89", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create text style",
    selectCount: 0,
    icon,
    useCommand({ onEnd, type }) {
      const [result, setResult] = React.useState();
      const reset = () => {
        setResult(void 0);
      };
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result);
                }
              }
            });
            reset();
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: "text style",
              x: p.x,
              y: p.y,
              fontFamily: "monospace",
              fontSize: 20,
              color: 0
            });
          }
        },
        assistentContents: result ? [result] : void 0,
        reset
      };
    }
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/cad-editor/plugins/text.plugin.tsx
function getModel(ctx) {
  const TextContent = ctx.and(ctx.BaseContent("text"), ctx.Position, ctx.TextFields, {
    text: ctx.string,
    width: ctx.optional(ctx.number),
    textVariableName: ctx.optional(ctx.string),
    angle: ctx.optional(ctx.number),
    scale: ctx.optional(ctx.or(ctx.number, ctx.Position))
  });
  const getRefIds = (content) => ctx.toRefId(content.textStyleId);
  const textLayoutResultCache = new ctx.WeakmapCache2();
  function getTextLayoutResult(content, c, variableContext) {
    return textLayoutResultCache.get(content, c, () => {
      var _a;
      const state = getText(content, variableContext).split("");
      const getTextWidth = (text) => {
        var _a2, _b;
        return (_b = (_a2 = ctx.getTextSizeFromCache(ctx.getTextStyleFont(c), text)) == null ? void 0 : _a2.width) != null ? _b : 0;
      };
      return ctx.flowLayout({
        state,
        width: content.width,
        lineHeight: (_a = c.lineHeight) != null ? _a : c.fontSize * 1.2,
        getWidth: getTextWidth,
        align: c.align,
        endContent: "",
        isNewLineContent: (c2) => c2 === "\\n",
        isPartOfComposition: (c2) => ctx.isWordCharactor(c2),
        getComposition: (index) => ctx.getTextComposition(index, state, getTextWidth, (c2) => c2)
      });
    });
  }
  function hasWidth(content) {
    return content.width !== void 0;
  }
  function getText(content, variableContext) {
    if (content.textVariableName && variableContext) {
      const text = variableContext[content.textVariableName];
      if (typeof text === "string") {
        return text;
      }
    }
    return content.text;
  }
  function getTextGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, () => {
      let points;
      if (hasWidth(content)) {
        const textStyleContent = ctx.getTextStyleContent(content, contents);
        const { newContentHeight } = getTextLayoutResult(content, textStyleContent);
        points = [
          { x: content.x, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y },
          { x: content.x, y: content.y }
        ];
      } else {
        const size = ctx.getTextSize(ctx.getTextStyleFont(content), content.text);
        if (!size) {
          throw "not supported";
        }
        points = [
          { x: content.x, y: content.y - size.height },
          { x: content.x + size.width, y: content.y - size.height },
          { x: content.x + size.width, y: content.y },
          { x: content.x, y: content.y }
        ];
      }
      const scale = ctx.getScaleOptionsScale(content);
      if (scale) {
        for (const p of points) {
          ctx.scalePoint(p, content, scale.x, scale.y);
        }
      }
      if (content.angle) {
        for (const p of points) {
          ctx.rotatePoint(p, content, content.angle);
        }
      }
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines: [],
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
    ...ctx.textModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    rotate(content, center, angle) {
      var _a;
      ctx.rotatePoint(content, center, angle);
      content.angle = ((_a = content.angle) != null ? _a : 0) + angle;
    },
    scale(content, center, sx, sy) {
      var _a, _b;
      ctx.scalePoint(content, center, sx, sy);
      const scale = ctx.getScaleOptionsScale(content);
      content.scale = {
        x: ((_a = scale == null ? void 0 : scale.x) != null ? _a : 1) * sx,
        y: ((_b = scale == null ? void 0 : scale.y) != null ? _b : 1) * sy
      };
    },
    mirror(content, line, angle) {
      var _a, _b, _c;
      ctx.mirrorPoint(content, line);
      content.angle = 2 * angle - ((_a = content.angle) != null ? _a : 0);
      const scale = ctx.getScaleOptionsScale(content);
      content.scale = {
        x: (_b = scale == null ? void 0 : scale.x) != null ? _b : 1,
        y: -((_c = scale == null ? void 0 : scale.y) != null ? _c : 1)
      };
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
            },
            {
              x: content.x,
              y: content.y + content.fontSize * (content.width ? 1 : -1),
              cursor: "move",
              update(c, { cursor, scale }) {
                if (!isTextContent(c)) {
                  return;
                }
                c.fontSize = Math.abs(cursor.y - content.y);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
              }
            },
            ...content.width ? [{
              x: content.x + content.width,
              y: content.y,
              cursor: "move",
              update(c, { cursor, scale }) {
                if (!isTextContent(c)) {
                  return;
                }
                c.width = Math.abs(cursor.x - content.x);
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [content, cursor] }] };
              }
            }] : []
          ]
        };
      });
    },
    render(content, renderCtx) {
      var _a, _b;
      const { contents, transformColor, variableContext, isAssistence, target } = renderCtx;
      const textStyleContent = ctx.getTextStyleContent(content, contents);
      const color = transformColor(textStyleContent.color);
      const text = getText(content, variableContext);
      let cacheKey;
      if (isAssistence) {
        cacheKey = ctx.assistentTextCache.get(text, textStyleContent.fontSize, textStyleContent.color);
      }
      if (!cacheKey) {
        cacheKey = content;
      }
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(color, renderCtx);
      const children = [];
      if (hasWidth(content)) {
        const { layoutResult } = getTextLayoutResult(content, textStyleContent, variableContext);
        for (const { x, y, content: text2 } of layoutResult) {
          const textWidth = (_b = (_a = ctx.getTextSizeFromCache(ctx.getTextStyleFont(textStyleContent), text2)) == null ? void 0 : _a.width) != null ? _b : 0;
          children.push(target.renderText(content.x + x + textWidth / 2, content.y + y + textStyleContent.fontSize, text2, textStyleContent.color, textStyleContent.fontSize, textStyleContent.fontFamily, { textAlign: "center", cacheKey, ...textOptions }));
        }
      } else {
        children.push(target.renderText(content.x, content.y, text, color, textStyleContent.fontSize, textStyleContent.fontFamily, { cacheKey, ...textOptions }));
      }
      return target.renderGroup(children, { base: content, angle: content.angle, scale: content.scale });
    },
    getGeometries: getTextGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
      var _a, _b, _c;
      const scale = ctx.getScaleOptionsScale(content);
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isTextContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.y = v;
          }
        }) }),
        ...ctx.getTextContentPropertyPanel(content, update, contents),
        text: /* @__PURE__ */ React.createElement(ctx.StringEditor, { textarea: true, value: content.text, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.text = v;
          }
        }) }),
        width: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.width !== void 0, setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.width = v ? 600 : void 0;
            }
          }) }),
          content.width !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.width, setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.width = v;
            }
          }) }) : void 0
        ],
        textVariableName: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.textVariableName !== void 0, setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.textVariableName = v ? "" : void 0;
            }
          }) }),
          content.textVariableName !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.textVariableName, setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.textVariableName = v;
            }
          }) }) : void 0
        ],
        angle: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_a = content.angle) != null ? _a : 0, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.angle = v;
          }
        }) }),
        sx: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_b = scale == null ? void 0 : scale.x) != null ? _b : 1, setValue: (v) => update((c) => {
          var _a2;
          if (isTextContent(c)) {
            c.scale = { x: v, y: (_a2 = scale == null ? void 0 : scale.y) != null ? _a2 : v };
          }
        }) }),
        sy: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: (_c = scale == null ? void 0 : scale.y) != null ? _c : 1, setValue: (v) => update((c) => {
          var _a2;
          if (isTextContent(c)) {
            c.scale = { x: (_a2 = scale == null ? void 0 : scale.x) != null ? _a2 : v, y: v };
          }
        }) })
      };
    },
    editPanel(content, scale, update, contents, cancel, transformPosition) {
      const p = transformPosition(content);
      const textStyleContent = ctx.getTextStyleContent(content, contents);
      const fontSize = textStyleContent.fontSize * scale;
      if (content.width) {
        return /* @__PURE__ */ React.createElement(
          ctx.SimpleTextEditor,
          {
            fontSize,
            width: content.width * scale,
            color: textStyleContent.color,
            fontFamily: textStyleContent.fontFamily,
            align: textStyleContent.align,
            lineHeight: textStyleContent.lineHeight ? textStyleContent.lineHeight * scale : void 0,
            onCancel: cancel,
            x: p.x,
            y: p.y,
            value: content.text,
            setValue: (v) => update((c) => {
              if (isTextContent(c)) {
                c.text = v;
              }
            })
          }
        );
      }
      return /* @__PURE__ */ React.createElement(ctx.StringEditor, { style: {
        zIndex: 10,
        position: "absolute",
        left: \`\${p.x - 1}px\`,
        top: \`\${p.y - fontSize - 1}px\`,
        fontSize: \`\${fontSize}px\`,
        fontFamily: content.fontFamily,
        color: ctx.getColorString(content.color),
        padding: "0px"
      }, textarea: true, autoFocus: true, onCancel: cancel, value: content.text, setValue: (v) => update((c) => {
        if (isTextContent(c)) {
          c.text = v;
        }
      }) });
    },
    isValid: (c, p) => ctx.validate(c, TextContent, p),
    getRefIds,
    updateRefId: ctx.updateTextStyleRefIds,
    deleteRefId: ctx.deleteTextStyleRefIds,
    getVariableNames: (content) => content.textVariableName ? [content.textVariableName] : []
  };
}
function isTextContent(content) {
  return content.type === "text";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "16,22 83,22", strokeWidth: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "49,22 49,89", strokeWidth: "10", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "create text",
    icon,
    useCommand({ onEnd, type, scale, textStyleId, transformPosition, contents }) {
      const [start, setStart] = React.useState();
      const [cursor, setCursor] = React.useState();
      const [text, setText] = React.useState();
      const reset = () => {
        setText(void 0);
        setStart(void 0);
        setCursor(void 0);
      };
      const assistentContents = [];
      let panel;
      if (type) {
        if (text) {
          assistentContents.push(text);
          const p = transformPosition(text);
          const textStyleContent = ctx.getTextStyleContent(text, contents);
          const fontSize = textStyleContent.fontSize * scale;
          if (text.width) {
            panel = /* @__PURE__ */ React.createElement(
              ctx.SimpleTextEditor,
              {
                fontSize,
                width: text.width * scale,
                color: textStyleContent.color,
                fontFamily: textStyleContent.fontFamily,
                align: textStyleContent.align,
                lineHeight: textStyleContent.lineHeight ? textStyleContent.lineHeight * scale : void 0,
                onCancel: reset,
                x: p.x,
                y: p.y,
                value: text.text,
                setValue: (v) => setText({
                  ...text,
                  text: v
                })
              }
            );
          }
        } else if (cursor) {
          if (start) {
            assistentContents.push({ type: "polygon", points: ctx.getPolygonFromTwoPointsFormRegion(ctx.getTwoPointsFormRegion(start, cursor)), dashArray: [4 / scale] });
            assistentContents.push({
              type: "text",
              text: "abc",
              textStyleId,
              color: 0,
              fontSize: 16 / scale,
              fontFamily: "monospace",
              x: Math.min(start.x, cursor.x),
              y: Math.min(start.y, cursor.y),
              width: Math.abs(start.x - cursor.x)
            });
          } else {
            assistentContents.push({
              type: "text",
              text: "abc",
              textStyleId,
              color: 0,
              fontSize: 16 / scale,
              fontFamily: "monospace",
              x: cursor.x,
              y: cursor.y,
              width: 100
            });
          }
        }
      }
      return {
        onStart: (p) => {
          if (!type) return;
          if (text) {
            onEnd({ updateContents: (contents2) => contents2.push(text) });
            reset();
            return;
          }
          if (start) {
            setText({
              type: "text",
              text: "",
              textStyleId,
              color: 0,
              fontSize: 16 / scale,
              fontFamily: "monospace",
              x: Math.min(start.x, p.x),
              y: Math.min(start.y, p.y),
              width: Math.abs(start.x - p.x)
            });
          } else {
            setStart(p);
          }
        },
        onMove: (p) => {
          if (!type) return;
          setCursor(p);
        },
        assistentContents,
        reset,
        panel
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
`// dev/cad-editor/plugins/time-axis.plugin.tsx
function getModel(ctx) {
  const TimeAxisContent = ctx.and(ctx.BaseContent("time axis"), ctx.StrokeFields, ctx.ArrowFields, ctx.Position, {
    max: ctx.number
  });
  const getRefIds = (content) => ctx.toRefId(content.strokeStyleId);
  function getGeometriesFromCache(content, contents, time) {
    const getGeometries = () => {
      const { arrowPoints, endPoint } = ctx.getArrowPoints(content, { x: content.x + content.max / 10, y: content.y }, content);
      const points = [content, endPoint];
      const result = {
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
      if (time) {
        const timePoints = ctx.arcToPolyline(ctx.circleToArc({ x: content.x + time / 10, y: content.y, r: 5 }), ctx.defaultAngleDelta);
        result.regions.push({
          points: timePoints,
          lines: Array.from(ctx.iteratePolygonLines(timePoints))
        });
      }
      return result;
    };
    if (time) {
      return getGeometries();
    }
    const refs = new Set(ctx.iterateRefContents(getRefIds(content), contents, [content]));
    return ctx.getGeometriesFromCache(content, refs, getGeometries);
  }
  const React = ctx.React;
  return {
    type: "time axis",
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      ctx.movePoint(content, offset);
    },
    render(content, renderCtx) {
      const { options, contents, time, target, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { regions, renderingLines } = getGeometriesFromCache(content, contents, time);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, options));
      }
      if (regions) {
        for (let i = 0; i < regions.length; i++) {
          children.push(target.renderPolygon(regions[i].points, fillOptions));
        }
      }
      return target.renderGroup(children);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        return {
          editPoints: [
            {
              ...content,
              cursor: "move",
              update(c, { cursor, start, scale }) {
                if (!isTimeAxisContent(c)) {
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
    getGeometries: getGeometriesFromCache,
    propertyPanel(content, update, contents, { startTime, acquirePoint }) {
      return {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => acquirePoint((p) => update((c) => {
          if (isTimeAxisContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (isTimeAxisContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (isTimeAxisContent(c)) {
            c.y = v;
          }
        }) }),
        max: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.max, setValue: (v) => update((c) => {
          if (isTimeAxisContent(c) && v > 0) {
            c.max = v;
          }
        }) }),
        action: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => startTime(content.max) }, "start"),
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, TimeAxisContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds
  };
}
function isTimeAxisContent(content) {
  return content.type === "time axis";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("g", { transform: "" }, /* @__PURE__ */ React.createElement("polyline", { points: "3,52 90,53", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "99,53 70,60 70,45", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" })));
  return {
    name: "create time axis",
    selectCount: 0,
    icon,
    useCommand({ onEnd, type }) {
      const [result, setResult] = React.useState();
      const reset = () => {
        setResult(void 0);
      };
      return {
        onStart() {
          if (result) {
            onEnd({
              updateContents: (contents) => {
                if (result) {
                  contents.push(result);
                }
              }
            });
            reset();
          }
        },
        onMove(p) {
          if (type) {
            setResult({
              type: "time axis",
              x: p.x,
              y: p.y,
              max: 5e3
            });
          }
        },
        assistentContents: result ? [result] : void 0,
        reset
      };
    }
  };
}
export {
  getCommand,
  getModel,
  isTimeAxisContent
};
`,
`// dev/cad-editor/plugins/hatch.plugin.tsx
function isHatchContent(content) {
  return content.type === "hatch";
}

// dev/cad-editor/plugins/trim.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { viewBox: "64 64 896 896", width: "1em", height: "1em", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M567.1 512l318.5-319.3c5-5 1.5-13.7-5.6-13.7h-90.5c-2.1 0-4.2.8-5.6 2.3l-273.3 274-90.2-90.5c12.5-22.1 19.7-47.6 19.7-74.8 0-83.9-68.1-152-152-152s-152 68.1-152 152 68.1 152 152 152c27.7 0 53.6-7.4 75.9-20.3l90 90.3-90.1 90.3A151.04 151.04 0 00288 582c-83.9 0-152 68.1-152 152s68.1 152 152 152 152-68.1 152-152c0-27.2-7.2-52.7-19.7-74.8l90.2-90.5 273.3 274c1.5 1.5 3.5 2.3 5.6 2.3H880c7.1 0 10.7-8.6 5.6-13.7L567.1 512zM288 370c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80zm0 444c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" }));
  return {
    name: "trim",
    useCommand({ onEnd, type, selected, backgroundColor, contents, getContentsInRange }) {
      const [candidates, setCandidates] = React.useState([]);
      const [currents, setCurrents] = React.useState([]);
      const [trackPoints, setTrackPoints] = React.useState([]);
      const { state, setState, resetHistory, undo, redo } = ctx.useUndoRedo([]);
      React.useEffect(() => {
        var _a, _b;
        if (type) {
          const allContents = [];
          for (let i = 0; i < selected.length; i++) {
            const content = selected[i].content;
            let intersectionPoints = [];
            for (let j = 0; j < selected.length; j++) {
              const c = selected[j].content;
              if (c && i !== j) {
                const p = i < j ? [c, content] : [content, c];
                intersectionPoints.push(...ctx.getIntersectionPoints(...p, contents));
              }
            }
            intersectionPoints = ctx.deduplicatePosition(intersectionPoints);
            if (intersectionPoints.length > 0) {
              const result = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.break) == null ? void 0 : _b.call(_a, content, intersectionPoints, contents);
              if (result) {
                allContents.push({ content, children: result });
              }
            } else {
              allContents.push({ content, children: [content] });
            }
          }
          setCandidates(allContents);
        }
      }, [type]);
      const assistentContents = [];
      const collectAssistentContent = (child) => {
        var _a;
        if (ctx.isStrokeContent(child)) {
          assistentContents.push({
            ...child,
            strokeWidth: ((_a = child.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(child)) + 2,
            strokeColor: backgroundColor,
            trueStrokeColor: true
          });
        } else if (isHatchContent(child)) {
          assistentContents.push({
            ...child,
            fillPattern: void 0,
            fillColor: backgroundColor,
            trueFillColor: true
          });
        }
      };
      for (const current of currents) {
        for (const child of current.children) {
          collectAssistentContent(child);
        }
      }
      if (trackPoints.length > 1) {
        assistentContents.push({ points: trackPoints, type: "polyline" });
      }
      for (const { children } of state) {
        for (const child of children) {
          collectAssistentContent(child);
        }
      }
      const reset = () => {
        setCandidates([]);
        setCurrents([]);
        resetHistory();
        setTrackPoints([]);
      };
      return {
        onStart() {
          if (currents.length > 0) {
            setState((draft) => {
              for (const current of currents) {
                const index = state.findIndex((s) => s.content === current.content);
                if (index >= 0) {
                  draft[index].children.push(...current.children);
                } else {
                  draft.push(current);
                }
              }
            });
          }
          setTrackPoints([]);
        },
        onMouseDown(p) {
          if (currents.length === 0) {
            setTrackPoints([p]);
          }
        },
        onMove(p) {
          var _a, _b, _c, _d;
          if (trackPoints.length > 0) {
            const newTracePoints = [...trackPoints, p];
            if (newTracePoints.length > 1) {
              const trackLines = Array.from(ctx.iteratePolylineLines(newTracePoints));
              const newCurrents = [];
              for (const candidate of candidates) {
                for (const child of candidate.children) {
                  const geometries = (_b = (_a = ctx.getContentModel(child)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, child, contents);
                  if (geometries) {
                    for (const line of geometries.lines) {
                      if (trackLines.some((t) => ctx.getTwoGeometryLinesIntersectionPoint(line, t).length > 0)) {
                        const index = newCurrents.findIndex((s) => s.content === candidate.content);
                        if (index >= 0) {
                          newCurrents[index].children.push(child);
                        } else {
                          newCurrents.push({ content: candidate.content, children: [child] });
                        }
                        break;
                      }
                    }
                  }
                }
              }
              setCurrents(newCurrents);
            }
            setTrackPoints(newTracePoints);
            return;
          }
          for (const candidate of candidates) {
            for (const child of candidate.children) {
              const geometries = (_d = (_c = ctx.getContentModel(child)) == null ? void 0 : _c.getGeometries) == null ? void 0 : _d.call(_c, child, contents);
              if (geometries) {
                if (isHatchContent(child) && geometries.regions && geometries.bounding) {
                  for (const region of geometries.regions) {
                    if (region.holesPoints && region.holesPoints.some((h) => ctx.pointInPolygon(p, h))) {
                      continue;
                    }
                    if (ctx.pointInPolygon(p, region.points)) {
                      const getGeometriesInRange = (region2) => getContentsInRange(region2).map((c) => ctx.getContentHatchGeometries(c, contents));
                      const border = ctx.getHatchByPosition(p, (line) => getGeometriesInRange(ctx.getGeometryLineBoundingFromCache(line)), geometries.bounding.end.x);
                      if (border) {
                        const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange);
                        setCurrents([{
                          children: [{
                            type: "hatch",
                            border: border.lines,
                            holes: holes == null ? void 0 : holes.holes,
                            ref: {
                              point: p,
                              ids: [...border.ids, ...(holes == null ? void 0 : holes.ids) || []]
                            }
                          }],
                          content: candidate.content
                        }]);
                      }
                      return;
                    }
                  }
                }
                for (const line of geometries.lines) {
                  if (ctx.getPointAndGeometryLineMinimumDistance(p, line) < 5) {
                    setCurrents([{ children: [child], content: candidate.content }]);
                    return;
                  }
                }
              }
            }
          }
          setCurrents([]);
        },
        onKeyDown(e) {
          var _a, _b;
          if (e.code === "KeyZ" && ctx.metaKeyIfMacElseCtrlKey(e)) {
            if (e.shiftKey) {
              redo(e);
            } else {
              undo(e);
            }
          } else if (e.key === "Enter") {
            if (!type) return;
            const removedIndexes = [];
            const newContents = [];
            for (const { content, children } of state) {
              const parentModel = ctx.getContentModel(content);
              if (parentModel == null ? void 0 : parentModel.break) {
                let points = [];
                for (const child of children) {
                  const geometries = (_b = (_a = ctx.getContentModel(child)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, child, contents);
                  if (geometries) {
                    const { start, end } = ctx.getGeometryLinesStartAndEnd(geometries.lines);
                    if (start && end) {
                      if (!ctx.isSamePoint(start, end)) {
                        points.push(start, end);
                      }
                    } else if (start) {
                      points.push(start);
                    } else if (end) {
                      points.push(end);
                    }
                  }
                }
                points = ctx.deduplicatePosition(points);
                const r = parentModel.break(content, points, contents);
                if (r) {
                  removedIndexes.push(ctx.getContentIndex(content, contents));
                  newContents.push(...r.filter((c) => children.every((f) => !ctx.deepEquals(f, c))));
                }
              } else if (isHatchContent(content)) {
                const holes = [];
                const ids = [];
                if (content.ref) {
                  ids.push(...content.ref.ids);
                }
                const borders = [content.border];
                if (content.holes) {
                  holes.push(...content.holes);
                }
                for (const child of children) {
                  if (isHatchContent(child)) {
                    holes.push(child.border);
                    if (child.holes) {
                      borders.push(...child.holes);
                    }
                    if (child.ref) {
                      ids.push(...child.ref.ids);
                    }
                  }
                }
                removedIndexes.push(ctx.getContentIndex(content, contents));
                const result = borders.map((b) => {
                  const polygon = ctx.getGeometryLinesPoints(b);
                  return ctx.optimizeHatch(b, holes.filter((h) => {
                    const start = ctx.getGeometryLineStartAndEnd(h[0]).start;
                    return start && (ctx.pointIsOnGeometryLines(start, b) || ctx.pointInPolygon(start, polygon));
                  }));
                }).flat();
                newContents.push(...result.map((r) => {
                  let ref;
                  if (content.ref) {
                    const p = content.ref.point;
                    if (ctx.pointInPolygon(p, ctx.getGeometryLinesPoints(r.border)) && r.holes.every((h) => !ctx.pointInPolygon(p, ctx.getGeometryLinesPoints(h)))) {
                      ref = {
                        point: p,
                        ids: Array.from(new Set(ids))
                      };
                    }
                  }
                  return { ...content, border: r.border, holes: r.holes, ref };
                }));
              }
            }
            onEnd({
              updateContents: (contents2) => {
                ctx.deleteSelectedContents(contents2, removedIndexes);
                contents2.push(...newContents);
              }
            });
            reset();
          }
        },
        assistentContents,
        reset
      };
    },
    contentSelectable(content, contents) {
      return ctx.contentIsDeletable(content, contents);
    },
    hotkey: "TR",
    icon,
    pointSnapDisabled: true
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/union.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "32", cy: "50", r: "32", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "65", cy: "50", r: "32", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("pattern", { id: "union", patternUnits: "userSpaceOnUse", width: "10", height: "10" }, /* @__PURE__ */ React.createElement("path", { d: "M 0 5 L 5 0 M 10 5 L 5 10", strokeWidth: "1", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" })), /* @__PURE__ */ React.createElement("path", { d: "M 50 78 L 47 79 L 45 81 L 42 81 L 39 82 L 37 82 L 34 82 L 31 82 L 28 82 L 25 81 L 23 81 L 20 79 L 18 78 L 15 77 L 13 75 L 11 73 L 9 71 L 7 69 L 6 66 L 4 64 L 3 61 L 2 58 L 2 56 L 1 53 L 1 50 L 1 47 L 2 44 L 2 42 L 3 39 L 4 36 L 6 34 L 7 31 L 9 29 L 11 27 L 13 25 L 15 23 L 18 22 L 20 21 L 23 19 L 25 19 L 28 18 L 31 18 L 34 18 L 37 18 L 39 18 L 42 19 L 45 19 L 47 21 L 50 22 L 50 22 L 53 21 L 55 19 L 58 19 L 61 18 L 63 18 L 66 18 L 69 18 L 72 18 L 75 19 L 77 19 L 80 21 L 82 22 L 85 23 L 87 25 L 89 27 L 91 29 L 93 31 L 94 34 L 96 36 L 97 39 L 98 42 L 98 44 L 99 47 L 99 50 L 99 53 L 98 56 L 98 58 L 97 61 L 96 64 L 94 66 L 93 69 L 91 71 L 89 73 L 87 75 L 85 77 L 82 78 L 80 79 L 77 81 L 75 81 L 72 82 L 69 82 L 66 82 L 63 82 L 61 82 L 58 81 L 55 81 L 53 79 L 50 78", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", fill: "url(#union)", stroke: "currentColor", fillRule: "evenodd" }));
  return {
    name: "union",
    execute({ contents, selected }) {
      var _a, _b, _c, _d;
      const first = contents[selected[0][0]];
      if (!first) return;
      const firstGeometries = (_b = (_a = ctx.getContentModel(first)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, first, contents);
      if (!firstGeometries) return;
      const second = contents[selected[1][0]];
      if (!second) return;
      const secondGeometries = (_d = (_c = ctx.getContentModel(second)) == null ? void 0 : _c.getGeometries) == null ? void 0 : _d.call(_c, second, contents);
      if (!secondGeometries) return;
      if (firstGeometries.regions && secondGeometries.regions) {
        const result = firstGeometries.regions.map((r) => ctx.getHatchesUnion({ border: r.lines, holes: r.holes || [] }, (secondGeometries.regions || []).map((g) => ({ border: g.lines, holes: g.holes || [] })))).flat();
        ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
        contents.push(...result.map((r) => ({ ...first, type: "hatch", border: r.border, holes: r.holes, ref: void 0 })));
        return;
      }
      const lines = ctx.mergeItems([...firstGeometries.lines, ...secondGeometries.lines], ctx.getTwoGeometryLinesUnionLine);
      ctx.deleteSelectedContents(contents, selected.map((s) => s[0]));
      const allLines = ctx.getSeparatedGeometryLines(lines);
      contents.push(...allLines.map((n) => ({ type: "geometry lines", lines: n })));
    },
    contentSelectable(content, contents) {
      return ctx.contentIsDeletable(content, contents);
    },
    selectCount: 2,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/viewport.plugin.tsx
function getModel(ctx) {
  const getRefIds = (content) => [...ctx.getStrokeRefIds(content), ...ctx.toRefId(content.border, true)];
  function getViewportGeometriesFromCache(content, contents) {
    var _a, _b;
    const geometries = (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content.border, contents);
    if (geometries) {
      return geometries;
    }
    return { lines: [], renderingLines: [] };
  }
  const renderCache = new ctx.WeakmapMapCache();
  const React = ctx.React;
  return {
    type: "viewport",
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      var _a, _b;
      (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.move) == null ? void 0 : _b.call(_a, content.border, offset);
      ctx.movePoint(content, offset);
    },
    rotate(content, center, angle, contents) {
      var _a, _b;
      (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.rotate) == null ? void 0 : _b.call(_a, content.border, center, angle, contents);
    },
    scale(content, center, sx, sy, contents) {
      var _a, _b;
      return (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.scale) == null ? void 0 : _b.call(_a, content.border, center, sx, sy, contents);
    },
    skew(content, center, sx, sy, contents) {
      var _a, _b;
      return (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.skew) == null ? void 0 : _b.call(_a, content.border, center, sx, sy, contents);
    },
    mirror(content, line, angle, contents) {
      var _a, _b;
      (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.mirror) == null ? void 0 : _b.call(_a, content.border, line, angle, contents);
    },
    render(content, renderCtx) {
      var _a;
      const render = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.render;
      if (render) {
        return render(content.border, {
          ...renderCtx,
          clip: renderCtx.isHoveringOrSelected || content.hidden ? void 0 : () => {
            const sortedContents = ctx.getSortedContents(renderCtx.contents).contents;
            const children = renderCache.get(sortedContents, renderCtx.target.type, () => {
              const children2 = [];
              sortedContents.forEach((content2) => {
                var _a2;
                if (!content2 || content2.visible === false || ctx.isViewportContent(content2)) {
                  return;
                }
                const ContentRender = (_a2 = ctx.getContentModel(content2)) == null ? void 0 : _a2.render;
                if (ContentRender) {
                  children2.push(ContentRender(content2, renderCtx));
                }
              });
              return children2;
            });
            return renderCtx.target.renderGroup(children, { matrix: ctx.getViewportMatrix(content) });
          }
        });
      }
      return renderCtx.target.renderEmpty();
    },
    getEditPoints(content, contents) {
      var _a, _b;
      const editPoints = (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.getEditPoints) == null ? void 0 : _b.call(_a, content.border, contents);
      if (!editPoints) return;
      return ctx.getEditPointsFromCache(content, () => {
        return {
          ...editPoints,
          editPoints: editPoints.editPoints.map((e) => ({
            ...e,
            update(c, props) {
              var _a2;
              if (!ctx.isViewportContent(c)) {
                return;
              }
              if (e.type === "move") {
                c.x += props.cursor.x - props.start.x;
                c.y += props.cursor.y - props.start.y;
              }
              return (_a2 = e.update) == null ? void 0 : _a2.call(e, c.border, props);
            }
          }))
        };
      });
    },
    getGeometries: getViewportGeometriesFromCache,
    propertyPanel(content, update, contents, options) {
      var _a, _b;
      const border = (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.propertyPanel) == null ? void 0 : _b.call(_a, content.border, (recipe) => {
        update((c) => {
          if (ctx.isViewportContent(c)) {
            recipe(c.border, contents);
          }
        });
      }, contents, options);
      const result = {
        from: /* @__PURE__ */ React.createElement(ctx.Button, { onClick: () => options.acquirePoint((p) => update((c) => {
          if (ctx.isViewportContent(c)) {
            c.x = p.x, c.y = p.y;
          }
        })) }, "canvas"),
        x: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.x, setValue: (v) => update((c) => {
          if (ctx.isViewportContent(c)) {
            c.x = v;
          }
        }) }),
        y: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.y, setValue: (v) => update((c) => {
          if (ctx.isViewportContent(c)) {
            c.y = v;
          }
        }) }),
        scale: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.scale, setValue: (v) => update((c) => {
          if (ctx.isViewportContent(c)) {
            c.scale = v;
          }
        }) }),
        rotate: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.rotate || 0, setValue: (v) => update((c) => {
          if (ctx.isViewportContent(c)) {
            c.rotate = v;
          }
        }) }),
        locked: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.locked || false, setValue: (v) => update((c) => {
          if (ctx.isViewportContent(c)) {
            c.locked = v;
          }
        }) }),
        hidden: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.hidden || false, setValue: (v) => update((c) => {
          if (ctx.isViewportContent(c)) {
            c.hidden = v;
          }
        }) })
      };
      if (border) {
        result.border = /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { properties: border });
      }
      return {
        ...result,
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, ctx.ViewportContent, p),
    getRefIds,
    updateRefId: ctx.updateStrokeRefIds,
    deleteRefId: ctx.deleteStrokeRefIds
  };
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "14", y: "18", width: "71", height: "71", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("g", { transform: "" }, /* @__PURE__ */ React.createElement("polyline", { points: "47,55 78,24", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "85,18 70,43 59,32", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" })), /* @__PURE__ */ React.createElement("g", { transform: "" }, /* @__PURE__ */ React.createElement("polyline", { points: "47,55 20,82", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "14,89 29,62 40,73", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" })), /* @__PURE__ */ React.createElement("g", { transform: "" }, /* @__PURE__ */ React.createElement("polyline", { points: "47,54 78,82", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "85,89 58,75 69,63", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" })), /* @__PURE__ */ React.createElement("g", { transform: "" }, /* @__PURE__ */ React.createElement("polyline", { points: "47,55 20,25", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "14,18 39,34 27,44", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" })));
  return {
    name: "create viewport",
    selectCount: 1,
    icon,
    contentSelectable(content) {
      return ctx.contentIsClosedPath(content);
    },
    execute({ contents, selected }) {
      contents.forEach((content, index) => {
        var _a, _b;
        if (content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true)) {
          const viewport = ctx.getDefaultViewport(content, contents);
          if (!viewport) return;
          const result = {
            type: "viewport",
            border: content,
            ...viewport
          };
          if (result) {
            contents[index] = result;
          }
        }
      });
    }
  };
}
export {
  getCommand,
  getModel
};
`,
`// dev/cad-editor/plugins/wire.plugin.tsx
function getModel(ctx) {
  const WireContent = ctx.and(ctx.BaseContent("wire"), {
    points: ctx.minItems(2, [ctx.Position]),
    refs: [ctx.ContentRef]
  });
  const LampContent = ctx.and(ctx.BaseContent("lamp"), ctx.Position, {
    size: ctx.number
  });
  const getIntersectedWires = (content, contents) => {
    const lines = Array.from(ctx.iteratePolylineLines(content.points));
    const wires = [];
    for (const c of ctx.getSortedContents(contents).contents) {
      if (!c) continue;
      if (ctx.shallowEquals(c, content)) {
        return wires;
      }
      if (isWireContent(c) && ctx.first(ctx.iterateGeometryLinesIntersectionPoints(getWireGeometries(c, contents).lines, lines))) {
        wires.push(c);
      }
    }
    return wires;
  };
  const getWireRefIds = (content) => [...ctx.getStrokeRefIds(content), ...ctx.toRefIds(content.refs)];
  const getLampRefIds = (content) => ctx.getStrokeRefIds(content);
  const wireGeometriesCache = new ctx.WeakmapValuesCache();
  function getWireGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getWireRefIds(content), contents, [content]));
    getIntersectedWires(content, contents).forEach((e) => refs.add(e));
    return wireGeometriesCache.get(content, refs, () => {
      let lines = Array.from(ctx.iteratePolylineLines(content.points));
      const joints = [];
      for (const ref of refs) {
        if (isWireContent(ref)) {
          const intersections = Array.from(ctx.iterateGeometryLinesIntersectionPoints(lines, getWireGeometries(ref, contents).lines));
          for (const intersection of intersections) {
            const param = ctx.getGeometryLinesParamAtPoint(intersection, lines);
            if (ctx.isZero(param) || ctx.isSameNumber(lines.length, param)) {
              let joint = joints.find((j) => ctx.isSamePoint(j.position, intersection));
              if (!joint) {
                joint = { position: intersection, count: 1 };
                joints.push(joint);
              }
              joint.count++;
              continue;
            }
            const radian = ctx.getGeometryLinesTangentRadianAtParam(param, lines);
            if (radian === void 0) continue;
            const angle = ctx.radianToAngle(radian);
            const radius = 5;
            const startPoint = ctx.getPointByLengthAndRadian(intersection, -radius, radian);
            const endPoint = ctx.getPointByLengthAndRadian(intersection, radius, radian);
            lines = [
              ...ctx.getPartOfGeometryLines(0, ctx.getGeometryLinesParamAtPoint(startPoint, lines), lines),
              { type: "arc", curve: { x: intersection.x, y: intersection.y, r: radius, startAngle: angle, endAngle: ctx.reverseAngle(angle) } },
              ...ctx.getPartOfGeometryLines(ctx.getGeometryLinesParamAtPoint(endPoint, lines), lines.length, lines)
            ];
          }
        } else if (isLampContent(ref)) {
          const params = ctx.deduplicate(Array.from(ctx.iterateGeometryLinesIntersectionPoints(lines, getLampGeometries(ref, contents).lines)).map((p) => ctx.getGeometryLinesParamAtPoint(p, lines)), ctx.isSameNumber);
          if (params.length === 1) {
            const param = params[0];
            if (param < lines.length / 2) {
              lines = ctx.getPartOfGeometryLines(param, lines.length, lines);
            } else {
              lines = ctx.getPartOfGeometryLines(0, param, lines);
            }
          } else if (params.length > 1) {
            lines = [
              ...ctx.getPartOfGeometryLines(0, Math.min(...params), lines),
              ...ctx.getPartOfGeometryLines(Math.max(...params), lines.length, lines)
            ];
          }
        }
      }
      const validJoints = joints.filter((j) => j.count === 3).map((j) => j.position);
      return {
        lines,
        joints: validJoints,
        bounding: ctx.getPointsBounding(content.points),
        regions: validJoints.length > 0 ? [] : void 0,
        renderingLines: lines.map((line) => ctx.dashedPolylineToLines(ctx.getGeometryLinesPoints([line]), content.dashArray)).flat()
      };
    });
  }
  function getLampGeometries(content, contents) {
    const refs = new Set(ctx.iterateRefContents(getLampRefIds(content), contents, [content]));
    const arc = ctx.circleToArc({ x: content.x, y: content.y, r: content.size });
    return ctx.getGeometriesFromCache(content, refs, () => {
      const size = content.size * Math.SQRT1_2;
      const lineSegments = [
        [{ x: content.x - size, y: content.y - size }, { x: content.x + size, y: content.y + size }],
        [{ x: content.x - size, y: content.y + size }, { x: content.x + size, y: content.y - size }]
      ];
      const points = ctx.arcToPolyline(arc, ctx.defaultAngleDelta);
      return {
        lines: [{ type: "arc", curve: arc }, ...lineSegments],
        bounding: {
          start: { x: content.x - content.size, y: content.y - content.size },
          end: { x: content.x + content.size, y: content.y + content.size }
        },
        renderingLines: [
          ...ctx.dashedPolylineToLines(points, content.dashArray),
          ...lineSegments.map((s) => ctx.dashedPolylineToLines(s, content.dashArray)).flat()
        ]
      };
    });
  }
  const React = ctx.React;
  return [
    {
      type: "wire",
      ...ctx.strokeModel,
      move(content, offset) {
        for (const point of content.points) {
          ctx.movePoint(point, offset);
        }
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
        const { renderingLines, joints } = getWireGeometries(content, renderCtx.contents);
        return target.renderGroup([
          ...renderingLines.map((line) => target.renderPolyline(line, options)),
          ...joints.map((joint) => target.renderCircle(joint.x, joint.y, 1, { fillColor: 0 }))
        ]);
      },
      getGeometries: getWireGeometries,
      propertyPanel(content, update, contents) {
        return {
          ...ctx.getStrokeContentPropertyPanel(content, update, contents)
        };
      },
      isValid: (c, p) => ctx.validate(c, WireContent, p),
      getRefIds: getWireRefIds,
      updateRefId(content, update) {
        for (const [i, id] of content.refs.entries()) {
          const newRefId = update(id);
          if (newRefId !== void 0) {
            content.refs[i] = newRefId;
          }
        }
        ctx.updateStrokeRefIds(content, update);
      },
      deleteRefId(content, ids) {
        for (const id of ids) {
          const index = content.refs.indexOf(id);
          if (index >= 0) {
            content.refs.splice(index, 1);
          }
        }
        ctx.deleteStrokeRefIds(content, ids);
      }
    },
    {
      type: "lamp",
      ...ctx.strokeModel,
      move(content, offset) {
        ctx.movePoint(content, offset);
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
        const geometries = getLampGeometries(content, renderCtx.contents);
        const children = [target.renderCircle(content.x, content.y, content.size, options)];
        for (const line of geometries.lines) {
          if (Array.isArray(line)) {
            children.push(target.renderPolyline(line, options));
          }
        }
        return target.renderGroup(children);
      },
      getGeometries: getLampGeometries,
      getEditPoints(content, contents) {
        return ctx.getEditPointsFromCache(content, () => {
          const editPoints = [{
            x: content.x,
            y: content.y,
            cursor: "move",
            update(c, { cursor, start, target }) {
              if (!isLampContent(c)) {
                return;
              }
              c.x += cursor.x - start.x;
              c.y += cursor.y - start.y;
              return {
                updateRelatedContents() {
                  const index = ctx.getContentIndex(content, contents);
                  const targetIndex = target ? ctx.getContentIndex(target.content, contents) : void 0;
                  const [, patches, reversePatches] = ctx.produceWithPatches(contents, (draft) => {
                    var _a, _b;
                    for (let i = 0; i < draft.length; i++) {
                      const c2 = draft[i];
                      if (!c2) continue;
                      if (i === targetIndex && isWireContent(c2)) {
                        if (!c2.refs.includes(index)) {
                          c2.refs.push(index);
                        }
                      } else {
                        (_b = (_a = ctx.getContentModel(c2)) == null ? void 0 : _a.deleteRefId) == null ? void 0 : _b.call(_a, c2, [index]);
                      }
                    }
                  });
                  return { patches, reversePatches };
                }
              };
            }
          }];
          return { editPoints };
        });
      },
      propertyPanel(content, update, contents) {
        return {
          size: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.size, setValue: (v) => update((c) => {
            if (isLampContent(c)) {
              c.size = v;
            }
          }) }),
          ...ctx.getStrokeContentPropertyPanel(content, update, contents)
        };
      },
      isValid: (c, p) => ctx.validate(c, LampContent, p),
      getRefIds: getLampRefIds,
      updateRefId: ctx.updateStrokeRefIds,
      deleteRefId: ctx.deleteStrokeRefIds
    }
  ];
}
function isWireContent(content) {
  return content.type === "wire";
}
function isLampContent(content) {
  return content.type === "lamp";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "4,4 97,4 97,96", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "50", cy: "50", r: "45", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "18,18 82,82", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "18,82 82,18", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }));
  return [
    {
      name: "create wire",
      useCommand({ onEnd, type, strokeStyleId }) {
        const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
          type === "create wire",
          (c) => onEnd({
            updateContents: (contents) => contents.push({ points: c, refs: [], strokeStyleId, type: "wire" })
          })
        );
        const assistentContents = [];
        if (line) {
          assistentContents.push({ points: line, refs: [], strokeStyleId, type: "wire" });
        }
        return {
          onStart: onClick,
          input,
          onMove,
          assistentContents,
          lastPosition,
          reset
        };
      },
      selectCount: 0,
      icon: icon1
    },
    {
      name: "create lamp",
      useCommand({ onEnd, type, strokeStyleId }) {
        const [lamp, setLamp] = React.useState();
        const [wireId, setWireId] = React.useState();
        const reset = () => {
          setWireId(void 0);
          setLamp(void 0);
        };
        const assistentContents = [];
        if (lamp) {
          assistentContents.push(lamp);
        }
        return {
          onStart: (p) => {
            onEnd({
              updateContents: (contents) => {
                if (wireId !== void 0) {
                  const content = contents[wireId];
                  if (content && isWireContent(content)) {
                    content.refs.push(contents.length);
                  }
                }
                contents.push({ x: p.x, y: p.y, size: 5, strokeStyleId, type: "lamp" });
              }
            });
          },
          onMove(p, _, target) {
            if (!type) return;
            setWireId(target == null ? void 0 : target.id);
            setLamp({ x: p.x, y: p.y, size: 5, strokeStyleId, type: "lamp" });
          },
          assistentContents,
          reset
        };
      },
      selectCount: 0,
      icon: icon2
    }
  ];
}
export {
  getCommand,
  getModel,
  isLampContent,
  isWireContent
};
`,
]
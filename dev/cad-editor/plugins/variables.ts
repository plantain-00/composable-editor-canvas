export const pluginScripts = [
`// dev/cad-editor/plugins/arrow.plugin.tsx
function getModel(ctx) {
  const ArrowContent = ctx.and(ctx.BaseContent("arrow"), ctx.StrokeFields, ctx.ArrowFields, {
    p1: ctx.Position,
    p2: ctx.Position,
    ref1: ctx.optional(ctx.PositionRef),
    ref2: ctx.optional(ctx.PositionRef)
  });
  const arrowCache = new ctx.WeakmapCache3();
  function getArrowGeometriesFromCache(content, contents) {
    var _a, _b;
    const p1 = (_a = ctx.getRefPosition(content.ref1, contents)) != null ? _a : content.p1;
    const p2 = (_b = ctx.getRefPosition(content.ref2, contents)) != null ? _b : content.p2;
    return arrowCache.get(content, p1, p2, () => {
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
    getRefIds: (content) => [
      ...ctx.getStrokeRefIds(content),
      ...content.ref1 && typeof content.ref1.id === "number" ? [content.ref1.id] : [],
      ...content.ref2 && typeof content.ref2.id === "number" ? [content.ref2.id] : []
    ],
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
    refId: ctx.or(ctx.number, ctx.Content),
    angle: ctx.number
  });
  const blockModel = {
    type: "block",
    ...ctx.containerModel,
    explode: ctx.getContainerExplode,
    render: ctx.getContainerRender,
    renderIfSelected: ctx.getContainerRenderIfSelected,
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
    getGeometries: ctx.getContainerGeometries,
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
    isValid: (c, p) => ctx.validate(c, BlockContent, p)
  };
  const blockLinesCache = new ctx.WeakmapCache2();
  const blockSnapPointsCache = new ctx.WeakmapCache2();
  function extractContentInBlockReference(target, content, block, contents) {
    const model = ctx.getContentModel(target);
    if (!model) {
      return void 0;
    }
    return ctx.produce(target, (draft) => {
      var _a, _b;
      (_a = model.rotate) == null ? void 0 : _a.call(model, draft, block.base, content.angle, contents);
      (_b = model.move) == null ? void 0 : _b.call(model, draft, content);
    });
  }
  function getBlockReferenceGeometries(content, contents) {
    const block = ctx.getReference(content.refId, contents, isBlockContent);
    if (block) {
      return blockLinesCache.get(block, content, () => {
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
            const r = (_b = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, extracted);
            if (r) {
              lines.push(...r.lines);
              if (r.bounding) {
                boundings.push(r.bounding);
              }
              if (r.renderingLines) {
                renderingLines.push(...r.renderingLines);
              }
              if (r.regions)
                [
                  regions.push(...r.regions)
                ];
            }
          }
        });
        return {
          lines,
          bounding: ctx.mergeBoundingsUnsafe(boundings),
          renderingLines,
          regions
        };
      });
    }
    return { lines: [], renderingLines: [] };
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
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        const p = ctx.mirrorPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line);
        content.x = p.x - block.base.x;
        content.y = p.y - block.base.y;
        content.angle = 2 * angle - content.angle;
      }
    },
    render(content, renderCtx) {
      const block = ctx.getReference(content.refId, renderCtx.contents, isBlockContent);
      if (block) {
        const children = ctx.renderContainerChildren({ ...block, variableValues: content.variableValues }, renderCtx);
        return renderCtx.target.renderGroup(children, { translate: content, base: block.base, angle: content.angle });
      }
      return renderCtx.target.renderEmpty();
    },
    renderIfSelected(content, renderCtx) {
      const block = ctx.getReference(content.refId, renderCtx.contents, isBlockContent);
      if (block) {
        const children = ctx.renderContainerIfSelected(block, renderCtx);
        return renderCtx.target.renderGroup([children], { translate: content, base: block.base, angle: content.angle });
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
      let variableNames = [];
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        variableNames = ctx.getContainerVariableNames(block);
      }
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
        ...ctx.getVariableValuesContentPropertyPanel(content, variableNames, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, BlockReferenceContent, p),
    getRefIds(content) {
      return typeof content.refId === "number" ? [content.refId] : void 0;
    },
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
              contents[index] = void 0;
            }
          }
        }
      });
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
  function getCenterLineGeometriesFromCache(content, contents) {
    const ref1 = ctx.getRefPart(content.ref1, contents, isLineContent);
    const ref2 = ctx.getRefPart(content.ref2, contents, isLineContent);
    if (ref1 && ref2) {
      return centerMarkLinesCache.get(ref1, ref2, content, () => {
        const line = ctx.maxmiumBy([
          [ctx.getTwoPointCenter(ref1.points[0], ref2.points[0]), ctx.getTwoPointCenter(ref1.points[1], ref2.points[1])],
          [ctx.getTwoPointCenter(ref1.points[0], ref2.points[1]), ctx.getTwoPointCenter(ref1.points[1], ref2.points[0])]
        ].map((r) => ({ line: r, length: ctx.getTwoPointsDistance(...r) })), (v) => v.length).line;
        return {
          lines: [line],
          bounding: ctx.getPointsBounding(line),
          renderingLines: ctx.dashedPolylineToLines(line, [8, 4])
        };
      });
    }
    return { lines: [], renderingLines: [] };
  }
  const centerMarkLinesCache = new ctx.WeakmapCache3();
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
    getRefIds: (content) => [
      ...content.ref1 && typeof content.ref1.id === "number" ? [content.ref1.id] : [],
      ...content.ref2 && typeof content.ref2.id === "number" ? [content.ref2.id] : []
    ],
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
  function getCenterMarkGeometriesFromCache(content, contents) {
    const target = ctx.getRefPart(content.ref, contents, contentSelectable);
    if (target) {
      return centerMarkLinesCache.get(target, content, () => {
        const lines = [
          [{ x: target.x - target.r, y: target.y }, { x: target.x + target.r, y: target.y }],
          [{ x: target.x, y: target.y - target.r }, { x: target.x, y: target.y + target.r }]
        ];
        return {
          lines,
          bounding: ctx.getPointsBounding(lines.flat()),
          renderingLines: lines.map((line) => ctx.dashedPolylineToLines(line, [8, 4])).flat()
        };
      });
    }
    return { lines: [], renderingLines: [] };
  }
  const centerMarkLinesCache = new ctx.WeakmapCache2();
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
    getRefIds: (content) => typeof content.ref === "number" ? [content.ref] : [],
    updateRefId(content, update) {
      if (content.ref) {
        const newRefId = update(content.ref.id);
        if (newRefId !== void 0) {
          content.ref.id = newRefId;
        }
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
`// dev/cad-editor/plugins/circle-arc.plugin.tsx
function getModel(ctx) {
  const CircleContent = ctx.and(ctx.BaseContent("circle"), ctx.StrokeFields, ctx.FillFields, ctx.Circle, {
    xExpression: ctx.optional(ctx.string),
    yExpression: ctx.optional(ctx.string),
    rExpression: ctx.optional(ctx.string)
  });
  const ArcContent = ctx.and(ctx.BaseContent("arc"), ctx.StrokeFields, ctx.FillFields, ctx.AngleDeltaFields, ctx.Arc);
  const geometriesCache = new ctx.WeakmapCache();
  const arcGeometriesCache = new ctx.WeakmapCache();
  function getCircleGeometries(content, _, time) {
    const quadrantPoints = ctx.getCircleQuadrantPoints(content);
    if (time && (content.xExpression || content.yExpression || content.rExpression)) {
      const x = ctx.getTimeExpressionValue(content.xExpression, time, content.x);
      const y = ctx.getTimeExpressionValue(content.yExpression, time, content.y);
      const r = ctx.getTimeExpressionValue(content.rExpression, time, content.r);
      return { quadrantPoints, ...getArcGeometries(ctx.circleToArc({ ...content, x, y, r })) };
    }
    return geometriesCache.get(content, () => {
      return { quadrantPoints, ...getArcGeometries(ctx.circleToArc(content)) };
    });
  }
  function getArcGeometries(content) {
    return arcGeometriesCache.get(content, () => {
      var _a;
      const points = ctx.arcToPolyline(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const startAngle = ctx.angleToRadian(content.startAngle);
      const endAngle = ctx.angleToRadian(content.endAngle);
      const middleAngle = (startAngle + endAngle) / 2;
      const geometries = {
        lines: [{ type: "arc", curve: content }],
        points,
        start: {
          x: content.x + content.r * Math.cos(startAngle),
          y: content.y + content.r * Math.sin(startAngle)
        },
        end: {
          x: content.x + content.r * Math.cos(endAngle),
          y: content.y + content.r * Math.sin(endAngle)
        },
        middle: {
          x: content.x + content.r * Math.cos(middleAngle),
          y: content.y + content.r * Math.sin(middleAngle)
        },
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
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const x = content.x;
          const y = content.y;
          const { quadrantPoints } = getCircleGeometries(content);
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
      getSnapPoints(content) {
        const { quadrantPoints } = getCircleGeometries(content);
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
      getRefIds: ctx.getStrokeAndFillRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
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
      render(content, renderCtx) {
        const { options, dashed, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
        if (dashed) {
          return target.renderPolyline(getCircleGeometries(content).points, options);
        }
        return target.renderArc(content.x, content.y, content.r, content.startAngle, content.endAngle, { ...options, counterclockwise: content.counterclockwise });
      },
      renderIfSelected(content, { color, target, strokeWidth }) {
        const { points } = getArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle });
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth });
      },
      getOperatorRenderPosition(content) {
        const { points } = getArcGeometries(content);
        return points[0];
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          const { start, end, middle } = getArcGeometries(content);
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
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => {
          const { start, end, middle } = getArcGeometries(content);
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
      getRefIds: ctx.getStrokeAndFillRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
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
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("mask", { id: "0" }, /* @__PURE__ */ React.createElement("path", { d: "M 1 1 L 1 100 L 103 100 L 103 1", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "white", stroke: "currentColor", fillRule: "evenodd" }), /* @__PURE__ */ React.createElement("path", { d: "M 91 70 L 91 73 L 91 75 L 90 78 L 90 80 L 89 82 L 88 84 L 86 86 L 85 88 L 83 90 L 81 91 L 79 93 L 77 94 L 75 95 L 73 96 L 71 97 L 68 97 L 66 98 L 64 98 L 61 98 L 59 97 L 57 97 L 54 96 L 52 95 L 50 94 L 48 93 L 46 91 L 44 90 L 43 88 L 41 86 L 40 84 L 39 82 L 38 80 L 37 78 L 37 75 L 36 73 L 36 70 L 36 68 L 37 66 L 37 63 L 38 61 L 39 59 L 40 57 L 41 55 L 43 53 L 44 51 L 46 49 L 48 48 L 50 47 L 52 46 L 54 45 L 57 44 L 59 43 L 61 43 L 64 43 L 66 43 L 68 43 L 71 44 L 73 45 L 75 46 L 77 47 L 79 48 L 81 49 L 83 51 L 85 53 L 86 55 L 88 57 L 89 59 L 90 61 L 90 63 L 91 66 L 91 68 L 91 70", fill: "black" })), /* @__PURE__ */ React.createElement("g", { mask: "url(#0)" }, /* @__PURE__ */ React.createElement("polygon", { points: "83,99 77,64 103,38 67,33 51,1 35,33 1,39 25,64 19,100 51,83", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", strokeOpacity: "1", fill: "currentColor", stroke: "currentColor" })));
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
        if (!type)
          return;
        if (!target.current) {
          target.current = selected[0].path;
          acquireContent(
            {
              count: 1,
              selectable: (v) => {
                var _a, _b;
                const content = ctx.getContentByIndex(contents, v);
                if (!content)
                  return false;
                const geometries = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents);
                if (!geometries)
                  return false;
                return geometries.lines.length > 0;
              }
            },
            (r) => {
              border.current = ctx.getRefPart(r[0], contents);
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
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/ellipse.plugin.tsx
function isEllipseArcContent(content) {
  return content.type === "ellipse arc";
}

// dev/cad-editor/plugins/combined-path.plugin.tsx
function getModel(ctx) {
  const CombinedPathContent = ctx.and(ctx.BaseContent("combined path"), ctx.ContainerFields, ctx.StrokeFields, ctx.FillFields);
  const getGeometries = (content) => {
    return ctx.getGeometriesFromCache(content, () => {
      const lines = [];
      const result = [];
      const boundings = [];
      content.contents.forEach((c) => {
        var _a, _b, _c, _d;
        if (!c) {
          return;
        }
        const r = (_b = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, c);
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
    explode: ctx.getContainerExplode,
    mirror: ctx.getContainerMirror,
    render(content, renderCtx) {
      const geometries = getGeometries(content);
      const { options } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      return renderCtx.target.renderGroup(geometries.renderingLines.map((line) => {
        return renderCtx.target.renderPolyline(line, options);
      }));
    },
    renderIfSelected: ctx.getContainerRenderIfSelected,
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, CombinedPathContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds
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
      for (let i = contents.length; i >= 0; i--) {
        if (ctx.isSelected([i], selected)) {
          contents[i] = void 0;
        }
      }
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
  function getGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
      const { regions, renderingLines } = getGeometriesFromCache(content);
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
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds
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
      const ids = /* @__PURE__ */ new Set();
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          for (const id of iterateRefContents(index, contents, ctx)) {
            ids.add(id);
          }
          if (type === "cut" && ctx.contentIsDeletable(content, contents)) {
            contents[index] = void 0;
          }
        }
      });
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
function* iterateRefContents(id, contents, ctx) {
  var _a, _b;
  yield id;
  const content = contents[id];
  if (content) {
    const refIds = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getRefIds) == null ? void 0 : _b.call(_a, content);
    if (refIds) {
      for (const refId of refIds) {
        yield* iterateRefContents(refId, contents, ctx);
      }
    }
  }
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
`// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
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
        result.push(...ctx.getCirclesTangentToLineAndCircle(line2, content1, radius));
      }
    } else if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]);
      if (isCircleContent(content2) || isArcContent(content2)) {
        result.push(...ctx.getCirclesTangentToLineAndCircle(line1, content2, radius));
      } else if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        result.push(...ctx.getCirclesTangentTo2Lines(line1, line2, radius));
      }
    }
    return result.map((c) => ({ ...c, r: radius }));
  }
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "10,87 89,87", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "17", cy: "40", r: "16", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("circle", { cx: "60", cy: "57", r: "30", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
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
    contentSelectable: (c) => isCircleContent(c) || isArcContent(c) || isLineContent(c),
    selectType: "select part",
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

// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/create-tangent-tangent-tangent-circle.plugin.tsx
function getCommand(ctx) {
  function getTangentTangentTangentCircles(content1, content2, content3) {
    const result = [];
    if (isLineContent(content1)) {
      const line1 = ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]);
      if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
          result.push(...ctx.getCirclesTangentTo3Lines(line1, line2, line3));
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineLineCircle(line1, line2, content3));
        }
      } else if (isCircleContent(content2) || isArcContent(content2)) {
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
          result.push(...ctx.getCirclesTangentToLineLineCircle(line1, line3, content2));
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line1, content2, content3));
        }
      }
    } else if (isCircleContent(content1) || isArcContent(content1)) {
      if (isLineContent(content2)) {
        const line2 = ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]);
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
          result.push(...ctx.getCirclesTangentToLineLineCircle(line2, line3, content1));
        } else if (isCircleContent(content3) || isArcContent(content3)) {
          result.push(...ctx.getCirclesTangentToLineCircleCircle(line2, content1, content3));
        }
      } else if (isCircleContent(content2) || isArcContent(content2)) {
        if (isLineContent(content3)) {
          const line3 = ctx.twoPointLineToGeneralFormLine(content3.points[0], content3.points[1]);
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
      contents.forEach((content, index) => {
        var _a, _b;
        if (content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true)) {
          contents[index] = void 0;
        }
      });
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
  const geometriesCache = new ctx.WeakmapCache();
  function getGeometries(content) {
    return geometriesCache.get(content, () => {
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
    explode(content) {
      const { lines } = getGeometries(content);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    offset(content, point, distance) {
      var _a;
      if (!distance) {
        distance = Math.min(...getGeometries(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point)) ? -2 : 2;
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
      const { points } = getGeometries(content);
      return target.renderPolygon(points, options);
    },
    getOperatorRenderPosition(content) {
      const { points } = getGeometries(content);
      return points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getGeometries(content);
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
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, lines } = getGeometries(content);
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getGeometries(content).points)
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
  const geometriesCache = new ctx.WeakmapCache();
  const ellipseArcGeometriesCache = new ctx.WeakmapCache();
  function getEllipseGeometries(content) {
    return geometriesCache.get(content, () => {
      var _a;
      const points = ctx.ellipseToPolygon(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const lines = Array.from(ctx.iteratePolygonLines(points));
      const polylinePoints = ctx.polygonToPolyline(points);
      const center = ctx.getEllipseCenter(content);
      const left = ctx.rotatePositionByEllipseCenter({ x: content.cx - content.rx, y: content.cy }, content);
      const right = ctx.rotatePositionByEllipseCenter({ x: content.cx + content.rx, y: content.cy }, content);
      const top = ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy - content.ry }, content);
      const bottom = ctx.rotatePositionByEllipseCenter({ x: content.cx, y: content.cy + content.ry }, content);
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
  function getEllipseArcGeometries(content) {
    return ellipseArcGeometriesCache.get(content, () => {
      var _a;
      const points = ctx.ellipseArcToPolyline(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const lines = Array.from(ctx.iteratePolylineLines(points));
      const center = ctx.getEllipseCenter(content);
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
    mirror(content, line, angle) {
      ctx.mirrorEllipse(content, line, angle);
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = Math.min(...getEllipseGeometries(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
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
        const { points } = getEllipseGeometries(content);
        return target.renderPolygon(points, options);
      }
      return target.renderEllipse(content.cx, content.cy, content.rx, content.ry, { ...options, angle: content.angle });
    },
    getOperatorRenderPosition(content) {
      return ctx.getEllipseCenter(content);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        var _a;
        const { center, left, right, top, bottom } = getEllipseGeometries(content);
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
    getSnapPoints(content) {
      const { center, left, right, top, bottom } = getEllipseGeometries(content);
      return ctx.getSnapPointsFromCache(content, () => [
        { ...center, type: "center" },
        { ...left, type: "endpoint" },
        { ...right, type: "endpoint" },
        { ...top, type: "endpoint" },
        { ...bottom, type: "endpoint" }
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getEllipseGeometries(content).points),
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
      offset(content, point, distance) {
        if (!distance) {
          distance = Math.min(...getEllipseArcGeometries(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
        }
        return ctx.getParallelEllipseArcsByDistance(content, distance)[ctx.pointSideToIndex(ctx.getPointSideOfEllipseArc(point, content))];
      },
      render(content, renderCtx) {
        const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
        const { points } = getEllipseArcGeometries(content);
        return target.renderPolyline(points, options);
      },
      renderIfSelected(content, { color, target, strokeWidth }) {
        const { points } = getEllipseArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle });
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth });
      },
      getOperatorRenderPosition(content) {
        const { points } = getEllipseArcGeometries(content);
        return points[0];
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          var _a;
          const { center, start, end } = getEllipseArcGeometries(content);
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
      getSnapPoints(content) {
        return ctx.getSnapPointsFromCache(content, () => {
          const { center, start, end, middle } = getEllipseArcGeometries(content);
          return [
            { ...center, type: "center" },
            { ...start, type: "endpoint" },
            { ...end, type: "endpoint" },
            { ...middle, type: "midpoint" }
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
      getRefIds: ctx.getStrokeAndFillRefIds,
      updateRefId: ctx.updateStrokeAndFillRefIds,
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
    axisId: ctx.or(ctx.number, ctx.Content),
    dependentVariable: ctx.or("x", "y"),
    expression: ctx.string
  });
  const equationCache = new ctx.WeakmapCache2();
  function getGeometriesFromCache(content, contents) {
    const axis = ctx.getReference(content.axisId, contents, isCoordinateAxisContent);
    if (axis) {
      return equationCache.get(content, axis, () => {
        var _a;
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
      });
    }
    return { lines: [], points: [], renderingLines: [] };
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
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...typeof content.axisId === "number" ? [content.axisId] : []],
    updateRefId(content, update) {
      const newAxisId = update(content.axisId);
      if (newAxisId !== void 0) {
        content.axisId = newAxisId;
      }
      ctx.updateStrokeRefIds(content, update);
    }
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
      contents.forEach((content, index) => {
        var _a, _b, _c, _d;
        if (content && ctx.isSelected([index], selected) && ((_b = (_a = this.contentSelectable) == null ? void 0 : _a.call(this, content, contents)) != null ? _b : true)) {
          const result = (_d = (_c = ctx.getContentModel(content)) == null ? void 0 : _c.explode) == null ? void 0 : _d.call(_c, content, contents);
          if (result) {
            newContents.push(...result);
            contents[index] = void 0;
          }
        }
      });
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
`// dev/cad-editor/plugins/fill-style.plugin.tsx
function getModel(ctx) {
  function getGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "5", y: "6", width: "89", height: "39", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("pattern", { id: "1", patternUnits: "userSpaceOnUse", width: "20", height: "20" }, /* @__PURE__ */ React.createElement("path", { d: "M 0 10 L 10 0 M 20 10 L 10 20", strokeWidth: "1", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" })), /* @__PURE__ */ React.createElement("rect", { x: "5", y: "55", width: "89", height: "39", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "url(#1)", stroke: "currentColor" }));
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
`// dev/cad-editor/plugins/line-polyline.plugin.tsx
function isLineContent(content) {
  return content.type === "line";
}

// dev/cad-editor/plugins/circle-arc.plugin.tsx
function isCircleContent(content) {
  return content.type === "circle";
}
function isArcContent(content) {
  return content.type === "arc";
}

// dev/cad-editor/plugins/fillet.plugin.tsx
function getCommand(ctx) {
  function getFillets(content1, content2, radius) {
    const result = [];
    if (!contentSelectable(content1) || !contentSelectable(content2)) {
      return result;
    }
    const circles = [];
    if (isLineContent(content1) && isLineContent(content2)) {
      circles.push(...ctx.getCirclesTangentTo2Lines(ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]), ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]), radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])),
        foot2: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]))
      })));
    } else if ((isCircleContent(content1) || isArcContent(content1)) && (isCircleContent(content2) || isArcContent(content2))) {
      circles.push(...ctx.getCirclesTangentTo2Circles(content1, content2, radius).map((c) => ({
        center: c,
        foot1: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content1)[0],
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content2)[0]
      })));
    } else if (isLineContent(content1) && (isCircleContent(content2) || isArcContent(content2))) {
      circles.push(...ctx.getCirclesTangentToLineAndCircle(ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1]), content2, radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])),
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content2)[0]
      })));
    } else if (isLineContent(content2) && (isCircleContent(content1) || isArcContent(content1))) {
      circles.push(...ctx.getCirclesTangentToLineAndCircle(ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1]), content1, radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])),
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content1)[0]
      })));
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
`// dev/cad-editor/plugins/group.plugin.tsx
function getModel(ctx) {
  const GroupContent = ctx.and(ctx.BaseContent("group"), ctx.ContainerFields, ctx.ClipFields);
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
      const result = ctx.getContainerRenderIfSelected(content, renderCtx);
      return ctx.renderClipContentIfSelected(content, result, renderCtx);
    },
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: ctx.getContainerGeometries,
    propertyPanel: (content, update, contents, { acquireContent }) => {
      return {
        ...ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
        ...ctx.getClipContentPropertyPanel(content, contents, acquireContent, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, GroupContent, p)
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
      for (let i = contents.length; i >= 0; i--) {
        if (ctx.isSelected([i], selected)) {
          contents[i] = void 0;
        }
      }
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
      end: ctx.Position,
      ids: [ctx.or(ctx.number, ctx.Content)]
    })
  });
  const refGeometriesCache = new ctx.WeakmapValuesCache();
  const geometriesCache = new ctx.WeakmapCache();
  function getHatchGeometries(content, contents) {
    const getDefault = (hatch) => geometriesCache.get(hatch, () => {
      const points = ctx.getGeometryLinesPoints(hatch.border);
      const holes = (hatch.holes || []).map((h) => ctx.getGeometryLinesPoints(h));
      return {
        lines: [],
        border: points,
        holes,
        bounding: ctx.getGeometryLinesBounding(hatch.border),
        renderingLines: [],
        regions: [
          {
            lines: hatch.border,
            points,
            holes
          }
        ]
      };
    });
    if (content.ref && content.ref.ids.length > 0) {
      const refContents = content.ref.ids.map((id) => ctx.getReference(id, contents)).filter((d) => !!d);
      if (refContents.length > 0) {
        const p = content.ref.point;
        const end = content.ref.end;
        return refGeometriesCache.get(content, refContents, () => {
          const getGeometriesInRange = () => refContents.map((c) => ctx.getContentHatchGeometries(c, contents));
          const border = ctx.getHatchByPosition(p, end, getGeometriesInRange);
          if (border) {
            const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange);
            return getDefault({
              border: border.lines,
              holes: holes == null ? void 0 : holes.holes
            });
          }
          return getDefault(content);
        });
      }
    }
    return getDefault(content);
  }
  return {
    type: "hatch",
    ...ctx.fillModel,
    move(content, offset) {
      if (content.ref) {
        ctx.movePoint(content.ref.point, offset);
        ctx.movePoint(content.ref.end, offset);
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
        ctx.rotatePoint(content.ref.end, center, angle);
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
    mirror(content, line, angle) {
      if (content.ref) {
        ctx.mirrorPoint(content.ref.point, line);
        ctx.mirrorPoint(content.ref.end, line);
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
    render(content, renderCtx) {
      const { options, target } = ctx.getFillRenderOptionsFromRenderContext(content, renderCtx);
      const { border, holes } = getHatchGeometries(content, renderCtx.contents);
      return target.renderPath([border, ...holes], options);
    },
    getGeometries: getHatchGeometries,
    propertyPanel(content, update, contents) {
      return {
        ...ctx.getFillContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, HatchContent, p),
    getRefIds: (content) => {
      var _a;
      return [
        ...ctx.getFillRefIds(content),
        ...(((_a = content.ref) == null ? void 0 : _a.ids) || []).filter((d) => typeof d === "number")
      ];
    },
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
    }
  };
}
function isHatchContent(content) {
  return content.type === "hatch";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "1,24 100,24", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "1,72 100,72", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "27,1 27,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "75,0 75,100", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", strokeOpacity: "1", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("pattern", { id: "1", patternUnits: "userSpaceOnUse", width: "10", height: "10" }, /* @__PURE__ */ React.createElement("path", { d: "M 0 5 L 5 0 M 10 5 L 5 10", strokeWidth: "1", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor", fillRule: "evenodd" })), /* @__PURE__ */ React.createElement("polygon", { points: "75,43 75,72 27,72 27,24 75,24 75,43", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fillOpacity: "1", fill: "url(#1)", stroke: "currentColor" }));
  return [
    {
      name: "create hatch",
      icon,
      useCommand({ onEnd, contents, getContentsInRange }) {
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
            if (contents.length === 0)
              return;
            const bounding = ctx.contentsBoundingCache.get(contents, () => {
              const points = ctx.getContentsPoints(contents, contents);
              return ctx.getPointsBoundingUnsafe(points);
            });
            const getGeometriesInRange = (region) => getContentsInRange(region).map((c) => ctx.getContentHatchGeometries(c, contents));
            const end = { x: bounding.end.x, y: p.y };
            const border = ctx.getHatchByPosition(p, end, (line) => getGeometriesInRange(ctx.getGeometryLineBoundingFromCache(line)));
            if (border) {
              const holes = ctx.getHatchHoles(border.lines, getGeometriesInRange);
              setHatch({
                type: "hatch",
                border: border.lines,
                holes: holes == null ? void 0 : holes.holes,
                ref: {
                  point: p,
                  end,
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
`// dev/cad-editor/plugins/line-polyline.plugin.tsx
function getModel(ctx) {
  const LineContent = ctx.and(ctx.BaseContent(ctx.or("line", "polyline")), ctx.StrokeFields, ctx.FillFields, {
    points: ctx.minItems(2, [ctx.Position])
  });
  const geometriesCache = new ctx.WeakmapCache();
  function getPolylineGeometries(content) {
    return geometriesCache.get(content, () => {
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
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    break(content, intersectionPoints) {
      const { lines } = getPolylineGeometries(content);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    offset(content, point, distance) {
      if (!distance) {
        distance = Math.min(...getPolylineGeometries(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      const { lines } = getPolylineGeometries(content);
      const index = ctx.getLinesOffsetDirection(point, lines);
      const points = ctx.getParallelPolylineByDistance(lines, index, distance);
      return ctx.trimOffsetResult(points, point, closed).map((p) => ctx.produce(content, (d) => {
        d.points = p;
      }));
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
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
      explode(content) {
        const { lines } = getPolylineGeometries(content);
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
  const linearDimensionCache = new ctx.WeakmapCache3();
  const getLinearDimensionPositions = (content, contents) => {
    var _a, _b;
    const p1 = (_a = ctx.getRefPosition(content.ref1, contents)) != null ? _a : content.p1;
    const p2 = (_b = ctx.getRefPosition(content.ref2, contents)) != null ? _b : content.p2;
    return { p1, p2 };
  };
  function getLinearDimensionGeometriesFromCache(content, contents) {
    const { p1, p2 } = getLinearDimensionPositions(content, contents);
    return linearDimensionCache.get(content, p1, p2, () => {
      var _a, _b;
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
    getRefIds: (content) => [
      ...ctx.getStrokeRefIds(content),
      ...content.ref1 && typeof content.ref1.id === "number" ? [content.ref1.id] : [],
      ...content.ref2 && typeof content.ref2.id === "number" ? [content.ref2.id] : []
    ],
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
  const geometriesCache = new ctx.WeakmapCache();
  function getNurbsGeometries(content) {
    return geometriesCache.get(content, () => {
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
    break(content, intersectionPoints) {
      const lines = getNurbsGeometries(content).lines;
      const result = ctx.breakGeometryLines(lines, intersectionPoints);
      return result.map((r) => r.map((t) => ctx.geometryLineToContent(t))).flat();
    },
    offset(content, point, distance) {
      const lines = getNurbsGeometries(content).lines;
      return ctx.getParallelGeometryLinesByDistance(point, lines, distance).map((r) => r.map((t) => ctx.geometryLineToContent(t))).flat();
    },
    render(content, renderCtx) {
      const { points } = getNurbsGeometries(content);
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
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
  function getOffsetResult(content, p, offset) {
    const model = ctx.getContentModel(content);
    if (model == null ? void 0 : model.offset) {
      const newContent = model.offset(content, p, offset);
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
    useCommand({ onEnd, type }) {
      let message = "";
      if (type) {
        message = "input offset or click to end";
      }
      const [offset, setOffset] = React.useState(0);
      const { input, clearText, setInputPosition, cursorPosition, setCursorPosition, resetInput } = ctx.useCursorInput(message, type ? (e, text) => {
        if (e.key === "Enter") {
          const offset2 = +text;
          if (!isNaN(offset2) && offset2 >= 0) {
            setOffset(offset2);
            clearText();
          }
        }
      } : void 0);
      return {
        onStart(p) {
          resetInput();
          onEnd({
            updateContents: (contents, selected) => {
              const target = contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c));
              for (const content of target) {
                if (content) {
                  contents.push(...getOffsetResult(content, p, offset));
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
            const newContents = getOffsetResult(content, cursorPosition, offset);
            if (newContents.length > 0) {
              return {
                newContents
              };
            }
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
  getCommand
};
`,
`// dev/cad-editor/plugins/coordinate-axis.plugin.tsx
function isCoordinateAxisContent(content) {
  return content.type === "coordinate axis";
}

// dev/cad-editor/plugins/parametric-equation.plugin.tsx
function getModel(ctx) {
  const ParametricEquationContent = ctx.and(ctx.BaseContent("parametric equation"), ctx.StrokeFields, ctx.SegmentCountFields, {
    axisId: ctx.or(ctx.number, ctx.Content),
    xExpression: ctx.string,
    yExpression: ctx.string,
    min: ctx.number,
    max: ctx.number
  });
  const equationCache = new ctx.WeakmapCache2();
  function getGeometriesFromCache(content, contents) {
    const axis = ctx.getReference(content.axisId, contents, isCoordinateAxisContent);
    if (axis) {
      return equationCache.get(content, axis, () => {
        var _a;
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
      });
    }
    return { lines: [], points: [], renderingLines: [] };
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
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...typeof content.axisId === "number" ? [content.axisId] : []],
    updateRefId(content, update) {
      const newAxisId = update(content.axisId);
      if (newAxisId !== void 0) {
        content.axisId = newAxisId;
      }
      ctx.updateStrokeRefIds(content, update);
    }
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
  const allContentsCache = new ctx.WeakmapCache2();
  const getAllContentsFromCache = (content, contents) => {
    const path = ctx.getRefPart(content.path, contents);
    if (!path)
      return [];
    return allContentsCache.get(content, path, () => {
      var _a, _b, _c, _d;
      const lines = (_b = (_a = ctx.getContentModel(path)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, path, contents).lines;
      if (!lines)
        return [];
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
        const r = ctx.getGeometryLinesPointAndTangentRadianByLength(lines, length);
        if (r) {
          result.push(...content.contents.map((child) => {
            var _a2, _b2;
            if (!child)
              return;
            const model = ctx.getContentModel(child);
            if (!model)
              return;
            const bounding2 = (_b2 = (_a2 = model.getGeometries) == null ? void 0 : _a2.call(model, child, contents)) == null ? void 0 : _b2.bounding;
            if (!bounding2)
              return;
            const move = model.move;
            if (!move)
              return;
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
  const getGeometries = (content, contents) => ctx.getContentsGeometries(content, (c) => getAllContentsFromCache(c, contents));
  const React = ctx.React;
  return {
    type: "path array",
    ...ctx.containerModel,
    move: ctx.getContainerMove,
    rotate: ctx.getContainerRotate,
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
    getRefIds: (content) => typeof content.path === "number" ? [content.path] : [],
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
  if (!content)
    return false;
  const geometries = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content, contents);
  if (!geometries)
    return false;
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
        if (!type)
          return;
        if (!target.current) {
          target.current = selected.map((s) => s.path);
          acquireContent(
            {
              count: 1,
              selectable: (v) => {
                const content = ctx.getContentByIndex(contents, v);
                if (!content)
                  return false;
                return pathContentSelectable(ctx, content, contents);
              }
            },
            (r) => {
              path.current = r[0];
            }
          );
        } else if (path.current) {
          const children = target.current.map((c) => contents[c[0]]);
          const bounding = ctx.getContentsBounding(children);
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
                  for (const c of target.current) {
                    contents2[c[0]] = void 0;
                  }
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
  function getPathGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const lines = ctx.pathCommandsToGeometryLines(content.commands)[0];
      const points = ctx.getGeometryLinesPoints(lines);
      return {
        lines,
        bounding: ctx.getGeometryLinesBounding(lines),
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
    break(content, intersectionPoints) {
      const lines = getPathGeometriesFromCache(content).lines;
      return ctx.breakGeometryLinesToPathCommands(lines, intersectionPoints);
    },
    offset(content, point, distance) {
      const lines = getPathGeometriesFromCache(content).lines;
      return ctx.getParallelGeometryLinesByDistance(point, lines, distance).map((g) => ({
        ...content,
        commands: ctx.geometryLineToPathCommands(g)
      }));
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    reverse: (content) => ({
      ...content,
      commands: ctx.geometryLineToPathCommands(getPathGeometriesFromCache(content).lines.map((n) => ctx.reverseGeometryLine(n)).reverse())
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
  function getGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
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
`// dev/cad-editor/plugins/point.plugin.tsx
function getModel(ctx) {
  const PointContent = ctx.and(ctx.BaseContent("point"), ctx.Position);
  function getPointGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
      useCommand({ onEnd }) {
        return {
          onStart: (p) => {
            onEnd({
              updateContents: (contents) => contents.push({ x: p.x, y: p.y, type: "point" })
            });
          }
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
  const getAllContentsFromCache = (content, contents) => {
    return ctx.allContentsCache.get(content, () => {
      const result = [];
      const bounding = ctx.getContentsBounding(content.contents);
      if (!bounding)
        return result;
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
              if (!c)
                return;
              const model = ctx.getContentModel(c);
              const rotate = model == null ? void 0 : model.rotate;
              if (!rotate)
                return;
              const move = model.move;
              if (!move)
                return;
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
  const getGeometries = (content, contents) => ctx.getContentsGeometries(content, (c) => getAllContentsFromCache(c, contents));
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
        if (!c)
          return;
        (_b = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.rotate) == null ? void 0 : _b.call(_a, c, center, angle, contents);
      });
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
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const bounding = ctx.getContentsBounding(content.contents);
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
    isValid: (c, p) => ctx.validate(c, PolarArrayContent, p)
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
              const target = contents.filter((c, i) => c && ctx.isSelected([i], selected) && contentSelectable(c, contents));
              const bounding = ctx.getContentsBounding(target);
              if (!bounding)
                return;
              const newContent = {
                type: "polar array",
                center: p,
                contents: target,
                rowCount: 1,
                rowSpacing: ctx.getTwoPointsDistance(bounding.end, bounding.start) * 1.5,
                itemCount: 6,
                itemAngle: 60
              };
              for (let i = contents.length; i >= 0; i--) {
                if (ctx.isSelected([i], selected)) {
                  contents[i] = void 0;
                }
              }
              contents.push(newContent);
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
            const bounding = (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content).bounding;
            if (!bounding)
              return {};
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
  const geometriesCache = new ctx.WeakmapCache();
  function getPolygonGeometries(content) {
    return geometriesCache.get(content, () => {
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
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    explode(content) {
      const { lines } = getPolygonGeometries(content);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    break(content, intersectionPoints) {
      const { lines } = getPolygonGeometries(content);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    offset(content, point, distance) {
      const { lines } = getPolygonGeometries(content);
      if (!distance) {
        distance = Math.min(...lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      const generalFormLines = lines.map((line) => ctx.twoPointLineToGeneralFormLine(...line));
      const index = ctx.getLinesOffsetDirection(point, lines);
      const parallelLines = generalFormLines.map((line) => ctx.getParallelLinesByDistance(line, distance)[index]);
      const points = [];
      for (let i = 0; i < parallelLines.length; i++) {
        const previous = parallelLines[i === 0 ? parallelLines.length - 1 : i - 1];
        const p = ctx.getTwoGeneralFormLinesIntersectionPoint(previous, parallelLines[i]);
        if (p) {
          points.push(p);
        }
      }
      return ctx.trimOffsetResult(points, point, true).map((p) => ctx.produce(content, (d) => {
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
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
  function getRadialDimensionReferenceGeometriesFromCache(content, contents) {
    const target = ctx.getRefPart(content.ref, contents, contentSelectable);
    if (target) {
      return radialDimensionReferenceLinesCache.get(target, content, () => {
        var _a, _b;
        return ctx.getRadialDimensionGeometries(content, target, {
          arrowAngle: (_a = content.arrowAngle) != null ? _a : ctx.dimensionStyle.arrowAngle,
          arrowSize: (_b = content.arrowSize) != null ? _b : ctx.dimensionStyle.arrowSize,
          margin: ctx.dimensionStyle.margin
        }, getTextPosition);
      });
    }
    return { lines: [], points: [], renderingLines: [] };
  }
  const radialDimensionReferenceLinesCache = new ctx.WeakmapCache2();
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
    render(content, renderCtx) {
      const { options, contents, target, fillOptions, strokeColor } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents);
      const children = [];
      for (const line of lines) {
        children.push(target.renderPolyline(line, options));
      }
      if (regions && regions.length > 0) {
        children.push(target.renderPolygon(regions[0].points, fillOptions));
      }
      const referenceTarget = ctx.getRefPart(content.ref, contents, contentSelectable);
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
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...typeof content.ref === "number" ? [content.ref] : []],
    updateRefId(content, update) {
      if (content.ref) {
        const newRefId = update(content.ref.id);
        if (newRefId !== void 0) {
          content.ref.id = newRefId;
        }
      }
      ctx.updateStrokeRefIds(content, update);
    }
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
  const React = ctx.React;
  function getRayGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      return {
        lines: [{ type: "ray", line: content }],
        renderingLines: []
      };
    });
  }
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
    mirror(content, line, angle) {
      ctx.mirrorPoint(content, line);
      content.angle = 2 * angle - content.angle;
    },
    break(content, intersectionPoints) {
      return ctx.breakGeometryLines(getRayGeometries(content).lines, intersectionPoints).flat().map((n) => ctx.geometryLineToContent(n));
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
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds,
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
              if (!c)
                return;
              const move = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.move;
              if (!move)
                return;
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
  const getGeometries = (content) => ctx.getContentsGeometries(content, getAllContentsFromCache);
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
        if (!c)
          return;
        const m = ctx.getContentModel(c);
        if (!m)
          return;
        (_a = m.move) == null ? void 0 : _a.call(m, c, { x, y });
        (_b = m.rotate) == null ? void 0 : _b.call(m, c, center, angle, contents);
        (_c = m.move) == null ? void 0 : _c.call(m, c, { x: -x, y: -y });
      });
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
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const bounding = ctx.getContentsBounding(content.contents);
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
    isValid: (c, p) => ctx.validate(c, RectArrayContent, p)
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
      const bounding = ctx.getContentsBounding(target);
      if (!bounding)
        return;
      const newContent = {
        type: "rect array",
        contents: target,
        rowCount: 3,
        rowSpacing: -(bounding.end.y - bounding.start.y) * 1.5,
        columnCount: 4,
        columnSpacing: (bounding.end.x - bounding.start.x) * 1.5
      };
      for (let i = contents.length; i >= 0; i--) {
        if (ctx.isSelected([i], selected)) {
          contents[i] = void 0;
        }
      }
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
  const geometriesCache = new ctx.WeakmapCache();
  function getRectGeometries(content) {
    return geometriesCache.get(content, () => {
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
    explode(content) {
      const { lines } = getRectGeometries(content);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    break(content, intersectionPoints) {
      const { lines } = getRectGeometries(content);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    mirror(content, line, angle) {
      ctx.mirrorPoint(content, line);
      content.angle = 2 * angle - content.angle;
    },
    offset(content, point, distance) {
      var _a;
      if (!distance) {
        distance = Math.min(...getRectGeometries(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= 2 * (((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point)) ? -1 : 1);
      return ctx.produce(content, (d) => {
        d.width += distance;
        d.height += distance;
      });
    },
    render(content, renderCtx) {
      const { options, dashed, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      if (dashed) {
        const { points } = getRectGeometries(content);
        return target.renderPolygon(points, options);
      }
      return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { ...options, angle: content.angle });
    },
    getOperatorRenderPosition(content) {
      const { points } = getRectGeometries(content);
      return points[0];
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points, midpoints } = getRectGeometries(content);
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
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points, midpoints } = getRectGeometries(content);
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getRectGeometries(content).points),
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
  const geometriesCache = new ctx.WeakmapCache();
  function getRegularPolygonGeometriesFromCache(content) {
    return geometriesCache.get(content, () => {
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
    offset(content, point, distance) {
      var _a;
      if (!distance) {
        distance = Math.min(...getRegularPolygonGeometriesFromCache(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point)) ? -1 : 1;
      const radius = distance / Math.cos(Math.PI / content.count);
      return ctx.produce(content, (d) => {
        d.radius += radius;
      });
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getRegularPolygonGeometriesFromCache(content);
      return target.renderPolygon(points, options);
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getRegularPolygonGeometriesFromCache(content);
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
    isValid: (c, p) => ctx.validate(c, RegularPolygonContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getRegularPolygonGeometriesFromCache(content).points)
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
          const result = (_d = (_c = ctx.getContentModel(content)) == null ? void 0 : _c.reverse) == null ? void 0 : _d.call(_c, content);
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
  function getRingGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
            lines,
            points: points1,
            holes: [points2]
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
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { renderingLines, regions } = getRingGeometriesFromCache(content);
      if (regions) {
        return target.renderPath([regions[0].points, ...regions[0].holes || []], options);
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds
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
  const geometriesCache = new ctx.WeakmapCache();
  function getGeometries(content) {
    return geometriesCache.get(content, () => {
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
    offset(content, point, distance) {
      var _a;
      if (!distance) {
        distance = Math.min(...getGeometries(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point)) ? -2 : 2;
      return ctx.produce(content, (d) => {
        d.width += distance;
        d.height += distance;
      });
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { renderingLines } = getGeometries(content);
      return target.renderPath(renderingLines, options);
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      const { points, arcPoints } = getGeometries(content);
      return target.renderGroup(points.map((p, i) => target.renderPolyline([arcPoints[2 * i], p, arcPoints[2 * i + 1]], { strokeColor: color, dashArray: [4], strokeWidth })));
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { points } = getGeometries(content);
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
    getSnapPoints(content) {
      return ctx.getSnapPointsFromCache(content, () => {
        const { points } = getGeometries(content);
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getGeometries(content).points)
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
  const geometriesCache = new ctx.WeakmapCache();
  function getSplineGeometries(content) {
    return geometriesCache.get(content, () => {
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
  function getSplineArrowGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const geometry = getSplineGeometries(content);
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
    mirror(content, line) {
      for (const point of content.points) {
        ctx.mirrorPoint(point, line);
      }
    },
    break(content, intersectionPoints) {
      const lines = getSplineGeometries(content).lines;
      return ctx.breakGeometryLinesToPathCommands(lines, intersectionPoints);
    },
    explode(content) {
      const lines = getSplineGeometries(content).lines;
      return [{ type: "path", commands: ctx.geometryLineToPathCommands(lines) }];
    },
    render(content, renderCtx) {
      const { options, target } = ctx.getStrokeFillRenderOptionsFromRenderContext(content, renderCtx);
      const { points } = getSplineGeometries(content);
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
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
      mirror: splineModel.mirror,
      render(content, renderCtx) {
        const { options, target, fillOptions } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
        const { regions, renderingLines } = getSplineArrowGeometries(content);
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
      getRefIds: ctx.getStrokeRefIds,
      updateRefId: ctx.updateStrokeRefIds,
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
  const geometriesCache = new ctx.WeakmapCache();
  function getStarGeometriesFromCache(content) {
    return geometriesCache.get(content, () => {
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
    break(content, intersectionPoints) {
      const { lines } = getStarGeometriesFromCache(content);
      return ctx.breakPolyline(lines, intersectionPoints);
    },
    offset(content, point, distance) {
      var _a;
      if (!distance) {
        distance = Math.min(...getStarGeometriesFromCache(content).lines.map((line) => ctx.getPointAndGeometryLineMinimumDistance(point, line)));
      }
      distance *= ((_a = this.isPointIn) == null ? void 0 : _a.call(this, content, point)) ? -1 : 1;
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
      const { points } = getStarGeometriesFromCache(content);
      return target.renderPolygon(points, options);
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
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds,
    isPointIn: (content, point) => ctx.pointInPolygon(point, getStarGeometriesFromCache(content).points)
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
    return ctx.getGeometriesFromCache(content, () => {
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
  const geometriesCache = new ctx.WeakmapCache();
  const textLayoutResultCache = new ctx.WeakmapMap3Cache();
  const getGeometries = (content) => {
    return geometriesCache.get(content, () => {
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
    render(content, renderCtx) {
      const geometries = getGeometries(content);
      const { options, strokeColor } = ctx.getStrokeRenderOptionsFromRenderContext(content, renderCtx);
      const textOptions = ctx.getTextStyleRenderOptionsFromRenderContext(strokeColor, renderCtx);
      const children = geometries.renderingLines.map((line) => renderCtx.target.renderPolyline(line, options));
      content.rows.forEach((row, i) => {
        var _a;
        (_a = row.cells) == null ? void 0 : _a.forEach((cell) => {
          var _a2, _b;
          const child = geometries.children.find((f) => f.row === i && f.column === cell.column);
          if (!child)
            return;
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
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        const { rows, columns, xs, ys } = getGeometries(content);
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
      if (!activeChild)
        return /* @__PURE__ */ React.createElement(React.Fragment, null);
      const [row, column] = activeChild;
      const cell = (_a = content.rows[row].cells) == null ? void 0 : _a.find((c) => c.column === column);
      if (!cell)
        return /* @__PURE__ */ React.createElement(React.Fragment, null);
      const { children } = getGeometries(content);
      const child = children.find((f) => f.row === row && f.column === column);
      if (!child)
        return /* @__PURE__ */ React.createElement(React.Fragment, null);
      const textStyleContent = ctx.getTextStyleContent(cell, contents);
      const fontSize = textStyleContent.fontSize * scale;
      return /* @__PURE__ */ React.createElement(
        ctx.TextEditor,
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
    getChildByPoint(content, point, { textStyleId }) {
      var _a;
      const { children } = getGeometries(content);
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
  if (!c.mergedCells)
    c.mergedCells = [];
  const index = c.mergedCells.findIndex((m) => m.row[0] === row && m.column[0] === column);
  if (index < 0) {
    c.mergedCells.push({ row: [row, v], column: [column, 1] });
  } else if (v <= 1 && c.mergedCells[index].column[1] <= 1) {
    c.mergedCells.splice(index, 1);
    if (c.mergedCells.length === 0)
      c.mergedCells = void 0;
  } else {
    c.mergedCells[index].row[1] = v;
  }
}
function setTableColumnSpan(c, row, column, v) {
  if (!c.mergedCells)
    c.mergedCells = [];
  const index = c.mergedCells.findIndex((m) => m.row[0] === row && m.column[0] === column);
  if (index < 0) {
    c.mergedCells.push({ row: [row, 1], column: [column, v] });
  } else if (v <= 1 && c.mergedCells[index].row[1] <= 1) {
    c.mergedCells.splice(index, 1);
    if (c.mergedCells.length === 0)
      c.mergedCells = void 0;
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
    textVariableName: ctx.optional(ctx.string)
  });
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
    return ctx.getGeometriesFromCache(content, () => {
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
      if (hasWidth(content)) {
        const { layoutResult } = getTextLayoutResult(content, textStyleContent, variableContext);
        const children = [];
        for (const { x, y, content: text2 } of layoutResult) {
          const textWidth = (_b = (_a = ctx.getTextSizeFromCache(ctx.getTextStyleFont(textStyleContent), text2)) == null ? void 0 : _a.width) != null ? _b : 0;
          children.push(target.renderText(content.x + x + textWidth / 2, content.y + y + textStyleContent.fontSize, text2, textStyleContent.color, textStyleContent.fontSize, textStyleContent.fontFamily, { textAlign: "center", cacheKey, ...textOptions }));
        }
        return target.renderGroup(children);
      }
      return target.renderText(content.x, content.y, text, color, textStyleContent.fontSize, textStyleContent.fontFamily, { cacheKey, ...textOptions });
    },
    getGeometries: getTextGeometries,
    propertyPanel(content, update, contents, { acquirePoint }) {
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
        ]
      };
    },
    editPanel(content, scale, update, contents, cancel, transformPosition) {
      const p = transformPosition(content);
      const textStyleContent = ctx.getTextStyleContent(content, contents);
      const fontSize = textStyleContent.fontSize * scale;
      if (content.width) {
        return /* @__PURE__ */ React.createElement(
          ctx.TextEditor,
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
              ctx.TextEditor,
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
          if (!type)
            return;
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
          if (!type)
            return;
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
  function getGeometriesFromCache(content, _, time) {
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
    return ctx.getGeometriesFromCache(content, getGeometries);
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
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds
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
`// dev/cad-editor/plugins/trim.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { viewBox: "64 64 896 896", width: "1em", height: "1em", fill: "currentColor" }, /* @__PURE__ */ React.createElement("path", { d: "M567.1 512l318.5-319.3c5-5 1.5-13.7-5.6-13.7h-90.5c-2.1 0-4.2.8-5.6 2.3l-273.3 274-90.2-90.5c12.5-22.1 19.7-47.6 19.7-74.8 0-83.9-68.1-152-152-152s-152 68.1-152 152 68.1 152 152 152c27.7 0 53.6-7.4 75.9-20.3l90 90.3-90.1 90.3A151.04 151.04 0 00288 582c-83.9 0-152 68.1-152 152s68.1 152 152 152 152-68.1 152-152c0-27.2-7.2-52.7-19.7-74.8l90.2-90.5 273.3 274c1.5 1.5 3.5 2.3 5.6 2.3H880c7.1 0 10.7-8.6 5.6-13.7L567.1 512zM288 370c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80zm0 444c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" }));
  return {
    name: "trim",
    useCommand({ onEnd, type, selected, backgroundColor, contents }) {
      var _a, _b;
      const [candidates, setCandidates] = React.useState([]);
      const [currents, setCurrents] = React.useState([]);
      const [trackPoints, setTrackPoints] = React.useState([]);
      const { state, setState, resetHistory, undo, redo } = ctx.useUndoRedo([]);
      React.useEffect(() => {
        var _a2, _b2;
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
              const result = (_b2 = (_a2 = ctx.getContentModel(content)) == null ? void 0 : _a2.break) == null ? void 0 : _b2.call(_a2, content, intersectionPoints, contents);
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
      for (const current of currents) {
        for (const child of current.children) {
          if (ctx.isStrokeContent(child)) {
            assistentContents.push({
              ...child,
              strokeWidth: ((_a = child.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(child)) + 2,
              strokeColor: backgroundColor,
              trueStrokeColor: true
            });
          }
        }
      }
      if (trackPoints.length > 1) {
        assistentContents.push({ points: trackPoints, type: "polyline" });
      }
      for (const { children } of state) {
        for (const child of children) {
          if (ctx.isStrokeContent(child)) {
            assistentContents.push({
              ...child,
              strokeWidth: ((_b = child.strokeWidth) != null ? _b : ctx.getDefaultStrokeWidth(child)) + 2,
              strokeColor: backgroundColor,
              trueStrokeColor: true
            });
          }
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
          var _a2, _b2, _c, _d;
          if (trackPoints.length > 0) {
            const newTracePoints = [...trackPoints, p];
            if (newTracePoints.length > 1) {
              const trackLines = Array.from(ctx.iteratePolylineLines(newTracePoints));
              const newCurrents = [];
              for (const candidate of candidates) {
                for (const child of candidate.children) {
                  const geometries = (_b2 = (_a2 = ctx.getContentModel(child)) == null ? void 0 : _a2.getGeometries) == null ? void 0 : _b2.call(_a2, child, contents);
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
          var _a2, _b2;
          if (e.code === "KeyZ" && ctx.metaKeyIfMacElseCtrlKey(e)) {
            if (e.shiftKey) {
              redo(e);
            } else {
              undo(e);
            }
          } else if (e.key === "Enter") {
            if (!type)
              return;
            const removedIndexes = [];
            const newContents = [];
            for (const { content, children } of state) {
              const parentModel = ctx.getContentModel(content);
              if (parentModel == null ? void 0 : parentModel.break) {
                let points = [];
                for (const child of children) {
                  const geometries = (_b2 = (_a2 = ctx.getContentModel(child)) == null ? void 0 : _a2.getGeometries) == null ? void 0 : _b2.call(_a2, child, contents);
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
              }
            }
            onEnd({
              updateContents: (contents2) => {
                for (const index of removedIndexes) {
                  contents2[index] = void 0;
                }
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
      const model = ctx.getContentModel(content);
      return (model == null ? void 0 : model.break) !== void 0 && ctx.contentIsDeletable(content, contents);
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
`// dev/cad-editor/plugins/viewport.plugin.tsx
function getModel(ctx) {
  function getViewportGeometriesFromCache(content, contents) {
    var _a, _b;
    const geometries = (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, content.border, contents);
    if (geometries) {
      return {
        ...geometries,
        regions: [{
          points: [],
          lines: []
        }]
      };
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
          clip: renderCtx.isHoveringOrSelected ? void 0 : () => {
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
      if (!editPoints)
        return;
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
    getRefIds: (content) => ctx.getStrokeRefIds(content),
    updateRefId(content, update) {
      ctx.updateStrokeRefIds(content, update);
    }
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
          if (!viewport)
            return;
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
]
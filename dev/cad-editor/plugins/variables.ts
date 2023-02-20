export const pluginScripts = [
`// dev/cad-editor/plugins/arrow.plugin.tsx
function getModel(ctx) {
  const ArrowContent = ctx.and(ctx.BaseContent("arrow"), ctx.StrokeFields, ctx.ArrowFields, {
    p1: ctx.Position,
    p2: ctx.Position
  });
  function getArrowGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const { arrowPoints, endPoint } = ctx.getArrowPoints(content.p1, content.p2, content);
      const points = [content.p1, endPoint];
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
    ...ctx.arrowModel,
    move(content, offset) {
      content.p1.x += offset.x;
      content.p1.y += offset.y;
      content.p2.x += offset.x;
      content.p2.y += offset.y;
    },
    rotate(content, center, angle) {
      content.p1 = ctx.rotatePositionByCenter(content.p1, center, -angle);
      content.p2 = ctx.rotatePositionByCenter(content.p2, center, -angle);
    },
    mirror(content, line) {
      content.p1 = ctx.getSymmetryPoint(content.p1, line);
      content.p2 = ctx.getSymmetryPoint(content.p2, line);
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const strokeColor = getStrokeColor(strokeStyleContent);
      const strokeWidth = transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content));
      const { regions, renderingLines } = getArrowGeometriesFromCache(content);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth }));
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }));
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
    propertyPanel(content, update, contents) {
      return {
        p1: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
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
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents)
      };
    },
    isValid: (c, p) => ctx.validate(c, ArrowContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds
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
      const { line, onClick, onMove, input, lastPosition, reset } = ctx.useLineClickCreate(
        type === "create arrow",
        (c) => onEnd({
          updateContents: (contents) => contents.push({
            type: "arrow",
            p1: c[0],
            p2: c[1],
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
    propertyPanel(content, update) {
      return {
        base: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
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
        const points = [];
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
              points.push(...r.points);
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
          points,
          bounding: ctx.getPointsBounding(points),
          renderingLines,
          regions
        };
      });
    }
    return { lines: [], points: [], renderingLines: [] };
  }
  const blockReferenceModel = {
    type: "block reference",
    ...ctx.variableValuesModel,
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    rotate(content, center, angle, contents) {
      const block = ctx.getReference(content.refId, contents, isBlockContent);
      if (block) {
        const p = ctx.rotatePositionByCenter({ x: content.x + block.base.x, y: content.y + block.base.y }, center, -angle);
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
        const p = ctx.getSymmetryPoint({ x: content.x + block.base.x, y: content.y + block.base.y }, line);
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
    propertyPanel(content, update, contents) {
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
    return !ctx.contentIsReferenced(content, contents);
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
      return (model == null ? void 0 : model.break) !== void 0 && !ctx.contentIsReferenced(content, contents);
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
  function getCircleGeometries(content, _, time) {
    if (time && (content.xExpression || content.yExpression || content.rExpression)) {
      const x = ctx.getTimeExpressionValue(content.xExpression, time, content.x);
      const y = ctx.getTimeExpressionValue(content.yExpression, time, content.y);
      const r = ctx.getTimeExpressionValue(content.rExpression, time, content.r);
      return getArcGeometries({ ...content, x, y, r, startAngle: 0, endAngle: 360 });
    }
    return ctx.getGeometriesFromCache(content, () => {
      return getArcGeometries({ ...content, startAngle: 0, endAngle: 360 });
    });
  }
  function getArcGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      var _a;
      const points = ctx.arcToPolyline(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const geometries = {
        lines: Array.from(ctx.iteratePolylineLines(points)),
        points,
        bounding: ctx.getPointsBounding(points),
        renderingLines: ctx.dashedPolylineToLines(points, content.dashArray)
      };
      if (ctx.hasFill(content)) {
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
      render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents, clip, time }) {
        var _a;
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
        const fillStyleContent = ctx.getFillStyleContent(content, contents);
        const options = {
          fillColor: getFillColor(fillStyleContent),
          strokeColor: getStrokeColor(strokeStyleContent),
          strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
          fillPattern: getFillPattern(fillStyleContent)
        };
        if (strokeStyleContent.dashArray) {
          const { points } = getCircleGeometries(content, contents, time);
          return target.renderPolyline(points, { ...options, dashArray: strokeStyleContent.dashArray, clip });
        }
        const x = ctx.getTimeExpressionValue(content.xExpression, time, content.x);
        const y = ctx.getTimeExpressionValue(content.yExpression, time, content.y);
        const r = ctx.getTimeExpressionValue(content.rExpression, time, content.r);
        return target.renderCircle(x, y, r, { ...options, clip });
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
          fill: ctx.hasFill(content),
          bounding: {
            start: { x: content.x - content.r, y: content.y - content.r },
            end: { x: content.x + content.r, y: content.y + content.r }
          }
        };
      },
      getGeometries: getCircleGeometries,
      propertyPanel(content, update, contents) {
        return {
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
      isPointIn: (content, point) => ctx.getTwoPointsDistance(content, point) < content.r
    },
    {
      type: "arc",
      ...ctx.strokeModel,
      ...ctx.fillModel,
      ...ctx.angleDeltaModel,
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
      render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
        var _a;
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
        const fillStyleContent = ctx.getFillStyleContent(content, contents);
        const options = {
          fillColor: getFillColor(fillStyleContent),
          strokeColor: getStrokeColor(strokeStyleContent),
          strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
          fillPattern: getFillPattern(fillStyleContent)
        };
        if (strokeStyleContent.dashArray) {
          const { points } = getCircleGeometries(content);
          return target.renderPolyline(points, { ...options, dashArray: strokeStyleContent.dashArray });
        }
        return target.renderArc(content.x, content.y, content.r, content.startAngle, content.endAngle, { ...options, counterclockwise: content.counterclockwise });
      },
      renderIfSelected(content, { color, target, strokeWidth }) {
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
                type: "move",
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
                  c.r = ctx.getTwoPointsDistance(cursor, c);
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
                  c.r = ctx.getTwoPointsDistance(cursor, c);
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
      propertyPanel(content, update, contents) {
        return {
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
      getStartPoint: (content) => ctx.getArcPointAtAngle(content, content.startAngle),
      getEndPoint: (content) => ctx.getArcPointAtAngle(content, content.endAngle)
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
`// dev/cad-editor/plugins/clone.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("rect", { x: "8", y: "27", width: "62", height: "65", strokeWidth: "3", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("rect", { x: "30", y: "8", width: "62", height: "65", strokeWidth: "3", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
  return {
    name: "clone",
    useCommand({ onEnd, transform, type, scale }) {
      const { offset, onStart, mask, startPosition, reset } = ctx.useDragMove(
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
      const points = [];
      const remains = [];
      const boundings = [];
      content.contents.forEach((c) => {
        var _a, _b;
        if (!c) {
          return;
        }
        const r = (_b = (_a = ctx.getContentModel(c)) == null ? void 0 : _a.getGeometries) == null ? void 0 : _b.call(_a, c);
        if (r) {
          lines.push(...r.lines);
          points.push(...r.points);
          remains.push(r.points);
          if (r.bounding) {
            boundings.push(r.bounding.start, r.bounding.end);
          }
        }
      });
      const result = [];
      const combine = (points2, target) => {
        const start = points2[0];
        let i = target.findIndex((r) => ctx.isSamePoint(r[0], start));
        if (i >= 0) {
          target[i] = [...points2.slice(1, points2.length).reverse(), ...target[i]];
          return true;
        }
        i = target.findIndex((r) => ctx.isSamePoint(r[r.length - 1], start));
        if (i >= 0) {
          target[i] = [...target[i], ...points2.slice(1, points2.length)];
          return true;
        }
        const end = points2[points2.length - 1];
        i = target.findIndex((r) => ctx.isSamePoint(r[0], end));
        if (i >= 0) {
          target[i] = [...points2.slice(0, points2.length - 1), ...target[i]];
          return true;
        }
        i = target.findIndex((r) => ctx.isSamePoint(r[r.length - 1], end));
        if (i >= 0) {
          target[i] = [...target[i], ...points2.slice(1, points2.length).reverse()];
          return true;
        }
        return false;
      };
      while (remains.length > 0) {
        const current = remains.shift();
        if (!current) {
          break;
        }
        let success = combine(current, result);
        if (success) {
          continue;
        }
        success = combine(current, remains);
        if (success) {
          continue;
        }
        result.push(current);
      }
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(boundings),
        renderingLines: result,
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
      var _a;
      const geometries = getGeometries(content);
      const strokeStyleContent = ctx.getStrokeStyleContent(content, renderCtx.contents);
      const fillStyleContent = ctx.getFillStyleContent(content, renderCtx.contents);
      const options = {
        ...renderCtx,
        fillColor: renderCtx.getFillColor(fillStyleContent),
        fillPattern: renderCtx.getFillPattern(fillStyleContent),
        strokeColor: renderCtx.getStrokeColor(strokeStyleContent),
        strokeWidth: renderCtx.transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray
      };
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
    return !ctx.contentIsReferenced(content, contents) && (isLineContent(content) || isArcContent(content) || isPolyLineContent(content) || isEllipseArcContent(content));
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
        var _a2, _b2, _c;
        return !!d && ((_c = (_b2 = (_a2 = ctx.getContentModel(d)) == null ? void 0 : _a2.isValid) == null ? void 0 : _b2.call(_a2, d)) != null ? _c : true) === true;
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
        points: [],
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
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const strokeColor = getStrokeColor(strokeStyleContent);
      const strokeWidth = transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content));
      const { regions, renderingLines } = getGeometriesFromCache(content);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth }));
      }
      if (regions) {
        for (let i = 0; i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }));
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
    propertyPanel(content, update, contents) {
      return {
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
      ctx.useKey((e) => e.key === "Escape", reset, [setResult]);
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
          if (type === "cut" && !ctx.contentIsReferenced(content, contents)) {
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
        ctx.useKey((e) => e.key === "Escape", reset, [setCopyData, resetInput, setInputPosition, setInputPosition]);
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
      return !ctx.contentIsReferenced(content, contents);
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
  function getGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
      content.x += offset.x;
      content.y += offset.y;
    },
    explode(content) {
      const { lines } = getGeometries(content);
      return lines.map((line) => ({ type: "line", points: line }));
    },
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent)
      };
      const { points } = getGeometries(content);
      return target.renderPolygon(points, { ...options, dashArray: strokeStyleContent.dashArray });
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
    propertyPanel(content, update, contents) {
      return {
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
    return ctx.isContainerContent(c);
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
  function getEllipseGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      var _a;
      const points = ctx.ellipseToPolygon(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const lines = Array.from(ctx.iteratePolygonLines(points));
      const polylinePoints = ctx.polygonToPolyline(points);
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
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
    return ctx.getGeometriesFromCache(content, () => {
      var _a;
      const points = ctx.ellipseArcToPolyline(content, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta);
      const lines = Array.from(ctx.iteratePolylineLines(points));
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
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
      content.cx += offset.x;
      content.cy += offset.y;
    },
    rotate(content, center, angle) {
      var _a;
      const p = ctx.rotatePositionByCenter({ x: content.cx, y: content.cy }, center, -angle);
      content.cx = p.x;
      content.cy = p.y;
      content.angle = ((_a = content.angle) != null ? _a : 0) + angle;
    },
    mirror(content, line, angle) {
      var _a;
      const p = ctx.getSymmetryPoint({ x: content.cx, y: content.cy }, line);
      content.cx = p.x;
      content.cy = p.y;
      content.angle = 2 * angle - ((_a = content.angle) != null ? _a : 0);
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
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent)
      };
      if (strokeStyleContent.dashArray) {
        const { points } = getEllipseGeometries(content);
        return target.renderPolygon(points, { ...options, dashArray: strokeStyleContent.dashArray });
      }
      return target.renderEllipse(content.cx, content.cy, content.rx, content.ry, { ...options, angle: content.angle });
    },
    getOperatorRenderPosition(content) {
      return { x: content.cx, y: content.cy };
    },
    getEditPoints(content) {
      return ctx.getEditPointsFromCache(content, () => {
        var _a;
        const center = { x: content.cx, y: content.cy };
        const rotate = -((_a = content.angle) != null ? _a : 0);
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
    propertyPanel(content, update, contents) {
      return {
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
    isPointIn: (content, point) => ctx.pointInPolygon(point, getEllipseGeometries(content).points)
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
      render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
        var _a;
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
        const fillStyleContent = ctx.getFillStyleContent(content, contents);
        const options = {
          fillColor: getFillColor(fillStyleContent),
          strokeColor: getStrokeColor(strokeStyleContent),
          strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
          fillPattern: getFillPattern(fillStyleContent),
          dashArray: strokeStyleContent.dashArray
        };
        const { points } = getEllipseArcGeometries(content);
        return target.renderPolyline(points, options);
      },
      renderIfSelected(content, { color, target, strokeWidth }) {
        const { points } = getEllipseArcGeometries({ ...content, startAngle: content.endAngle, endAngle: content.startAngle + 360 });
        return target.renderPolyline(points, { strokeColor: color, dashArray: [4], strokeWidth });
      },
      getOperatorRenderPosition(content) {
        const { points } = getEllipseArcGeometries(content);
        return points[0];
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => {
          var _a;
          const center = { x: content.cx, y: content.cy };
          const startAngle = content.startAngle / 180 * Math.PI;
          const endAngle = content.endAngle / 180 * Math.PI;
          const rotate = -((_a = content.angle) != null ? _a : 0);
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
                  var _a2;
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  const p = ctx.rotatePositionByCenter(cursor, center, (_a2 = content.angle) != null ? _a2 : 0);
                  c.startAngle = Math.atan2((p.y - content.cy) / content.ry, (p.x - content.cx) / content.rx) * 180 / Math.PI;
                  ctx.normalizeAngleRange(c);
                  return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [center, cursor] }] };
                }
              },
              {
                ...ctx.rotatePositionByCenter({ x: content.cx + content.rx * Math.cos(endAngle), y: content.cy + content.ry * Math.sin(endAngle) }, center, rotate),
                cursor: ctx.getResizeCursor(content.endAngle - rotate, "top"),
                update(c, { cursor, scale }) {
                  var _a2;
                  if (!isEllipseArcContent(c)) {
                    return;
                  }
                  const p = ctx.rotatePositionByCenter(cursor, center, (_a2 = content.angle) != null ? _a2 : 0);
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
      propertyPanel(content, update, contents) {
        return {
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
      getStartPoint: (content) => ctx.getEllipseArcPointAtAngle(content, content.startAngle),
      getEndPoint: (content) => ctx.getEllipseArcPointAtAngle(content, content.endAngle)
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
              assistentContents.push({ type: "line", points: [{ x: ellipse.cx, y: ellipse.cy }, cursorPosition], dashArray: [4 / scale] });
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

// dev/expression/math.ts
var math = [
  {
    "name": "Math",
    "members": [
      {
        "name": "E",
        "comment": "The mathematical constant e. This is Euler's number, the base of natural logarithms."
      },
      {
        "name": "LN10",
        "comment": "The natural logarithm of 10."
      },
      {
        "name": "LN2",
        "comment": "The natural logarithm of 2."
      },
      {
        "name": "LOG2E",
        "comment": "The base-2 logarithm of e."
      },
      {
        "name": "LOG10E",
        "comment": "The base-10 logarithm of e."
      },
      {
        "name": "PI",
        "comment": "Pi. This is the ratio of the circumference of a circle to its diameter."
      },
      {
        "name": "SQRT1_2",
        "comment": "The square root of 0.5, or, equivalently, one divided by the square root of 2."
      },
      {
        "name": "SQRT2",
        "comment": "The square root of 2."
      },
      {
        "name": "abs",
        "comment": "Returns the absolute value of a number (the value without regard to whether it is positive or negative).\\r\\nFor example, the absolute value of -5 is the same as the absolute value of 5.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression for which the absolute value is needed.",
            "optional": false
          }
        ]
      },
      {
        "name": "acos",
        "comment": "Returns the arc cosine (or inverse cosine) of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "asin",
        "comment": "Returns the arcsine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "atan",
        "comment": "Returns the arctangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression for which the arctangent is needed.",
            "optional": false
          }
        ]
      },
      {
        "name": "atan2",
        "comment": "Returns the angle (in radians) from the X axis to a point.",
        "parameters": [
          {
            "name": "y",
            "comment": "A numeric expression representing the cartesian y-coordinate.",
            "optional": false
          },
          {
            "name": "x",
            "comment": "A numeric expression representing the cartesian x-coordinate.",
            "optional": false
          }
        ]
      },
      {
        "name": "ceil",
        "comment": "Returns the smallest integer greater than or equal to its numeric argument.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "cos",
        "comment": "Returns the cosine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "exp",
        "comment": "Returns e (the base of natural logarithms) raised to a power.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression representing the power of e.",
            "optional": false
          }
        ]
      },
      {
        "name": "floor",
        "comment": "Returns the greatest integer less than or equal to its numeric argument.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "log",
        "comment": "Returns the natural logarithm (base e) of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "max",
        "comment": "Returns the larger of a set of supplied numeric expressions.",
        "parameters": [
          {
            "name": "values",
            "comment": "Numeric expressions to be evaluated.",
            "optional": false
          }
        ]
      },
      {
        "name": "min",
        "comment": "Returns the smaller of a set of supplied numeric expressions.",
        "parameters": [
          {
            "name": "values",
            "comment": "Numeric expressions to be evaluated.",
            "optional": false
          }
        ]
      },
      {
        "name": "pow",
        "comment": "Returns the value of a base expression taken to a specified power.",
        "parameters": [
          {
            "name": "x",
            "comment": "The base value of the expression.",
            "optional": false
          },
          {
            "name": "y",
            "comment": "The exponent value of the expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "random",
        "comment": "Returns a pseudorandom number between 0 and 1.",
        "parameters": []
      },
      {
        "name": "round",
        "comment": "Returns a supplied numeric expression rounded to the nearest integer.",
        "parameters": [
          {
            "name": "x",
            "comment": "The value to be rounded to the nearest integer.",
            "optional": false
          }
        ]
      },
      {
        "name": "sin",
        "comment": "Returns the sine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "sqrt",
        "comment": "Returns the square root of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "tan",
        "comment": "Returns the tangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "clz32",
        "comment": "Returns the number of leading zero bits in the 32-bit binary representation of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "imul",
        "comment": "Returns the result of 32-bit multiplication of two numbers.",
        "parameters": [
          {
            "name": "x",
            "comment": "First number",
            "optional": false
          },
          {
            "name": "y",
            "comment": "Second number",
            "optional": false
          }
        ]
      },
      {
        "name": "sign",
        "comment": "Returns the sign of the x, indicating whether x is positive, negative or zero.",
        "parameters": [
          {
            "name": "x",
            "comment": "The numeric expression to test",
            "optional": false
          }
        ]
      },
      {
        "name": "log10",
        "comment": "Returns the base 10 logarithm of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "log2",
        "comment": "Returns the base 2 logarithm of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "log1p",
        "comment": "Returns the natural logarithm of 1 + x.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "expm1",
        "comment": "Returns the result of (e^x - 1), which is an implementation-dependent approximation to\\r\\nsubtracting 1 from the exponential function of x (e raised to the power of x, where e\\r\\nis the base of the natural logarithms).",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "cosh",
        "comment": "Returns the hyperbolic cosine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "sinh",
        "comment": "Returns the hyperbolic sine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "tanh",
        "comment": "Returns the hyperbolic tangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "acosh",
        "comment": "Returns the inverse hyperbolic cosine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "asinh",
        "comment": "Returns the inverse hyperbolic sine of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "atanh",
        "comment": "Returns the inverse hyperbolic tangent of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression that contains an angle measured in radians.",
            "optional": false
          }
        ]
      },
      {
        "name": "hypot",
        "comment": "Returns the square root of the sum of squares of its arguments.",
        "parameters": [
          {
            "name": "values",
            "comment": "Values to compute the square root for.\\r\\nIf no arguments are passed, the result is +0.\\r\\nIf there is only one argument, the result is the absolute value.\\r\\nIf any argument is +Infinity or -Infinity, the result is +Infinity.\\r\\nIf any argument is NaN, the result is NaN.\\r\\nIf all arguments are either +0 or \\u22120, the result is +0.",
            "optional": false
          }
        ]
      },
      {
        "name": "trunc",
        "comment": "Returns the integral part of the a numeric expression, x, removing any fractional digits.\\r\\nIf x is already an integer, the result is x.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "fround",
        "comment": "Returns the nearest single precision float representation of a number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      },
      {
        "name": "cbrt",
        "comment": "Returns an implementation-dependent approximation to the cube root of number.",
        "parameters": [
          {
            "name": "x",
            "comment": "A numeric expression.",
            "optional": false
          }
        ]
      }
    ]
  }
];

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
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      var _a;
      const { points } = getGeometriesFromCache(content, contents);
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const options = {
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray
      };
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
        expression: /* @__PURE__ */ React.createElement(ctx.ExpressionEditor, { suggestionSources: math, validate: ctx.validateExpression, value: content.expression, setValue: (v) => update((c) => {
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
      ctx.useKey((e) => e.key === "Escape", reset, [resetInput, setDependentVariable]);
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
      return (model == null ? void 0 : model.explode) !== void 0 && !ctx.contentIsReferenced(content, contents);
    },
    hotkey: "X",
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
            })(index, 1, 1));
            let jsx = "";
            for (let j = 0; j < svg.length; j++) {
              const c = svg[j];
              if (c === "-") {
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
        points: [],
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
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { target, getFillColor, transformColor, getFillPattern }) {
      const options = {
        strokeColor: content.isCurrent ? transformColor(16711680) : void 0,
        strokeWidth: content.isCurrent ? 1 : 0,
        fillColor: getFillColor(content),
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
    propertyPanel(content, update, contents) {
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
      ctx.useKey((e) => e.key === "Escape", reset, [setResult]);
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
      circles.push(...ctx.getCirclesTangentTo2Lines(content1.points[0], content1.points[1], content2.points[0], content2.points[1], radius).map((c) => ({
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
      circles.push(...ctx.getCirclesTangentToLineAndCircle(content1.points[0], content1.points[1], content2, radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content1.points[0], content1.points[1])),
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content2)[0]
      })));
    } else if (isLineContent(content2) && (isCircleContent(content1) || isArcContent(content1))) {
      circles.push(...ctx.getCirclesTangentToLineAndCircle(content2.points[0], content2.points[1], content1, radius).map((c) => ({
        center: c,
        foot1: ctx.getPerpendicularPoint(c, ctx.twoPointLineToGeneralFormLine(content2.points[0], content2.points[1])),
        foot2: ctx.getTwoCircleIntersectionPoints({ ...c, r: radius }, content1)[0]
      })));
    }
    return circles.map(({ foot1, foot2, center: c }) => {
      const angle1 = Math.atan2(foot1.y - c.y, foot1.x - c.x) * 180 / Math.PI;
      const angle2 = Math.atan2(foot2.y - c.y, foot2.x - c.x) * 180 / Math.PI;
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
  const GroupContent = ctx.and(ctx.BaseContent("group"), ctx.ContainerFields);
  return {
    type: "group",
    ...ctx.containerModel,
    move: ctx.getContainerMove,
    rotate: ctx.getContainerRotate,
    explode: ctx.getContainerExplode,
    mirror: ctx.getContainerMirror,
    render: ctx.getContainerRender,
    renderIfSelected: ctx.getContainerRenderIfSelected,
    getSnapPoints: ctx.getContainerSnapPoints,
    getGeometries: ctx.getContainerGeometries,
    propertyPanel: (content, update) => ctx.getVariableValuesContentPropertyPanel(content, ctx.getContainerVariableNames(content), update),
    isValid: (c, p) => ctx.validate(c, GroupContent, p)
  };
}
function getCommand(ctx) {
  function contentSelectable(content, contents) {
    return !ctx.contentIsReferenced(content, contents);
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
`// dev/cad-editor/plugins/image.plugin.tsx
function getModel(ctx) {
  const ImageContent = ctx.and(ctx.BaseContent("image"), ctx.Image);
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
    render(content, { target }) {
      return target.renderImage(content.url, content.x, content.y, content.width, content.height);
    },
    renderIfSelected(content, { color, target, strokeWidth }) {
      return target.renderRect(content.x, content.y, content.width, content.height, { strokeColor: color, dashArray: [4], strokeWidth });
    },
    getOperatorRenderPosition(content) {
      return content;
    },
    getGeometries: getImageGeometries,
    propertyPanel(content, update) {
      return {
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
        }) })
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
  function getPolylineGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
    render(content, { getStrokeColor, target, transformStrokeWidth, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const options = {
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray
      };
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
    propertyPanel(content, update, contents) {
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
    getStartPoint: (content) => content.points[0],
    getEndPoint: (content) => content.points[content.points.length - 1]
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
      render(content, { target, transformStrokeWidth, getFillColor, getStrokeColor, getFillPattern, contents }) {
        var _a;
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
        const fillStyleContent = ctx.getFillStyleContent(content, contents);
        const options = {
          fillColor: getFillColor(fillStyleContent),
          strokeColor: getStrokeColor(strokeStyleContent),
          strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
          fillPattern: getFillPattern(fillStyleContent)
        };
        return target.renderPolyline(content.points, { ...options, dashArray: strokeStyleContent.dashArray });
      },
      getEditPoints(content) {
        return ctx.getEditPointsFromCache(content, () => ({ editPoints: ctx.getPolylineEditPoints(content, isPolyLineContent) }));
      },
      canSelectPart: true,
      propertyPanel(content, update, contents) {
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
  const icon1 = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("polyline", { points: "10,87 87,9", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }));
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
    ref1: ctx.optional({
      id: ctx.or(ctx.number, ctx.Content),
      snapIndex: ctx.number
    }),
    ref2: ctx.optional({
      id: ctx.or(ctx.number, ctx.Content),
      snapIndex: ctx.number
    })
  });
  const linearDimensionCache = new ctx.WeakmapCache3();
  const getLinearDimensionPositions = (content, contents) => {
    var _a, _b, _c, _d, _e, _f;
    let p1 = content.p1;
    if (content.ref1 !== void 0) {
      const ref = ctx.getReference(content.ref1.id, contents);
      if (ref) {
        const p = (_c = (_b = (_a = ctx.getContentModel(ref)) == null ? void 0 : _a.getSnapPoints) == null ? void 0 : _b.call(_a, ref, contents)) == null ? void 0 : _c[content.ref1.snapIndex];
        if (p) {
          p1 = p;
        }
      }
    }
    let p2 = content.p2;
    if (content.ref2 !== void 0) {
      const ref = ctx.getReference(content.ref2.id, contents);
      if (ref) {
        const p = (_f = (_e = (_d = ctx.getContentModel(ref)) == null ? void 0 : _d.getSnapPoints) == null ? void 0 : _e.call(_d, ref, contents)) == null ? void 0 : _f[content.ref2.snapIndex];
        if (p) {
          p2 = p;
        }
      }
    }
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
      content.p1.x += offset.x;
      content.p1.y += offset.y;
      content.p2.x += offset.x;
      content.p2.y += offset.y;
      content.position.x += offset.x;
      content.position.y += offset.y;
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const strokeColor = getStrokeColor(strokeStyleContent);
      const strokeWidth = transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content));
      const { regions, lines } = getLinearDimensionGeometriesFromCache(content, contents);
      const children = [];
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth, dashArray: strokeStyleContent.dashArray }));
      }
      if (regions) {
        for (let i = 0; i < 2 && i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }));
        }
      }
      const { textPosition, text, textRotation } = getTextPosition(content, contents);
      children.push(target.renderGroup(
        [
          target.renderText(textPosition.x, textPosition.y, text, strokeColor, content.fontSize, content.fontFamily, { cacheKey: content })
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
    propertyPanel(content, update, contents) {
      return {
        p1: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
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
          }) }) : void 0
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
          }) }) : void 0
        ],
        position: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
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
      ctx.useKey((e) => e.key === "Escape", reset, [setResult]);
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
      const { onStart, mask, startPosition, reset } = ctx.useDragMove(void 0, {
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
      const { offset, onStart, mask, startPosition, reset } = ctx.useDragMove(onEnd, {
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
        updateSelectedContent(content, contents) {
          if (startPosition && offset && (offset.x !== 0 || offset.y !== 0)) {
            const end = { x: startPosition.x + offset.x, y: startPosition.y + offset.y };
            const line = ctx.twoPointLineToGeneralFormLine(startPosition, end);
            const angle = Math.atan2(end.y - startPosition.y, end.x - startPosition.x) * 180 / Math.PI;
            if (changeOriginal) {
              const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
                var _a, _b;
                (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.mirror) == null ? void 0 : _b.call(_a, draft, line, angle, contents);
              });
              const assistentContents = ctx.updateReferencedContents(content, newContent, contents);
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
      return ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.mirror) !== void 0;
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
      const { offset, onStart, mask, startPosition, reset } = ctx.useDragMove(onEnd, {
        transform,
        ignoreLeavingEvent: true
      });
      let message = "";
      if (type) {
        message = startPosition ? "specify end point" : "specify start point";
      }
      const { input, setInputPosition } = ctx.useCursorInput(message);
      return {
        onStart: (s) => onStart(s),
        mask,
        input,
        onMove(_, p) {
          setInputPosition(p);
        },
        reset,
        updateSelectedContent(content, contents) {
          if (startPosition && (offset.x !== 0 || offset.y !== 0)) {
            const [newContent, ...patches] = ctx.produceWithPatches(content, (draft) => {
              var _a, _b;
              (_b = (_a = ctx.getContentModel(content)) == null ? void 0 : _a.move) == null ? void 0 : _b.call(_a, draft, offset);
            });
            const assistentContents = ctx.updateReferencedContents(content, newContent, contents);
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
      return ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.move) !== void 0;
    },
    hotkey: "M",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/cad-editor/plugins/path.plugin.tsx
function getModel(ctx) {
  const PathContent = ctx.and(ctx.BaseContent("path"), ctx.StrokeFields, ctx.FillFields, {
    commands: [ctx.PathCommand]
  });
  function getPathGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = ctx.getPathCommandsPoints(content.commands)[0];
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
    type: "path",
    ...ctx.strokeModel,
    ...ctx.fillModel,
    move(content, offset) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          command.to.x += offset.x;
          command.to.y += offset.y;
        }
        if (command.type === "arc") {
          command.from.x += offset.x;
          command.from.y += offset.y;
        } else if (command.type === "bezierCurve") {
          command.cp1.x += offset.x;
          command.cp1.y += offset.y;
          command.cp2.x += offset.x;
          command.cp2.y += offset.y;
        } else if (command.type === "quadraticCurve") {
          command.cp.x += offset.x;
          command.cp.y += offset.y;
        }
      }
    },
    rotate(content, center, angle) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          command.to = ctx.rotatePositionByCenter(command.to, center, -angle);
        }
        if (command.type === "arc") {
          command.from = ctx.rotatePositionByCenter(command.from, center, -angle);
        } else if (command.type === "bezierCurve") {
          command.cp1 = ctx.rotatePositionByCenter(command.cp1, center, -angle);
          command.cp2 = ctx.rotatePositionByCenter(command.cp2, center, -angle);
        } else if (command.type === "quadraticCurve") {
          command.cp = ctx.rotatePositionByCenter(command.cp, center, -angle);
        }
      }
    },
    mirror(content, line) {
      for (const command of content.commands) {
        if (command.type !== "close") {
          command.to = ctx.getSymmetryPoint(command.to, line);
        }
        if (command.type === "arc") {
          command.from = ctx.getSymmetryPoint(command.from, line);
        } else if (command.type === "bezierCurve") {
          command.cp1 = ctx.getSymmetryPoint(command.cp1, line);
          command.cp2 = ctx.getSymmetryPoint(command.cp2, line);
        } else if (command.type === "quadraticCurve") {
          command.cp = ctx.getSymmetryPoint(command.cp, line);
        }
      }
    },
    render(content, { target, getStrokeColor, getFillColor, transformStrokeWidth, getFillPattern, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray,
        fillPattern: getFillPattern(fillStyleContent)
      };
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
    propertyPanel(content, update, contents) {
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
                type: /* @__PURE__ */ React.createElement(ctx.EnumEditor, { select: true, value: f.type, enums: ["move", "line", "arc", "bezierCurve", "quadraticCurve", "close"], setValue: (v) => update((c) => {
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
              } else if (f.type === "bezierCurve") {
                properties.cp1 = /* @__PURE__ */ React.createElement(ctx.ObjectEditor, { inline: true, properties: {
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
    updateRefId: ctx.updateStrokeAndFillRefIds
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
        points: content.points,
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
    render(content, { target, transformStrokeWidth, getStrokeColor, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const options = {
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        dashArray: strokeStyleContent.dashArray
      };
      return target.renderPolyline(content.points, options);
    },
    getGeometries,
    propertyPanel(content, update, contents) {
      return ctx.getStrokeContentPropertyPanel(content, update, contents);
    },
    isValid: (c, p) => ctx.validate(c, PenContent, p),
    getRefIds: ctx.getStrokeRefIds,
    updateRefId: ctx.updateStrokeRefIds
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
      content.center.x += offset.x;
      content.center.y += offset.y;
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
              c.itemAngle = (Math.atan2(cursor.y - content.center.y, cursor.x - content.center.x) - Math.atan2(base.y - content.center.y, base.x - content.center.x)) * 180 / Math.PI;
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
              let angle = (Math.atan2(cursor.y - content.center.y, cursor.x - content.center.x) - Math.atan2(base.y - content.center.y, base.x - content.center.x)) * 180 / Math.PI;
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
    propertyPanel(content, update) {
      return {
        center: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
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
    return !ctx.contentIsReferenced(content, contents);
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
  function getPolygonGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents, clip }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
        dashArray: strokeStyleContent.dashArray,
        clip
      };
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
    propertyPanel(content, update, contents) {
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
    refId: ctx.or(ctx.number, ctx.Content)
  });
  function getRadialDimensionReferenceGeometriesFromCache(content, contents) {
    const target = ctx.getReference(content.refId, contents, contentSelectable);
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
      content.position.x += offset.x;
      content.position.y += offset.y;
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const strokeColor = getStrokeColor(strokeStyleContent);
      const strokeWidth = transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content));
      const { regions, lines } = getRadialDimensionReferenceGeometriesFromCache(content, contents);
      const children = [];
      for (const line of lines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth, dashArray: strokeStyleContent.dashArray }));
      }
      if (regions && regions.length > 0) {
        children.push(target.renderPolyline(regions[0].points, { strokeWidth: 0, fillColor: strokeColor }));
      }
      const referenceTarget = ctx.getReference(content.refId, contents, contentSelectable);
      if (referenceTarget) {
        const { textPosition, textRotation, text } = getTextPosition(content, referenceTarget);
        children.push(target.renderGroup(
          [
            target.renderText(textPosition.x, textPosition.y, text, strokeColor, content.fontSize, content.fontFamily)
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
                const target = ctx.getReference(c.refId, contents, contentSelectable);
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
    propertyPanel(content, update, contents) {
      return {
        refId: typeof content.refId === "number" ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.refId, setValue: (v) => update((c) => {
          if (isRadialDimensionReferenceContent(c)) {
            c.refId = v;
          }
        }) }) : [],
        position: /* @__PURE__ */ React.createElement(
          ctx.ObjectEditor,
          {
            inline: true,
            properties: {
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
    getRefIds: (content) => [...ctx.getStrokeRefIds(content), ...typeof content.refId === "number" ? [content.refId] : []],
    updateRefId(content, update) {
      const newRefId = update(content.refId);
      if (newRefId !== void 0) {
        content.refId = newRefId;
      }
      ctx.updateStrokeRefIds(content, update);
    }
  };
}
function isRadialDimensionReferenceContent(content) {
  return content.type === "radial dimension reference";
}
function contentSelectable(content) {
  return isArcContent(content) || isCircleContent(content);
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 100 100" }, /* @__PURE__ */ React.createElement("circle", { cx: "36", cy: "64", r: "31", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polyline", { points: "36,64 90,9", strokeWidth: "5", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "none", stroke: "currentColor" }), /* @__PURE__ */ React.createElement("polygon", { points: "75,32 65,22 54,44", strokeWidth: "0", strokeMiterlimit: "10", strokeLinejoin: "miter", strokeLinecap: "butt", fill: "currentColor", stroke: "currentColor" }));
  return {
    name: "create radial dimension",
    selectCount: 1,
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
                    text: result.text,
                    strokeStyleId
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
    return !ctx.contentIsReferenced(content, contents);
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
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents, clip }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent)
      };
      if (strokeStyleContent.dashArray) {
        const { points } = getRectGeometries(content);
        return target.renderPolygon(points, { ...options, dashArray: strokeStyleContent.dashArray, clip });
      }
      return target.renderRect(content.x - content.width / 2, content.y - content.height / 2, content.width, content.height, { ...options, angle: content.angle, clip });
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
          ].map((p, i) => ({
            x: p.x,
            y: p.y,
            type: i === 0 ? "move" : void 0,
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
    propertyPanel(content, update, contents) {
      return {
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
    isPointIn: (content, point) => ctx.pointInPolygon(point, getRectGeometries(content).points)
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
  function getRegularPolygonGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { target, getFillColor, getStrokeColor, transformStrokeWidth, getFillPattern, contents, clip }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
        dashArray: strokeStyleContent.dashArray,
        clip
      };
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
                c.angle = Math.atan2(cursor.y - c.y, cursor.x - c.x) * 180 / Math.PI;
                return { assistentContents: [{ type: "line", dashArray: [4 / scale], points: [start, cursor] }] };
              }
            }))
          ]
        };
      });
    },
    getGeometries: getRegularPolygonGeometriesFromCache,
    propertyPanel(content, update, contents) {
      return {
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
              angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
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
          angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
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
      const points1 = ctx.arcToPolyline({ ...content, r: content.outerRadius, startAngle: 0, endAngle: 360 }, angleDelta);
      const points2 = ctx.arcToPolyline({ ...content, r: content.innerRadius, startAngle: 0, endAngle: 360 }, angleDelta);
      const points = [...points1, ...points2];
      const lines1 = Array.from(ctx.iteratePolygonLines(points1));
      const lines2 = Array.from(ctx.iteratePolygonLines(points2));
      return {
        points,
        lines: [...lines1, ...lines2],
        bounding: ctx.getPointsBounding(points),
        regions: ctx.hasFill(content) ? [
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
    ...ctx.angleDeltaModel,
    move(content, offset) {
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { target, getFillColor, getStrokeColor, transformStrokeWidth, getFillPattern, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
        dashArray: strokeStyleContent.dashArray
      };
      const { renderingLines, regions } = getRingGeometriesFromCache(content);
      if (regions) {
        return target.renderPath([regions[0].points, regions[1].points], options);
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
    propertyPanel(content, update, contents) {
      return {
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
      const { offset, onStart, mask, center: startPosition, reset } = ctx.useDragRotate(
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
        updateSelectedContent(content, contents) {
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
            const assistentContents2 = ctx.updateReferencedContents(content, newContent, contents);
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
      return ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.rotate) !== void 0;
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
  function getGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      var _a, _b, _c, _d;
      const rectPoints = [
        { x: content.x - content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y - content.height / 2 },
        { x: content.x + content.width / 2, y: content.y + content.height / 2 },
        { x: content.x - content.width / 2, y: content.y + content.height / 2 }
      ];
      const points = [
        ...ctx.arcToPolyline({
          x: content.x + content.width / 2 - content.radius,
          y: content.y - content.height / 2 + content.radius,
          r: content.radius,
          startAngle: -90,
          endAngle: 0
        }, (_a = content.angleDelta) != null ? _a : ctx.defaultAngleDelta),
        ...ctx.arcToPolyline({
          x: content.x + content.width / 2 - content.radius,
          y: content.y + content.height / 2 - content.radius,
          r: content.radius,
          startAngle: 0,
          endAngle: 90
        }, (_b = content.angleDelta) != null ? _b : ctx.defaultAngleDelta),
        ...ctx.arcToPolyline({
          x: content.x - content.width / 2 + content.radius,
          y: content.y + content.height / 2 - content.radius,
          r: content.radius,
          startAngle: 90,
          endAngle: 180
        }, (_c = content.angleDelta) != null ? _c : ctx.defaultAngleDelta),
        ...ctx.arcToPolyline({
          x: content.x - content.width / 2 + content.radius,
          y: content.y - content.height / 2 + content.radius,
          r: content.radius,
          startAngle: 180,
          endAngle: 270
        }, (_d = content.angleDelta) != null ? _d : ctx.defaultAngleDelta)
      ];
      const lines = Array.from(ctx.iteratePolygonLines(points));
      return {
        lines,
        points: rectPoints,
        bounding: ctx.getPointsBounding(rectPoints),
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
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent)
      };
      const { renderingLines } = getGeometries(content);
      return target.renderPath(renderingLines, options);
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
    propertyPanel(content, update, contents) {
      return {
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
    updateRefId: ctx.updateStrokeAndFillRefIds
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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
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

// dev/cad-editor/plugins/spline.plugin.tsx
var import_b_spline = __toESM(require_b_spline());
function getModel(ctx) {
  const SplineContent = ctx.and(ctx.BaseContent("spline"), ctx.StrokeFields, ctx.FillFields, ctx.SegmentCountFields, {
    points: [ctx.Position],
    fitting: ctx.optional(ctx.boolean)
  });
  const SplineArrowContent = ctx.and(ctx.BaseContent("spline arrow"), ctx.StrokeFields, ctx.SegmentCountFields, {
    points: [ctx.Position],
    fitting: ctx.optional(ctx.boolean)
  });
  function getSplineGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      var _a;
      const inputPoints = content.points.map((p) => [p.x, p.y]);
      let points = [];
      const splineSegmentCount = (_a = content.segmentCount) != null ? _a : ctx.defaultSegmentCount;
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
      const lines = Array.from(ctx.iteratePolylineLines(points));
      return {
        lines,
        points,
        bounding: ctx.getPointsBounding(points),
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
    render(content, { getFillColor, getStrokeColor, target, transformStrokeWidth, getFillPattern, contents }) {
      var _a;
      const { points } = getSplineGeometries(content);
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
        dashArray: strokeStyleContent.dashArray
      };
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
    propertyPanel(content, update, contents) {
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
        fitting: /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.fitting === true, setValue: (v) => update((c) => {
          if (isSplineContent(c)) {
            c.fitting = v ? true : void 0;
          }
        }) }),
        ...ctx.getStrokeContentPropertyPanel(content, update, contents),
        ...ctx.getFillContentPropertyPanel(content, update, contents),
        ...ctx.getSegmentCountContentPropertyPanel(content, update)
      };
    },
    isValid: (c, p) => ctx.validate(c, SplineContent, p),
    getRefIds: ctx.getStrokeAndFillRefIds,
    updateRefId: ctx.updateStrokeAndFillRefIds
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
      render(content, { getStrokeColor, target, transformStrokeWidth, contents }) {
        var _a;
        const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
        const strokeColor = getStrokeColor(strokeStyleContent);
        const strokeWidth = transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content));
        const { regions, renderingLines } = getSplineArrowGeometries(content);
        const children = [];
        for (const line of renderingLines) {
          children.push(target.renderPolyline(line, { strokeColor, strokeWidth }));
        }
        if (regions) {
          for (let i = 0; i < 2 && i < regions.length; i++) {
            children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }));
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
      propertyPanel(content, update, contents) {
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
      updateRefId: ctx.updateStrokeRefIds
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
  function getStarGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
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
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { target, getFillColor, getStrokeColor, transformStrokeWidth, getFillPattern, contents }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const fillStyleContent = ctx.getFillStyleContent(content, contents);
      const options = {
        fillColor: getFillColor(fillStyleContent),
        strokeColor: getStrokeColor(strokeStyleContent),
        strokeWidth: transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        fillPattern: getFillPattern(fillStyleContent),
        dashArray: strokeStyleContent.dashArray
      };
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
    propertyPanel(content, update, contents) {
      var _a;
      return {
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
    updateRefId: ctx.updateStrokeAndFillRefIds
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
              angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
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
          angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI,
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
        points: [],
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
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, transformColor }) {
      var _a;
      const options = {
        strokeColor: getStrokeColor(content),
        strokeWidth: transformStrokeWidth((_a = content.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content)),
        dashArray: content.dashArray
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
    propertyPanel(content, update, contents) {
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
      ctx.useKey((e) => e.key === "Escape", reset, [setResult]);
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
`// dev/cad-editor/plugins/text.plugin.tsx
function getModel(ctx) {
  const TextContent = ctx.and(ctx.BaseContent("text"), ctx.Text, {
    width: ctx.optional(ctx.number),
    lineHeight: ctx.optional(ctx.number),
    textVariableName: ctx.optional(ctx.string)
  });
  const textLayoutResultCache = new ctx.WeakmapCache();
  function getTextLayoutResult(content, variableContext) {
    return textLayoutResultCache.get(content, () => {
      var _a;
      const state = getText(content, variableContext).split("");
      const getTextWidth = (text) => {
        var _a2, _b;
        return (_b = (_a2 = ctx.getTextSizeFromCache(\`\${content.fontSize}px \${content.fontFamily}\`, text)) == null ? void 0 : _a2.width) != null ? _b : 0;
      };
      return ctx.flowLayout({
        state,
        width: content.width,
        lineHeight: (_a = content.lineHeight) != null ? _a : content.fontSize * 1.2,
        getWidth: getTextWidth,
        endContent: "",
        isNewLineContent: (content2) => content2 === "\\n",
        isPartOfComposition: (content2) => ctx.isWordCharactor(content2),
        getComposition: (index) => ctx.getTextComposition(index, state, getTextWidth, (c) => c),
        scrollY: 0
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
  function getTextGeometries(content) {
    return ctx.getGeometriesFromCache(content, () => {
      let points;
      if (hasWidth(content)) {
        const { newContentHeight } = getTextLayoutResult(content);
        points = [
          { x: content.x, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y + newContentHeight },
          { x: content.x + content.width, y: content.y },
          { x: content.x, y: content.y }
        ];
      } else {
        const size = ctx.getTextSize(\`\${content.fontSize}px \${content.fontFamily}\`, content.text);
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
    render(content, { target, transformColor, isAssistence, variableContext }) {
      var _a, _b;
      const color = transformColor(content.color);
      const text = getText(content, variableContext);
      let cacheKey;
      if (isAssistence) {
        cacheKey = ctx.assistentTextCache.get(text, content.fontSize, content.color);
      }
      if (!cacheKey) {
        cacheKey = content;
      }
      if (hasWidth(content)) {
        const { layoutResult } = getTextLayoutResult(content, variableContext);
        const children = [];
        for (const { x, y, content: text2 } of layoutResult) {
          const textWidth = (_b = (_a = ctx.getTextSizeFromCache(\`\${content.fontSize}px \${content.fontFamily}\`, text2)) == null ? void 0 : _a.width) != null ? _b : 0;
          children.push(target.renderText(content.x + x + textWidth / 2, content.y + y + content.fontSize, text2, content.color, content.fontSize, content.fontFamily, { textAlign: "center", cacheKey }));
        }
        return target.renderGroup(children);
      }
      return target.renderText(content.x, content.y, text, color, content.fontSize, content.fontFamily, { cacheKey });
    },
    getGeometries: getTextGeometries,
    propertyPanel(content, update) {
      return {
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
        fontSize: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.fontSize, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.fontSize = v;
          }
        }) }),
        fontFamily: /* @__PURE__ */ React.createElement(ctx.StringEditor, { value: content.fontFamily, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.fontFamily = v;
          }
        }) }),
        text: /* @__PURE__ */ React.createElement(ctx.StringEditor, { textarea: true, value: content.text, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.text = v;
          }
        }) }),
        color: /* @__PURE__ */ React.createElement(ctx.NumberEditor, { type: "color", value: content.color, setValue: (v) => update((c) => {
          if (isTextContent(c)) {
            c.color = v;
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
        lineHeight: [
          content.width !== void 0 ? /* @__PURE__ */ React.createElement(ctx.BooleanEditor, { value: content.lineHeight !== void 0, setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.lineHeight = v ? content.fontSize * 1.2 : void 0;
            }
          }) }) : void 0,
          content.width !== void 0 && content.lineHeight !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, { value: content.lineHeight, setValue: (v) => update((c) => {
            if (isTextContent(c)) {
              c.lineHeight = v;
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
    useCommand({ onEnd, type, scale }) {
      const { text, onClick, onMove, input, reset } = ctx.useTextClickCreate(
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
        assistentContents,
        reset
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
      if (time) {
        const timePoints = ctx.arcToPolyline({ x: content.x + time / 10, y: content.y, r: 5, startAngle: 0, endAngle: 360 }, ctx.defaultAngleDelta);
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
      content.x += offset.x;
      content.y += offset.y;
    },
    render(content, { target, getStrokeColor, transformStrokeWidth, contents, time }) {
      var _a;
      const strokeStyleContent = ctx.getStrokeStyleContent(content, contents);
      const strokeColor = getStrokeColor(strokeStyleContent);
      const strokeWidth = transformStrokeWidth((_a = strokeStyleContent.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(content));
      const { regions, renderingLines } = getGeometriesFromCache(content, contents, time);
      const children = [];
      for (const line of renderingLines) {
        children.push(target.renderPolyline(line, { strokeColor, strokeWidth }));
      }
      if (regions) {
        for (let i = 0; i < regions.length; i++) {
          children.push(target.renderPolyline(regions[i].points, { strokeWidth: 0, fillColor: strokeColor }));
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
    propertyPanel(content, update, contents, startTime) {
      return {
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
      ctx.useKey((e) => e.key === "Escape", reset, [setResult]);
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
      const [current, setCurrent] = React.useState();
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
            }
          }
          setCandidates(allContents);
        }
      }, [type]);
      const assistentContents = [];
      if (current && ctx.isStrokeContent(current.content)) {
        assistentContents.push({
          ...current.content,
          strokeWidth: ((_a = current.content.strokeWidth) != null ? _a : ctx.getDefaultStrokeWidth(current.content)) + 2,
          strokeColor: backgroundColor,
          trueStrokeColor: true
        });
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
        setCurrent(void 0);
        resetHistory();
      };
      ctx.useKey((e) => e.key === "Escape", reset, [setCandidates, setCurrent, resetHistory]);
      ctx.useKey((k) => k.code === "KeyZ" && !k.shiftKey && ctx.metaKeyIfMacElseCtrlKey(k), undo);
      ctx.useKey((k) => k.code === "KeyZ" && k.shiftKey && ctx.metaKeyIfMacElseCtrlKey(k), redo);
      ctx.useKey((e) => e.key === "Enter", () => {
        const removedIndexes = [];
        const newContents = [];
        for (const { content, children } of state) {
          const parentModel = ctx.getContentModel(content);
          if (parentModel == null ? void 0 : parentModel.break) {
            let points = [];
            for (const child of children) {
              const model = ctx.getContentModel(child);
              if ((model == null ? void 0 : model.getStartPoint) && model.getEndPoint) {
                points.push(model.getStartPoint(child), model.getEndPoint(child));
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
      }, [reset]);
      return {
        onStart() {
          if (current) {
            const index = state.findIndex((s) => s.content === current.parent);
            setState((draft) => {
              if (index >= 0) {
                draft[index].children.push(current.content);
              } else {
                draft.push({ content: current.parent, children: [current.content] });
              }
            });
          }
        },
        onMove(p) {
          var _a2, _b2;
          for (const candidate of candidates) {
            for (const child of candidate.children) {
              const geometries = (_b2 = (_a2 = ctx.getContentModel(child)) == null ? void 0 : _a2.getGeometries) == null ? void 0 : _b2.call(_a2, child, contents);
              if (geometries) {
                for (const line of geometries.lines) {
                  if (ctx.getPointAndLineSegmentMinimumDistance(p, line[0], line[1]) < 5) {
                    setCurrent({ content: child, parent: candidate.content });
                    return;
                  }
                }
              }
            }
          }
          setCurrent(void 0);
        },
        assistentContents,
        reset
      };
    },
    contentSelectable(content, contents) {
      const model = ctx.getContentModel(content);
      return (model == null ? void 0 : model.break) !== void 0 && !ctx.contentIsReferenced(content, contents);
    },
    hotkey: "TR",
    icon
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
    return { lines: [], points: [], renderingLines: [] };
  }
  const React = ctx.React;
  return {
    type: "viewport",
    ...ctx.strokeModel,
    ...ctx.arrowModel,
    move(content, offset) {
      var _a, _b;
      (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.move) == null ? void 0 : _b.call(_a, content.border, offset);
      content.x += offset.x;
      content.y += offset.y;
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
            const children = [];
            const sortedContents = ctx.getSortedContents(renderCtx.contents).contents;
            sortedContents.forEach((content2) => {
              var _a2;
              if (!content2 || content2.visible === false || ctx.isViewportContent(content2)) {
                return;
              }
              const ContentRender = (_a2 = ctx.getContentModel(content2)) == null ? void 0 : _a2.render;
              if (ContentRender) {
                children.push(ContentRender(content2, renderCtx));
              }
            });
            return renderCtx.target.renderGroup(children, { matrix: ctx.m3.multiply(ctx.m3.translation(content.x, content.y), ctx.m3.scaling(content.scale, content.scale)) });
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
              if (!ctx.isViewportContent(c)) {
                return;
              }
              if (e.type === "move") {
                c.x += props.cursor.x - props.start.x;
                c.y += props.cursor.y - props.start.y;
              }
              return e.update(c.border, props);
            }
          }))
        };
      });
    },
    getGeometries: getViewportGeometriesFromCache,
    propertyPanel(content, update, contents, startTime) {
      var _a, _b;
      const border = (_b = (_a = ctx.getContentModel(content.border)) == null ? void 0 : _a.propertyPanel) == null ? void 0 : _b.call(_a, content.border, (recipe) => {
        update((c) => {
          if (ctx.isViewportContent(c)) {
            recipe(c.border, contents);
          }
        });
      }, contents, startTime);
      const result = {
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
      var _a;
      return ((_a = ctx.getContentModel(content)) == null ? void 0 : _a.isPointIn) !== void 0;
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
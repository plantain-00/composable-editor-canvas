export const pluginScripts = [
`// dev/plugins/arrow.plugin.tsx
function getModel(ctx) {
  function getArrowGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      const points = [content.p1, content.p2];
      const arrowSize = content.arrowSize ?? ctx.dimensionStyle.arrowSize;
      const arrowAngle = content.arrowAngle ?? ctx.dimensionStyle.arrowAngle;
      const arrow = ctx.getPointByLengthAndDirection(content.p2, arrowSize, content.p1);
      const arrowPoints = [
        content.p2,
        ctx.rotatePositionByCenter(arrow, content.p2, arrowAngle),
        ctx.rotatePositionByCenter(arrow, content.p2, -arrowAngle)
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
    ...ctx.arrowModel,
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
          children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth: 0, fillColor: color }));
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
        ...ctx.getArrowContentPropertyPanel(content, update),
        ...ctx.getStrokeContentPropertyPanel(content, update)
      };
    }
  };
}
function isArrowContent(content) {
  return content.type === "arrow";
}
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 512 512"
  }, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M334.5 414c8.8 3.8 19 2 26-4.6l144-136c4.8-4.5 7.5-10.8 7.5-17.4s-2.7-12.9-7.5-17.4l-144-136c-7-6.6-17.2-8.4-26-4.6s-14.5 12.5-14.5 22l0 88L32 208c-17.7 0-32 14.3-32 32l0 32c0 17.7 14.3 32 32 32l288 0 0 88c0 9.6 5.7 18.2 14.5 22z"
  }));
  return {
    name: "create arrow",
    hotkey: "AR",
    icon,
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
    const model = ctx.getContentModel(target);
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
            const r = ctx.getContentModel(c)?.getGeometries?.(extracted);
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
            const model = ctx.getContentModel(c);
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 640 512"
  }, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H328.6C339.6 12.9 360.3 0 384 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V232.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM119.4 96c-5.6 9.7-13.7 17.8-23.4 23.4V232.6c9.7 5.6 17.8 13.7 23.4 23.4H328.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4H119.4zm192 384c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V352h64v40.6c9.7 5.6 17.8 13.7 23.4 23.4H520.6c5.6-9.7 13.7-17.8 23.4-23.4V279.4c-9.7-5.6-17.8-13.7-23.4-23.4h-46c-5.4-15.4-14.6-28.9-26.5-39.6V192h72.6c11.1-19.1 31.7-32 55.4-32c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H311.4z"
  }));
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
    hotkey: "I",
    icon
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 576 512"
  }, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M32 119.4C12.9 108.4 0 87.7 0 64C0 28.7 28.7 0 64 0c23.7 0 44.4 12.9 55.4 32H456.6C467.6 12.9 488.3 0 512 0c35.3 0 64 28.7 64 64c0 23.7-12.9 44.4-32 55.4V392.6c19.1 11.1 32 31.7 32 55.4c0 35.3-28.7 64-64 64c-23.7 0-44.4-12.9-55.4-32H119.4c-11.1 19.1-31.7 32-55.4 32c-35.3 0-64-28.7-64-64c0-23.7 12.9-44.4 32-55.4V119.4zM456.6 96H119.4c-5.6 9.7-13.7 17.8-23.4 23.4V392.6c9.7 5.6 17.8 13.7 23.4 23.4H456.6c5.6-9.7 13.7-17.8 23.4-23.4V119.4c-9.7-5.6-17.8-13.7-23.4-23.4zM128 160c0-17.7 14.3-32 32-32H288c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V160zM256 320h32c35.3 0 64-28.7 64-64V224h64c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32H288c-17.7 0-32-14.3-32-32V320z"
  }));
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
    hotkey: "B",
    icon
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 640 512"
  }, /* @__PURE__ */ React.createElement("path", {
    fill: "currentColor",
    d: "M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L489.3 358.2l90.5-90.5c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114l-96 96-31.9-25C430.9 239.6 420.1 175.1 377 132c-52.2-52.3-134.5-56.2-191.3-11.7L38.8 5.1zM239 162c30.1-14.9 67.7-9.9 92.8 15.3c20 20 27.5 48.3 21.7 74.5L239 162zM406.6 416.4L220.9 270c-2.1 39.8 12.2 80.1 42.2 110c38.9 38.9 94.4 51 143.6 36.3zm-290-228.5L60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l61.8-61.8-50.6-39.9z"
  }));
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
            const result = ctx.getContentModel(content)?.break?.(content, intersectionPoints);
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
      return model?.break !== void 0 && !ctx.contentIsReferenced(content, contents);
    },
    hotkey: "BR",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/plugins/cancel-edit-container.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "37.2523424414741,82.2523424414741 32,77 45.26210843293586,64.73424940995307 34.85576768442547,52.45776612707198 22.804714999337193,65 16.408386715608138,58.388958288839014 4.438582558303025,90.59970985857345",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "83.31772011698345,40.37472637282923 78.58823529411765,34.64705882352941 65.11778548913132,46.68363390432083 53.8856897130448,35.157837010145315 67.51629404983674,24.353109954091316 61.542962454827205,17.357525798639863 94.74536622245155,8.502633800256604",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "60.823922790999546,82.94782332121554 66.3768001163132,78.0142895314217 53.860936060450534,64.98795833037552 64.9729807484759,53.34637628924838 76.26359466760502,66.57730742319224 83.03857504543225,60.35488595723553 93.08844972308609,93.21532946025053",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "17.30773332157345,38.42709778758177 22.36668717670166,32.98823870348119 35.10404208885271,45.798076620726135 46.996145772344406,34.95456060653361 34.026286658445244,23.364985294745704 40.40167834341685,16.733750953905556 7.779106641484908,5.936689140444656",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
  return {
    name: "cancel edit container",
    execute(contents, selected, setEditingContentPath) {
      setEditingContentPath(void 0);
    },
    selectCount: 0,
    icon
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
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "11,12 57,12 86.01723625709383,41.01723625709381 86.01723625709383,86.01150037545519",
    strokeWidth: "3",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }));
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
    hotkey: "CHA",
    icon
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
  const React = ctx.React;
  const circleIcon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "44.75112610327733",
    cy: "48.751126103277315",
    r: "39.24601890638081",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "44.75112610327733,48.751126103277315 66.35131574575921,15.984041896579598",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "44.75112610327733",
    cy: "48.751126103277315",
    r: "39.24601890638081",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "18.017351145722543",
    cy: "20.018648373035933",
    r: "12",
    strokeWidth: "0",
    vectorEffect: "non-scaling-stroke",
    fill: "currentColor",
    stroke: "#000000"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "72.41194310314575",
    cy: "76.59226837330263",
    r: "12",
    strokeWidth: "0",
    vectorEffect: "non-scaling-stroke",
    fill: "currentColor",
    stroke: "#000000"
  }));
  const icon3 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "44.75112610327733",
    cy: "48.751126103277315",
    r: "39.24601890638081",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "18.017351145722543",
    cy: "20.018648373035933",
    r: "12",
    strokeWidth: "0",
    vectorEffect: "non-scaling-stroke",
    fill: "currentColor",
    stroke: "#000000"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "36.75568663017539",
    cy: "87.17407429354459",
    r: "12",
    strokeWidth: "0",
    vectorEffect: "non-scaling-stroke",
    fill: "currentColor",
    stroke: "#000000"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "80.41194310314575",
    cy: "28.59226837330263",
    r: "12",
    strokeWidth: "0",
    vectorEffect: "non-scaling-stroke",
    fill: "currentColor",
    stroke: "#000000"
  }));
  const circleIcon4 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "44.75112610327733",
    cy: "48.751126103277315",
    r: "39.24601890638081",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "25.519211367842193,82.96199361067842 66.35131574575921,15.984041896579598",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }));
  const arcIcon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M 31.023373335849115 80.3626026626414 A 35.805027579936315 35.805027579936315 0 1 0 25.04108890280913 24.327977157175116",
    strokeWidth: "2",
    vectorEffect: "non-scaling-stroke",
    fill: "none",
    stroke: "currentColor"
  }));
  return [
    {
      name: "create circle",
      type: [
        { name: "2 points", icon: icon2 },
        { name: "3 points", icon: icon3 },
        { name: "center radius", hotkey: "C", icon: circleIcon },
        { name: "center diameter", icon: circleIcon4 }
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
`// dev/plugins/clone.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("rect", {
    x: "8",
    y: "27",
    width: "62",
    height: "65",
    strokeWidth: "3",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("rect", {
    x: "30",
    y: "8",
    width: "62",
    height: "65",
    strokeWidth: "3",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
                  ctx.getContentModel(d)?.move?.(d, offset);
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
      return ctx.getContentModel(content)?.move !== void 0;
    },
    hotkey: "CO",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/plugins/compress.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("rect", {
    x: "10.000000000000007",
    y: "44.006943105369096",
    width: "81",
    height: "20",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("rect", {
    x: "9",
    y: "69",
    width: "81",
    height: "20",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "42.02315889327355,6.083985542473695 57.02315889327355,6.083985542473695 57.02315889327355,31.083985542473695 73.02315889327355,31.083985542473695 51.714259038694095,44.09092864784279 27.023158893273553,32.0839855424737 42.05645527164646,32.0839855424737",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
  return {
    name: "compress",
    execute(contents) {
      const newIndexes = [];
      let validContentCount = 0;
      const invalidContentsIndex = [];
      const contentIsValid = (d) => !!d && (ctx.getContentModel(d)?.isValid?.(d) ?? true);
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
        ctx.getContentModel(content)?.updateRefId?.(content, (refId) => newIndexes[refId]);
      }
    },
    selectCount: 0,
    icon
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
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "10,87 89,87",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "17",
    cy: "40",
    r: "16.55294535724685",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "60.33793628490876",
    cy: "57",
    r: "30",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
    selectType: "select part",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/plugins/delete.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "17,21 80.00793600809345,84.00793600809345",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "77.78066522214152,23.227270785951916 19.22727078595193,81.78066522214154",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
    hotkey: "E",
    icon
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
        angle: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
            value: content.angle !== void 0,
            setValue: (v) => update((c) => {
              if (isEllipseContent(c)) {
                c.angle = v ? 0 : void 0;
              }
            }),
            style: { marginRight: "5px" }
          }),
          content.angle !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
            value: content.angle,
            setValue: (v) => update((c) => {
              if (isEllipseContent(c)) {
                c.angle = v;
              }
            })
          }) : void 0
        ],
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
          angle: [
            /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
              value: content.angle !== void 0,
              setValue: (v) => update((c) => {
                if (isEllipseArcContent(c)) {
                  c.angle = v ? 0 : void 0;
                }
              }),
              style: { marginRight: "5px" }
            }),
            content.angle !== void 0 ? /* @__PURE__ */ React.createElement(ctx.NumberEditor, {
              value: content.angle,
              setValue: (v) => update((c) => {
                if (isEllipseArcContent(c)) {
                  c.angle = v;
                }
              })
            }) : void 0
          ],
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
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("ellipse", {
    cx: "50",
    cy: "50",
    rx: "42",
    ry: "25.495097567963924",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "10",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "92",
    cy: "50",
    r: "10",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("ellipse", {
    cx: "50",
    cy: "50",
    rx: "42",
    ry: "25.495097567963924",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "8",
    cy: "50",
    r: "10",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "92",
    cy: "50",
    r: "10",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
  const icon3 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "7.25397110182702,71.37301444908648 7.525675776285333,68.97359332179542 8.120635704784306,66.42977169275659 9.034322883021424,63.7609095805685 10.259783599870872,60.987318637407924 11.787691359324036,58.130107565092274 13.606417860755549,55.211021465113106 15.70212149731244,52.25227634528363 18.058852698900033,49.27639004250492 20.65867531804105,46.30601084843038 23.481803134788017,43.363745142290924 26.506750441804286,40.47198534269887 29.710495563570376,37.65273948782142 33.06865606523542,34.9274637409214 36.555674317669016,32.316899095999176 40.14501200645094,29.840913526304668 43.80935210446823,27.518350777064185 47.520806770985914,25.366886953201202 51.25112959495419,23.40289599350468 54.97193056725217,21.641325055068076 58.65489214579961,20.095580756398505 62.27198476915073,18.77742714495478 65.79568017838163,17.696896165642876 69.19916092376258,16.86221131165783 72.45652446174336,16.279725038734938 75.54298028895008,15.953870419125984 78.43503861288471,15.88712740324258 81.11068912342954,16.080003945736145 83.54956850459736,16.53103213965627 85.73311541166187,17.23677938810893 87.64471173419864,18.19187452839158 89.26980906993974,19.389048709784426 90.59603944689957,20.819190713893583 91.61330945110967,22.47141629652439 92.3138770435936,24.333151023351952 92.69241048195828,26.39022596895895 92.746028898173,28.626985550913506 92.47432422371466,31.02640667820458 91.8793642952157,33.570228307243404 90.96567711697858,36.239090419431484 89.74021640012914,39.012681362592076 88.21230864067596,41.869892434907726 86.39358213924444,44.788978534886894 84.29787850268758,47.74772365471635 81.94114730109996,50.723609957495086 79.34132468195895,53.69398915156962 76.51819686521199,56.636254857709076 73.49324955819571,59.52801465730113 70.28950443642962,62.347260512178565 66.93134393476458,65.0725362590786 63.44432568233099,67.68310090400082 59.85498799354905,70.15908647369534 56.19064789553177,72.4816492229358 52.479193229014086,74.6331130467988 48.74887040504581,76.59710400649531 45.02806943274783,78.35867494493192 41.3451078542004,79.9044192436015 37.728015230849266,81.22257285504521 34.20431982161838,82.30310383435712",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return [
    {
      name: "create ellipse",
      type: [
        { name: "ellipse center", hotkey: "EL", icon: icon1 },
        { name: "ellipse endpoint", icon: icon2 }
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
`// dev/plugins/explode.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "17,11 83,11",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "80,91 16,91",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "9,84 9,19",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "90,19 90,85",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "explode",
    execute(contents, selected) {
      const newContents = [];
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected) && (this.contentSelectable?.(content, contents) ?? true)) {
          const result = ctx.getContentModel(content)?.explode?.(content, contents);
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
      return model?.explode !== void 0 && !ctx.contentIsReferenced(content, contents);
    },
    hotkey: "X",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/plugins/export-jsx.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "25,13 7,51 22,90",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "75,13 93,51 78,90",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "64,15 51,90",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "export jsx",
    execute(contents, selected) {
      const result = [];
      contents.forEach((content, index) => {
        if (content && ctx.isSelected([index], selected)) {
          const model = ctx.getContentModel(content);
          if (model?.render) {
            const color = ctx.getContentColor(content);
            const svg = ctx.renderToStaticMarkup(model.render({
              content,
              target: ctx.reactSvgRenderTarget,
              color,
              strokeWidth: ctx.getStrokeWidth(content),
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
`// dev/plugins/fill.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "50",
    cy: "50",
    r: "40.45985664828782",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
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
    contentSelectable: ctx.isFillContent,
    icon
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
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "9,10 92.02409288875128,10",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "92.02409288875128,10 92.02409288875128,93.02467676553937",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M 92.02409288875128 60.000000000000014 A 50 50 0 0 0 42.024092888751284 10.000000000000014",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
    hotkey: "F",
    icon
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
        ctx.getContentModel(c)?.move?.(c, offset);
      });
    },
    rotate(content, center, angle, contents) {
      content.contents.forEach((c) => {
        if (!c) {
          return;
        }
        ctx.getContentModel(c)?.rotate?.(c, center, angle, contents);
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
        ctx.getContentModel(c)?.mirror?.(c, line, angle, contents);
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "28",
    cy: "73",
    r: "22.090722034374522",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "93,78 97.68132319206183,48.443288605436294 71.01782864251547,34.85755955998643 49.85755955998643,56.01782864251546 63.44328860543629,82.68132319206183",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("rect", {
    x: "7",
    y: "8.5",
    width: "50",
    height: "37",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
    hotkey: "G",
    icon
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "100,100 100,50 66,67 28.124783736376884,11.999999999999993 0,36 0,100",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "70",
    cy: "22",
    r: "13.601470508735444",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
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
    selectCount: 0,
    icon
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
    },
    isValid(content) {
      return content.points.length > 1;
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
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "10,87 87.51451476981585,9.485485230184139",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "12,86 38,24 62.2,64.6 88,13",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
      hotkey: "L",
      icon: icon1
    },
    {
      name: "create polyline",
      useCommand({ onEnd, scale, type }) {
        const { line, onClick, onMove, input, inputMode, lastPosition, reset, positions } = ctx.useLineClickCreate(
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
          lastPosition,
          subcommand: type === "create polyline" && positions.length > 2 ? /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("button", {
            onClick: () => {
              onEnd({
                updateContents: (contents) => contents.push({ points: positions, type: "polygon" })
              });
              reset();
            },
            style: { position: "relative" }
          }, "close")) : void 0
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
`// dev/plugins/linear-dimension.plugin.tsx
function getModel(ctx) {
  function getLinearDimensionGeometriesFromCache(content) {
    return ctx.getGeometriesFromCache(content, () => {
      return ctx.getLinearDimensionGeometries(content, {
        arrowAngle: content.arrowAngle ?? ctx.dimensionStyle.arrowAngle,
        arrowSize: content.arrowSize ?? ctx.dimensionStyle.arrowSize,
        margin: ctx.dimensionStyle.margin
      }, getTextPosition);
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
    ...ctx.arrowModel,
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
          children.push(target.renderPolyline(regions[i].points, { strokeColor: color, strokeWidth: 0, fillColor: color }));
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
        text: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
            value: content.text !== void 0,
            setValue: (v) => update((c) => {
              if (isLinearDimensionContent(c)) {
                c.text = v ? "" : void 0;
              }
            }),
            style: { marginRight: "5px" }
          }),
          content.text !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, {
            value: content.text,
            setValue: (v) => update((c) => {
              if (isLinearDimensionContent(c)) {
                c.text = v;
              }
            })
          }) : void 0
        ],
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
        ...ctx.getArrowContentPropertyPanel(content, update),
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
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "15",
    cy: "83",
    r: "10",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "82",
    cy: "84",
    r: "10",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "15,83 14.999999999999995,7.940023980819191",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "82,84 82,6",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "14.999999999999996,25.040156291535933 81.99999999999999,25.040156291535933",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "66.73400154202005,34.93792306863058 83.13620848929534,24.48805424801579 65.88525315079036,15.508260763853169",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "29.265998457979954,34.575944487278335 12.308983383341738,25.052720722827807 29.034844626598673,15.129126778060689",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
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
`// dev/plugins/measure.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "9,14 43,92",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "94.0881895447306,14 93.76440329468612,21.41592435882452 92.795508753423,28.775409055420823 91.18887979343477,36.022443967469464 88.95674383121603,43.10187478341042 86.1160887692398,49.9598227600572 82.68853370776218,56.54409477236529 78.70016441041528,62.80458053462891 74.1813347757952,68.69363397001257 69.1664358259653,74.1664358259653 63.69363397001257,79.1813347757952 57.80458053462891,83.70016441041528 51.544094772365305,87.68853370776216 44.9598227600572,91.1160887692398",
    strokeWidth: "5",
    strokeDasharray: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "9,14 94.0881895447306,14",
    strokeWidth: "5",
    strokeDasharray: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
    selectCount: 0,
    icon
  };
}
export {
  getCommand
};
`,
`// dev/plugins/mirror.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "9.999999999999998,91.0384048104053 38,46 9,10",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "50,0 50,100",
    strokeWidth: "5",
    strokeDasharray: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "90,91.0384048104053 62,46 91,10",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
                ctx.getContentModel(content)?.mirror?.(draft, line, angle, contents);
              });
              return {
                patches
              };
            }
            return {
              newContents: [
                ctx.produce(content, (d) => {
                  ctx.getContentModel(d)?.mirror?.(d, line, angle, contents);
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
      return ctx.getContentModel(content)?.mirror !== void 0;
    },
    hotkey: "MI",
    icon
  };
}
export {
  getCommand
};
`,
`// dev/plugins/move.plugin.tsx
function getCommand(ctx) {
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "9,60 55,60 55,91 9,91",
    strokeWidth: "5",
    strokeDasharray: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("rect", {
    x: "44",
    y: "10",
    width: "46",
    height: "31",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
              ctx.getContentModel(content)?.move?.(draft, offset);
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
      return ctx.getContentModel(content)?.move !== void 0;
    },
    hotkey: "M",
    icon
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
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "10.964331152381801,81 86.72644978417914,83.3559397330022 88.44676768044036,39.61510448168846 52.00408203830702,10.225841867064801 12.791823135476555,35.80311391824452",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
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
        return ctx.getRadialDimensionGeometries(content, target, {
          arrowAngle: content.arrowAngle ?? ctx.dimensionStyle.arrowAngle,
          arrowSize: content.arrowSize ?? ctx.dimensionStyle.arrowSize,
          margin: ctx.dimensionStyle.margin
        }, getTextPosition);
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
    ...ctx.arrowModel,
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
        children.push(target.renderPolyline(regions[0].points, { strokeColor: color, strokeWidth: 0, fillColor: color }));
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
        text: [
          /* @__PURE__ */ React.createElement(ctx.BooleanEditor, {
            value: content.text !== void 0,
            setValue: (v) => update((c) => {
              if (isRadialDimensionReferenceContent(c)) {
                c.text = v ? "" : void 0;
              }
            }),
            style: { marginRight: "5px" }
          }),
          content.text !== void 0 ? /* @__PURE__ */ React.createElement(ctx.StringEditor, {
            value: content.text,
            setValue: (v) => update((c) => {
              if (isRadialDimensionReferenceContent(c)) {
                c.text = v;
              }
            })
          }) : void 0
        ],
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
        ...ctx.getArrowContentPropertyPanel(content, update),
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
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "36",
    cy: "64",
    r: "31.622776601683793",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "36,64 90.50229352972221,9.497706470277791",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "75.10199280075491,32.88621938243634 65.39851220628051,22.75526837146677 54.21645977390029,44.31651677899134",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }));
  return {
    name: "create radial dimension",
    selectCount: 1,
    icon,
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("rect", {
    x: "11",
    y: "26",
    width: "79",
    height: "48",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "create rect",
    icon,
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "91,40 53.15913160642131,7.916512888149235 10.952450707702425,33.99097459975807 22.708155753551882,82.18936528774087 72.18026193232437,85.90314722435183",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "create regular polygon",
    icon,
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "91.86884283091663,50 91.70951924339575,53.6491100949135 91.2327610295363,57.27044825861179 90.4421966072203,60.83645392104537 89.34384264905735,64.31998762591 87.94605829187336,67.69453757829653 86.25948151863179,70.93442141545832 84.29694819695987,74.01498166509921 82.07339439044554,76.9127734036263 79.60574268617492,79.60574268617492 76.9127734036263,82.07339439044554 74.01498166509921,84.29694819695987 70.93442141545833,86.25948151863179 67.69453757829653,87.94605829187336 64.31998762591002,89.34384264905735 60.83645392104537,90.4421966072203 57.2704482586118,91.2327610295363 53.6491100949135,91.70951924339575 50,91.86884283091663 46.3508899050865,91.70951924339575 42.72955174138821,91.2327610295363 39.16354607895463,90.4421966072203 35.68001237409,89.34384264905735 32.30546242170347,87.94605829187337 29.06557858454169,86.25948151863179 25.9850183349008,84.29694819695987 23.087226596373693,82.07339439044554 20.39425731382508,79.60574268617492 17.92660560955445,76.91277340362632 15.703051803040147,74.01498166509923 13.740518481368213,70.93442141545832 12.053941708126636,67.69453757829655 10.65615735094265,64.31998762591002 9.55780339277971,60.836453921045376 8.767238970463687,57.27044825861179 8.290480756604254,53.649110094913524 8.131157169083359,50.00000000000001 8.290480756604254,46.350889905086504 8.767238970463687,42.7295517413882 9.557803392779704,39.16354607895465 10.65615735094265,35.68001237409 12.05394170812663,32.30546242170347 13.74051848136822,29.065578584541676 15.703051803040125,25.9850183349008 17.926605609554443,23.087226596373696 20.394257313825072,20.39425731382508 23.08722659637369,17.92660560955445 25.985018334900776,15.703051803040147 29.06557858454166,13.740518481368227 32.30546242170344,12.053941708126644 35.68001237408997,10.656157350942657 39.16354607895464,9.55780339277971 42.72955174138821,8.767238970463687 46.3508899050865,8.290480756604254 49.99999999999999,8.131157169083359 53.64911009491349,8.290480756604254 57.27044825861178,8.76723897046368 60.83645392104538,9.55780339277971 64.31998762590999,10.656157350942642 67.69453757829655,12.053941708126636 70.93442141545833,13.74051848136822 74.01498166509921,15.703051803040132 76.9127734036263,17.926605609554443 79.60574268617492,20.394257313825072 82.07339439044554,23.087226596373682 84.29694819695985,25.985018334900772 86.25948151863177,29.06557858454166 87.94605829187336,32.30546242170344 89.34384264905735,35.68001237409 90.4421966072203,39.16354607895464 91.2327610295363,42.729551741388164 91.70951924339575,46.35088990508649 91.86884283091663,49.99999999999999",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "70.93442141545832,50 70.85475962169787,51.82455504745675 70.61638051476815,53.6352241293059 70.22109830361015,55.41822696052268 69.67192132452868,57.159993812955 68.97302914593668,58.847268789148266 68.1297407593159,60.46721070772916 67.14847409847994,62.00749083254961 66.03669719522277,63.45638670181315 64.80287134308746,64.80287134308746 63.45638670181315,66.03669719522277 62.00749083254961,67.14847409847994 60.467210707729166,68.1297407593159 58.847268789148266,68.97302914593668 57.15999381295501,69.67192132452868 55.41822696052268,70.22109830361015 53.6352241293059,70.61638051476815 51.82455504745675,70.85475962169787 50,70.93442141545832 48.175444952543245,70.85475962169787 46.3647758706941,70.61638051476815 44.58177303947731,70.22109830361015 42.840006187045,69.67192132452868 41.152731210851734,68.97302914593669 39.53278929227085,68.1297407593159 37.9925091674504,67.14847409847994 36.54361329818685,66.03669719522277 35.19712865691254,64.80287134308746 33.96330280477723,63.45638670181316 32.85152590152008,62.007490832549614 31.870259240684106,60.46721070772916 31.02697085406332,58.84726878914827 30.328078675471325,57.15999381295501 29.778901696389855,55.41822696052269 29.383619485231844,53.6352241293059 29.145240378302127,51.82455504745676 29.06557858454168,50 29.145240378302127,48.17544495254325 29.383619485231844,46.364775870694096 29.778901696389852,44.581773039477326 30.328078675471325,42.840006187045 31.026970854063315,41.152731210851734 31.87025924068411,39.532789292270834 32.85152590152006,37.9925091674504 33.96330280477722,36.54361329818685 35.19712865691254,35.19712865691254 36.54361329818684,33.96330280477723 37.992509167450386,32.85152590152008 39.532789292270834,31.870259240684113 41.15273121085172,31.026970854063322 42.840006187044985,30.32807867547133 44.58177303947732,29.778901696389855 46.3647758706941,29.383619485231844 48.175444952543245,29.145240378302127 49.99999999999999,29.06557858454168 51.82455504745675,29.145240378302127 53.63522412930589,29.38361948523184 55.41822696052269,29.778901696389855 57.159993812954994,30.32807867547132 58.84726878914827,31.02697085406332 60.467210707729166,31.87025924068411 62.00749083254961,32.85152590152006 63.45638670181315,33.96330280477722 64.80287134308746,35.19712865691254 66.03669719522277,36.54361329818684 67.14847409847992,37.992509167450386 68.1297407593159,39.532789292270834 68.97302914593668,41.15273121085172 69.67192132452868,42.840006187045 70.22109830361015,44.58177303947732 70.61638051476815,46.36477587069408 70.85475962169787,48.175444952543245 70.93442141545832,49.99999999999999",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "create ring",
    icon,
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
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "5.5,66 66.5,66 66.5,94 5.5,94",
    strokeWidth: "5",
    strokeDasharray: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("rect", {
    x: "35.5",
    y: "26",
    width: "61",
    height: "28",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor",
    transform: "rotate(56.85300416774402,66,40)"
  }));
  return {
    name: "rotate",
    icon,
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
                    ctx.getContentModel(d)?.rotate?.(d, startPosition, angle, contents);
                  })
                ]
              };
            }
            const [, ...patches] = ctx.produceWithPatches(content, (draft) => {
              ctx.getContentModel(content)?.rotate?.(draft, startPosition, angle, contents);
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
      return ctx.getContentModel(content)?.rotate !== void 0;
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
  const React = ctx.React;
  const icon1 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "13",
    cy: "22",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "28",
    cy: "79",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "63",
    cy: "22",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "85",
    cy: "80",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "13,22 13.601,24.2458 14.204,26.423199999999998 14.808999999999997,28.5322 15.416000000000002,30.5728 16.025000000000002,32.545 16.636,34.4488 17.249,36.2842 17.864,38.0512 18.481,39.74980000000001 19.1,41.38000000000001 19.721,42.9418 20.344,44.435199999999995 20.968999999999998,45.860200000000006 21.595999999999997,47.2168 22.225,48.50499999999999 22.856,49.7248 23.489,50.8762 24.124,51.959199999999996 24.761000000000003,52.9738 25.4,53.92 26.041000000000004,54.7978 26.684000000000005,55.607200000000006 27.329000000000004,56.348200000000006 27.976,57.020799999999994 28.625,57.625 29.275999999999996,58.1608 29.929000000000002,58.62820000000001 30.583999999999996,59.02719999999999 31.241,59.3578 31.9,59.620000000000005 32.561,59.8138 33.224000000000004,59.9392 33.888999999999996,59.99619999999999 34.556,59.98479999999999 35.224999999999994,59.905 35.896,59.7568 36.569,59.5402 37.244,59.255199999999995 37.921,58.9018 38.6,58.480000000000004 39.281,57.98980000000001 39.964000000000006,57.431200000000004 40.648999999999994,56.80420000000001 41.336,56.1088 42.025,55.345 42.716,54.5128 43.409000000000006,53.61220000000001 44.104,52.6432 44.80100000000001,51.6058 45.5,50.5 46.2018,49.3946 46.907199999999996,48.358399999999996 47.6162,47.3914 48.32880000000001,46.493599999999994 49.045,45.665 49.76480000000001,44.90559999999999 50.48819999999999,44.21540000000001 51.215199999999996,43.5944 51.94579999999999,43.0426 52.68,42.559999999999995 53.4178,42.1466 54.159200000000006,41.8024 54.9042,41.5274 55.6528,41.3216 56.405,41.185 57.16080000000001,41.117599999999996 57.92020000000001,41.1194 58.683200000000014,41.1904 59.449799999999996,41.3306 60.22,41.54 60.99379999999999,41.8186 61.77120000000001,42.166399999999996 62.5522,42.5834 63.3368,43.0696 64.125,43.625 64.9168,44.2496 65.7122,44.9434 66.5112,45.7064 67.3138,46.5386 68.12,47.44 68.9298,48.4106 69.74319999999999,49.450399999999995 70.5602,50.5594 71.3808,51.73759999999999 72.20499999999998,52.985 73.03280000000001,54.301599999999986 73.8642,55.6874 74.6992,57.142399999999995 75.5378,58.66660000000001 76.38,60.260000000000005 77.22579999999999,61.9226 78.0752,63.654399999999995 78.9282,65.45540000000001 79.7848,67.32559999999998 80.645,69.265 81.5088,71.2736 82.37619999999998,73.3514 83.24719999999999,75.49839999999999 84.12180000000001,77.7146 85,80",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  const icon2 = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("circle", {
    cx: "13",
    cy: "22",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "28",
    cy: "79",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "63",
    cy: "22",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("circle", {
    cx: "85",
    cy: "80",
    r: "5",
    strokeWidth: "0",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "currentColor",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "13,22 13.0880062,22.9506286 13.1760496,23.9010288 13.264167399999998,24.8509722 13.3523968,25.800230400000004 13.440775,26.748575 13.5293392,27.6957776 13.6181266,28.641609800000005 13.7071744,29.5858432 13.796519799999999,30.5282494 13.886199999999999,31.468600000000002 13.9762522,32.4066666 14.0667136,33.3422208 14.157621400000002,34.27503420000001 14.249012800000003,35.2048784 14.340924999999999,36.131525 14.4333952,37.0547456 14.5264606,37.974311799999995 14.620158400000001,38.8899952 14.714525799999999,39.8015674 14.8096,40.7088 14.9054182,41.6114646 15.0020176,42.509332799999996 15.0994354,43.4021762 15.197708800000001,44.2897664 15.296875000000002,45.171875 15.396971200000001,46.0482736 15.4980346,46.918733800000005 15.600102399999999,47.7830272 15.7032118,48.6409254 15.8074,49.4922 15.912704199999999,50.336622600000005 16.0191616,51.1739648 16.1268094,52.003998200000005 16.2356848,52.8264944 16.345825,53.641225000000006 16.4572672,54.4479616 16.5700486,55.2464758 16.6842064,56.0365392 16.7997778,56.817923400000005 16.9168,57.590399999999995 17.035310199999998,58.353740599999995 17.155345599999997,59.107716800000006 17.2769434,59.852100199999995 17.4001408,60.58666240000001 17.524975,61.311175000000006 17.6514832,62.0254096 17.7797026,62.729137800000004 17.9096704,63.422131199999995 18.0414238,64.10416140000001 18.174999999999997,64.775 18.310436199999998,65.4344186 18.4477696,66.0821888 18.5870374,66.7180822 18.7282768,67.3418704 18.871525,67.953325 19.0168192,68.5522176 19.1641966,69.13831979999999 19.313694400000003,69.7114032 19.4653498,70.2712394 19.6192,70.8176 19.7752822,71.35025660000001 19.9336336,71.8689808 20.0942914,72.3735442 20.2572928,72.86371840000001 20.422675,73.339275 20.5904752,73.7999856 20.7607306,74.24562180000001 20.933478400000002,74.6759552 21.1087558,75.0907574 21.2866,75.4898 21.467048199999997,75.8728546 21.6501376,76.2396928 21.835905399999998,76.59008619999999 22.0243888,76.92380639999999 22.215625,77.240625 22.4096512,77.54031359999999 22.6065046,77.8226438 22.8062224,78.08738720000001 23.008841800000003,78.33431540000001 23.214399999999998,78.56320000000001 23.4229342,78.7738126 23.6344816,78.9659248 23.8490794,79.1393082 24.0667648,79.2937344 24.287575,79.428975 24.511547200000003,79.5448016 24.7387186,79.64098580000001 24.9691264,79.7172992 25.202807800000002,79.77351340000001 25.439799999999998,79.80940000000001 25.6801402,79.8247306 25.923865600000003,79.8192768 26.171013400000003,79.79281019999999 26.421620799999996,79.7451024 26.675725,79.675925 26.933363200000002,79.5850496 27.1945726,79.47224779999999 27.4593904,79.3372912 27.727853800000002,79.1799514 28,79 28.275849,78.797323 28.555352,78.57226399999999 28.838443,78.325281 29.125056,78.05683200000001 29.415125,77.767375 29.708584,77.457368 30.005367,77.127269 30.305408,76.777536 30.608641,76.408627 30.915,76.021 31.224419,75.615113 31.536832,75.19142400000001 31.852173,74.75039100000001 32.170376,74.292472 32.491375,73.818125 32.815104,73.327808 33.141497,72.821979 33.470487999999996,72.301096 33.802011,71.76561699999999 34.136,71.216 34.472389,70.652703 34.811112,70.076184 35.152103000000004,69.486901 35.495296,68.885312 35.840625,68.271875 36.188024,67.647048 36.537427,67.011289 36.888768,66.365056 37.241980999999996,65.70880700000001 37.596999999999994,65.043 37.953759000000005,64.368093 38.312191999999996,63.684544 38.672233000000006,62.992810999999996 39.033815999999995,62.29335199999999 39.396875,61.586625000000005 39.761344,60.873087999999996 40.127157,60.153199 40.494248,59.42741600000001 40.862550999999996,58.696197 41.232,57.96 41.602529000000004,57.219283 41.97407199999999,56.474503999999996 42.346563,55.72612099999999 42.719936000000004,54.974592 43.094125,54.22037499999999 43.469063999999996,53.463927999999996 43.844687,52.705709 44.220928,51.946176 44.597721,51.185787000000005 44.974999999999994,50.425 45.352699,49.664272999999994 45.730752,48.904064 46.109093,48.144830999999996 46.487656,47.387032 46.866375000000005,46.631125 47.245184,45.877568 47.624016999999995,45.126819000000005 48.002808,44.379336 48.381491,43.635577 48.760000000000005,42.896 49.138268999999994,42.161063 49.516232,41.431224 49.893823000000005,40.706941 50.270976000000005,39.988672 50.647625,39.276875 51.023704,38.572008 51.399147,37.874528999999995 51.773888,37.184895999999995 52.147861,36.503567000000004 52.521,35.831 52.893239,35.167653 53.264511999999996,34.513984 53.634753,33.870451 54.003896,33.237512 54.371875,32.615625 54.738624,32.005247999999995 55.104077000000004,31.406838999999998 55.468168000000006,30.820856 55.830831,30.247757 56.19200000000001,29.687999999999995 56.551609,29.142042999999997 56.909591999999996,28.610344000000005 57.265883,28.093361 57.620416,27.591552 57.973124999999996,27.105375 58.323944,26.635288 58.672807,26.181749 59.019648000000004,25.745216 59.364401,25.326147 59.706999999999994,24.924999999999997 60.047379,24.542232999999996 60.385472,24.178303999999997 60.721213,23.833670999999995 61.054536000000006,23.508792 61.385374999999996,23.204124999999998 61.713664,22.920128000000002 62.039336999999996,22.657258999999996 62.362328,22.415976 62.682571,22.196737000000002 63,22 63.3145648,21.8261084 63.626278400000004,21.674947200000002 63.9351696,21.5462868 64.24126720000001,21.439897600000002 64.54459999999999,21.35555 64.8451968,21.2930144 65.14308639999999,21.252061199999996 65.4382976,21.2324608 65.7308592,21.2339836 66.02080000000001,21.2564 66.3081488,21.2994804 66.59293439999999,21.3629952 66.8751856,21.446714800000002 67.15493120000001,21.550409600000002 67.4322,21.67385 67.7070208,21.8168064 67.97942239999999,21.979049200000002 68.2494336,22.1603488 68.5170832,22.3604756 68.7824,22.5792 69.04541280000001,22.8162924 69.3061504,23.071523199999998 69.5646416,23.3446628 69.8209152,23.635481600000002 70.075,23.94375 70.3269248,24.269238400000003 70.57671839999999,24.6117172 70.8244096,24.970956800000003 71.0700272,25.3467276 71.3136,25.7388 71.55515679999999,26.1469444 71.7947264,26.5709312 72.03233759999999,27.010530800000005 72.2680192,27.4655136 72.50179999999999,27.935650000000003 72.73370879999999,28.4207104 72.9637744,28.9204652 73.19202560000001,29.4346848 73.4184912,29.9631396 73.64320000000001,30.505600000000005 73.86618080000001,31.0618364 74.08746239999999,31.631619200000003 74.3070736,32.2147188 74.5250432,32.8109056 74.7414,33.41995 74.9561728,34.0416224 75.16939039999998,34.6756932 75.38108159999999,35.3219328 75.5912752,35.9801116 75.80000000000001,36.65 76.00728480000001,37.3313684 76.2131584,38.02398720000001 76.4176496,38.72762680000001 76.62078720000001,39.442057600000005 76.82260000000001,40.16705 77.02311680000001,40.9023744 77.2223664,41.647801199999996 77.4203776,42.4031008 77.6171792,43.1680436 77.8128,43.94239999999999 78.00726879999999,44.7259404 78.20061439999999,45.51843519999999 78.3928656,46.319654799999995 78.58405119999999,47.129369600000004 78.77420000000001,47.94735 78.96334080000001,48.773366400000015 79.15150240000001,49.60718920000001 79.3387136,50.44858880000001 79.5250032,51.297335600000004 79.7104,52.1532 79.8949328,53.0159524 80.0786304,53.8853632 80.2615216,54.7612028 80.44363519999999,55.643241599999996 80.625,56.53124999999999 80.8056448,57.42499839999999 80.98559839999999,58.324257200000005 81.1648896,59.228796800000005 81.3435472,60.138387600000016 81.5216,61.05280000000001 81.69907680000001,61.97180440000001 81.87600640000001,62.89517120000001 82.0524176,63.822670800000004 82.22833920000001,64.7540736 82.4038,65.68915 82.5788288,66.6276704 82.7534544,67.5694052 82.9277056,68.51412479999999 83.1016112,69.4615996 83.2752,70.41159999999999 83.44850079999999,71.36389639999999 83.62154239999998,72.31825920000001 83.7943536,73.2744588 83.96696320000001,74.2322656 84.13940000000001,75.19144999999997 84.3116928,76.1517824 84.4838704,77.1130332 84.6559616,78.07497280000001 84.8279952,79.0373716 85,80",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "create spline",
    type: [
      { name: "spline", hotkey: "SPL", icon: icon1 },
      { name: "spline fitting", icon: icon2 }
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polygon", {
    points: "75,84 70.10506171865889,56.40597325071819 90.0613464134089,36.73016490136938 62.30524834733077,32.85850464193647 49.75927371857041,7.798790883939958 37.5,33 9.789876562682231,37.18805349856361 29.969326793295547,56.63491754931531 25.389503305338458,84.28299071612705 50.1203631407148,71.10060455803003",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "create star",
    icon,
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "42.15549442140351,73 42.09401788765295,74.40804411575307 41.91005615994365,75.80537216558498 41.605009298102615,77.18134963930676 41.181198892940785,78.52550451750547 40.641850397545156,79.82760696993512 39.99106857963322,81.07774721070176 39.233806281792084,82.26641091771783 38.37582672735581,83.38455164243818 37.42365965879586,84.42365965879586 36.38455164243818,85.37582672735581 35.26641091771783,86.23380628179208 34.07774721070176,86.99106857963322 32.82760696993512,87.64185039754516 31.52550451750547,88.18119889294078 30.18134963930676,88.60500929810262 28.80537216558498,88.91005615994365 27.40804411575307,89.09401788765295 26,89.15549442140352 24.59195588424693,89.09401788765295 23.194627834415023,88.91005615994365 21.81865036069324,88.60500929810262 20.47449548249453,88.18119889294078 19.17239303006488,87.64185039754516 17.92225278929825,86.99106857963322 16.733589082282172,86.23380628179208 15.615448357561815,85.37582672735581 14.57634034120414,84.42365965879586 13.624173272644194,83.38455164243818 12.766193718207916,82.26641091771783 12.008931420366778,81.07774721070176 11.35814960245484,79.82760696993512 10.818801107059214,78.52550451750547 10.394990701897383,77.18134963930676 10.089943840056348,75.80537216558498 9.90598211234705,74.40804411575309 9.84450557859649,73 9.90598211234705,71.59195588424693 10.089943840056348,70.19462783441502 10.39499070189738,68.81865036069325 10.818801107059212,67.47449548249453 11.358149602454839,66.17239303006488 12.00893142036678,64.92225278929824 12.766193718207909,63.73358908228217 13.62417327264419,62.61544835756182 14.576340341204137,61.576340341204144 15.615448357561814,60.62417327264419 16.733589082282165,59.766193718207916 17.922252789298238,59.00893142036678 19.172393030064875,58.358149602454844 20.47449548249452,57.818801107059215 21.818650360693244,57.394990701897385 23.194627834415023,57.08994384005635 24.59195588424693,56.90598211234705 25.999999999999996,56.84450557859649 27.408044115753068,56.90598211234705 28.805372165584973,57.08994384005635 30.181349639306763,57.394990701897385 31.52550451750546,57.81880110705921 32.82760696993512,58.358149602454844 34.07774721070176,59.00893142036678 35.26641091771783,59.766193718207916 36.38455164243818,60.62417327264419 37.423659658795856,61.57634034120414 38.3758267273558,62.61544835756181 39.233806281792084,63.733589082282165 39.991068579633215,64.92225278929824 40.641850397545156,66.17239303006487 41.181198892940785,67.47449548249453 41.605009298102615,68.81865036069324 41.91005615994365,70.194627834415 42.09401788765295,71.59195588424693 42.15549442140351,73",
    strokeWidth: "5",
    strokeDasharray: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "12,10 76,10 76,45 12,45",
    strokeWidth: "5",
    strokeDasharray: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polygon", {
    points: "70.00000000000001,93.07397274136177 93.44674817538672,52.46301362931911 46.553251824613284,52.463013629319114",
    strokeWidth: "5",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "start edit container",
    icon,
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
  const React = ctx.React;
  const icon = /* @__PURE__ */ React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React.createElement("polyline", {
    points: "16,22 83.00746227100382,22",
    strokeWidth: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }), /* @__PURE__ */ React.createElement("polyline", {
    points: "49,22.000000000000004 49.00000000000001,89.00746227100382",
    strokeWidth: "10",
    strokeMiterlimit: "10",
    strokeLinejoin: "miter",
    strokeLinecap: "butt",
    fill: "none",
    stroke: "currentColor"
  }));
  return {
    name: "create text",
    icon,
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
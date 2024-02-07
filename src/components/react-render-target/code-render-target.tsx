import { printJsToCode } from "../../utils/print"
import { ReactRenderTarget } from "./react-render-target"

export const codeRenderTarget: ReactRenderTarget<string, string> = {
  type: 'code',
  renderResult(children, width, height, options) {
    return `target.renderResult([\n${children.map(c => '  ' + c).join(',\n')}\n], ${width}, ${height}, ${stringify(options)})`
  },
  renderEmpty() {
    return `target.renderEmpty()`
  },
  renderGroup(children, options) {
    return `target.renderGroup([\n${children.map(c => '  ' + c).join(',\n')}\n], ${stringify(options)})`
  },
  renderRect(x, y, width, height, options) {
    return `target.renderRect(${x}, ${y}, ${width}, ${height}, ${stringify(options)})`
  },
  renderPolyline(points, options) {
    return `target.renderPolyline(${stringify(points)}, ${stringify(options)})`
  },
  renderPolygon(points, options) {
    return `target.renderPolygon(${stringify(points)}, ${stringify(options)})`
  },
  renderCircle(cx, cy, r, options) {
    return `target.renderCircle(${cx}, ${cy}, ${r}, ${stringify(options)})`
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return `target.renderEllipse(${cx}, ${cy}, ${rx}, ${ry}, ${stringify(options)})`
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return `target.renderArc(${cx}, ${cy}, ${r}, ${startAngle}, ${endAngle}, ${stringify(options)})`
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    return `target.renderEllipseArc(${cx}, ${cy}, ${rx}, ${ry}, ${startAngle}, ${endAngle}, ${stringify(options)})`
  },
  renderPathCommands(pathCommands, options) {
    return `target.renderPathCommands(${stringify(pathCommands)}, ${stringify(options)})`
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return `target.renderText(${x}, ${y}, ${stringify(text)}, ${stringify(fill)}, ${fontSize}, ${stringify(fontFamily)}, ${stringify(options)})`
  },
  renderImage(url, x, y, width, height, options) {
    return `target.renderImage(${stringify(url)}, ${x}, ${y}, ${width}, ${height}, ${stringify(options)})`
  },
  renderPath(lines, options) {
    return `target.renderPath(${stringify(lines)}, ${stringify(options)})`
  },
  renderRay(x, y, angle, options) {
    return `target.renderRay(${x}, ${y}, ${angle}, ${stringify(options)})`
  },
}

function stringify(value: unknown) {
  return printJsToCode(value, { functionPrinter: f => '() => ' + f() })
}

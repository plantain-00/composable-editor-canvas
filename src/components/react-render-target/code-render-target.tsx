import { ReactRenderTarget } from "./react-render-target"

export const codeRenderTarget: ReactRenderTarget<string, string> = {
  type: 'code',
  renderResult(children, width, height, options) {
    return `target.renderResult([\n${children.map(c => '  ' + c).join('\n')}\n], ${width}, ${height}, ${JSON.stringify(options)})`
  },
  renderEmpty() {
    return `target.renderEmpty()`
  },
  renderGroup(children, options) {
    return `target.renderGroup([\n${children.map(c => '  ' + c).join('\n')}\n], ${JSON.stringify(options)})`
  },
  renderRect(x, y, width, height, options) {
    return `target.renderRect(${x}, ${y}, ${width}, ${height}, ${JSON.stringify(options)})`
  },
  renderPolyline(points, options) {
    return `target.renderPolyline(${JSON.stringify(points)}, ${JSON.stringify(options)})`
  },
  renderPolygon(points, options) {
    return `target.renderPolygon(${JSON.stringify(points)}, ${JSON.stringify(options)})`
  },
  renderCircle(cx, cy, r, options) {
    return `target.renderCircle(${cx}, ${cy}, ${r}, ${JSON.stringify(options)})`
  },
  renderEllipse(cx, cy, rx, ry, options) {
    return `target.renderEllipse(${cx}, ${cy}, ${rx}, ${ry}, ${JSON.stringify(options)})`
  },
  renderArc(cx, cy, r, startAngle, endAngle, options) {
    return `target.renderArc(${cx}, ${cy}, ${r}, ${startAngle}, ${endAngle}, ${JSON.stringify(options)})`
  },
  renderEllipseArc(cx, cy, rx, ry, startAngle, endAngle, options) {
    return `target.renderEllipseArc(${cx}, ${cy}, ${rx}, ${ry}, ${startAngle}, ${endAngle}, ${JSON.stringify(options)})`
  },
  renderPathCommands(pathCommands, options) {
    return `target.renderPathCommands(${JSON.stringify(pathCommands)}, ${JSON.stringify(options)})`
  },
  renderText(x, y, text, fill, fontSize, fontFamily, options) {
    return `target.renderText(${x}, ${y}, ${JSON.stringify(text)}, ${JSON.stringify(fill)}, ${fontSize}, ${JSON.stringify(fontFamily)}, ${JSON.stringify(options)})`
  },
  renderImage(url, x, y, width, height, options) {
    return `target.renderImage(${JSON.stringify(url)}, ${x}, ${y}, ${width}, ${height}, ${JSON.stringify(options)})`
  },
  renderPath(lines, options) {
    return `target.renderPath(${JSON.stringify(lines)}, ${JSON.stringify(options)})`
  },
}

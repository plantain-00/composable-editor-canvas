import { Position } from "../../utils"
import { isSamePath } from "../use-selected"

/**
 * @public
 */
export class RenderingLinesMerger {
  private last: LastRenderingLines | undefined

  constructor(private flush: (lines: LastRenderingLines) => void) { }

  public flushLast() {
    if (this.last && this.last.line.length > 0) {
      this.flush(this.last)
      this.last = undefined
    }
  }

  public push(line: {
    line: Position[]
    strokeColor: number
    dashArray?: number[]
    strokeWidth: number
  }) {
    if (!this.last) {
      this.last = {
        ...line,
        line: [line.line],
      }
    } else if (
      this.last.strokeColor === line.strokeColor &&
      this.last.strokeWidth === line.strokeWidth &&
      isSamePath(this.last.dashArray, line.dashArray)
    ) {
      this.last.line.push(line.line)
    } else {
      this.flushLast()
      this.push(line)
    }
  }
}

/**
 * @public
 */
export interface LastRenderingLines {
  line: Position[][]
  strokeColor: number
  dashArray?: number[]
  strokeWidth: number
}

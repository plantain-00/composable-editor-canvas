/**
 * @public
 */
export class Merger<T, V> {
  private last: { type: T, target: V[] } | undefined

  constructor(
    private flush: (last: { type: T, target: V[] }) => void,
    private equals: (a: T, b: T) => boolean,
    private getTarget: (data: T) => V,
  ) { }

  public flushLast() {
    if (this.last && this.last.target.length > 0) {
      this.flush(this.last)
      this.last = undefined
    }
  }

  public push(data: T) {
    if (!this.last) {
      this.last = {
        type: data,
        target: [this.getTarget(data)],
      }
    } else if (this.equals(this.last.type, data)) {
      this.last.target.push(this.getTarget(data))
    } else {
      this.flushLast()
      this.push(data)
    }
  }
}

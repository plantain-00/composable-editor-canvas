/**
 * @public
 */
export class Reducer<T> {
  private last: T | undefined

  constructor(
    private flush: (last: T) => void,
    private newItem: (previous: T, current: T) => boolean,
    private reduceItem: (previous: T, current: T) => void,
  ) { }

  public flushLast() {
    if (this.last) {
      this.flush(this.last)
      this.last = undefined
    }
  }

  public push(data: T) {
    if (!this.last) {
      this.last = data
    } else if (this.newItem(this.last, data)) {
      this.flushLast()
      this.push(data)
    } else {
      this.reduceItem(this.last, data)
    }
  }
}

/**
 * @public
 */
export class Debug {
  constructor(private enabled?: boolean) { }
  private last = performance.now()
  private result: Record<string, number> = {}
  public add(name: string, value: number) {
    if (!this.enabled) {
      return
    }
    this.result[name] = value
  }
  public mark(name: string) {
    if (!this.enabled) {
      return
    }
    this.result[name] = Math.round(performance.now() - this.last)
    this.last = performance.now()
  }
  public print(name = 'end') {
    this.mark(name)
    return Object.values(this.result).join(' ')
  }
}

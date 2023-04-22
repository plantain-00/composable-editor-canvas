export class Lazy<T> {
  private _instance?: T
  constructor(private getInstance: () => T, private destroy?: (t: T) => void) { }
  get instance() {
    if (this._instance === undefined) {
      this._instance = this.getInstance()
    }
    return this._instance
  }
  reset() {
    if (this._instance) {
      this.destroy?.(this._instance)
    }
    this._instance = undefined
  }
}

export class Lazy<T> {
  private _instance?: T
  constructor(private getInstance: () => T) { }
  get instance() {
    if (this._instance === undefined) {
      this._instance = this.getInstance()
    }
    return this._instance
  }
}

/**
 * @public
 */
export class AsyncRequest<T> {
  private map = new Map<number, (result: T) => void>()
  private id = 0
  private getId() {
    return this.id++
  }
  public send(send: (requestId: number) => void) {
    const id = this.getId()
    return new Promise<T>(resolve => {
      this.map.set(id, resolve)
      send(id)
    })
  }
  public respond(id: number, result: T) {
    this.map.get(id)?.(result)
    this.map.delete(id)
  }
}

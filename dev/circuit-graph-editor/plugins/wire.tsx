import { BaseContent, BaseDevice } from "../model"

export type WireDevice = BaseDevice<'wire'> & {
  value: number
}

export function isWireDevice(content: BaseContent): content is WireDevice {
  return content.type === 'wire'
}

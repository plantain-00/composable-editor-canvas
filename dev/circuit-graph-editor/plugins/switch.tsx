import { BaseContent, BaseDevice } from "../model"

export type SwitchDevice = BaseDevice<'switch'> & {
  open: boolean
}

export function isPowerDevice(content: BaseContent): content is SwitchDevice {
  return content.type === 'switch'
}

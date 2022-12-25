import { BaseContent, BaseDevice } from "../model"

export type ResistanceDevice = BaseDevice<'resistance'> & {
  value: number
}

export function isPowerDevice(content: BaseContent): content is ResistanceDevice {
  return content.type === 'resistance'
}

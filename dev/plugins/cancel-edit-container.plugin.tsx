import type { PluginContext } from './types'
import type { Command } from '../commands/command'

export function getCommand(ctx: PluginContext): Command {
  const React = ctx.React
  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <polygon points="37.2523424414741,82.2523424414741 32,77 45.26210843293586,64.73424940995307 34.85576768442547,52.45776612707198 22.804714999337193,65 16.408386715608138,58.388958288839014 4.438582558303025,90.59970985857345" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <polygon points="83.31772011698345,40.37472637282923 78.58823529411765,34.64705882352941 65.11778548913132,46.68363390432083 53.8856897130448,35.157837010145315 67.51629404983674,24.353109954091316 61.542962454827205,17.357525798639863 94.74536622245155,8.502633800256604" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <polygon points="60.823922790999546,82.94782332121554 66.3768001163132,78.0142895314217 53.860936060450534,64.98795833037552 64.9729807484759,53.34637628924838 76.26359466760502,66.57730742319224 83.03857504543225,60.35488595723553 93.08844972308609,93.21532946025053" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
      <polygon points="17.30773332157345,38.42709778758177 22.36668717670166,32.98823870348119 35.10404208885271,45.798076620726135 46.996145772344406,34.95456060653361 34.026286658445244,23.364985294745704 40.40167834341685,16.733750953905556 7.779106641484908,5.936689140444656" strokeWidth="0" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" fill="currentColor" stroke="currentColor"></polygon>
    </svg>
  )
  return {
    name: 'cancel edit container',
    execute(contents, selected, setEditingContentPath) {
      setEditingContentPath(undefined)
    },
    selectCount: 0,
    icon,
  }
}

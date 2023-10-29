import * as opentype from 'opentype.js'
import { PathCommand } from '../../src'

export function opentypeCommandsToPathCommands(path: opentype.Path) {
  const commands: PathCommand[] = path.commands.map(c => {
    if (c.type === 'M') return { type: 'move', to: c }
    if (c.type === 'L') return { type: 'line', to: c }
    if (c.type === 'C') return { type: 'bezierCurve', cp1: { x: c.x1, y: c.y1 }, cp2: { x: c.x2, y: c.y2 }, to: c }
    if (c.type === 'Q') return { type: 'quadraticCurve', cp: { x: c.x1, y: c.y1 }, to: c }
    return { type: 'close' }
  })
  return commands
}

export const allFonts = [
  { name: 'STSong', url: 'https://raw.githubusercontent.com/Haixing-Hu/latex-chinese-fonts/master/chinese/%E5%AE%8B%E4%BD%93/STSong.ttf' },
  { name: 'Arial', url: 'https://raw.githubusercontent.com/Haixing-Hu/latex-chinese-fonts/master/english/Sans/Arial.ttf' },
]
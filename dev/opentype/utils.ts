import * as opentype from 'opentype.js'
import { PathCommand, Position, skewPoint } from '../../src'

export function opentypeCommandsToPathCommands(path: opentype.Path, italicY?: number) {
  const commands: PathCommand[] = []
  for (const c of path.commands) {
    if (c.type === 'M') {
      commands.push({
        type: 'move',
        to: skewPointIfItalic({ x: c.x, y: c.y }, italicY),
      })
    } else if (c.type === 'L') {
      commands.push({
        type: 'line',
        to: skewPointIfItalic({ x: c.x, y: c.y }, italicY),
      })
    } else if (c.type === 'C') {
      commands.push({
        type: 'bezierCurve',
        cp1: skewPointIfItalic({ x: c.x1, y: c.y1 }, italicY),
        cp2: skewPointIfItalic({ x: c.x2, y: c.y2 }, italicY),
        to: skewPointIfItalic({ x: c.x, y: c.y }, italicY),
      })
    } else if (c.type === 'Q') {
      commands.push({
        type: 'quadraticCurve',
        cp: skewPointIfItalic({ x: c.x1, y: c.y1 }, italicY),
        to: skewPointIfItalic({ x: c.x, y: c.y }, italicY),
      })
    } else {
      commands.push({ type: 'close' })
    }
  }
  return commands
}

function skewPointIfItalic(point: Position, italicY?: number) {
  if (italicY !== undefined) {
    skewPoint(point, { x: 0, y: italicY }, -0.15)
  }
  return point
}

export const allFonts = [
  { name: 'STSong', url: 'https://raw.githubusercontent.com/Haixing-Hu/latex-chinese-fonts/master/chinese/%E5%AE%8B%E4%BD%93/STSong.ttf' },
  { name: 'Arial', url: 'https://raw.githubusercontent.com/Haixing-Hu/latex-chinese-fonts/master/english/Sans/Arial.ttf' },
]
export function getResizeCursor(rotate: number, direction: ResizeDirection) {
  rotate = rotate % 180
  let offset = 0
  if (rotate > 22.5) {
    if (rotate < 67.5) {
      offset += 1
    } else if (rotate < 112.5) {
      offset += 2
    } else if (rotate < 157.5) {
      offset += 3
    }
  } else if (rotate < -22.5) {
    if (rotate > -67.5) {
      offset += 3
    } else if (rotate > -112.5) {
      offset += 2
    } else if (rotate > -157.5) {
      offset += 1
    }
  }
  if (direction === 'top' || direction === 'bottom') {
    return cursors[(offset + 2) % 4]
  }
  if (direction === 'right' || direction === 'left') {
    return cursors[offset % 4]
  }
  if (direction === 'right-top' || direction === 'left-bottom') {
    return cursors[(offset + 3) % 4]
  }
  return cursors[(offset + 1) % 4]
}

export type ResizeDirection = `${'left' | 'right'}-${'top' | 'bottom'}` | "left" | "right" | "top" | "bottom"

const cursors = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize']

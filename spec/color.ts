import test, { ExecutionContext } from 'ava'
import { colorNumberToPixelColor, colorNumberToRec, pixelColorToColorNumber, recToColorNumber } from '../src'

function check(t: ExecutionContext<unknown>, color: number) {
  t.deepEqual(recToColorNumber(colorNumberToRec(color)), color)
  t.deepEqual(pixelColorToColorNumber(colorNumberToPixelColor(color)), color)
}

test('recToColorNumber', (t) => {
  check(t, 0x000000)
  check(t, 0x000001)
  check(t, 0x000002)
  check(t, 0x0000fd)
  check(t, 0x0000fe)
  check(t, 0x0000ff)

  check(t, 0x000000)
  check(t, 0x000100)
  check(t, 0x000200)
  check(t, 0x00fd00)
  check(t, 0x00fe00)
  check(t, 0x00ff00)

  check(t, 0x000000)
  check(t, 0x010000)
  check(t, 0x020000)
  check(t, 0xfd0000)
  check(t, 0xfe0000)
  check(t, 0xff0000)

  check(t, 0x000000)
  check(t, 0x010101)
  check(t, 0x020202)
  check(t, 0xfdfdfd)
  check(t, 0xfefefe)
  check(t, 0xffffff)
})

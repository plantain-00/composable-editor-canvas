import * as React from "react"

import { useCursorInput } from ".."
import { Position, Image, blobToDataUrl } from "../../utils"
import { getImageFromCache } from "../react-render-target/image-loader"

/**
 * @public
 */
export function useImageClickCreate(
  enabled: boolean,
  onEnd: (image: Image) => void,
) {
  const [image, setImage] = React.useState<Image>()

  let message = ''
  if (enabled) {
    message = image ? 'specify image position' : 'click to select image'
  }

  const { input, setInputPosition } = useCursorInput(message)
  const { start, ui } = useChooseFile(file => {
    blobToDataUrl(file).then(base64 => {
      getImageFromCache(base64, {
        callback(image) {
          setImage({
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
            url: base64,
          })
        },
      })
    })
  })

  const reset = () => {
    setImage(undefined)
  }

  React.useEffect(() => {
    if (enabled) {
      start()
    }
  }, [enabled])

  return {
    image,
    reset,
    onClick(p: Position) {
      if (!enabled) {
        return
      }
      if (!image) {
        start()
        return
      }
      setInputPosition(p)
      onEnd(image)
      reset()
    },
    onMove(p: Position, viewportPosition?: Position) {
      setInputPosition(viewportPosition || p)
      if (image) {
        setImage({
          ...image,
          x: p.x,
          y: p.y,
        })
      }
    },
    input: (
      <>
        {ui}
        {input}
      </>
    ),
  }
}

export function useChooseFile(onChoose: (file: File) => void) {
  const ref = React.useRef<HTMLInputElement | null>(null)
  return {
    start() {
      ref.current?.click()
    },
    ui: (
      <input
        type='file'
        ref={ref}
        accept='image/*'
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.currentTarget.files?.item(0)
          if (file) {
            onChoose(file)
          }
          (e.target.value as string | null) = null
        }}
      />
    )
  }
}

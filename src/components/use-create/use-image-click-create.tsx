import * as React from "react"

import { useCursorInput } from ".."
import { Position, Image } from "../../utils"
import { getImageFromCache } from "../react-render-target/image-loader"

/**
 * @public
 */
export function useImageClickCreate(
  enabled: boolean,
  onEnd: (image: Image) => void,
) {
  const [image, setImage] = React.useState<Image>()
  const ref = React.useRef<HTMLInputElement | null>(null)

  let message = ''
  if (enabled) {
    message = image ? 'specify image position' : 'click to select image'
  }

  const { input, setInputPosition } = useCursorInput(message)

  const reset = () => {
    setImage(undefined)
  }

  React.useEffect(() => {
    if (enabled) {
      ref.current?.click()
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
        ref.current?.click()
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
        <input
          type='file'
          ref={ref}
          accept='image/*'
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.currentTarget.files?.item(0)
            if (file) {
              const reader = new FileReader()
              reader.onloadend = () => {
                const base64 = reader.result
                if (typeof base64 === 'string') {
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
                  },
                  )
                }
              }
              reader.readAsDataURL(file)
            }
            (e.target.value as string | null) = null
          }}
        />
        {input}
      </>
    ),
  }
}

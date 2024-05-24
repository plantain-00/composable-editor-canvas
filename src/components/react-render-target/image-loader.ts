import { dataUrlToImage } from "../../utils/blob"

const images = new Map<string, ImageBitmap | (() => void)[]>()

export function getImageFromCache(
  url: string,
  options?: Partial<{
    rerender: () => void,
    crossOrigin: "anonymous" | "use-credentials" | "",
    callback: (imageBitmap: ImageBitmap) => void
  }>
) {
  const image = images.get(url)
  if (!image) {
    images.set(url, [])
    dataUrlToImage(url, options?.crossOrigin).then(image => {
      createImageBitmap(image).then(imageBitmap => {
        const listeners = images.get(url)
        images.set(url, imageBitmap)
        if (Array.isArray(listeners)) {
          listeners.forEach(listener => {
            listener()
          })
        }
        options?.callback?.(imageBitmap)
        options?.rerender?.()
      })
    })
    return
  }
  if (Array.isArray(image)) {
    image.push(() => {
      options?.rerender?.()
    })
    return
  }
  options?.callback?.(image)
  return image
}

function loadImage(url: string, crossOrigin?: "anonymous" | "use-credentials" | "") {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    if (crossOrigin !== undefined) {
      image.crossOrigin = crossOrigin
    }
    image.onload = () => {
      resolve(image)
    }
    image.onerror = () => {
      reject()
    }
    image.src = url
  })
}

const images = new Map<string, ImageBitmap | (() => void)[]>()

export function getImageFromCache(
  url: string,
  rerender: () => void,
  crossOrigin?: "anonymous" | "use-credentials" | "",
  callback?: (imageBitmap: ImageBitmap) => void
) {
  const image = images.get(url)
  if (!image) {
    images.set(url, [])
    // eslint-disable-next-line plantain/promise-not-await
    loadImage(url, crossOrigin).then(image => {
      createImageBitmap(image).then(imageBitmap => {
        const listeners = images.get(url)
        images.set(url, imageBitmap)
        if (Array.isArray(listeners)) {
          listeners.forEach(listener => {
            listener()
          })
        }
        callback?.(imageBitmap)
        rerender()
      })
    })
    return
  }
  if (Array.isArray(image)) {
    image.push(() => {
      rerender()
    })
    return
  }
  callback?.(image)
  return image
}

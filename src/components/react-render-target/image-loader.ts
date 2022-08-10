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
) {
  const image = images.get(url)
  if (!image) {
    images.set(url, [])
    // eslint-disable-next-line plantain/promise-not-await
    loadImage(url, crossOrigin).then(image => {
      createImageBitmap(image).then(imageBitMap => {
        const listeners = images.get(url)
        images.set(url, imageBitMap)
        if (Array.isArray(listeners)) {
          listeners.forEach(listener => {
            listener()
          })
        }
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
  return image
}

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

const images = new Map<string, HTMLImageElement | (() => void)[]>()

export function getImageFromCache(
  url: string,
  setImageLoadStatus: React.Dispatch<React.SetStateAction<number>>,
  crossOrigin?: "anonymous" | "use-credentials" | "",
) {
  const image = images.get(url)
  if (!image) {
    images.set(url, [])
    // eslint-disable-next-line plantain/promise-not-await
    loadImage(url, crossOrigin).then(image => {
      const listeners = images.get(url)
      images.set(url, image)
      if (Array.isArray(listeners)) {
        listeners.forEach(listener => {
          listener()
        })
      }
      setImageLoadStatus(c => c + 1)
    })
    return
  }
  if (Array.isArray(image)) {
    image.push(() => {
      setImageLoadStatus(c => c + 1)
    })
    return
  }
  return image
}

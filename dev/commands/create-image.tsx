import { useImageClickCreate } from "../../src";
import { ImageContent } from "../models/image-model";
import { Command } from "./command";

export const createImageCommand: Command = {
  name: 'create image',
  useCommand({ onEnd, type }) {
    const { image, onClick, onMove, input } = useImageClickCreate(
      type === 'create image',
      (c) => onEnd({
        updateContents: (contents) => contents.push({
          type: 'image',
          ...c,
        } as ImageContent)
      }),
    )
    const assistentContents: ImageContent[] = []
    if (image) {
      assistentContents.push({
        type: 'image',
        ...image,
      })
    }
    return {
      onStart: onClick,
      input,
      onMove,
      assistentContents,
    }
  },
  selectCount: 0,
}

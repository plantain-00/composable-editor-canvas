import React from "react";
import { usePolygonClickCreate } from "../../src";
import { LineContent } from "../models/line-model";
import { PolygonContent } from "../models/polygon-model";
import { Command } from "./command";

export const createPolygonCommand: Command = {
  name: 'create polygon',
  useCommand({ onEnd, getAngleSnap, type, scale }) {
    const [createType, setCreateType] = React.useState<'point' | 'edge'>('point')
    const { polygon, onClick, onMove, input, startSetSides, startPosition, cursorPosition } = usePolygonClickCreate(
      type === 'create polygon',
      (c) => onEnd((contents) => contents.push({ points: c, type: 'polygon' } as PolygonContent)),
      {
        getAngleSnap,
        toEdge: createType === 'edge',
        setSidesKey: 'S',
        switchTypeKey: 'T',
        switchType: () => setCreateType(createType === 'edge' ? 'point' : 'edge'),
      },
    )
    const assistentContents: (LineContent | PolygonContent)[] = []
    if (startPosition && cursorPosition) {
      assistentContents.push({ type: 'line', points: [startPosition, cursorPosition], dashArray: [4 / scale] })
    }
    if (polygon) {
      assistentContents.push({ points: polygon, type: 'polygon' })
    }
    return {
      onStart: onClick,
      input,
      onMove,
      subcommand: type === 'create polygon'
        ? (
          <span>
            <button onClick={startSetSides} style={{ position: 'relative' }}>set sides(S)</button>
            <button onClick={() => setCreateType(createType === 'edge' ? 'point' : 'edge')} style={{ position: 'relative' }}>{createType}(T)</button>
          </span>
        )
        : undefined,
      assistentContents,
    }
  },
  selectCount: 0,
  hotkey: 'POL',
}

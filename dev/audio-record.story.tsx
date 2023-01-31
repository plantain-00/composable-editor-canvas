import React from "react"
import { useAudioRecorder } from "../src"

export default () => {
  const { start, stop, duration, volume, audioUrl } = useAudioRecorder()
  return (
    <div>
      {!duration ? <button onClick={start}>start</button> : null}
      {duration ? <button onClick={stop}>stop {duration}</button> : null}
      {duration && volume !== undefined ? <meter high={0.25} max="1" value={volume}></meter> : null}
      {audioUrl && <audio controls src={audioUrl}></audio>}
    </div>
  )
}

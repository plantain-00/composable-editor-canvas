import React from "react"
import { useAudioPlayer, useAudioRecorder } from "../src"

export default () => {
  const { start, stop, duration, volume, audioUrl, recording } = useAudioRecorder()
  const { play, pause, playing, currentTime, audio, duration: audioDuration } = useAudioPlayer(audioUrl)
  return (
    <div>
      {!recording ? <button onClick={start}>start</button> : null}
      {recording ? <button onClick={stop}>stop {duration}</button> : null}
      {recording && volume !== undefined ? <meter max="1" value={volume}></meter> : null}
      {audioUrl && (
        <>
          <button onClick={playing ? pause : play}>{playing ? 'pause' : 'play'}</button>
          {currentTime}/{audioDuration}
          {audio}
        </>
      )}
    </div>
  )
}

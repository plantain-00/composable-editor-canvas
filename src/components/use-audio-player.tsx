import React from "react"

export function useAudioPlayer(url?: string) {
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const ref = React.useRef<HTMLAudioElement | null>(null)
  return {
    currentTime,
    duration,
    playing,
    play() {
      if (!ref.current) return
      ref.current.play()
      setPlaying(true)
    },
    pause() {
      if (!ref.current) return
      ref.current.pause()
      setPlaying(false)
    },
    audio: url && (
      <audio
        onTimeUpdate={() => {
          if (ref.current) {
            setCurrentTime(ref.current.currentTime)
          }
        }}
        onEnded={() => {
          setPlaying(false)
        }}
        preload="auto"
        onDurationChange={() => {
          if (ref.current) {
            setDuration(ref.current.duration)
          }
        }}
        ref={ref}
        src={url}
      />
    ),
  }
}

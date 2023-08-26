import React from "react"

export function useAudioRecorder() {
  const mediaRecorder = React.useRef<MediaRecorder>()
  const timer = React.useRef<NodeJS.Timeout>()
  const analyser = React.useRef<AnalyserNode>()

  const [audioUrl, setAudioUrl] = React.useState<string>()
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState<number>()
  const [recording, setRecording] = React.useState(false)
  const chunks = React.useRef<Blob[]>([])

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    mediaRecorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data)
    }

    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    analyser.current = audioCtx.createAnalyser()
    source.connect(analyser.current)

    const now = Date.now()
    timer.current = setInterval(() => {
      setDuration(Date.now() - now)
      if (analyser.current) {
        const pcmData = new Float32Array(analyser.current.fftSize)
        analyser.current.getFloatTimeDomainData(pcmData)
        let max = 0
        for (const amplitude of pcmData) {
          max = Math.max(max, Math.abs(amplitude))
        }
        setVolume(Math.min(max * 2, 1))
      }
    }, 20)

    setAudioUrl(undefined)
    setDuration(0)
    chunks.current = []
    setRecording(true)

    mediaRecorder.current.start(100)
  }
  const stop = () => {
    if (!mediaRecorder.current) return
    mediaRecorder.current.stop()
    mediaRecorder.current.stream.getAudioTracks().forEach(track => {
      track.stop()
    })

    if (timer.current) {
      clearInterval(timer.current)
      timer.current = undefined
    }
    setVolume(undefined)
    setRecording(false)

    setAudioUrl(window.URL.createObjectURL(new Blob(chunks.current, { type: "audio/ogg; codecs=opus" })))
  }

  return {
    audioUrl,
    duration,
    volume,
    start,
    stop,
    recording,
    chunks: chunks.current
  }
}

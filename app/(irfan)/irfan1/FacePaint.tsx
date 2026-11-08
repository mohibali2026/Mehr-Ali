'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import styles from './facepaint.module.css'

// Everything runs in the browser: the face tracker (MediaPipe) is downloaded once,
// and the camera picture never leaves the device.
const MP_VERSION = '0.10.35'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

// Size of the drawing canvas. The drawing is also the picture that gets wrapped onto the face.
const TEX = 1024
// Points in the face mesh (the iris points that come after these are not part of it)
const MESH_POINTS = 468

const COLORS = ['#ffffff', '#111111', '#e84025', '#ffcc00', '#1faa59', '#2f7bff', '#ff5fa2', '#8a5cff']
const SIZES = [
  { label: 'S', px: 10 },
  { label: 'M', px: 24 },
  { label: 'L', px: 52 },
]
const LOOKS = [
  { id: 'paint', label: 'Paint' },
  { id: 'tattoo', label: 'Tattoo' },
  { id: 'glow', label: 'Glow' },
] as const
type Look = (typeof LOOKS)[number]['id']
const LOOK_CLASS: Record<Look, string> = { paint: '', tattoo: styles.tattoo, glow: styles.glow }

type Stroke = { color: string; size: number; erase: boolean; pts: number[] }
type Edge = { start: number; end: number }
type Status = 'starting' | 'ready' | 'error'
type Template = { uv: Float32Array; tris: Uint16Array }

// The mesh only comes as a list of lines, so find every three points that are all joined to each other.
function buildTriangles(edges: Edge[]) {
  const near = Array.from({ length: MESH_POINTS }, () => new Set<number>())
  for (const { start, end } of edges) {
    near[start].add(end)
    near[end].add(start)
  }
  const tris: number[][] = []
  for (let a = 0; a < MESH_POINTS; a++)
    for (const b of near[a])
      if (b > a) for (const c of near[b]) if (c > b && near[a].has(c)) tris.push([a, b, c])
  return tris
}

// Looking straight at the camera: the nose tip sits in the middle between the two cheeks.
function isFrontal(lm: NormalizedLandmark[]) {
  const r = (lm[1].x - lm[234].x) / (lm[454].x - lm[234].x)
  return r > 0.42 && r < 0.58
}

// Turns one straight-on camera frame into the face guide on the right.
// Each mesh point gets a fixed spot on the drawing canvas; that spot is what gets painted onto it later.
function learnFace(
  lm: NormalizedLandmark[],
  video: HTMLVideoElement,
  guide: HTMLCanvasElement,
  tris: number[][],
  mesh: Edge[],
  features: Edge[],
): Template {
  const vw = video.videoWidth
  const vh = video.videoHeight
  // Mirrored, so the guide matches the selfie view on the left
  const x = (i: number) => (1 - lm[i].x) * vw
  const y = (i: number) => lm[i].y * vh

  // Turn the face so the eyes sit level
  let ax = x(33), ay = y(33), bx = x(263), by = y(263)
  if (ax > bx) [ax, ay, bx, by] = [bx, by, ax, ay]
  const angle = -Math.atan2(by - ay, bx - ax)
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i < MESH_POINTS; i++) {
    const rx = c * x(i) - s * y(i)
    const ry = s * x(i) + c * y(i)
    minX = Math.min(minX, rx); maxX = Math.max(maxX, rx)
    minY = Math.min(minY, ry); maxY = Math.max(maxY, ry)
  }
  const k = (TEX * 0.82) / Math.max(maxX - minX, maxY - minY)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const m = [k * c, k * s, -k * s, k * c, TEX / 2 - k * cx, TEX / 2 - k * cy] as const

  const px = new Float32Array(MESH_POINTS * 2)
  for (let i = 0; i < MESH_POINTS; i++) {
    px[i * 2] = m[0] * x(i) + m[2] * y(i) + m[4]
    px[i * 2 + 1] = m[1] * x(i) + m[3] * y(i) + m[5]
  }

  // Wind every triangle the same way while the face is straight on,
  // so triangles that turn away from the camera later can be hidden.
  const order = new Uint16Array(tris.length * 3)
  tris.forEach(([a, b, t], n) => {
    const cross = (lm[b].x - lm[a].x) * (lm[t].y - lm[a].y) - (lm[b].y - lm[a].y) * (lm[t].x - lm[a].x)
    order.set(cross > 0 ? [a, t, b] : [a, b, t], n * 3)
  })

  // Guide: a faint photo of the face, then the mesh and the eyes, brows, lips and outline on top
  const g = guide.getContext('2d')!
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.clearRect(0, 0, TEX, TEX)
  g.save()
  g.beginPath()
  for (const [a, b, t] of tris) {
    g.moveTo(px[a * 2], px[a * 2 + 1])
    g.lineTo(px[b * 2], px[b * 2 + 1])
    g.lineTo(px[t * 2], px[t * 2 + 1])
    g.closePath()
  }
  g.clip()
  g.globalAlpha = 0.55
  g.setTransform(...m)
  g.translate(vw, 0)
  g.scale(-1, 1)
  g.drawImage(video, 0, 0, vw, vh)
  g.restore()

  const lines = (edges: Edge[], style: string, width: number) => {
    g.beginPath()
    for (const { start, end } of edges) {
      g.moveTo(px[start * 2], px[start * 2 + 1])
      g.lineTo(px[end * 2], px[end * 2 + 1])
    }
    g.strokeStyle = style
    g.lineWidth = width
    g.stroke()
  }
  lines(mesh, 'rgba(255,255,255,0.07)', 1)
  lines(features, 'rgba(255,255,255,0.4)', 2.5)

  return { uv: px.map((v) => v / TEX), tris: order }
}

// Draws the drawing onto the face with WebGL: each mesh triangle shows its piece of the drawing.
function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true })
  if (!gl) return null

  const shader = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    return sh
  }
  const program = gl.createProgram()!
  gl.attachShader(program, shader(gl.VERTEX_SHADER, `
    attribute vec3 aPos;
    attribute vec2 aUV;
    varying vec2 vUV;
    void main() {
      gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, aPos.z, 1.0);
      vUV = aUV;
    }`))
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUV;
    uniform sampler2D uTex;
    void main() { gl_FragColor = texture2D(uTex, vUV); }`))
  gl.linkProgram(program)
  gl.useProgram(program)

  const aPos = gl.getAttribLocation(program, 'aPos')
  const aUV = gl.getAttribLocation(program, 'aUV')
  const pos = new Float32Array(MESH_POINTS * 3)
  const posBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
  gl.bufferData(gl.ARRAY_BUFFER, pos.byteLength, gl.DYNAMIC_DRAW)
  const uvBuf = gl.createBuffer()
  const idxBuf = gl.createBuffer()
  let count = 0

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // Closer points have a smaller z, so the nose hides the cheek behind it when the head turns
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  return {
    setTemplate(t: Template) {
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf)
      gl.bufferData(gl.ARRAY_BUFFER, t.uv, gl.STATIC_DRAW)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, t.tris, gl.STATIC_DRAW)
      count = t.tris.length
    },
    setDrawing(src: HTMLCanvasElement) {
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
      gl.generateMipmap(gl.TEXTURE_2D)
    },
    draw(lm: NormalizedLandmark[] | null) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      if (!lm || !count) return
      for (let i = 0; i < MESH_POINTS; i++) {
        pos[i * 3] = lm[i].x
        pos[i * 3 + 1] = lm[i].y
        pos[i * 3 + 2] = lm[i].z
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf)
      gl.enableVertexAttribArray(aUV)
      gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf)
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0)
    },
    // The canvas keeps its WebGL context for the next start (Try again), so only free what we made
    dispose() {
      gl.deleteBuffer(posBuf)
      gl.deleteBuffer(uvBuf)
      gl.deleteBuffer(idxBuf)
      gl.deleteTexture(tex)
      gl.deleteProgram(program)
    },
  }
}

function cameraError(err: unknown) {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError') return 'The camera is blocked. Allow the camera for this site, then tap Try again.'
  if (name === 'NotFoundError') return 'No camera was found on this device.'
  if (name === 'NotReadableError') return 'Another app is using the camera. Close it, then tap Try again.'
  return `Something went wrong: ${err instanceof Error ? err.message : String(err)}`
}

export default function FacePaint() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const maskRef = useRef<HTMLCanvasElement>(null)
  const guideRef = useRef<HTMLCanvasElement>(null)
  const inkRef = useRef<HTMLCanvasElement>(null)

  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const inkChangedRef = useRef(true)
  const relearnRef = useRef(false)

  const [status, setStatus] = useState<Status>('starting')
  const [message, setMessage] = useState('Starting camera…')
  const [attempt, setAttempt] = useState(0)
  const [faceSeen, setFaceSeen] = useState(false)
  const [hasFace, setHasFace] = useState(false)
  const [learning, setLearning] = useState(true)
  const [color, setColor] = useState(COLORS[2])
  const [size, setSize] = useState(SIZES[1].px)
  const [eraser, setEraser] = useState(false)
  const [look, setLook] = useState<Look>('paint')
  const [strokeCount, setStrokeCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let landmarker: FaceLandmarker | null = null
    let raf = 0
    const video = videoRef.current!
    const mask = maskRef.current!
    const guide = guideRef.current!
    const ink = inkRef.current!
    const renderer = createRenderer(mask)

    async function run() {
      if (!renderer) throw new Error('This browser cannot draw 3D graphics (WebGL).')
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot open the camera.')
      setStatus('starting')
      setMessage('Starting camera…')
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      if (cancelled) return
      video.srcObject = stream
      await video.play()

      setMessage('Loading face tracker…')
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const files = await FilesetResolver.forVisionTasks(WASM_URL)
      const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO' as const,
        numFaces: 1,
      })
      try {
        landmarker = await FaceLandmarker.createFromOptions(files, options('GPU'))
      } catch {
        landmarker = await FaceLandmarker.createFromOptions(files, options('CPU'))
      }
      if (cancelled) return landmarker.close()

      const mesh = FaceLandmarker.FACE_LANDMARKS_TESSELATION
      const features = FaceLandmarker.FACE_LANDMARKS_CONTOURS
      const tris = buildTriangles(mesh)
      const tracker = landmarker
      setStatus('ready')

      let lastTime = -1
      let seen = false
      let learned = false
      let frontal = 0
      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (video.readyState < 2 || video.currentTime === lastTime) return
        lastTime = video.currentTime
        if (mask.width !== video.videoWidth || mask.height !== video.videoHeight) {
          mask.width = video.videoWidth
          mask.height = video.videoHeight
        }

        const lm = tracker.detectForVideo(video, performance.now()).faceLandmarks[0] ?? null
        if (!!lm !== seen) {
          seen = !!lm
          setFaceSeen(seen)
        }

        // Wait for about half a second of looking straight at the camera before learning the face
        if (lm && (!learned || relearnRef.current)) {
          frontal = isFrontal(lm) ? frontal + 1 : 0
          if (frontal >= 12) {
            renderer!.setTemplate(learnFace(lm, video, guide, tris, mesh, features))
            learned = true
            relearnRef.current = false
            frontal = 0
            setHasFace(true)
            setLearning(false)
          }
        }

        if (inkChangedRef.current) {
          renderer!.setDrawing(ink)
          inkChangedRef.current = false
        }
        renderer!.draw(learned ? lm : null)
      }
      loop()
    }

    run().catch((err) => {
      if (cancelled) return
      setStatus('error')
      setMessage(cameraError(err))
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      landmarker?.close()
      renderer?.dispose()
    }
  }, [attempt])

  const redrawInk = useCallback(() => {
    const ctx = inkRef.current!.getContext('2d')!
    ctx.clearRect(0, 0, TEX, TEX)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokesRef.current) {
      ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
      ctx.strokeStyle = ctx.fillStyle = s.color
      ctx.lineWidth = s.size
      const p = s.pts
      ctx.beginPath()
      if (p.length === 2) {
        ctx.arc(p[0], p[1], s.size / 2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      // Smooth curve through the middle of each pair of points
      ctx.moveTo(p[0], p[1])
      for (let i = 2; i < p.length - 2; i += 2)
        ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2)
      ctx.lineTo(p[p.length - 2], p[p.length - 1])
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
    inkChangedRef.current = true
  }, [])

  const toCanvas = (e: PointerEvent, el: HTMLCanvasElement) => {
    const r = el.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * TEX, ((e.clientY - r.top) / r.height) * TEX]
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!hasFace) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const stroke = { color, size, erase: eraser, pts: toCanvas(e.nativeEvent, e.currentTarget) }
    drawingRef.current = stroke
    strokesRef.current.push(stroke)
    redrawInk()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = drawingRef.current
    if (!s) return
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const [x, y] = toCanvas(ev, e.currentTarget)
      const n = s.pts.length
      if (Math.hypot(x - s.pts[n - 2], y - s.pts[n - 1]) >= 2) s.pts.push(x, y)
    }
    redrawInk()
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = null
    setStrokeCount(strokesRef.current.length)
  }

  const undo = () => {
    strokesRef.current.pop()
    setStrokeCount(strokesRef.current.length)
    redrawInk()
  }

  const clear = () => {
    strokesRef.current = []
    setStrokeCount(0)
    redrawInk()
  }

  const relearn = () => {
    relearnRef.current = true
    setLearning(true)
  }

  const takePhoto = () => {
    const video = videoRef.current!
    const out = document.createElement('canvas')
    out.width = video.videoWidth
    out.height = video.videoHeight
    const ctx = out.getContext('2d')!
    ctx.translate(out.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    if (look === 'tattoo') {
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.9
    } else if (look === 'glow') {
      ctx.globalCompositeOperation = 'screen'
      ctx.shadowColor = 'rgba(255,255,255,0.75)'
      ctx.shadowBlur = 14
    }
    ctx.drawImage(maskRef.current!, 0, 0)

    out.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'irfan-face-paint.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  return (
    <main className={styles.app}>
      <section className={styles.camera}>
        <video ref={videoRef} className={styles.video} playsInline muted />
        <canvas ref={maskRef} className={`${styles.mask} ${LOOK_CLASS[look]}`} />

        <header className={styles.head}>
          <p className={styles.eyebrow}>{"// Irfan's Face Paint"}</p>
          <p className={styles.note}>Your camera stays on this device. Nothing is uploaded.</p>
        </header>

        {status !== 'ready' && (
          <div className={styles.status}>
            <p>{message}</p>
            {status === 'error' && (
              <button className={`${styles.btn} ${styles.primary}`} onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </button>
            )}
          </div>
        )}
        {status === 'ready' && !faceSeen && <p className={styles.hint}>Show your face to the camera</p>}
        {status === 'ready' && faceSeen && learning && <p className={styles.hint}>Look straight at the camera…</p>}

        <div className={styles.bar}>
          <div className={styles.group}>
            {LOOKS.map((l, i) => (
              <button
                key={i}
                className={`${styles.btn} ${look === l.id ? styles.on : ''}`}
                onClick={() => setLook(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className={styles.group}>
            <button className={styles.btn} onClick={relearn} disabled={!hasFace || learning}>
              New face
            </button>
            <button className={`${styles.btn} ${styles.primary}`} onClick={takePhoto} disabled={status !== 'ready'}>
              Photo
            </button>
          </div>
        </div>
      </section>

      <section className={styles.studio}>
        <p className={styles.eyebrow}>{'// Draw here'}</p>
        <div className={styles.stage}>
          <div className={styles.square}>
            <canvas ref={guideRef} width={TEX} height={TEX} className={styles.layer} />
            <canvas
              ref={inkRef}
              width={TEX}
              height={TEX}
              className={`${styles.layer} ${styles.ink}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
            {!hasFace && (
              <p className={styles.waiting}>
                Look straight at the camera.
                <br />
                Your face will appear here.
              </p>
            )}
          </div>
        </div>

        <div className={styles.tools}>
          <div className={styles.group}>
            {COLORS.map((c, i) => (
              <button
                key={i}
                aria-label={`Color ${c}`}
                className={`${styles.swatch} ${!eraser && color === c ? styles.swatchOn : ''}`}
                style={{ background: c }}
                onClick={() => {
                  setColor(c)
                  setEraser(false)
                }}
              />
            ))}
          </div>
          <div className={styles.group}>
            {SIZES.map((s, i) => (
              <button
                key={i}
                className={`${styles.btn} ${styles.round} ${size === s.px ? styles.on : ''}`}
                onClick={() => setSize(s.px)}
              >
                {s.label}
              </button>
            ))}
            <button className={`${styles.btn} ${eraser ? styles.on : ''}`} onClick={() => setEraser((v) => !v)}>
              Eraser
            </button>
            <button className={styles.btn} onClick={undo} disabled={!strokeCount}>
              Undo
            </button>
            <button className={styles.btn} onClick={clear} disabled={!strokeCount}>
              Clear
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

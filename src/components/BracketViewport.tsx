import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface BracketViewportProps {
  layoutWidth: number
  layoutHeight: number
  children: ReactNode
}

interface ViewportState {
  zoom: number
  showDetails: boolean
  showMedium: boolean
}

const ViewportContext = createContext<ViewportState>({ zoom: 1, showDetails: true, showMedium: true })

export function useBracketZoom() {
  return useContext(ViewportContext)
}

const MIN_ZOOM = 0.2
const MAX_ZOOM = 2
const DEFAULT_ZOOM = 0.45

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function BracketViewport({ layoutWidth, layoutHeight, children }: BracketViewportProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [pan, setPan] = useState({ x: 24, y: 24 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const isPanningRef = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const showDetails = zoom >= 0.55
  const showMedium = zoom >= 0.42

  function isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false
    return !!target.closest('button, input, textarea, a, select, [data-interactive]')
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges()
  }

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const fitToScreen = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const pad = 40
    const zw = (el.clientWidth - pad) / layoutWidth
    const zh = (el.clientHeight - pad) / layoutHeight
    const next = clamp(Math.min(zw, zh), MIN_ZOOM, 0.85)
    setZoom(next)
    setPan({ x: 20, y: 20 })
  }, [layoutWidth, layoutHeight])

  useEffect(() => {
    const t = setTimeout(fitToScreen, 100)
    return () => clearTimeout(t)
  }, [fitToScreen, isFullscreen])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.07 : 0.07
      setZoom((z) => clamp(z + delta, MIN_ZOOM, MAX_ZOOM))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const toggleFullscreen = async () => {
    const el = shellRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      await el.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    if (isInteractiveTarget(e.target)) return

    e.preventDefault()
    clearSelection()
    isPanningRef.current = true
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    e.preventDefault()
    clearSelection()
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    })
  }

  const endPan = () => {
    isPanningRef.current = false
    setIsPanning(false)
    clearSelection()
  }

  const onPointerUp = () => endPan()

  const canvasW = layoutWidth * zoom + pan.x + 48
  const canvasH = layoutHeight * zoom + pan.y + 48

  return (
    <ViewportContext.Provider value={{ zoom, showDetails, showMedium }}>
      <div
        ref={shellRef}
        className={`flex flex-col rounded-lg border border-border bg-surface-1/40 overflow-hidden w-full min-w-0 max-w-full ${
          isFullscreen ? 'fixed inset-0 z-[200] rounded-none border-0 bg-surface-1' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-surface-2/90 shrink-0">
          <span className="text-xs font-semibold text-text-primary mr-1">Mapa interativo</span>

          <div className="flex items-center gap-1 bg-surface-1 border border-border rounded-md p-0.5">
            <ViewportBtn onClick={() => setZoom((z) => clamp(z - 0.1, MIN_ZOOM, MAX_ZOOM))} title="Diminuir (visão ampla)">
              −
            </ViewportBtn>
            <span className="text-xs font-mono text-text-primary w-11 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <ViewportBtn onClick={() => setZoom((z) => clamp(z + 0.1, MIN_ZOOM, MAX_ZOOM))} title="Aumentar (mais detalhe)">
              +
            </ViewportBtn>
          </div>

          <ViewportBtn onClick={fitToScreen}>Ajustar à tela</ViewportBtn>
          <ViewportBtn onClick={() => { setZoom(1); setPan({ x: 24, y: 24 }) }}>100%</ViewportBtn>

          <div className="flex-1 min-w-[8px]" />

          <ViewportBtn onClick={toggleFullscreen} active={isFullscreen}>
            {isFullscreen ? '⊠ Sair' : '⛶ Tela cheia'}
          </ViewportBtn>
        </div>

        <p className="text-[10px] text-text-tertiary px-3 py-1 border-b border-border-subtle shrink-0 select-none">
          Scroll = zoom · arraste no fundo para mover · clique no placar para editar
        </p>

        <div
          ref={scrollRef}
          className={`flex-1 overflow-auto overscroll-contain relative w-full min-w-0 max-w-full bg-[radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] bg-[size:20px_20px] bg-surface-1/20 select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            minHeight: isFullscreen ? '100%' : 440,
            maxHeight: isFullscreen ? '100%' : '78vh',
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onDragStart={(e) => e.preventDefault()}
        >
          <div style={{ width: canvasW, height: canvasH, position: 'relative' }} className="select-none">
            <div
              className="absolute top-0 left-0 origin-top-left select-none [&_input]:select-text [&_textarea]:select-text"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                width: layoutWidth,
                height: layoutHeight,
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </ViewportContext.Provider>
  )
}

function ViewportBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode
  onClick: () => void
  title?: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? 'bg-brand text-white'
          : 'bg-surface-1 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-3'
      }`}
    >
      {children}
    </button>
  )
}

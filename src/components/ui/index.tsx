import { useEffect, useState, type ReactNode } from 'react'
import { resolveFlagUrls } from '../../lib/flags'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const pad = { sm: 'p-4', md: 'p-5', lg: 'p-6' }[padding]
  return (
    <div className={`bg-surface-2 border border-border rounded-lg ${pad} min-w-0 ${className}`}>
      {children}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

interface BadgeProps {
  children: ReactNode
  color?: string
  variant?: 'solid' | 'outline'
}

export function Badge({ children, color = '#4f8ff7', variant = 'outline' }: BadgeProps) {
  if (variant === 'solid') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: color }}>
        {children}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}
    >
      {children}
    </span>
  )
}

interface KpiCardProps {
  label: string
  value: string
  sublabel?: string
  trend?: number
  help?: { title: string; body: ReactNode }
}

export function KpiCard({ label, value, sublabel, trend, help }: KpiCardProps) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <>
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{label}</div>
          {help && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-border text-[10px] font-semibold text-text-tertiary hover:text-text-primary hover:border-brand/50 hover:bg-brand/10 transition-colors"
              aria-label={`Explicação: ${label}`}
            >
              ?
            </button>
          )}
        </div>
        <div className="text-2xl font-semibold font-mono text-text-primary">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {sublabel && <span className="text-xs text-text-secondary">{sublabel}</span>}
          {trend !== undefined && trend !== 0 && (
            <span className={`text-xs font-mono font-medium ${trend > 0 ? 'text-positive' : 'text-negative'}`}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      {help && (
        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} title={help.title}>
          {help.body}
        </HelpModal>
      )}
    </>
  )
}

interface HelpModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function HelpModal({ open, onClose, title, children }: HelpModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-md bg-surface-2 border border-border rounded-lg shadow-xl p-5 animate-enter">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 id="help-modal-title" className="text-sm font-semibold text-text-primary pr-4">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-text-tertiary hover:text-text-primary text-lg leading-none px-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-text-secondary leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  )
}

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  className?: string
}

export function Button({ children, onClick, disabled, variant = 'primary', className = '' }: ButtonProps) {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const styles = variant === 'primary'
    ? 'bg-brand text-white hover:bg-brand-muted'
    : 'bg-surface-3 border border-border text-text-primary hover:bg-surface-2'

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}

interface FlagProps {
  iso: string
  name: string
  size?: number
}

export function Flag({ iso, name, size = 24 }: FlagProps) {
  const [failed, setFailed] = useState(false)
  const { svg, png } = resolveFlagUrls(iso, size)
  const height = Math.round(size * 0.75)

  if (failed) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-sm bg-surface-3 border border-border text-[10px] font-mono font-semibold text-text-tertiary shrink-0 uppercase"
        style={{ width: size, height }}
        title={name}
        aria-label={name}
      >
        {iso.slice(0, 2)}
      </span>
    )
  }

  return (
    <img
      src={svg}
      alt={`Bandeira ${name}`}
      width={size}
      height={height}
      className="rounded-sm object-cover shrink-0 bg-surface-3"
      style={{ width: size, height }}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget
        if (img.src !== png) {
          img.src = png
        } else {
          setFailed(true)
        }
      }}
    />
  )
}

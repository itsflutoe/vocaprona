import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  src?: string | null
  alt?: string
  /** Shown when no src or load fails */
  fallback?: ReactNode
  className?: string
  /** Max height so tall images don't dominate (px). Default 360 */
  maxHeight?: number
}

/**
 * Container follows the image's natural aspect ratio (clamped).
 * Use on play/editor/preview cards — NOT on My games / Library grids (those stay square).
 */
export function AdaptiveImage({
  src,
  alt = '',
  fallback,
  className = '',
  maxHeight = 360,
}: Props) {
  const [ratio, setRatio] = useState(1)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setFailed(false)
    setReady(false)
    setRatio(1)
  }, [src])

  const url = src?.trim()
  const showImg = url && !failed

  return (
    <div
      className={`mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-slate-100 ${className}`}
      style={{
        aspectRatio: String(ratio),
        maxHeight,
      }}
    >
      {showImg ? (
        <img
          src={url}
          alt={alt}
          className={`h-full w-full object-contain transition-opacity ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              // Clamp extreme ratios so UI stays usable
              const r = img.naturalWidth / img.naturalHeight
              setRatio(Math.min(2.5, Math.max(0.55, r)))
            }
            setReady(true)
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full min-h-[8rem] items-center justify-center text-5xl text-slate-300">
          {fallback ?? '🎤'}
        </div>
      )}
    </div>
  )
}

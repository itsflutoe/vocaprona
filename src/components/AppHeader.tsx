import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  variant?: 'light' | 'dark'
  right?: ReactNode
}

export function AppHeader({ variant = 'light', right }: Props) {
  const dark = variant === 'dark'
  return (
    <header
      className={
        dark
          ? 'border-b border-white/10 bg-slate-950/95'
          : 'border-b border-slate-200/80 bg-white/90 backdrop-blur'
      }
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          to="/"
          className={`text-lg font-bold tracking-tight ${
            dark ? 'text-teal-400' : 'text-teal-700'
          }`}
        >
          VocaProna
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">{right}</div>
      </div>
    </header>
  )
}

export function headerLink(dark: boolean, active?: boolean) {
  if (dark) {
    return active
      ? 'rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-white/10'
      : 'rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5'
  }
  return active
    ? 'rounded-lg px-3 py-1.5 text-sm font-medium text-teal-800 bg-teal-50'
    : 'rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50'
}

export function headerBtnPrimary(dark: boolean) {
  return dark
    ? 'rounded-lg bg-teal-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-teal-400'
    : 'rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700'
}

export function headerBtnGhost(dark: boolean) {
  return dark
    ? 'rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5'
    : 'rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50'
}

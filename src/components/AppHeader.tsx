import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  variant?: 'light' | 'dark'
  right?: ReactNode
}

/**
 * Fixed-height bar: logo left, actions right, vertically centered.
 * max-w-6xl matches main content so columns line up page to page.
 */
export function AppHeader({ variant = 'light', right }: Props) {
  const dark = variant === 'dark'
  return (
    <header
      className={
        dark
          ? 'sticky top-0 z-40 border-b border-white/10 bg-slate-950'
          : 'sticky top-0 z-40 border-b border-slate-200 bg-white'
      }
    >
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr] items-center gap-4 px-4">
        <Link
          to="/"
          className={`shrink-0 self-center text-lg font-bold leading-none tracking-tight ${
            dark ? 'text-teal-400' : 'text-teal-700'
          }`}
        >
          VocaProna
        </Link>
        <nav className="flex min-w-0 items-center justify-end gap-x-1 gap-y-0 sm:gap-x-2">
          {right}
        </nav>
      </div>
    </header>
  )
}

const baseLink =
  'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-sm sm:px-3'

export function headerLink(dark: boolean, active?: boolean) {
  if (dark) {
    return active
      ? `${baseLink} font-medium text-white bg-white/10`
      : `${baseLink} text-slate-400 hover:bg-white/5 hover:text-white`
  }
  return active
    ? `${baseLink} font-medium text-teal-800 bg-teal-50`
    : `${baseLink} text-slate-600 hover:bg-slate-50 hover:text-slate-900`
}

export function headerBtnPrimary(dark: boolean) {
  return dark
    ? `${baseLink} bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400`
    : `${baseLink} bg-teal-600 font-semibold text-white hover:bg-teal-700`
}

export function headerBtnGhost(dark: boolean) {
  return dark
    ? `${baseLink} border border-white/15 text-slate-300 hover:bg-white/5`
    : `${baseLink} border border-slate-200 text-slate-700 hover:bg-slate-50`
}

import { ICON_MAP, DEFAULT_ICON } from '../constants/icon-map'
import { SIDEBAR_ICON_CLASS } from '../constants/classes'

/**
 * Component untuk render icon berdasarkan icon name
 * Fallback ke default icon jika tidak ditemukan
 */
export function NavIcon({ name }: { name?: string }) {
  if (!name) return null

  const Icon = ICON_MAP[name] ?? DEFAULT_ICON
  return <Icon className={SIDEBAR_ICON_CLASS} />
}

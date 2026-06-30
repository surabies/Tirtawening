import {
  BarChartIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CameraIcon,
  ClipboardIcon,
  DatabaseIcon,
  DropletIcon,
  FileDownIcon,
  FilePlusIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  ScissorsIcon,
  SettingsIcon,
  UserCogIcon,
  UsersIcon,
  MapIcon,
} from 'lucide-react'

/**
 * Mapping icon name ke Lucide React component
 * Setiap item di NavItem.icon akan dipetakan ke sini
 * Fallback ke BookOpenIcon jika icon tidak ditemukan
 */
export const ICON_MAP: Record<string, React.ElementType> = {
  dashboard: LayoutDashboardIcon,
  'chart-bar': BarChartIcon,
  users: UsersIcon,
  'file-plus': FilePlusIcon,
  scissors: ScissorsIcon,
  clipboard: ClipboardIcon,
  camera: CameraIcon,
  'calendar-check': CalendarCheckIcon,
  receipt: ReceiptIcon,
  receiptText: ReceiptIcon,
  droplet: DropletIcon,
  fileText: FileTextIcon,
  fileDown: FileDownIcon,
  userCog: UserCogIcon,
  database: DatabaseIcon,
  settings: SettingsIcon,
  peta: MapIcon,
  map: MapIcon,
}

export const DEFAULT_ICON = BookOpenIcon

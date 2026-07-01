import { useNavigate } from '@tanstack/react-router'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || ''
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

export function UserMenu() {
  const { data, isPending } = authClient.useSession()
  const navigate = useNavigate()

  if (isPending) {
    return <Skeleton className="h-8 w-8 rounded-full shrink-0" />
  }

  const user = data?.user
  if (!user) return null

  const initials = getInitials(user.name, user.email)

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          aria-label="Menu akun"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
            <AvatarFallback className="text-[11px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">
            {user.name || 'Pengguna'}
          </span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* FIX: Menghapus asChild dan mengganti aksi navigasi menggunakan onClick bawaan dropdown */}
        <DropdownMenuItem 
  onClick={() => navigate({ to: '/dashboard/profil' as any })} 
  className="gap-2 cursor-pointer"
>
  <UserIcon className="h-4 w-4" />
  Profil Saya
</DropdownMenuItem>

<DropdownMenuItem 
  onClick={() => navigate({ to: '/dashboard/pengaturan' as any })} 
  className="gap-2 cursor-pointer"
>
  <Settings className="h-4 w-4" />
  Pengaturan
</DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
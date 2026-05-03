'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Target, Megaphone, CheckSquare, BarChart2, Settings, LogOut, ChevronsUpDown, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import ThemeToggle from '@/components/ThemeToggle'
import useAuthStore from '@/store/authStore'
import useWorkspaceStore from '@/store/workspaceStore'
import useNotificationStore from '@/store/notificationStore'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dashboard/action-items', label: 'Action Items', icon: CheckSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspaceStore()
  const accentColor = activeWorkspace?.accentColor || '#6366f1'
  const { notifications, unreadCount, markAllRead } = useNotificationStore()


  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="w-60 border-r bg-card flex flex-col h-screen shrink-0">

      {/* Workspace switcher */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex-1 justify-between px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-5 h-5 rounded shrink-0"
                    style={{ backgroundColor: activeWorkspace?.accentColor || '#6366f1' }}
                  />
                  <span className="text-sm font-medium truncate">
                    {activeWorkspace?.name || 'Select workspace'}
                  </span>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {workspaces.map(w => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => switchWorkspace(w.id)}
                  className="flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: w.accentColor }} />
                  <span className="truncate">{w.name}</span>
                  {w.id === activeWorkspace?.id && (
                    <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/workspaces/create')}>
                + New workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push('/dashboard/settings/workspace')}
            title="Workspace Settings"
            style={{ color: accentColor }}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}>
              <Button
                variant={active ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2.5 h-8 px-2 text-sm"
                style={active ? { backgroundColor: `${accentColor}20`, color: accentColor } : {}}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Button>
            </Link>
          )
        })}
      </nav>
      <div className="px-2 mb-1">
        <Popover onOpenChange={(open) => { if (open) markAllRead() }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2.5 h-8 px-2 text-sm relative">
              <Bell className="h-4 w-4 shrink-0" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-72 p-0">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">Notifications</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No notifications yet
                </p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-3 py-2.5 border-b last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <p className="text-xs">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Bottom: theme + user */}
      <div className="p-3 border-t space-y-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 px-2 h-9">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="h-4 w-4 mr-2" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings/workspace')}>
              <Settings className="h-4 w-4 mr-2" /> Workspace Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

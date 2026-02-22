import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useCustomAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { NAV_SECTIONS } from '@/lib/constants';
import {
  LayoutDashboard, PhoneCall, TrendingUp, CalendarCheck,
  Radio, History, LogOut, ChevronLeft, ChevronRight, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, PhoneCall, TrendingUp, CalendarCheck,
  Radio, History, Settings,
};

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { collapsed, toggle } = useSidebar();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <span className="text-lg">🏠</span>
            <div>
              <span className="font-bold text-base text-sidebar-accent-foreground">Alex AI</span>
              <p className="text-[11px] text-sidebar-primary leading-none">Berkshire Hathaway</p>
            </div>
          </Link>
        )}
        <Button
          variant="ghost" size="icon"
          className={cn('h-7 w-7 text-sidebar-foreground hover:text-sidebar-accent-foreground', collapsed && 'mx-auto')}
          onClick={toggle}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Live indicator */}
      {!collapsed && (
        <div className="flex items-center gap-2 px-5 py-3">
          <span className="w-2 h-2 rounded-full bg-primary pulse-live" />
          <span className="text-xs text-sidebar-primary font-medium">Live</span>
        </div>
      )}

      {/* Nav sections */}
      <nav className="flex-1 px-2 py-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-sidebar-foreground/50 uppercase">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon];
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn('nav-item', active && 'active', collapsed && 'justify-center px-2')}
                    title={collapsed ? item.name : undefined}
                  >
                    {Icon && <Icon className="h-[18px] w-[18px] flex-shrink-0" />}
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings + User */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <Link
          to="/dashboard/settings"
          className={cn('nav-item', isActive('/dashboard/settings') && 'active', collapsed && 'justify-center px-2')}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <div className={cn('flex items-center gap-3 px-2 py-2', collapsed && 'justify-center')}>
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary text-sm font-semibold">
              {user?.name?.charAt(0) || '?'}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-sidebar-foreground truncate">{user?.role}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost" size={collapsed ? 'icon' : 'sm'}
          className={cn('text-sidebar-foreground hover:text-sidebar-accent-foreground w-full', !collapsed && 'justify-start gap-2')}
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}

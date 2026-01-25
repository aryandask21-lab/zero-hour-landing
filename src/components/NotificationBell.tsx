import { Bell, Check, Trophy, Swords, AlertTriangle, Mail, Ban, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/types/esports';

const iconMap: Record<Notification['type'], React.ComponentType<{ className?: string }>> = {
  match_start: Swords,
  check_in: Check,
  dispute: AlertTriangle,
  invite: Mail,
  result: Trophy,
  prize: Trophy,
  ban: Ban,
  system: Info,
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-crimson text-[10px] font-bold flex items-center justify-center text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-card border-border">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="font-heading text-sm text-white">NOTIFICATIONS</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-white"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => {
            const Icon = iconMap[notification.type] || Info;
            return (
              <DropdownMenuItem
                key={notification.id}
                className={`flex gap-3 p-3 cursor-pointer ${
                  !notification.read ? 'bg-crimson/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`shrink-0 p-2 rounded ${
                  notification.type === 'ban' ? 'bg-red-500/20 text-red-400' :
                  notification.type === 'prize' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-crimson/20 text-crimson'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${!notification.read ? 'text-white' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-crimson shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-crimson text-sm"
              onClick={() => navigate('/notifications')}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

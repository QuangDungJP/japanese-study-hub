import { useState } from 'react';
import { LogOut, User, Settings, CreditCard, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const UserDropdown = () => {
  const { user, signOut, isAdmin, isModeratorOrAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Đăng xuất thành công',
      description: 'Hẹn gặp lại bạn!',
    });
    navigate('/');
  };

  const getInitial = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold shadow-md">
            {getInitial()}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-3 border-b border-border">
          <p className="font-medium text-foreground truncate">{getDisplayName()}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
        
        <DropdownMenuItem onClick={() => { navigate('/learn'); setOpen(false); }}>
          <User className="w-4 h-4 mr-2" />
          Hồ sơ của tôi
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => { navigate('/learn/courses'); setOpen(false); }}>
          <CreditCard className="w-4 h-4 mr-2" />
          Khóa học của tôi
        </DropdownMenuItem>
        
        {isModeratorOrAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { navigate('/admin'); setOpen(false); }}>
              <Settings className="w-4 h-4 mr-2" />
              {isAdmin ? 'Quản trị viên' : 'Quản lý nội dung'}
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;

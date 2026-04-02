import { useState, useEffect } from 'react';
import {
  Search, Loader2, Flame, Zap, Users, TrendingUp, BookOpen, Eye,
  ChevronUp, ChevronDown, Shield, GraduationCap, Filter, X,
  Crown, Star, MoreHorizontal
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StudentProgressModal from '@/components/admin/StudentProgressModal';

interface UserWithProgress {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  current_language?: string | null;
  progress: {
    total_xp: number;
    streak: number;
    lessons_completed: number;
    vocabulary_mastered: number;
    daily_progress: number;
    daily_goal: number;
  } | null;
  roles: string[];
}

type SortField = 'name' | 'xp' | 'streak' | 'lessons' | 'date';
type SortDirection = 'asc' | 'desc';
type RoleFilter = 'all' | 'user' | 'teacher' | 'senior_teacher' | 'moderator' | 'admin';

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Users; color: string; badgeVariant: string; gradient: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-red-500', badgeVariant: 'destructive', gradient: 'from-red-500/20 to-red-600/5' },
  senior_teacher: { label: 'GV Cao cấp', icon: Star, color: 'text-amber-500', badgeVariant: 'default', gradient: 'from-amber-500/20 to-amber-600/5' },
  teacher: { label: 'Giảng viên', icon: GraduationCap, color: 'text-blue-500', badgeVariant: 'secondary', gradient: 'from-blue-500/20 to-blue-600/5' },
  moderator: { label: 'Moderator', icon: Shield, color: 'text-purple-500', badgeVariant: 'outline', gradient: 'from-purple-500/20 to-purple-600/5' },
  user: { label: 'Học viên', icon: BookOpen, color: 'text-emerald-500', badgeVariant: 'outline', gradient: 'from-emerald-500/20 to-emerald-600/5' },
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedStudent, setSelectedStudent] = useState<UserWithProgress | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const [{ data: profiles, error: e1 }, { data: progress, error: e2 }, { data: userRoles, error: e3 }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_progress').select('*'),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;

      setUsers(profiles?.map(p => ({
        ...p,
        progress: progress?.find(pr => pr.user_id === p.user_id) || null,
        roles: userRoles?.filter(r => r.user_id === p.user_id).map(r => r.role as string) || []
      })) || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).eq('role', role as any);
      if (existing && existing.length > 0) {
        toast({ title: 'Thông báo', description: 'Đã có role này' }); return;
      }
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
      if (error) throw error;
      toast({ title: 'Thành công', description: `Đã gán ${ROLE_CONFIG[role]?.label || role}` });
      fetchUsers();
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể gán role', variant: 'destructive' });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role as any);
      if (error) throw error;
      toast({ title: 'Thành công', description: `Đã xóa ${ROLE_CONFIG[role]?.label || role}` });
      fetchUsers();
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa role', variant: 'destructive' });
    }
  };

  const getUserPrimaryRole = (roles: string[]): string => {
    const priority = ['admin', 'senior_teacher', 'teacher', 'moderator', 'user'];
    return priority.find(r => roles.includes(r)) || 'user';
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.full_name?.toLowerCase() || '').includes(search.toLowerCase());
    if (roleFilter === 'all') return matchSearch;
    if (roleFilter === 'user') return matchSearch && (u.roles.length === 0 || (u.roles.length === 1 && u.roles[0] === 'user'));
    return matchSearch && u.roles.includes(roleFilter);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let vA: number | string, vB: number | string;
    switch (sortField) {
      case 'name': vA = a.full_name?.toLowerCase() || ''; vB = b.full_name?.toLowerCase() || ''; break;
      case 'xp': vA = a.progress?.total_xp || 0; vB = b.progress?.total_xp || 0; break;
      case 'streak': vA = a.progress?.streak || 0; vB = b.progress?.streak || 0; break;
      case 'lessons': vA = a.progress?.lessons_completed || 0; vB = b.progress?.lessons_completed || 0; break;
      case 'date': vA = new Date(a.created_at).getTime(); vB = new Date(b.created_at).getTime(); break;
      default: vA = 0; vB = 0;
    }
    return sortDirection === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />;
  };

  // Role stats
  const roleCounts = {
    all: users.length,
    admin: users.filter(u => u.roles.includes('admin')).length,
    senior_teacher: users.filter(u => u.roles.includes('senior_teacher')).length,
    teacher: users.filter(u => u.roles.includes('teacher')).length,
    moderator: users.filter(u => u.roles.includes('moderator')).length,
    user: users.filter(u => u.roles.length === 0 || (u.roles.length === 1 && u.roles[0] === 'user')).length,
  };

  const activeToday = users.filter(u => (u.progress?.daily_progress || 0) > 0).length;
  const getLevel = (xp: number) => Math.floor(xp / 500) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý vai trò, tiến độ và thông tin chi tiết</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
            <Users className="w-4 h-4" />
            {users.length} người dùng
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
            <TrendingUp className="w-4 h-4" />
            {activeToday} online hôm nay
          </div>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(['admin', 'senior_teacher', 'teacher', 'moderator', 'user'] as const).map(role => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          return (
            <Card
              key={role}
              className={`cursor-pointer transition-all hover:shadow-md ${roleFilter === role ? 'ring-2 ring-primary shadow-md' : ''}`}
              onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
            >
              <CardContent className="p-4">
                <div className={`flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{roleCounts[role]}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {roleFilter !== 'all' && (
          <Button variant="outline" size="sm" onClick={() => setRoleFilter('all')} className="gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Đang lọc: {ROLE_CONFIG[roleFilter]?.label}
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center p-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{search ? 'Không tìm thấy kết quả' : 'Chưa có người dùng'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                      Người dùng <SortIcon field="name" />
                    </TableHead>
                    <TableHead className="text-center">Vai trò</TableHead>
                    <TableHead className="text-center cursor-pointer hover:text-foreground" onClick={() => handleSort('xp')}>
                      XP <SortIcon field="xp" />
                    </TableHead>
                    <TableHead className="text-center cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => handleSort('streak')}>
                      Streak <SortIcon field="streak" />
                    </TableHead>
                    <TableHead className="text-center cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => handleSort('lessons')}>
                      Bài học <SortIcon field="lessons" />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-foreground hidden xl:table-cell" onClick={() => handleSort('date')}>
                      Ngày tham gia <SortIcon field="date" />
                    </TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user, index) => {
                    const level = getLevel(user.progress?.total_xp || 0);
                    const primaryRole = getUserPrimaryRole(user.roles);
                    const config = ROLE_CONFIG[primaryRole];
                    return (
                      <TableRow key={user.id} className="group hover:bg-muted/30">
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                            index === 1 ? 'bg-gray-300/30 text-gray-500' :
                            index === 2 ? 'bg-orange-500/20 text-orange-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 border border-border">
                              <AvatarImage src={user.avatar_url || ''} />
                              <AvatarFallback className={`text-sm font-bold bg-gradient-to-br ${config.gradient}`}>
                                {user.full_name?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">
                                {user.full_name || 'Chưa đặt tên'}
                              </p>
                              <p className="text-xs text-muted-foreground">Lv.{level}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">User</Badge>
                            ) : (
                              user.roles.map(role => {
                                const rc = ROLE_CONFIG[role];
                                return (
                                  <Badge
                                    key={role}
                                    variant={rc?.badgeVariant as any || 'outline'}
                                    className="text-[10px] px-1.5 py-0 cursor-pointer hover:opacity-70"
                                    onClick={() => removeRole(user.user_id, role)}
                                    title="Click để xóa role"
                                  >
                                    {rc?.label || role} ×
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-semibold text-sm">{(user.progress?.total_xp || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-sm">{user.progress?.streak || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">{user.progress?.lessons_completed || 0}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
                          {new Date(user.created_at).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-popover">
                              <DropdownMenuLabel className="text-xs text-muted-foreground">Hành động</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => { setSelectedStudent(user); setModalOpen(true); }}>
                                <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-muted-foreground">Gán vai trò</DropdownMenuLabel>
                              {(['teacher', 'senior_teacher', 'moderator', 'admin'] as const).map(role => {
                                const rc = ROLE_CONFIG[role];
                                const Icon = rc.icon;
                                const hasRole = user.roles.includes(role);
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => hasRole ? removeRole(user.user_id, role) : assignRole(user.user_id, role)}
                                    className={hasRole ? 'bg-muted' : ''}
                                  >
                                    <Icon className={`w-4 h-4 mr-2 ${rc.color}`} />
                                    {rc.label}
                                    {hasRole && <Badge variant="secondary" className="ml-auto text-[9px] px-1">Đã gán</Badge>}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StudentProgressModal open={modalOpen} onOpenChange={setModalOpen} student={selectedStudent} />
    </div>
  );
};

export default AdminUsers;

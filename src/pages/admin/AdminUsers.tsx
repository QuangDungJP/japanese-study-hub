import { useState, useEffect } from 'react';
import {
  Search, Loader2, Flame, Zap, Users, TrendingUp, BookOpen, Eye,
  ChevronUp, ChevronDown, Shield, GraduationCap, Filter, X,
  Crown, Star, MoreHorizontal, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { formatWithJST } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import StudentProgressModal from '@/components/admin/StudentProgressModal';
import { Skeleton } from '@/components/ui/skeleton';

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

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Users; color: string; badgeVariant: string; gradient: string; border: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-red-500', badgeVariant: 'destructive', gradient: 'from-red-500/20 to-red-600/5', border: 'border-red-500/30' },
  senior_teacher: { label: 'GV Cao cấp', icon: Star, color: 'text-amber-500', badgeVariant: 'default', gradient: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30' },
  teacher: { label: 'Giảng viên', icon: GraduationCap, color: 'text-blue-500', badgeVariant: 'secondary', gradient: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
  moderator: { label: 'Moderator', icon: Shield, color: 'text-purple-500', badgeVariant: 'outline', gradient: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30' },
  user: { label: 'Học viên', icon: BookOpen, color: 'text-emerald-500', badgeVariant: 'outline', gradient: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30' },
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalUsers, setTotalUsers] = useState(0);

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  
  const [roleStats, setRoleStats] = useState<Record<string, number>>({
    all: 0, admin: 0, senior_teacher: 0, teacher: 0, moderator: 0, user: 0
  });

  const [selectedStudent, setSelectedStudent] = useState<UserWithProgress | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', full_name: '', role: 'user' });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, page, sortField, sortDirection, roleFilter]);

  const fetchGlobalStats = async () => {
    try {
      const getCount = async (role: string) => {
        const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', role);
        return count || 0;
      };
      const [allCountRes, adminCount, stCount, teacherCount, modCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        getCount('admin'), getCount('senior_teacher'), getCount('teacher'), getCount('moderator')
      ]);
      const allCount = allCountRes.count || 0;
      const userCount = allCount - (adminCount + stCount + teacherCount + modCount);
      setRoleStats({
        all: allCount, admin: adminCount, senior_teacher: stCount, 
        teacher: teacherCount, moderator: modCount, user: userCount > 0 ? userCount : 0
      });
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let userIdsToFetch: string[] = [];
      let currentTotalCount = 0;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let allowedUserIds: string[] | null = null;
      if (roleFilter !== 'all') {
        if (roleFilter === 'user') {
          const { data: nonUserRoles } = await supabase.from('user_roles')
             .select('user_id')
             .in('role', ['admin', 'teacher', 'senior_teacher', 'moderator']);
          allowedUserIds = nonUserRoles?.map(r => r.user_id) || [];
        } else {
          const { data: roleData } = await supabase.from('user_roles').select('user_id').eq('role', roleFilter);
          allowedUserIds = roleData?.map(r => r.user_id) || [];
          if (allowedUserIds.length === 0) {
            setUsers([]); setTotalUsers(0); setLoading(false); return;
          }
        }
      }

      if (['xp', 'streak', 'lessons'].includes(sortField)) {
        let progressQuery = supabase.from('user_progress').select('user_id', { count: 'exact' });
        
        if (sortField === 'xp') progressQuery = progressQuery.order('total_xp', { ascending: sortDirection === 'asc' });
        if (sortField === 'streak') progressQuery = progressQuery.order('streak', { ascending: sortDirection === 'asc' });
        if (sortField === 'lessons') progressQuery = progressQuery.order('lessons_completed', { ascending: sortDirection === 'asc' });
        
        if (debouncedSearch) {
          const { data: nameMatches } = await supabase.from('profiles').select('user_id').ilike('full_name', `%${debouncedSearch}%`);
          const matchedIds = nameMatches?.map(m => m.user_id) || [];
          if (matchedIds.length === 0) {
            setUsers([]); setTotalUsers(0); setLoading(false); return;
          }
          progressQuery = progressQuery.in('user_id', matchedIds);
        }

        if (roleFilter !== 'all' && allowedUserIds) {
          if (roleFilter === 'user') {
             if (allowedUserIds.length > 0) progressQuery = progressQuery.not('user_id', 'in', `(${allowedUserIds.join(',')})`);
          } else {
             progressQuery = progressQuery.in('user_id', allowedUserIds);
          }
        }

        const { data: pData, count } = await progressQuery.range(from, to);
        userIdsToFetch = pData?.map(p => p.user_id) || [];
        currentTotalCount = count || 0;
      } else {
        let profileQuery = supabase.from('profiles').select('user_id', { count: 'exact' });
        
        if (debouncedSearch) profileQuery = profileQuery.ilike('full_name', `%${debouncedSearch}%`);
        
        if (sortField === 'date') profileQuery = profileQuery.order('created_at', { ascending: sortDirection === 'asc' });
        if (sortField === 'name') profileQuery = profileQuery.order('full_name', { ascending: sortDirection === 'asc' });
        
        if (roleFilter !== 'all' && allowedUserIds) {
          if (roleFilter === 'user') {
             if (allowedUserIds.length > 0) profileQuery = profileQuery.not('user_id', 'in', `(${allowedUserIds.join(',')})`);
          } else {
             profileQuery = profileQuery.in('user_id', allowedUserIds);
          }
        }

        const { data: pData, count } = await profileQuery.range(from, to);
        userIdsToFetch = pData?.map(p => p.user_id) || [];
        currentTotalCount = count || 0;
      }

      if (userIdsToFetch.length === 0) {
        setUsers([]); setTotalUsers(currentTotalCount); setLoading(false); return;
      }

      const [{ data: profiles }, { data: progress }, { data: userRoles }] = await Promise.all([
        supabase.from('profiles').select('*').in('user_id', userIdsToFetch),
        supabase.from('user_progress').select('*').in('user_id', userIdsToFetch),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIdsToFetch),
      ]);

      const usersData = userIdsToFetch.map(uid => {
         const p = profiles?.find(pr => pr.user_id === uid);
         if (!p) return null;
         return {
           ...p,
           progress: progress?.find(pr => pr.user_id === uid) || null,
           roles: userRoles?.filter(r => r.user_id === uid).map(r => r.role) || []
         };
      }).filter(Boolean);

      setUsers(usersData as UserWithProgress[]);
      setTotalUsers(currentTotalCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    if (role === 'admin') {
      toast({ title: 'Bảo vệ Admin', description: 'Không thể cấp quyền Admin tại giao diện này.', variant: 'destructive' }); return;
    }
    try {
      const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).eq('role', role);
      if (existing && existing.length > 0) { toast({ title: 'Thông báo', description: 'Đã có vai trò này' }); return; }
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role });
      if (error) throw error;
      toast({ title: 'Thành công', description: `Đã gán ${ROLE_CONFIG[role]?.label || role}` });
      fetchUsers(); fetchGlobalStats();
    } catch (error) { toast({ title: 'Lỗi', description: 'Không thể gán vai trò', variant: 'destructive' }); }
  };

  const removeRole = async (userId: string, role: string) => {
    if (role === 'admin') {
      toast({ title: 'Bảo vệ Admin', description: 'Không thể xóa vai trò Admin.', variant: 'destructive' }); return;
    }
    try {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      if (error) throw error;
      toast({ title: 'Thành công', description: `Đã xóa ${ROLE_CONFIG[role]?.label || role}` });
      fetchUsers(); fetchGlobalStats();
    } catch (error) { toast({ title: 'Lỗi', description: 'Không thể xóa vai trò', variant: 'destructive' }); }
  };

  const handleCreateUser = async () => {
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      toast({ title: 'Thiếu thông tin', description: 'Vui lòng nhập đầy đủ', variant: 'destructive' }); return;
    }
    setIsAdding(true);
    try {
      const res = await supabase.functions.invoke('create-user', { body: addForm });
      if (res.error) throw res.error;
      toast({ title: 'Thành công', description: 'Đã tạo người dùng mới' });
      setAddUserOpen(false);
      setAddForm({ email: '', password: '', full_name: '', role: 'user' });
      fetchUsers(); fetchGlobalStats();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message || 'Không thể tạo người dùng', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const getUserPrimaryRole = (roles: string[]): string => {
    const priority = ['admin', 'senior_teacher', 'teacher', 'moderator', 'user'];
    return priority.find(r => roles.includes(r)) || 'user';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(p => p === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />;
  };

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;
  const getLevel = (xp: number) => Math.floor(xp / 500) + 1;

  return (
    <div className="space-y-8 w-full max-w-full overflow-x-hidden pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Quản lý người dùng
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Quản lý chuyên sâu vai trò và thông tin ({totalUsers.toLocaleString()} tài khoản)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setAddUserOpen(true)} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all rounded-xl h-10">
            <Plus className="w-4 h-4" /> Thêm người dùng
          </Button>
        </div>
      </div>

      {/* Role Summary Cards (Glassmorphism) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(['admin', 'senior_teacher', 'teacher', 'moderator', 'user'] as const).map(role => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          const isActive = roleFilter === role;
          return (
            <div
              key={role}
              onClick={() => { setRoleFilter(isActive ? 'all' : role); setPage(1); }}
              className={`cursor-pointer transition-all duration-300 rounded-2xl border p-4 hover:-translate-y-1 hover:shadow-xl ${
                isActive 
                  ? `bg-background ring-2 ring-primary shadow-primary/20 ${config.border}` 
                  : 'bg-card/40 backdrop-blur-md shadow-sm border-border/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-inner`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black">{roleStats[role]?.toLocaleString()}</p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card/50 backdrop-blur-xl p-3 rounded-2xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài khoản theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50 border-0 shadow-inner h-10 rounded-xl focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {roleFilter !== 'all' && (
            <Button variant="secondary" size="sm" onClick={() => { setRoleFilter('all'); setPage(1); }} className="gap-2 rounded-xl h-10 bg-secondary/50">
              <Filter className="w-3.5 h-3.5" /> Lọc: {ROLE_CONFIG[roleFilter]?.label}
              <X className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
          <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-2 rounded-xl border border-border/50">
            Tổng: <span className="text-foreground font-bold">{totalUsers.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <Card className="w-full max-w-full overflow-hidden border-0 shadow-2xl rounded-2xl bg-card/80 backdrop-blur-2xl ring-1 ring-border/50">
        <CardContent className="p-0 overflow-x-auto w-full">
          {loading ? (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-border/50">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Tham gia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="w-6 h-6 rounded-full" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-20 text-muted-foreground flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 opacity-40" />
              </div>
              <p className="font-semibold text-lg">{search ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dữ liệu người dùng'}</p>
              <p className="text-sm mt-1 opacity-70">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b border-border/50">
                    <TableHead className="w-16 text-center font-bold">#</TableHead>
                    <TableHead className="cursor-pointer hover:text-primary transition-colors font-bold" onClick={() => handleSort('name')}>
                      Hồ sơ người dùng <SortIcon field="name" />
                    </TableHead>
                    <TableHead className="text-center font-bold">Vai trò / Cấp bậc</TableHead>
                    <TableHead className="text-center cursor-pointer hover:text-primary transition-colors font-bold" onClick={() => handleSort('xp')}>
                      Tổng XP <SortIcon field="xp" />
                    </TableHead>
                    <TableHead className="text-center cursor-pointer hover:text-primary transition-colors hidden md:table-cell font-bold" onClick={() => handleSort('streak')}>
                      Lửa (Streak) <SortIcon field="streak" />
                    </TableHead>
                    <TableHead className="cursor-pointer hover:text-primary transition-colors hidden xl:table-cell font-bold" onClick={() => handleSort('date')}>
                      Ngày tham gia <SortIcon field="date" />
                    </TableHead>
                    <TableHead className="w-20 text-center font-bold">Menu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => {
                    const level = getLevel(user.progress?.total_xp || 0);
                    const primaryRole = getUserPrimaryRole(user.roles);
                    const config = ROLE_CONFIG[primaryRole];
                    const rowIndex = (page - 1) * pageSize + index + 1;
                    
                    return (
                      <TableRow key={user.id} className="group hover:bg-muted/40 transition-colors border-b border-border/30">
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {rowIndex}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <Avatar className="w-11 h-11 border-2 border-background shadow-md">
                              <AvatarImage src={user.avatar_url || ''} className="object-cover" />
                              <AvatarFallback className={`text-sm font-black bg-gradient-to-br ${config.gradient} ${config.color}`}>
                                {user.full_name?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm sm:text-base">
                                {user.full_name || 'Chưa đặt tên'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-muted text-muted-foreground">Lv.{level}</Badge>
                                <span className="text-xs text-muted-foreground hidden sm:inline-block truncate max-w-[120px]">{user.id.slice(0,8)}...</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-emerald-500/30 text-emerald-600 font-semibold bg-emerald-500/5">Học viên</Badge>
                            ) : (
                              user.roles.map(role => {
                                const rc = ROLE_CONFIG[role];
                                const isAdmin = role === 'admin';
                                return (
                                  <Badge
                                    key={role}
                                    variant={rc?.badgeVariant as any || 'outline'}
                                    className={`text-[10px] px-2 py-0.5 font-semibold transition-all ${isAdmin ? 'cursor-default' : 'cursor-pointer hover:scale-105'} ${rc?.border || ''}`}
                                    onClick={() => !isAdmin && removeRole(user.user_id, role)}
                                    title={isAdmin ? 'Vai trò Admin được bảo vệ' : 'Click để gỡ quyền'}
                                  >
                                    {rc?.label || role} {!isAdmin && ' ×'}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-sm tracking-tight">{(user.progress?.total_xp || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1.5">
                            <Flame className={`w-4 h-4 ${(user.progress?.streak || 0) > 0 ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground'}`} />
                            <span className={`text-sm font-semibold ${(user.progress?.streak || 0) > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {user.progress?.streak || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-muted-foreground hidden xl:table-cell">
                          {formatWithJST(user.created_at, false)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-full hover:bg-primary/10 hover:text-primary">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-border/50 bg-background/95 backdrop-blur-xl">
                              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Cài đặt tài khoản</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-lg mt-1 cursor-pointer" onClick={() => { setSelectedStudent(user); setModalOpen(true); }}>
                                <Eye className="w-4 h-4 mr-2 text-primary" /> Tiến độ học tập
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2" />
                              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Nâng cấp quyền (Roles)</DropdownMenuLabel>
                              {(['user', 'teacher', 'senior_teacher', 'moderator'] as const).map(role => {
                                const rc = ROLE_CONFIG[role];
                                const Icon = rc.icon;
                                const hasRole = user.roles.includes(role);
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => hasRole ? removeRole(user.user_id, role) : assignRole(user.user_id, role)}
                                    className={`rounded-lg mt-1 cursor-pointer transition-colors ${hasRole ? 'bg-primary/10 text-primary font-medium' : ''}`}
                                  >
                                    <Icon className={`w-4 h-4 mr-2 ${hasRole ? 'text-primary' : rc.color}`} />
                                    {rc.label}
                                    {hasRole && <Badge variant="default" className="ml-auto text-[9px] px-1.5 h-4 bg-primary text-primary-foreground">Đang bật</Badge>}
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
        
        {/* Pagination Controls */}
        {totalUsers > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
            <p className="text-sm font-medium text-muted-foreground">
              Hiển thị <span className="text-foreground font-bold">{(page - 1) * pageSize + 1}</span> - <span className="text-foreground font-bold">{Math.min(page * pageSize, totalUsers)}</span> trong <span className="text-foreground font-bold">{totalUsers.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-9 w-9 p-0 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 px-2 font-medium text-sm">
                Trang <span className="bg-background border rounded-md px-2 py-1 mx-1 min-w-[2rem] text-center">{page}</span> / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-9 w-9 p-0 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <StudentProgressModal open={modalOpen} onOpenChange={setModalOpen} student={selectedStudent} />

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Thêm người dùng mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="font-semibold">Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Mật khẩu</Label>
              <Input
                type="password"
                placeholder="******"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Họ và tên</Label>
              <Input
                placeholder="Nguyễn Văn A"
                value={addForm.full_name}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Vai trò ban đầu</Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              >
                <option value="user">Học viên</option>
                <option value="teacher">Giảng viên</option>
                <option value="senior_teacher">GV Cao cấp</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddUserOpen(false)} className="rounded-xl">Hủy</Button>
            <Button onClick={handleCreateUser} disabled={isAdding} className="rounded-xl bg-primary hover:bg-primary/90">
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAdding ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;

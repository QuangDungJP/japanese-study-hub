import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Database,
  BarChart3,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  ExamPool,
  getExamPools,
  saveExamPools,
  getExamPoolId,
  DEFAULT_EXAM_POOLS,
} from '@/lib/examPoolService';

interface AdminExamPoolsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exams: any[];
  onPoolsUpdated?: () => void;
  onOpenAIGenerator?: (poolId: string) => void;
}

export const AdminExamPoolsModal: React.FC<AdminExamPoolsModalProps> = ({
  open,
  onOpenChange,
  exams,
  onPoolsUpdated,
  onOpenAIGenerator,
}) => {
  const [pools, setPools] = useState<ExamPool[]>(getExamPools());
  const [editingPool, setEditingPool] = useState<ExamPool | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (open) {
      setPools(getExamPools());
    }
  }, [open]);

  // Compute breakdown of exams per pool and level
  const poolStats = React.useMemo(() => {
    const stats: Record<
      string,
      { total: number; n5: number; n4: number; n3: number; n2: number; n1: number }
    > = {};

    pools.forEach((p) => {
      stats[p.id] = { total: 0, n5: 0, n4: 0, n3: 0, n2: 0, n1: 0 };
    });

    exams.forEach((exam) => {
      const pId = getExamPoolId(exam);
      if (!stats[pId]) {
        stats[pId] = { total: 0, n5: 0, n4: 0, n3: 0, n2: 0, n1: 0 };
      }
      stats[pId].total += 1;
      const lvl = (exam.exam_category || exam.level || 'N4').toUpperCase();
      if (lvl === 'N5') stats[pId].n5 += 1;
      else if (lvl === 'N4') stats[pId].n4 += 1;
      else if (lvl === 'N3') stats[pId].n3 += 1;
      else if (lvl === 'N2') stats[pId].n2 += 1;
      else if (lvl === 'N1') stats[pId].n1 += 1;
    });

    return stats;
  }, [pools, exams]);

  const handleCreatePool = () => {
    if (!newName.trim()) {
      toast.error('Vui lòng nhập tên kho đề');
      return;
    }

    const newPool: ExamPool = {
      id: `pool-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Kho đề bổ sung được tạo bởi Giảng viên/Quản trị viên.',
      is_active: false,
      order: pools.length + 1,
      created_at: new Date().toISOString(),
    };

    const updated = [...pools, newPool];
    setPools(updated);
    saveExamPools(updated);
    setNewName('');
    setNewDesc('');
    setIsCreating(false);
    toast.success(`Đã tạo kho đề mới: ${newPool.name}`);
    onPoolsUpdated?.();
  };

  const handleUpdatePool = () => {
    if (!editingPool || !editingPool.name.trim()) return;
    const updated = pools.map((p) => (p.id === editingPool.id ? editingPool : p));
    setPools(updated);
    saveExamPools(updated);
    setEditingPool(null);
    toast.success('Đã cập nhật thông tin kho đề');
    onPoolsUpdated?.();
  };

  const handleDeletePool = (poolId: string) => {
    if (pools.length <= 1) {
      toast.error('Hệ thống cần ít nhất 1 kho đề chính');
      return;
    }
    const target = pools.find((p) => p.id === poolId);
    if (!window.confirm(`Bạn có chắc muốn xóa "${target?.name}"?`)) return;

    const updated = pools.filter((p) => p.id !== poolId);
    setPools(updated);
    saveExamPools(updated);
    toast.success('Đã xóa kho đề thành công');
    onPoolsUpdated?.();
  };

  const handleResetDefault = () => {
    if (window.confirm('Khôi phục danh sách kho đề về cấu hình chuẩn ban đầu (Kho 1, 2, 3)?')) {
      setPools(DEFAULT_EXAM_POOLS);
      saveExamPools(DEFAULT_EXAM_POOLS);
      toast.success('Đã khôi phục kho đề mặc định');
      onPoolsUpdated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-border/80 shadow-2xl bg-card">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white relative">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    Quản Lý Kho Đề Thi (Exam Pools)
                    <Badge className="bg-emerald-500/80 text-white border-0 text-xs">
                      {pools.length} Kho sẵn sàng
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-white/80 text-xs mt-0.5">
                    Tổ chức kho đề theo từng đợt kiểm tra. Học viên làm hết Kho 1 sẽ tự động chuyển tiếp sang Kho 2, 3 chống trùng lặp tuyệt đối.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Top Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Danh sách Kho Đề Luân Phiên
              </p>
              <p className="text-xs text-muted-foreground">
                Tổng cộng {exams.length} bài thi đang được phân phối trong hệ thống
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefault}
                className="text-xs gap-1.5 h-8"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Mặc định
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-primary/90 text-xs gap-1.5 h-8 font-medium shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm Kho Mới
              </Button>
            </div>
          </div>

          {/* Create New Pool Form */}
          {isCreating && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-primary flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Tạo kho đề kiểm tra mới
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                  className="h-7 text-xs text-muted-foreground"
                >
                  Hủy
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Ví dụ: Kho đề số 4 (Luyện Đề Marathon Đạt 150+)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 text-sm"
                />
                <Textarea
                  placeholder="Mô tả mục tiêu của kho đề này (ví dụ: dành cho học sinh chuẩn bị thi tháng 7 hoặc tháng 12)..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleCreatePool}
                  className="bg-primary text-xs h-8 px-4"
                >
                  Lưu Kho Đề
                </Button>
              </div>
            </div>
          )}

          {/* Edit Pool Form */}
          {editingPool && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Edit2 className="h-4 w-4" /> Chỉnh sửa kho: {editingPool.name}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPool(null)}
                  className="h-7 text-xs text-muted-foreground"
                >
                  Hủy
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  value={editingPool.name}
                  onChange={(e) => setEditingPool({ ...editingPool, name: e.target.value })}
                  className="h-9 text-sm"
                />
                <Textarea
                  value={editingPool.description}
                  onChange={(e) => setEditingPool({ ...editingPool, description: e.target.value })}
                  className="text-xs min-h-[60px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleUpdatePool}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-4"
                >
                  Cập Nhật
                </Button>
              </div>
            </div>
          )}

          {/* Pools List */}
          <div className="space-y-4">
            {pools.map((pool, idx) => {
              const stat = poolStats[pool.id] || { total: 0, n5: 0, n4: 0, n3: 0, n2: 0, n1: 0 };
              const isDefaultPool = pool.id === 'pool-1';

              return (
                <div
                  key={pool.id}
                  className="group rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-all shadow-sm p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          #{pool.order || idx + 1}
                        </span>
                        <h4 className="font-semibold text-foreground text-sm sm:text-base">
                          {pool.name}
                        </h4>
                        {isDefaultPool && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0">
                            Kho Ưu Tiên 1
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {stat.total} đề thi
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pool.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {onOpenAIGenerator && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            onOpenAIGenerator(pool.id);
                          }}
                          className="h-8 text-xs gap-1 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Nạp Đề
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPool(pool)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Chỉnh sửa kho"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      {!isDefaultPool && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePool(pool.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Xóa kho"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Level Breakdown Grid */}
                  <div className="grid grid-cols-5 gap-2 pt-2 border-t border-border/50 text-center">
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">N5</div>
                      <div className="text-base font-black text-foreground">{stat.n5}</div>
                      <div className="text-[9px] text-muted-foreground">đề</div>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">N4</div>
                      <div className="text-base font-black text-foreground">{stat.n4}</div>
                      <div className="text-[9px] text-muted-foreground">đề</div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">N3</div>
                      <div className="text-base font-black text-foreground">{stat.n3}</div>
                      <div className="text-[9px] text-muted-foreground">đề</div>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400">N2</div>
                      <div className="text-base font-black text-foreground">{stat.n2}</div>
                      <div className="text-[9px] text-muted-foreground">đề</div>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                      <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">N1</div>
                      <div className="text-base font-black text-foreground">{stat.n1}</div>
                      <div className="text-[9px] text-muted-foreground">đề</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rotation Logic Explainer Box */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div className="text-xs space-y-1">
              <span className="font-semibold text-foreground">
                Cơ chế Bốc Đề Luân Phiên & Chống Trùng Đề Hoạt Động Thế Nào?
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Khi học viên nhấn <b className="text-foreground">"Bốc đề thi ngay"</b>, hệ thống quét các đề trong <b>Kho số 1</b> trước. Nếu học viên chưa từng thi đề nào trong kho 1, đề đó sẽ được phát ngay. Khi học viên đã làm hết tất cả các đề thuộc trình độ trong Kho 1, hệ thống tự động thăng cấp lên <b>Kho số 2</b>, rồi tiếp tục sang <b>Kho số 3</b>. Sau khi làm hết các kho, hệ thống mới bắt đầu xoay vòng lại nhằm tối ưu khả năng cọ xát đề mới!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="px-6 text-xs h-9">
            Đóng Quản Lý Kho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

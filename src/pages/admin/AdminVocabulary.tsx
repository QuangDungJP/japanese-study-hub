import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VocabularyItem {
  id: string;
  word: string;
  meaning_vi: string;
  pronunciation: string | null;
  example: string | null;
  example_vi: string | null;
  language: string;
  level: string;
  category: string | null;
  created_at: string;
}

const AdminVocabulary = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VocabularyItem | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    word: '',
    meaning_vi: '',
    pronunciation: '',
    example: '',
    example_vi: '',
    language: 'english',
    level: 'beginner',
    category: '',
  });

  useEffect(() => {
    fetchVocabulary();
  }, []);

  const fetchVocabulary = async () => {
    try {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVocabulary(data || []);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách từ vựng',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('vocabulary')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật từ vựng' });
      } else {
        const { error } = await supabase
          .from('vocabulary')
          .insert([formData]);

        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã thêm từ vựng mới' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchVocabulary();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa từ này?')) return;

    try {
      const { error } = await supabase.from('vocabulary').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Thành công', description: 'Đã xóa từ vựng' });
      fetchVocabulary();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      word: '',
      meaning_vi: '',
      pronunciation: '',
      example: '',
      example_vi: '',
      language: 'english',
      level: 'beginner',
      category: '',
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VocabularyItem) => {
    setEditingItem(item);
    setFormData({
      word: item.word,
      meaning_vi: item.meaning_vi,
      pronunciation: item.pronunciation || '',
      example: item.example || '',
      example_vi: item.example_vi || '',
      language: item.language,
      level: item.level,
      category: item.category || '',
    });
    setIsDialogOpen(true);
  };

  const filteredVocabulary = vocabulary.filter((item) => {
    const matchesSearch = 
      item.word.toLowerCase().includes(search.toLowerCase()) ||
      item.meaning_vi.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage = filterLanguage === 'all' || item.language === filterLanguage;
    const matchesLevel = filterLevel === 'all' || item.level === filterLevel;
    return matchesSearch && matchesLanguage && matchesLevel;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý từ vựng</h1>
          <p className="text-muted-foreground">Thêm và quản lý từ vựng cho các ngôn ngữ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Thêm từ vựng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Từ vựng</label>
                  <Input
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    placeholder="e.g., Hello"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nghĩa tiếng Việt</label>
                  <Input
                    value={formData.meaning_vi}
                    onChange={(e) => setFormData({ ...formData, meaning_vi: e.target.value })}
                    placeholder="e.g., Xin chào"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phát âm</label>
                  <Input
                    value={formData.pronunciation}
                    onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                    placeholder="e.g., /həˈloʊ/"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Danh mục</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Greetings"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Ví dụ</label>
                <Input
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                  placeholder="e.g., Hello, how are you?"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Ví dụ (tiếng Việt)</label>
                <Input
                  value={formData.example_vi}
                  onChange={(e) => setFormData({ ...formData, example_vi: e.target.value })}
                  placeholder="e.g., Xin chào, bạn khỏe không?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Ngôn ngữ</label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">🇬🇧 Tiếng Anh</SelectItem>
                      <SelectItem value="german">🇩🇪 Tiếng Đức</SelectItem>
                      <SelectItem value="chinese">🇨🇳 Tiếng Trung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Cấp độ</label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Cơ bản</SelectItem>
                      <SelectItem value="intermediate">Trung cấp</SelectItem>
                      <SelectItem value="advanced">Nâng cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="hero" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Cập nhật' : 'Thêm từ vựng'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm từ vựng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ngôn ngữ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="english">Tiếng Anh</SelectItem>
            <SelectItem value="german">Tiếng Đức</SelectItem>
            <SelectItem value="chinese">Tiếng Trung</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Cấp độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="beginner">Cơ bản</SelectItem>
            <SelectItem value="intermediate">Trung cấp</SelectItem>
            <SelectItem value="advanced">Nâng cao</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vocabulary Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredVocabulary.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground bg-card rounded-2xl border border-border">
          Chưa có từ vựng nào. Nhấn "Thêm từ vựng" để tạo mới.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVocabulary.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl p-4 border border-border hover:shadow-soft transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{item.word}</h3>
                  {item.pronunciation && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      {item.pronunciation}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-primary font-medium mb-2">{item.meaning_vi}</p>
              
              {item.example && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mb-2">
                  <p className="italic">"{item.example}"</p>
                  {item.example_vi && <p className="text-xs mt-1">→ {item.example_vi}</p>}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs">
                  {item.language === 'english' ? '🇬🇧' : 
                   item.language === 'german' ? '🇩🇪' : '🇨🇳'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  item.level === 'beginner' ? 'bg-green-500/10 text-green-600' :
                  item.level === 'intermediate' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-red-500/10 text-red-600'
                }`}>
                  {item.level === 'beginner' ? 'Cơ bản' : 
                   item.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
                </span>
                {item.category && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    {item.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVocabulary;

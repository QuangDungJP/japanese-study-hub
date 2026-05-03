import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { GripVertical, Save, Loader2, Home, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SectionConfig {
  id: string;
  label: string;
  visible: boolean;
}

const defaultSections: SectionConfig[] = [
  { id: 'hero', label: 'Hero Banner', visible: true },
  { id: 'skills', label: '4 Kỹ năng cốt lõi', visible: true },
  { id: 'courses', label: 'Khóa học JLPT', visible: true },
  { id: 'features', label: 'Tại sao chọn TNQDO?', visible: true },
  { id: 'zoom', label: 'Học Online qua Zoom', visible: true },
  { id: 'teachers', label: 'Đội ngũ giảng viên', visible: true },
  { id: 'cta', label: 'CTA - Đăng ký ngay', visible: true },
];

export default function HomepageSectionOrder() {
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionConfig[]>(defaultSections);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    const { data } = await supabase
      .from('website_content')
      .select('content')
      .eq('section_key', 'homepage_sections')
      .maybeSingle();

    if (data?.content) {
      const saved = data.content as unknown as SectionConfig[];
      if (Array.isArray(saved) && saved.length > 0) {
        // Merge with defaults for any new sections
        const savedIds = saved.map(s => s.id);
        const merged = [
          ...saved,
          ...defaultSections.filter(d => !savedIds.includes(d.id)),
        ];
        setSections(merged);
      }
    }
  };

  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setOverIndex(i); };
  const handleDragEnd = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const updated = [...sections];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(overIndex, 0, moved);
      setSections(updated);
      setChanged(true);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const toggleVisibility = (index: number) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, visible: !s.visible } : s));
    setChanged(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('website_content')
        .upsert({
          section_key: 'homepage_sections',
          title: 'Homepage Section Order',
          content: sections as any,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'section_key' });

      if (error) throw error;
      toast({ title: 'Đã lưu thứ tự trang chủ ✓' });
      setChanged(false);
    } catch (e: any) {
      toast({ title: 'Lỗi khi lưu', description: e?.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Sắp xếp trang chủ</CardTitle>
              <CardDescription>Kéo thả để thay đổi thứ tự, toggle để ẩn/hiện section</CardDescription>
            </div>
          </div>
          {changed && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Lưu
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-grab active:cursor-grabbing ${
              dragIndex === index ? 'opacity-30' : ''
            } ${overIndex === index && dragIndex !== index ? 'border-primary border-2' : 'hover:border-primary/50'} ${
              !section.visible ? 'opacity-50 bg-muted/30' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground w-5">{index + 1}</span>
              <div>
                <h4 className="font-medium text-sm">{section.label}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {section.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {section.visible ? 'Đang hiện' : 'Đang ẩn'}
                </p>
              </div>
            </div>
            <Switch
              checked={section.visible}
              onCheckedChange={() => toggleVisibility(index)}
              disabled={section.id === 'hero'}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// D:\QuangDung\QuangDung\japanese-study-hub\src\pages\admin\AdminContent.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layout, HelpCircle, Plus, Edit2, Trash2, Save, FileText, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
}

const AdminContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("faq");
  
  // State quản lý Modal FAQ
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<FAQ>({ question: "", answer: "", order_index: 0, is_active: true });

  // 1. Fetch danh sách FAQ từ bảng 'faqs'
  const { data: faqs = [], isLoading: isLoadingFaq } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch nội dung Website Content từ bảng 'website_content'
  const { data: webContent = [], isLoading: isLoadingContent } = useQuery({
    queryKey: ["admin-web-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_content")
        .select("*")
        .in("section_key", ["about_hero", "about_story", "about_values"]);
      if (error) throw error;
      return data;
    },
  });

  // Mutation xử lý thêm/sửa FAQ
  const faqMutation = useMutation({
    mutationFn: async (faq: FAQ) => {
      if (faq.id) {
        return supabase.from("faqs").update(faq).eq("id", faq.id);
      } else {
        return supabase.from("faqs").insert([faq]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["faqs-public"] });
      toast({ title: "Thành công", description: "Đã cập nhật câu hỏi thường gặp" });
      setIsFaqOpen(false);
      setCurrentFaq({ question: "", answer: "", order_index: 0, is_active: true });
    },
  });

  // Mutation xóa FAQ
  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      return supabase.from("faqs").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["faqs-public"] });
      toast({ title: "Thành công", description: "Đã xóa câu hỏi" });
    },
  });

  // Mutation cập nhật Website Content (Hero, Story, Values)
  const updateContentMutation = useMutation({
    mutationFn: async ({ key, title, desc }: { key: string; title: string; desc: string }) => {
      return supabase
        .from("website_content")
        .update({ title_vi: title, description_vi: desc })
        .eq("section_key", key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-web-content"] });
      toast({ title: "Thành công", description: "Đã lưu thay đổi nội dung trang giao diện" });
    },
  });

  const handleEditFaq = (faq: FAQ) => {
    setCurrentFaq(faq);
    setIsFaqOpen(true);
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layout className="w-5 h-5 text-primary" />
          </div>
          Quản lý nội dung Website
        </h1>
        <p className="text-muted-foreground mt-1">
          Tùy chỉnh linh hoạt các khối dữ liệu tĩnh hiển thị ngoài trang Landing Page và Giới thiệu.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl border border-border/50">
          <TabsTrigger value="faq" className="gap-2 rounded-lg py-2">
            <HelpCircle className="w-4 h-4" /> Hỏi đáp (FAQ Accordion)
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2 rounded-lg py-2">
            <FileText className="w-4 h-4" /> Khối thông tin giới thiệu
          </TabsTrigger>
        </TabsList>

        {/* CONTEN TABS 1: QUẢN LÝ CÂU HỎI FAQ */}
        <TabsContent value="faq" className="space-y-4 outline-none">
          <Card className="border border-border shadow-soft rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl font-bold">Danh sách câu hỏi thường gặp</CardTitle>
                <CardDescription>Các câu hỏi sẽ hiển thị dạng accordion sập/xổ ngoài trang web.</CardDescription>
              </div>
              <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl gap-2" onClick={() => setCurrentFaq({ question: "", answer: "", order_index: faqs.length + 1, is_active: true })}>
                    <Plus className="w-4 h-4" /> Thêm câu hỏi
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px] rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>{currentFaq.id ? "Cập nhật câu hỏi" : "Tạo câu hỏi mới"}</DialogTitle>
                    <DialogDescription>Điền nội dung câu hỏi và câu trả lời chi tiết xổ xuống.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Câu hỏi (Question)</label>
                      <Input 
                        value={currentFaq.question} 
                        onChange={(e) => setCurrentFaq({ ...currentFaq, question: e.target.value })} 
                        placeholder="VD: Trung tâm có hỗ trợ luyện thi JLPT không?" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Câu trả lời (Answer xổ xuống)</label>
                      <Textarea 
                        value={currentFaq.answer} 
                        onChange={(e) => setCurrentFaq({ ...currentFaq, answer: e.target.value })} 
                        placeholder="Nhập nội dung giải đáp chi tiết..." 
                        rows={5}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Thứ tự hiển thị</label>
                        <Input 
                          type="number" 
                          value={currentFaq.order_index} 
                          onChange={(e) => setCurrentFaq({ ...currentFaq, order_index: parseInt(e.target.value) || 0 })} 
                        />
                      </div>
                      <div className="flex items-center justify-between border rounded-xl p-3 mt-6">
                        <span className="text-sm font-medium">Kích hoạt hiển thị</span>
                        <Switch 
                          checked={currentFaq.is_active} 
                          onCheckedChange={(checked) => setCurrentFaq({ ...currentFaq, is_active: checked })} 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsFaqOpen(false)}>Hủy</Button>
                    <Button onClick={() => faqMutation.mutate(currentFaq)} disabled={faqMutation.isPending}>
                      {faqMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Lưu cấu hình
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingFaq ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[80px]">Thứ tự</TableHead>
                        <TableHead>Câu hỏi</TableHead>
                        <TableHead className="w-[120px]">Trạng thái</TableHead>
                        <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq) => (
                        <TableRow key={faq.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-semibold text-center">{faq.order_index}</TableCell>
                          <TableCell className="max-w-md font-medium truncate">{faq.question}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${faq.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {faq.is_active ? "Hoạt động" : "Ẩn"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditFaq(faq)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { if(confirm("Xóa câu hỏi này?")) deleteFaqMutation.mutate(faq.id!); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENT TABS 2: QUẢN LÝ TEXT DỰ ÁN (ABOUT HERO, STORY, VALUES) */}
        <TabsContent value="about" className="space-y-6 outline-none">
          {isLoadingContent ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {webContent.map((section) => (
                <ContentEditorCard 
                  key={section.section_key} 
                  section={section} 
                  onSave={(title, desc) => updateContentMutation.mutate({ key: section.section_key, title, desc })}
                  isSaving={updateContentMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component con Render Form chỉnh sửa cho từng Khối nội dung giao diện
const ContentEditorCard = ({ section, onSave, isSaving }: { section: any; onSave: (t: string, d: string) => void; isSaving: boolean }) => {
  const [title, setTitle] = useState(section.title_vi || "");
  const [desc, setDesc] = useState(section.description_vi || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handleTitleChange = (val: string) => { setTitle(val); setHasChanges(true); };
  const handleDescChange = (val: string) => { setDesc(val); setHasChanges(true); };

  const getSectionLabel = (key: string) => {
    if (key === "about_hero") return "Khối Đầu Trang (Hero Section)";
    if (key === "about_story") return "Khối Câu Chuyện Thương Hiệu (Story Section)";
    return "Khối Tiêu Đề Giá Trị Cốt Lõi (Values Header)";
  };

  return (
    <Card className="border border-border/80 shadow-soft rounded-2xl">
      <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-6">
        <CardTitle className="text-base font-bold text-primary">{getSectionLabel(section.section_key)}</CardTitle>
        <CardDescription>Key định danh trong hệ thống: <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-destructive">{section.section_key}</code></CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Tiêu đề (Title hiển thị)</label>
          <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>
        {section.description_vi !== null && (
          <div className="space-y-2">
            <label className="text-sm font-semibold">Đoạn văn mô tả (Description/Paragraph)</label>
            <Textarea value={desc} onChange={(e) => handleDescChange(e.target.value)} rows={4} />
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button className="rounded-xl gap-2" disabled={!hasChanges || isSaving} onClick={() => { onSave(title, desc); setHasChanges(false); }}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Cập nhật khối này
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminContent;
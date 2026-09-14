import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, Sparkles, FileText, BrainCircuit, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (questions: any[]) => void;
  defaultSkill?: string;
}

export default function AIGeneratorModal({ isOpen, onClose, onGenerate, defaultSkill = 'vocabulary' }: AIGeneratorModalProps) {
  const [skill, setSkill] = useState(defaultSkill);
  const [level, setLevel] = useState('N3');
  const [questionCount, setQuestionCount] = useState(5);
  const [sourceType, setSourceType] = useState('file'); // file or text
  const [textSource, setTextSource] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const { toast } = useToast();

  const handleGenerate = () => {
    if (sourceType === 'text' && !textSource.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập nội dung để tạo câu hỏi", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate AI generation process
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setGeneratedCount(count);
      if (count >= questionCount) {
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          setGeneratedCount(0);
          
          // Generate mock questions
          const newQuestions = Array(questionCount).fill(0).map((_, i) => {
            const qType = skill === 'kaiwa' ? 'audio_record' : 'multiple_choice';
            const q: any = {
              id: crypto.randomUUID(),
              type: qType,
              skill: skill,
              text: `[AI Generated] Câu hỏi ${skill} số ${i + 1} trích xuất từ tài liệu của bạn (Cấp độ ${level}). Vui lòng kiểm tra lại.`,
              points: 5,
            };
            
            if (qType === 'multiple_choice') {
              q.options = ["Đáp án A (Sinh bởi AI)", "Đáp án B (Sinh bởi AI)", "Đáp án C (Sinh bởi AI)", "Đáp án D (Sinh bởi AI)"];
              q.correct_index = Math.floor(Math.random() * 4);
            }
            return q;
          });
          
          toast({ title: "Thành công!", description: `Đã sinh tự động ${questionCount} câu hỏi bằng AI.` });
          onGenerate(newQuestions);
          onClose();
        }, 500);
      }
    }, 600); // Fake delay per question
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-0 overflow-hidden">
        
        {/* Header with Glassmorphism and animated gradient */}
        <div className="relative p-6 pb-8 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-zinc-100 dark:border-zinc-900 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-black flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Sparkles className="w-6 h-6 text-purple-500" /> TNQDO AI Generator
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm mt-2 font-medium">
              Sử dụng Trí tuệ nhân tạo để phân tích tài liệu (PDF, Word, Text) và tự động sinh câu hỏi trắc nghiệm hoặc tự luận với độ chính xác cao.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">Kỹ năng</Label>
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vocabulary">Từ vựng & Chữ Hán</SelectItem>
                  <SelectItem value="reading">Đọc hiểu & Ngữ pháp</SelectItem>
                  <SelectItem value="listening">Nghe hiểu</SelectItem>
                  <SelectItem value="kaiwa">Kaiwa (Giao tiếp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">Cấp độ</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="N1">JLPT N1</SelectItem>
                  <SelectItem value="N2">JLPT N2</SelectItem>
                  <SelectItem value="N3">JLPT N3</SelectItem>
                  <SelectItem value="N4">JLPT N4</SelectItem>
                  <SelectItem value="N5">JLPT N5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">Số lượng sinh</Label>
              <Input type="number" min={1} max={50} value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value) || 5)} className="font-bold" />
            </div>
          </div>

          <Tabs value={sourceType} onValueChange={setSourceType}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="file" className="font-bold">Tải lên File (PDF/Docs)</TabsTrigger>
              <TabsTrigger value="text" className="font-bold">Nhập Văn Bản Markdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="mt-0">
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Kéo thả tài liệu vào đây</h3>
                <p className="text-zinc-500 text-sm mt-1 mb-4">Hỗ trợ PDF, DOCX, TXT. Hệ thống sẽ tự động đọc nội dung để làm dữ liệu nền.</p>
                <Button variant="outline" className="font-bold shadow-sm">Chọn File từ máy</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="mt-0">
              <Textarea 
                placeholder="Dán nội dung văn bản, bài báo, bài luận, hoặc markdown vào đây để AI phân tích..."
                className="min-h-[250px] resize-none font-medium leading-relaxed"
                value={textSource}
                onChange={e => setTextSource(e.target.value)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
          <div className="text-xs text-zinc-500 font-medium max-w-sm">
            AI có thể tốn từ 10 - 30 giây tùy thuộc vào độ dài tài liệu và số lượng câu hỏi yêu cầu.
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isGenerating}>Hủy bỏ</Button>
            
            {isGenerating ? (
              <Button disabled className="bg-gradient-to-r from-purple-500 to-indigo-600 font-bold min-w-[160px]">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý {generatedCount}/{questionCount}
              </Button>
            ) : (
              <Button onClick={handleGenerate} className="bg-gradient-to-r from-purple-500 hover:from-purple-600 to-indigo-600 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-500/25 min-w-[160px] gap-2">
                <BrainCircuit className="w-4 h-4" /> Bắt đầu AI Tạo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

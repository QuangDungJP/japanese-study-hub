import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Headphones, BookOpen, PenTool, FileText, HelpCircle, 
  Loader2, X, Eye, EyeOff, Save, GripVertical, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MediaUploader from '@/components/shared/MediaUploader';
import { cn } from '@/lib/utils';

interface Exercise {
  id?: string;
  lesson_id: string;
  exercise_type: string;
  title: string;
  title_vi: string;
  instructions: string;
  instructions_vi: string;
  content: any;
  audio_url: string;
  correct_answers: any;
  explanation: any;
  requires_grading: boolean;
  order_index: number;
}

interface ExerciseEditorProps {
  lessonId: string;
  exercise?: Exercise | null;
  onSave: () => void;
  onCancel: () => void;
}

const exerciseTypes = [
  { value: 'reading', label: 'Bài đọc hiểu', icon: BookOpen, color: 'text-blue-500', description: 'Đọc văn bản và trả lời câu hỏi' },
  { value: 'listening', label: 'Nghe hiểu', icon: Headphones, color: 'text-orange-500', description: 'Nghe audio và trả lời câu hỏi' },
  { value: 'writing', label: 'Bài viết', icon: PenTool, color: 'text-purple-500', description: 'Viết bài theo đề bài cho trước' },
  { value: 'vocabulary', label: 'Từ vựng Flashcard', icon: FileText, color: 'text-green-500', description: 'Học từ vựng với flashcard' },
  { value: 'multiple_choice', label: 'Trắc nghiệm', icon: HelpCircle, color: 'text-pink-500', description: 'Câu hỏi trắc nghiệm 4 đáp án' },
  { value: 'fill_blank', label: 'Điền chỗ trống', icon: FileText, color: 'text-cyan-500', description: 'Điền từ vào chỗ trống' },
  { value: 'matching', label: 'Nối cặp', icon: FileText, color: 'text-yellow-500', description: 'Nối các cặp tương ứng' },
  { value: 'sentence_order', label: 'Sắp xếp câu', icon: FileText, color: 'text-indigo-500', description: 'Sắp xếp từ thành câu đúng' },
];

const ExerciseEditor = ({ lessonId, exercise, onSave, onCancel }: ExerciseEditorProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('type');
  
  const [formData, setFormData] = useState<Exercise>({
    lesson_id: lessonId,
    exercise_type: exercise?.exercise_type || 'vocabulary',
    title: exercise?.title || '',
    title_vi: exercise?.title_vi || '',
    instructions: exercise?.instructions || '',
    instructions_vi: exercise?.instructions_vi || '',
    content: exercise?.content || {},
    audio_url: exercise?.audio_url || '',
    correct_answers: exercise?.correct_answers || [],
    explanation: exercise?.explanation || {},
    requires_grading: exercise?.requires_grading || false,
    order_index: exercise?.order_index || 0,
  });

  // Content states for different exercise types
  const [readingText, setReadingText] = useState(exercise?.content?.text || '');
  const [readingTextVi, setReadingTextVi] = useState(exercise?.content?.text_vi || '');
  const [questions, setQuestions] = useState<any[]>(exercise?.content?.questions || []);
  const [vocabItems, setVocabItems] = useState<any[]>(exercise?.content?.items || []);
  const [writingPrompt, setWritingPrompt] = useState(exercise?.content?.prompt || '');
  const [writingPromptVi, setWritingPromptVi] = useState(exercise?.content?.prompt_vi || '');
  const [wordLimit, setWordLimit] = useState(exercise?.content?.word_limit || 200);
  const [fillBlankItems, setFillBlankItems] = useState<any[]>(exercise?.content?.items || []);
  const [matchingPairs, setMatchingPairs] = useState<any[]>(exercise?.content?.pairs || []);
  const [sentenceOrderItems, setSentenceOrderItems] = useState<any[]>(exercise?.content?.items || []);
  const [audioTranscript, setAudioTranscript] = useState(exercise?.content?.transcript || '');
  const [audioTranscriptVi, setAudioTranscriptVi] = useState(exercise?.content?.transcript_vi || '');

  // Expanded states for collapsible items
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Question helpers
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      question_vi: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
      explanation_vi: ''
    };
    setQuestions([...questions, newQuestion]);
    setExpandedItems(new Set([questions.length]));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Vocabulary helpers
  const addVocabItem = () => {
    const newItem = {
      id: Date.now(),
      word: '',
      meaning: '',
      meaning_vi: '',
      pronunciation: '',
      example: '',
      example_vi: ''
    };
    setVocabItems([...vocabItems, newItem]);
    setExpandedItems(new Set([vocabItems.length]));
  };

  const updateVocabItem = (index: number, field: string, value: string) => {
    const updated = [...vocabItems];
    updated[index] = { ...updated[index], [field]: value };
    setVocabItems(updated);
  };

  const removeVocabItem = (index: number) => {
    setVocabItems(vocabItems.filter((_, i) => i !== index));
  };

  // Fill blank helpers
  const addFillBlankItem = () => {
    const newItem = {
      id: Date.now(),
      sentence: '',
      answer: '',
      hint: ''
    };
    setFillBlankItems([...fillBlankItems, newItem]);
    setExpandedItems(new Set([fillBlankItems.length]));
  };

  const updateFillBlankItem = (index: number, field: string, value: string) => {
    const updated = [...fillBlankItems];
    updated[index] = { ...updated[index], [field]: value };
    setFillBlankItems(updated);
  };

  const removeFillBlankItem = (index: number) => {
    setFillBlankItems(fillBlankItems.filter((_, i) => i !== index));
  };

  // Matching helpers
  const addMatchingPair = () => {
    const newPair = { id: Date.now(), left: '', right: '' };
    setMatchingPairs([...matchingPairs, newPair]);
  };

  const updateMatchingPair = (index: number, field: string, value: string) => {
    const updated = [...matchingPairs];
    updated[index] = { ...updated[index], [field]: value };
    setMatchingPairs(updated);
  };

  const removeMatchingPair = (index: number) => {
    setMatchingPairs(matchingPairs.filter((_, i) => i !== index));
  };

  // Sentence order helpers
  const addSentenceOrderItem = () => {
    const newItem = {
      id: Date.now(),
      correctOrder: [],
      translation: ''
    };
    setSentenceOrderItems([...sentenceOrderItems, newItem]);
    setExpandedItems(new Set([sentenceOrderItems.length]));
  };

  const updateSentenceOrderItem = (index: number, field: string, value: any) => {
    const updated = [...sentenceOrderItems];
    updated[index] = { ...updated[index], [field]: value };
    setSentenceOrderItems(updated);
  };

  const removeSentenceOrderItem = (index: number) => {
    setSentenceOrderItems(sentenceOrderItems.filter((_, i) => i !== index));
  };

  const buildContent = () => {
    switch (formData.exercise_type) {
      case 'reading':
        return { text: readingText, text_vi: readingTextVi, questions };
      case 'listening':
        return { audio_url: formData.audio_url, transcript: audioTranscript, transcript_vi: audioTranscriptVi, questions };
      case 'writing':
        return { prompt: writingPrompt, prompt_vi: writingPromptVi, word_limit: wordLimit };
      case 'vocabulary':
        return { items: vocabItems };
      case 'multiple_choice':
        return { questions };
      case 'fill_blank':
        return { items: fillBlankItems };
      case 'matching':
        return { pairs: matchingPairs };
      case 'sentence_order':
        return { items: sentenceOrderItems };
      default:
        return {};
    }
  };

  const buildCorrectAnswers = () => {
    switch (formData.exercise_type) {
      case 'multiple_choice':
      case 'reading':
      case 'listening':
        return questions.map(q => ({ question_id: q.id, correct_index: q.correct_index }));
      case 'vocabulary':
        return vocabItems.map(v => ({ word: v.word, meaning_vi: v.meaning_vi }));
      case 'fill_blank':
        return fillBlankItems.map(s => ({ id: s.id, answer: s.answer }));
      case 'matching':
        return matchingPairs.map(p => ({ id: p.id, left: p.left, right: p.right }));
      case 'sentence_order':
        return sentenceOrderItems.map(s => ({ id: s.id, correctOrder: s.correctOrder }));
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const exerciseData = {
        ...formData,
        content: buildContent(),
        correct_answers: buildCorrectAnswers(),
        requires_grading: formData.exercise_type === 'writing',
      };

      if (exercise?.id) {
        const { error } = await supabase
          .from('exercises')
          .update(exerciseData)
          .eq('id', exercise.id);
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật bài tập' });
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert([exerciseData]);
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã tạo bài tập mới' });
      }

      onSave();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const currentType = exerciseTypes.find(t => t.value === formData.exercise_type);
  const TypeIcon = currentType?.icon || BookOpen;

  const getItemCount = () => {
    switch (formData.exercise_type) {
      case 'vocabulary': return vocabItems.length;
      case 'multiple_choice':
      case 'reading':
      case 'listening': return questions.length;
      case 'fill_blank': return fillBlankItems.length;
      case 'matching': return matchingPairs.length;
      case 'sentence_order': return sentenceOrderItems.length;
      default: return 0;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 
            currentType?.color.replace('text-', 'bg-').replace('500', '500/10')
          )}>
            <TypeIcon className={cn('w-5 h-5', currentType?.color)} />
          </div>
          <div>
            <h3 className="font-semibold">{exercise?.id ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</h3>
            <p className="text-sm text-muted-foreground">{currentType?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={showPreview} onCheckedChange={setShowPreview} />
            <span className="text-muted-foreground">{showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</span>
          </div>
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>

      <div className={cn('grid gap-6', showPreview ? 'lg:grid-cols-2' : 'grid-cols-1')}>
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="type">Loại bài tập</TabsTrigger>
              <TabsTrigger value="info">Thông tin</TabsTrigger>
              <TabsTrigger value="content">
                Nội dung
                {getItemCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">{getItemCount()}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab: Exercise Type */}
            <TabsContent value="type" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {exerciseTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, exercise_type: type.value })}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left',
                      formData.exercise_type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/50 hover:bg-muted'
                    )}
                  >
                    <type.icon className={cn('w-5 h-5 mt-0.5', type.color)} />
                    <div>
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Basic Info */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tiêu đề bài tập</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiếng Anh</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Exercise title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tiếng Việt</Label>
                      <Input
                        value={formData.title_vi}
                        onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
                        placeholder="Tên bài tập"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Hướng dẫn làm bài</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Instructions in English..."
                      rows={3}
                    />
                    <Textarea
                      value={formData.instructions_vi}
                      onChange={(e) => setFormData({ ...formData, instructions_vi: e.target.value })}
                      placeholder="Hướng dẫn bằng tiếng Việt..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Audio for listening */}
              {formData.exercise_type === 'listening' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-orange-500" />
                      File Audio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MediaUploader
                      value={formData.audio_url}
                      onChange={(url) => setFormData({ ...formData, audio_url: url })}
                      accept="both"
                      folder="lesson-audio"
                      placeholder="Upload file audio bài nghe"
                      aspectRatio="banner"
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Transcript (lời thoại)</Label>
                      <Textarea
                        value={audioTranscript}
                        onChange={(e) => setAudioTranscript(e.target.value)}
                        placeholder="Nội dung audio..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Content - varies by type */}
            <TabsContent value="content" className="space-y-4 mt-4">
              
              {/* VOCABULARY */}
              {formData.exercise_type === 'vocabulary' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-500" />
                        Danh sách từ vựng ({vocabItems.length})
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addVocabItem}>
                        <Plus className="w-4 h-4 mr-1" /> Thêm từ
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vocabItems.map((item, index) => (
                      <Collapsible key={item.id} open={expandedItems.has(index)}>
                        <div className="border rounded-lg">
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              onClick={() => toggleExpand(index)}
                              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{item.word || `Từ #${index + 1}`}</span>
                                {item.meaning_vi && (
                                  <span className="text-sm text-muted-foreground">• {item.meaning_vi}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => { e.stopPropagation(); removeVocabItem(index); }}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                                {expandedItems.has(index) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 pt-0 space-y-3 border-t">
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  placeholder="Từ vựng (日本語/English)"
                                  value={item.word}
                                  onChange={(e) => updateVocabItem(index, 'word', e.target.value)}
                                />
                                <Input
                                  placeholder="Nghĩa tiếng Việt"
                                  value={item.meaning_vi}
                                  onChange={(e) => updateVocabItem(index, 'meaning_vi', e.target.value)}
                                />
                              </div>
                              <Input
                                placeholder="Phiên âm / Romaji / Hiragana"
                                value={item.pronunciation}
                                onChange={(e) => updateVocabItem(index, 'pronunciation', e.target.value)}
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <Textarea
                                  placeholder="Ví dụ câu"
                                  value={item.example}
                                  onChange={(e) => updateVocabItem(index, 'example', e.target.value)}
                                  rows={2}
                                />
                                <Textarea
                                  placeholder="Dịch ví dụ"
                                  value={item.example_vi}
                                  onChange={(e) => updateVocabItem(index, 'example_vi', e.target.value)}
                                  rows={2}
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                    {vocabItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Chưa có từ vựng. Nhấn "Thêm từ" để bắt đầu.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* MULTIPLE CHOICE */}
              {formData.exercise_type === 'multiple_choice' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-pink-500" />
                        Câu hỏi trắc nghiệm ({questions.length})
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <Plus className="w-4 h-4 mr-1" /> Thêm câu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {questions.map((q, qIndex) => (
                      <Collapsible key={q.id} open={expandedItems.has(qIndex)}>
                        <div className="border rounded-lg">
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              onClick={() => toggleExpand(qIndex)}
                              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                  {qIndex + 1}
                                </span>
                                <span className="font-medium truncate max-w-[300px]">
                                  {q.question || `Câu hỏi #${qIndex + 1}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => { e.stopPropagation(); removeQuestion(qIndex); }}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                                {expandedItems.has(qIndex) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-3 pt-0 space-y-3 border-t">
                              <div className="grid grid-cols-2 gap-3">
                                <Textarea
                                  placeholder="Câu hỏi (EN/JP)"
                                  value={q.question}
                                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                  rows={2}
                                />
                                <Textarea
                                  placeholder="Câu hỏi (VI)"
                                  value={q.question_vi}
                                  onChange={(e) => updateQuestion(qIndex, 'question_vi', e.target.value)}
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Các đáp án (chọn đáp án đúng):</Label>
                                {q.options.map((opt: string, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-${q.id}`}
                                      checked={q.correct_index === optIndex}
                                      onChange={() => updateQuestion(qIndex, 'correct_index', optIndex)}
                                      className="w-4 h-4 accent-primary"
                                    />
                                    <Input
                                      placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
                                      value={opt}
                                      onChange={(e) => {
                                        const newOptions = [...q.options];
                                        newOptions[optIndex] = e.target.value;
                                        updateQuestion(qIndex, 'options', newOptions);
                                      }}
                                      className={cn(
                                        q.correct_index === optIndex && 'border-green-500 bg-green-500/5'
                                      )}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                  <Lightbulb className="w-3 h-3" /> Giải thích (tùy chọn)
                                </Label>
                                <Textarea
                                  placeholder="Giải thích tại sao đáp án đúng..."
                                  value={q.explanation_vi}
                                  onChange={(e) => updateQuestion(qIndex, 'explanation_vi', e.target.value)}
                                  rows={2}
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                    {questions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Chưa có câu hỏi. Nhấn "Thêm câu" để bắt đầu.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* READING */}
              {formData.exercise_type === 'reading' && (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        Nội dung bài đọc
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Bài đọc gốc</Label>
                        <Textarea
                          value={readingText}
                          onChange={(e) => setReadingText(e.target.value)}
                          placeholder="Nhập nội dung bài đọc..."
                          rows={8}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Bản dịch tiếng Việt (tùy chọn)</Label>
                        <Textarea
                          value={readingTextVi}
                          onChange={(e) => setReadingTextVi(e.target.value)}
                          placeholder="Bản dịch..."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Câu hỏi đọc hiểu ({questions.length})</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                          <Plus className="w-4 h-4 mr-1" /> Thêm câu
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {questions.map((q, qIndex) => (
                        <div key={q.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Câu {qIndex + 1}</span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Câu hỏi"
                            value={q.question}
                            onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                            rows={2}
                          />
                          <div className="space-y-2">
                            {q.options.map((opt: string, optIndex: number) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`reading-correct-${q.id}`}
                                  checked={q.correct_index === optIndex}
                                  onChange={() => updateQuestion(qIndex, 'correct_index', optIndex)}
                                  className="w-4 h-4 accent-primary"
                                />
                                <Input
                                  placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...q.options];
                                    newOptions[optIndex] = e.target.value;
                                    updateQuestion(qIndex, 'options', newOptions);
                                  }}
                                  className={cn(q.correct_index === optIndex && 'border-green-500')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* LISTENING */}
              {formData.exercise_type === 'listening' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Câu hỏi nghe hiểu ({questions.length})</CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <Plus className="w-4 h-4 mr-1" /> Thêm câu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {questions.map((q, qIndex) => (
                      <div key={q.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Câu {qIndex + 1}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Câu hỏi"
                          value={q.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          rows={2}
                        />
                        <div className="space-y-2">
                          {q.options.map((opt: string, optIndex: number) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`listening-correct-${q.id}`}
                                checked={q.correct_index === optIndex}
                                onChange={() => updateQuestion(qIndex, 'correct_index', optIndex)}
                                className="w-4 h-4 accent-primary"
                              />
                              <Input
                                placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...q.options];
                                  newOptions[optIndex] = e.target.value;
                                  updateQuestion(qIndex, 'options', newOptions);
                                }}
                                className={cn(q.correct_index === optIndex && 'border-green-500')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* WRITING */}
              {formData.exercise_type === 'writing' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-purple-500" />
                      Đề bài viết
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg">
                      <Checkbox
                        checked={formData.requires_grading}
                        onCheckedChange={(checked) => setFormData({ ...formData, requires_grading: !!checked })}
                      />
                      <label className="text-sm">Yêu cầu giáo viên chấm bài</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Đề bài gốc</Label>
                        <Textarea
                          value={writingPrompt}
                          onChange={(e) => setWritingPrompt(e.target.value)}
                          placeholder="Write about..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Đề bài tiếng Việt</Label>
                        <Textarea
                          value={writingPromptVi}
                          onChange={(e) => setWritingPromptVi(e.target.value)}
                          placeholder="Viết về..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Giới hạn từ</Label>
                      <Input
                        type="number"
                        value={wordLimit}
                        onChange={(e) => setWordLimit(parseInt(e.target.value) || 200)}
                        min={50}
                        max={2000}
                        className="w-32"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* FILL BLANK */}
              {formData.exercise_type === 'fill_blank' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-500" />
                        Câu điền chỗ trống ({fillBlankItems.length})
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addFillBlankItem}>
                        <Plus className="w-4 h-4 mr-1" /> Thêm câu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      💡 Sử dụng <code className="bg-muted px-1 rounded font-mono">___</code> để đánh dấu chỗ trống
                    </p>
                    {fillBlankItems.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Câu #{index + 1}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeFillBlankItem(index)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="VD: The cat ___ on the mat."
                          value={item.sentence}
                          onChange={(e) => updateFillBlankItem(index, 'sentence', e.target.value)}
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Đáp án đúng"
                            value={item.answer}
                            onChange={(e) => updateFillBlankItem(index, 'answer', e.target.value)}
                          />
                          <Input
                            placeholder="Gợi ý (tùy chọn)"
                            value={item.hint}
                            onChange={(e) => updateFillBlankItem(index, 'hint', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                    {fillBlankItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có câu nào. Nhấn "Thêm câu" để bắt đầu.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* MATCHING */}
              {formData.exercise_type === 'matching' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-yellow-500" />
                        Các cặp nối ({matchingPairs.length})
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addMatchingPair}>
                        <Plus className="w-4 h-4 mr-1" /> Thêm cặp
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {matchingPairs.map((pair, index) => (
                      <div key={pair.id} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <Input
                          placeholder="Vế trái"
                          value={pair.left}
                          onChange={(e) => updateMatchingPair(index, 'left', e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-muted-foreground">↔</span>
                        <Input
                          placeholder="Vế phải"
                          value={pair.right}
                          onChange={(e) => updateMatchingPair(index, 'right', e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeMatchingPair(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {matchingPairs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có cặp nào. Nhấn "Thêm cặp" để bắt đầu.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* SENTENCE ORDER */}
              {formData.exercise_type === 'sentence_order' && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Câu sắp xếp ({sentenceOrderItems.length})
                      </CardTitle>
                      <Button type="button" variant="outline" size="sm" onClick={addSentenceOrderItem}>
                        <Plus className="w-4 h-4 mr-1" /> Thêm câu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      💡 Nhập các từ của câu đúng, cách nhau bởi dấu phẩy hoặc dấu cách
                    </p>
                    {sentenceOrderItems.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Câu #{index + 1}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSentenceOrderItem(index)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          placeholder="VD: I, love, learning, Japanese (các từ cách bởi dấu phẩy)"
                          value={Array.isArray(item.correctOrder) ? item.correctOrder.join(', ') : ''}
                          onChange={(e) => {
                            const words = e.target.value.split(',').map((w: string) => w.trim()).filter(Boolean);
                            updateSentenceOrderItem(index, 'correctOrder', words);
                          }}
                        />
                        <Input
                          placeholder="Dịch nghĩa (tùy chọn)"
                          value={item.translation || ''}
                          onChange={(e) => updateSentenceOrderItem(index, 'translation', e.target.value)}
                        />
                      </div>
                    ))}
                    {sentenceOrderItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Chưa có câu nào. Nhấn "Thêm câu" để bắt đầu.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="sticky top-4">
            <Card>
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Xem trước bài tập
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                      currentType?.color.replace('text-', 'bg-').replace('500', '500/10')
                    )}>
                      <TypeIcon className={cn('w-5 h-5', currentType?.color)} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{formData.title_vi || formData.title || 'Tên bài tập'}</h4>
                      <p className="text-xs text-muted-foreground">{currentType?.label}</p>
                    </div>
                  </div>
                  
                  {formData.instructions_vi && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {formData.instructions_vi}
                    </p>
                  )}

                  <div className="text-sm">
                    <p className="text-muted-foreground mb-2">Số lượng:</p>
                    <Badge variant="secondary">{getItemCount()} {
                      formData.exercise_type === 'vocabulary' ? 'từ vựng' :
                      formData.exercise_type === 'matching' ? 'cặp' :
                      'câu'
                    }</Badge>
                  </div>

                  {formData.exercise_type === 'vocabulary' && vocabItems.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Xem trước từ vựng:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {vocabItems.slice(0, 5).map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span className="font-medium">{item.word}</span>
                            <span className="text-muted-foreground">{item.meaning_vi}</span>
                          </div>
                        ))}
                        {vocabItems.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">+{vocabItems.length - 5} từ khác</p>
                        )}
                      </div>
                    </div>
                  )}

                  {formData.exercise_type === 'matching' && matchingPairs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Xem trước cặp nối:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {matchingPairs.slice(0, 5).map((pair, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                            <span className="font-medium flex-1">{pair.left}</span>
                            <span className="text-muted-foreground">↔</span>
                            <span className="flex-1 text-right">{pair.right}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </form>
  );
};

export default ExerciseEditor;

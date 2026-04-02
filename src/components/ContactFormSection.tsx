import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, CheckCircle } from 'lucide-react';

type FormField = {
  id: string;
  label: string;
  label_vi: string;
  field_type: string;
  placeholder: string | null;
  placeholder_vi: string | null;
  is_required: boolean | null;
  options: any;
  order_index: number | null;
};

interface ContactFormSectionProps {
  variant?: 'default' | 'compact';
}

const ContactFormSection = ({ variant = 'default' }: ContactFormSectionProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: fields = [] } = useQuery({
    queryKey: ['contact-form-fields-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_form_fields')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return data as FormField[];
    },
  });

  if (fields.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const field of fields) {
      if (field.is_required && !formData[field.label_vi]?.trim()) {
        toast.error(`Vui lòng nhập ${field.label_vi}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('contact_submissions').insert({ data: formData });
      if (error) throw error;
      setSubmitted(true);
      setFormData({});
      toast.success('Gửi thông tin thành công!');
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const isCompact = variant === 'compact';

  const renderField = (field: FormField) => {
    const key = field.label_vi;
    const value = formData[key] || '';
    const inputClass = isCompact
      ? "bg-white border-0 shadow-sm focus:ring-2 focus:ring-primary/30 rounded-xl h-12 text-base"
      : "bg-background/50 border-border/50 focus:border-primary";

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder_vi || field.placeholder || ''}
            value={value}
            onChange={e => updateField(key, e.target.value)}
            required={field.is_required ?? false}
            className={inputClass}
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={v => updateField(key, v)}>
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder={field.placeholder_vi || 'Chọn...'} />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(field.options) ? field.options : []).map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
            placeholder={field.placeholder_vi || field.placeholder || ''}
            value={value}
            onChange={e => updateField(key, e.target.value)}
            required={field.is_required ?? false}
            className={inputClass}
          />
        );
    }
  };

  if (submitted) {
    return (
      <div className={isCompact ? "text-center space-y-4 py-6" : "py-24"}>
        <div className={isCompact ? "" : "container mx-auto px-4"}>
          <div className={isCompact ? "space-y-4" : "max-w-xl mx-auto text-center space-y-4"}>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className={`font-bold ${isCompact ? 'text-xl text-foreground' : 'text-2xl text-foreground'}`}>Cảm ơn bạn!</h2>
            <p className="text-muted-foreground">Chúng tôi đã nhận được thông tin và sẽ liên hệ lại sớm nhất.</p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>Gửi thêm</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map(field => (
          <div key={field.id} className="space-y-1.5">
            <Label className="text-foreground font-bold text-base">
              {field.label_vi}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
        <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl" size="lg" disabled={submitting}>
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Đang gửi...' : 'Gửi thông tin'}
        </Button>
      </form>
    );
  }

  return (
    <section id="contact" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Liên hệ với chúng tôi</h2>
            <p className="text-muted-foreground text-lg">Để lại thông tin, chúng tôi sẽ liên hệ tư vấn miễn phí</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            {fields.map(field => (
              <div key={field.id} className="space-y-2">
                <Label className="text-foreground font-medium">
                  {field.label_vi}
                  {field.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Đang gửi...' : 'Gửi thông tin'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactFormSection;

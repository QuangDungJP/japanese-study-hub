import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

const FAQSection = () => {
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as FAQ[];
    },
  });

  if (faqs.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Hỏi & Đáp
            </h2>
            <p className="text-muted-foreground">
              Bạn có thể gửi thêm câu trả lời cho giáo viên khi là học viên tại TNQDO. Hoặc câu hỏi liên quan về khóa học và ứng dụng của tiếng Nhật, hãy gửi câu hỏi cho bộ phận CSKH{' '}
              <Link to="/faq" className="text-primary underline hover:opacity-80">
                Tại đây
              </Link>.
            </p>
          </div>

          {/* FAQ Items */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-0"
              >
                <AccordionTrigger className="hover:no-underline px-6 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base md:text-lg data-[state=open]:rounded-b-none [&>svg]:text-primary-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="bg-card border border-t-0 border-border/50 rounded-b-xl px-6 py-5 text-foreground leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

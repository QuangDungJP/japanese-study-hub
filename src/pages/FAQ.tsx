import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HelpCircle, Search } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ScrollReveal from '@/components/ScrollReveal';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: faqs = [], isLoading } = useQuery({
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

  const filteredFaqs = searchQuery
    ? faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">FAQ</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Câu hỏi <span className="text-gradient">thường gặp</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Tìm câu trả lời cho những thắc mắc phổ biến về LinguaViet
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg rounded-2xl border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredFaqs.map((faq, i) => (
                  <ScrollReveal key={faq.id} delay={i * 80} direction="up">
                    <AccordionItem
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
                  </ScrollReveal>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{searchQuery ? 'Không tìm thấy kết quả. Hãy thử từ khóa khác.' : 'Chưa có câu hỏi nào.'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <ScrollReveal>
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Vẫn cần hỗ trợ?</h2>
              <p className="text-muted-foreground mb-8">
                Nếu bạn không tìm thấy câu trả lời, đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ
              </p>
              <a
                href="mailto:support@linguaviet.com"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Liên hệ hỗ trợ
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <Footer />
    </div>
  );
};

export default FAQPage;

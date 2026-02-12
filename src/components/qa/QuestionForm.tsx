import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCirclePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuestionFormProps {
  onQuestionAdded: () => void;
}

export function QuestionForm({ onQuestionAdded }: QuestionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !question.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('questions').insert({
        user_id: user.id,
        content_type: 'book', // Default value since content_type is required
        question: question.trim(),
      });

      if (error) throw error;

      toast({
        title: t('qa.form.successTitle'),
        description: t('qa.form.successDesc'),
      });
      setQuestion('');
      onQuestionAdded();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast({
        title: t('qa.form.errorTitle'),
        description: t('qa.form.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t('qa.form.loginToAsk')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={t('qa.form.placeholder')}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="min-h-[80px]"
      />
      <Button type="submit" disabled={isSubmitting || !question.trim()}>
        <MessageCirclePlus className="h-4 w-4 mr-2" />
        {isSubmitting ? t('qa.form.submitting') : t('qa.form.submit')}
      </Button>
    </form>
  );
}

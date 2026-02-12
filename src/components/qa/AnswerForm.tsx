import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnswerFormProps {
  questionId: string;
  onAnswerAdded: () => void;
}

export function AnswerForm({ questionId, onAnswerAdded }: AnswerFormProps) {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = role === 'admin';
  const isContributor = role === 'contributor';
  const canAnswer = isAdmin || isContributor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !answer.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('answers').insert({
        question_id: questionId,
        answered_by: user.id,
        answer: answer.trim(),
        status: isAdmin ? 'approved' : 'pending',
        approved_at: isAdmin ? new Date().toISOString() : null,
      });

      if (error) throw error;

      toast({
        title: isAdmin ? t('qa.answerForm.answerPosted') : t('qa.answerForm.answerSubmitted'),
        description: isAdmin
          ? t('qa.form.successDesc')
          : t('qa.answerForm.answerSubmittedDesc'),
      });
      setAnswer('');
      onAnswerAdded();
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: t('qa.form.errorTitle'),
        description: t('qa.form.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canAnswer) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-3">
      <Textarea
        placeholder={t('qa.answerForm.placeholder')}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="min-h-[60px] text-sm"
      />
      <Button type="submit" size="sm" disabled={isSubmitting || !answer.trim()}>
        <Send className="h-3 w-3 mr-1" />
        {isSubmitting ? t('qa.form.submitting') : isAdmin ? t('qa.answerForm.postAnswer') : t('qa.answerForm.submitForReview')}
      </Button>
    </form>
  );
}

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface QuestionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  currentQuestion: string;
  onQuestionUpdated: () => void;
}

export function QuestionEditDialog({
  open,
  onOpenChange,
  questionId,
  currentQuestion,
  onQuestionUpdated,
}: QuestionEditDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [question, setQuestion] = useState(currentQuestion);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({ question: question.trim() })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: t('qa.list.questionUpdated'),
        description: t('qa.list.updatedSuccess'),
      });
      onQuestionUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: t('qa.form.errorTitle'),
        description: t('qa.form.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('qa.list.editTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px]"
            placeholder={t('qa.form.placeholder')}
          />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('moderation.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !question.trim()}>
              {isSubmitting ? t('settings.profile.saving') : t('moderation.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
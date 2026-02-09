import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, MessageCircle } from 'lucide-react';

interface PendingAnswer {
  id: string;
  answer: string;
  created_at: string;
  question_id: string;
  question?: {
    question: string;
    content_type: string;
  };
}

export function PendingAnswersList() {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<PendingAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingAnswers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch associated questions
      if (data && data.length > 0) {
        const questionIds = [...new Set(data.map(a => a.question_id))];
        const { data: questionsData } = await supabase
          .from('questions')
          .select('id, question, content_type')
          .in('id', questionIds);

        const questionsMap = new Map(questionsData?.map(q => [q.id, q]) || []);
        const answersWithQuestions = data.map(answer => ({
          ...answer,
          question: questionsMap.get(answer.question_id),
        }));
        setAnswers(answersWithQuestions);
      } else {
        setAnswers([]);
      }
    } catch (error) {
      console.error('Error fetching pending answers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAnswers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('answers')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Answer approved', description: 'The answer is now visible.' });
      fetchPendingAnswers();
    } catch (error) {
      console.error('Error approving answer:', error);
      toast({ title: 'Error', description: 'Failed to approve answer.', variant: 'destructive' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('answers')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Answer rejected', description: 'The answer has been rejected.' });
      fetchPendingAnswers();
    } catch (error) {
      console.error('Error rejecting answer:', error);
      toast({ title: 'Error', description: 'Failed to reject answer.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (answers.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No pending answers to review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Pending Answers ({answers.length})</h3>
      {answers.map(answer => (
        <Card key={answer.id} className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Question: {answer.question?.question || 'Unknown'}
              </CardTitle>
              <Badge variant="outline">{answer.question?.content_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm">{answer.answer}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(answer.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleReject(answer.id)}>
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => handleApprove(answer.id)}>
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

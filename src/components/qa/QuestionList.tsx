 import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Loader2, MessageCircle, User, Calendar, Pencil, Trash2, Search } from 'lucide-react';
import { AnswerForm } from './AnswerForm';
 import { QuestionEditDialog } from './QuestionEditDialog';
 import { useToast } from '@/hooks/use-toast';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';

interface Question {
  id: string;
  question: string;
  created_at: string;
  user_id: string;
}

interface Answer {
  id: string;
  answer: string;
  status: string;
  created_at: string;
  answered_by: string;
}

interface QuestionListProps {
  refreshTrigger: number;
}

 export function QuestionList({ refreshTrigger }: QuestionListProps) {
   const { user, role } = useAuth();
   const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
   const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
   const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = role === 'admin';
  const isContributor = role === 'contributor';

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch questions
      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (qError) throw qError;

      setQuestions(questionsData || []);

      // Fetch answers for each question
      if (questionsData && questionsData.length > 0) {
        const questionIds = questionsData.map(q => q.id);
        const { data: answersData, error: aError } = await supabase
          .from('answers')
          .select('*')
          .in('question_id', questionIds)
          .order('created_at', { ascending: true });

        if (aError) throw aError;

        // Group answers by question
        const groupedAnswers: Record<string, Answer[]> = {};
        (answersData || []).forEach(answer => {
          if (!groupedAnswers[answer.question_id]) {
            groupedAnswers[answer.question_id] = [];
          }
          groupedAnswers[answer.question_id].push(answer);
        });
        setAnswers(groupedAnswers);
      }
    } catch (error) {
      console.error('Error fetching Q&A:', error);
    } finally {
      setLoading(false);
    }
  };

   const handleDeleteQuestion = async () => {
     if (!deletingQuestionId) return;
 
     try {
       const { error } = await supabase
         .from('questions')
         .delete()
         .eq('id', deletingQuestionId);
 
       if (error) throw error;
 
       toast({
         title: 'Question deleted',
         description: 'Your question has been deleted successfully.',
       });
       fetchData();
     } catch (error) {
       console.error('Error deleting question:', error);
       toast({
         title: 'Error',
         description: 'Failed to delete question. Please try again.',
         variant: 'destructive',
       });
     } finally {
       setDeletingQuestionId(null);
     }
   };
 
   const canEditDelete = (question: Question) => {
     // User can edit/delete their own question only if it has no answers
     return user?.id === question.user_id && (!answers[question.id] || answers[question.id].length === 0);
   };
 
   // Filter questions based on search query
   const filteredQuestions = questions.filter(question =>
     question.question.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
  useEffect(() => {
    fetchData();
   }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

   if (questions.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No questions yet. Be the first to ask!</p>
      </div>
    );
  }

  return (
     <div className="space-y-4">
       {/* Search Input */}
       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
         <Input
           placeholder="Search questions..."
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="pl-9"
         />
       </div>
 
       {filteredQuestions.length === 0 ? (
         <div className="text-center py-8 text-muted-foreground">
           <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
           <p>{searchQuery ? 'No questions match your search.' : 'No questions yet. Be the first to ask!'}</p>
         </div>
       ) : (
         filteredQuestions.map(question => (
        <Card key={question.id} className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                 <div className="flex items-start justify-between gap-2">
                   <p className="font-medium text-foreground">{question.question}</p>
                   {canEditDelete(question) && (
                     <div className="flex items-center gap-1 flex-shrink-0">
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-7 w-7"
                         onClick={() => setEditingQuestion(question)}
                       >
                         <Pencil className="h-3.5 w-3.5" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-7 w-7 text-destructive hover:text-destructive"
                         onClick={() => setDeletingQuestionId(question.id)}
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </Button>
                     </div>
                   )}
                 </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(question.created_at).toLocaleDateString()}
                </p>

                {/* Answers */}
                {answers[question.id]?.length > 0 && (
                  <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/20">
                    {answers[question.id].map(answer => (
                      <div key={answer.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {answer.status === 'approved' ? 'Answer' : 'Pending'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(answer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{answer.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer form for admin/contributor */}
                {(isAdmin || isContributor) && (
                  <AnswerForm questionId={question.id} onAnswerAdded={fetchData} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
         ))
       )}
 
       {/* Edit Dialog */}
       {editingQuestion && (
         <QuestionEditDialog
           open={!!editingQuestion}
           onOpenChange={(open) => !open && setEditingQuestion(null)}
           questionId={editingQuestion.id}
           currentQuestion={editingQuestion.question}
           onQuestionUpdated={fetchData}
         />
       )}
 
       {/* Delete Confirmation */}
       <AlertDialog open={!!deletingQuestionId} onOpenChange={(open) => !open && setDeletingQuestionId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Question?</AlertDialogTitle>
             <AlertDialogDescription>
               This action cannot be undone. Your question will be permanently deleted.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}

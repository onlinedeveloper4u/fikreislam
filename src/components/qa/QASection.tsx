import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionForm } from './QuestionForm';
import { QuestionList } from './QuestionList';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QASectionProps {
  title?: string;
}

export function QASection({ title }: QASectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useTranslation();

  const handleQuestionAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HelpCircle className="h-5 w-5 text-primary" />
          {title || t('qa.sectionTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <QuestionForm onQuestionAdded={handleQuestionAdded} />
        <QuestionList refreshTrigger={refreshTrigger} />
      </CardContent>
    </Card>
  );
}

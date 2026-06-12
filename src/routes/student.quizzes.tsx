import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { getStudentQuizzes, submitQuizResponse, type Quiz } from "@/lib/quiz-api";
import { toast } from "sonner";
import { HelpCircle, CheckCircle, X } from "lucide-react";

export const Route = createFileRoute("/student/quizzes")({
  head: () => ({ meta: [{ title: "Polls & Quizzes · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Local state to hold the currently selected option before submitting
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await getStudentQuizzes();
      setQuizzes(data);
    } catch (err) {
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (quizId: string, optionIndex: number) => {
    setSelectedOptions(prev => ({ ...prev, [quizId]: optionIndex }));
  };

  const handleSubmit = async (quizId: string) => {
    const selectedOptionIndex = selectedOptions[quizId];
    if (selectedOptionIndex === undefined) return;

    setSubmitting(quizId);
    try {
      const result = await submitQuizResponse(quizId, selectedOptionIndex);
      
      // Update the local quiz state to reflect it's been answered
      setQuizzes(prev => prev.map(q => {
        if (q._id === quizId) {
          return {
            ...q,
            hasResponded: true,
            selectedOptionIndex: result.selectedOptionIndex,
            correctOptionIndex: result.correctOptionIndex
          };
        }
        return q;
      }));
      toast.success("Response submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit response");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Polls & Quizzes"
        subtitle="Participate in live class polls and answer quizzes assigned by your teachers."
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground border border-dashed border-border rounded-xl">
            <HelpCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold">No active quizzes.</p>
            <p className="text-sm">When a teacher creates a poll for your class, it will appear here.</p>
          </div>
        ) : (
          quizzes.map((quiz) => {
            const isAnswered = quiz.hasResponded;
            const myAnswer = quiz.selectedOptionIndex;
            const correctAnswer = quiz.correctOptionIndex;
            const isCorrect = isAnswered && myAnswer === correctAnswer;

            return (
              <div key={quiz._id} className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
                <div className={`p-6 border-b border-border ${isAnswered ? (isCorrect ? 'bg-emerald-500/5' : 'bg-red-500/5') : 'bg-card'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      Teacher {quiz.teacherId?.firstName} {quiz.teacherId?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-6">{quiz.question}</h3>
                  
                  <div className="space-y-3">
                    {quiz.options.map((opt, idx) => {
                      let optionClass = "border-border bg-background hover:border-accent hover:bg-accent/5 cursor-pointer";
                      let icon = null;

                      if (isAnswered) {
                        optionClass = "border-border bg-background opacity-60 cursor-default";
                        if (idx === correctAnswer) {
                          optionClass = "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-medium opacity-100";
                          icon = <CheckCircle className="h-5 w-5 text-emerald-500" />;
                        } else if (idx === myAnswer) {
                          optionClass = "border-red-500 bg-red-500/10 text-red-700 opacity-100";
                          icon = <X className="h-5 w-5 text-red-500" />;
                        }
                      } else {
                        if (selectedOptions[quiz._id] === idx) {
                          optionClass = "border-accent bg-accent/10 text-accent font-medium";
                        }
                      }

                      return (
                        <div 
                          key={idx} 
                          onClick={() => !isAnswered && handleSelectOption(quiz._id, idx)}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${optionClass}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 ${selectedOptions[quiz._id] === idx && !isAnswered ? 'border-accent bg-accent text-white' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span>{opt}</span>
                          </div>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-4 bg-muted/20 flex items-center justify-between">
                  {isAnswered ? (
                    <div className={`text-sm font-bold ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isCorrect ? 'Great job! That is correct.' : 'Incorrect. Better luck next time!'}
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Select an option to submit your response.</p>
                      <button
                        onClick={() => handleSubmit(quiz._id)}
                        disabled={selectedOptions[quiz._id] === undefined || submitting === quiz._id}
                        className="px-6 py-2.5 rounded-lg bg-accent text-white font-bold text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {submitting === quiz._id ? 'Submitting...' : 'Submit Answer'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

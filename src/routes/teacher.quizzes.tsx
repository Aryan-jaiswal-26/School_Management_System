import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { createQuiz, getTeacherQuizzes, getQuizResults, type Quiz, type QuizResult } from "@/lib/quiz-api";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { HelpCircle, Plus, Users, CheckCircle, ChevronRight, X } from "lucide-react";

export const Route = createFileRoute("/teacher/quizzes")({
  head: () => ({ meta: [{ title: "Polls & Quizzes · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    classId: "",
    question: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0
  });
  const [creating, setCreating] = useState(false);

  // Results Modal
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    loadQuizzes();
    loadClasses();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await getTeacherQuizzes();
      setQuizzes(data);
    } catch (err) {
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await apiClient<any>('/academics/sections');
      if (Array.isArray(res)) {
        setClasses(res);
      } else if (res && Array.isArray(res.data)) {
        setClasses(res.data);
      } else {
        setClasses([]);
      }
      if (Array.isArray(res) && res.length > 0) {
        setFormData(prev => ({ ...prev, classId: res[0].classId?._id || res[0].classId, sectionId: res[0]._id }));
      } else if (res && Array.isArray(res.data) && res.data.length > 0) {
        setFormData(prev => ({ ...prev, classId: res.data[0].classId?._id || res.data[0].classId, sectionId: res.data[0]._id }));
      }
    } catch (err) {
      console.error("Failed to load sections", err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.question) return toast.error("Please fill required fields");
    if (formData.options.some(opt => !opt.trim())) return toast.error("All 4 options must be filled");

    setCreating(true);
    try {
      await createQuiz(formData);
      await loadQuizzes(); // Refetch to get populated class data
      setShowCreateModal(false);
      setFormData({
        classId: classes[0]?.classId?._id || classes[0]?.classId || "",
        sectionId: classes[0]?._id || "",
        question: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0
      });
      toast.success("Quiz created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create quiz");
    } finally {
      setCreating(false);
    }
  };

  const openResults = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setLoadingResults(true);
    try {
      const data = await getQuizResults(quizId);
      setQuizResult(data);
    } catch (err) {
      toast.error("Failed to load results");
      setSelectedQuizId(null);
    } finally {
      setLoadingResults(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Polls & Quizzes"
          subtitle="Create quick in-class polls and multiple-choice quizzes."
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Quiz
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>You haven't created any quizzes yet.</p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz._id} className="flex flex-col cursor-pointer hover:border-accent transition-colors rounded-3xl border border-border bg-card overflow-hidden" onClick={() => openResults(quiz._id)}>
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {quiz.classId?.name?.replace('Grade ', '')}{quiz.sectionId?.name || ''}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-4 line-clamp-2">{quiz.question}</h3>
                
                <div className="space-y-2">
                  {quiz.options.map((opt, idx) => (
                    <div key={idx} className={`text-xs p-2 rounded border ${idx === quiz.correctOptionIndex ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700' : 'border-border text-muted-foreground'}`}>
                      {String.fromCharCode(65 + idx)}. {opt}
                      {idx === quiz.correctOptionIndex && <CheckCircle className="h-3 w-3 inline ml-2" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> View Responses
                </div>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-card rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold">Create New Quiz</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Target Class</label>
                <select
                  value={formData.sectionId || ''}
                  onChange={(e) => {
                    const sec = classes.find((c: any) => c._id === e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      sectionId: e.target.value,
                      classId: sec?.classId?._id || sec?.classId || prev.classId
                    }));
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  required
                >
                  <option value="">Select a section...</option>
                  {classes.filter((c, index, self) => 
                    index === self.findIndex((t: any) => (
                      t.classId?.name === c.classId?.name && t.name === c.name
                    ))
                  ).map((c: any) => (
                    <option key={c._id} value={c._id}>{c.classId?.name?.replace('Grade ', '')} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Question</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent min-h-[80px]"
                  placeholder="e.g. What is the capital of France?"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium block">Options & Correct Answer</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formData.correctOptionIndex === idx}
                      onChange={() => setFormData(prev => ({ ...prev, correctOptionIndex: idx }))}
                      className="h-4 w-4 text-accent"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...formData.options];
                        newOpts[idx] = e.target.value;
                        setFormData(prev => ({ ...prev, options: newOpts }));
                      }}
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {selectedQuizId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-card rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <h3 className="font-bold">Quiz Results</h3>
              <button onClick={() => setSelectedQuizId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {loadingResults || !quizResult ? (
              <div className="p-12 text-center text-sm text-muted-foreground">Loading results...</div>
            ) : (
              <div className="p-0 overflow-y-auto">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold mb-4">{quizResult.quiz.question}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {quizResult.quiz.options.map((opt, idx) => {
                      const count = quizResult.responses.filter(r => r.selectedOptionIndex === idx).length;
                      const isCorrect = idx === quizResult.quiz.correctOptionIndex;
                      const percentage = quizResult.responses.length > 0 ? Math.round((count / quizResult.responses.length) * 100) : 0;
                      
                      return (
                        <div key={idx} className={`p-3 rounded-lg border ${isCorrect ? 'border-emerald-500 bg-emerald-500/10' : 'border-border'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-sm">{String.fromCharCode(65 + idx)}. {opt} {isCorrect && '✓'}</span>
                            <span className="text-xs font-bold">{count} ({percentage}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${isCorrect ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-6">
                  <h4 className="font-bold text-sm mb-4">Student Responses ({quizResult.responses.length})</h4>
                  {quizResult.responses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students have responded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {quizResult.responses.map(response => {
                        const isCorrect = response.selectedOptionIndex === quizResult.quiz.correctOptionIndex;
                        return (
                          <div key={response._id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                {response.studentId?.userId?.firstName?.charAt(0) || 'U'}{response.studentId?.userId?.lastName?.charAt(0) || ''}
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{response.studentId?.userId?.firstName || 'Unknown'} {response.studentId?.userId?.lastName || 'Student'}</p>
                                <p className="text-xs text-muted-foreground">ID: {response.studentId?.admissionNumber || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                                Option {String.fromCharCode(65 + response.selectedOptionIndex)}
                                {isCorrect ? ' ✓' : ' ✗'}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(response.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

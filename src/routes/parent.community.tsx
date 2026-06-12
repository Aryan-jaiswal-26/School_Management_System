import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HeartHandshake, MessageCircle, Send, Star, Ghost, Loader2 } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { createCommunityPost, fetchCommunityPosts, fetchParentFeedback, submitParentFeedback } from "@/lib/parent-api";

export const Route = createFileRoute("/parent/community")({
  head: () => ({ meta: [{ title: "Community & Feedback · Campus OS" }] }),
  component: Page,
});

function Page() {
  const [activeTab, setActiveTab] = useState<"forum" | "feedback" | "suggestion">("forum");
  const [posts, setPosts] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [suggestionText, setSuggestionText] = useState("");
  const [forumTitle, setForumTitle] = useState("");
  const [forumBody, setForumBody] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([fetchCommunityPosts(), fetchParentFeedback()])
      .then(([postsRes, feedbackRes]) => {
        setPosts(postsRes.status === "fulfilled" ? postsRes.value || [] : []);
        setFeedback(feedbackRes.status === "fulfilled" ? feedbackRes.value || [] : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const submitForum = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const post = await createCommunityPost({
        title: forumTitle,
        body: forumBody,
        category: "GENERAL",
        anonymous: false,
      });
      setPosts((prev) => [post, ...prev]);
      setForumTitle("");
      setForumBody("");
      toast.success("Post published");
    } catch (error) {
      console.error(error);
      toast.error("Could not publish community post");
    }
  };

  const submitFeedbackForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating) return toast.error("Please select a rating star.");
    try {
      const created = await submitParentFeedback({
        target: "School",
        rating,
        feedback: feedbackText,
        category: "GENERAL",
        anonymous: false,
      });
      setFeedback((prev) => [created, ...prev]);
      setRating(0);
      setFeedbackText("");
      toast.success("Feedback submitted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit feedback");
    }
  };

  const submitSuggestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!suggestionText) return;
    try {
      const created = await submitParentFeedback({
        target: "Anonymous Suggestion Box",
        rating: 5,
        feedback: suggestionText,
        category: "GENERAL",
        anonymous: true,
      });
      setFeedback((prev) => [created, ...prev]);
      setSuggestionText("");
      toast.success("Anonymous suggestion submitted");
    } catch (error) {
      console.error(error);
      toast.error("Could not submit suggestion");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community & Feedback"
        subtitle="Connect with other parents, rate school events, and share anonymous suggestions."
      />

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {[
          ["forum", "Community Forum", MessageCircle],
          ["feedback", "Rate & Feedback", Star],
          ["suggestion", "Anonymous Box", Ghost],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
              activeTab === key ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "forum" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading community posts...
              </div>
            ) : posts.length === 0 ? (
              <EmptyState icon={HeartHandshake} title="No Community Posts" description="Parents can share discussions here once the forum is active." />
            ) : (
              posts.map((post) => (
                <div key={post._id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{post.title}</h4>
                      <p className="text-xs text-muted-foreground mt-2">{post.body}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{post.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Panel title="Start Discussion">
              <form onSubmit={submitForum} className="space-y-3">
                <input value={forumTitle} onChange={(event) => setForumTitle(event.target.value)} placeholder="Topic title" className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-accent" />
                <textarea value={forumBody} onChange={(event) => setForumBody(event.target.value)} rows={4} placeholder="Share your thoughts..." className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" />
                <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Post to Forum
                </button>
              </form>
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <div className="max-w-2xl mx-auto grid grid-cols-1 gap-6">
          <Panel title="School Event & Experience Rating">
            <form onSubmit={submitFeedbackForm} className="space-y-5">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className={`${star <= rating ? "text-amber-500" : "text-muted-foreground"}`}>
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
              <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} rows={4} className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-accent resize-none" placeholder="What went well? What could be improved?" />
              <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Submit Feedback
              </button>
            </form>
          </Panel>

          <Panel title="Recent Feedback">
            <div className="space-y-3">
              {feedback.map((item) => (
                <div key={item._id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-foreground">{item.target}</div>
                    <div className="text-xs text-amber-500 font-semibold">{item.rating}/5</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{item.feedback}</p>
                </div>
              ))}
              {feedback.length === 0 && <EmptyState icon={Star} title="No feedback yet" description="Your ratings and reviews will appear here." />}
            </div>
          </Panel>
        </div>
      )}

      {activeTab === "suggestion" && (
        <div className="max-w-2xl mx-auto">
          <Panel title="Anonymous Suggestion Box">
            <form onSubmit={submitSuggestion} className="space-y-4">
              <textarea value={suggestionText} onChange={(event) => setSuggestionText(event.target.value)} rows={5} className="w-full rounded-xl border border-border bg-card p-4 text-sm outline-none focus:border-[oklch(0.65_0.15_155)] resize-none" placeholder="Type your suggestion securely..." />
              <button type="submit" className="w-full rounded-lg bg-[oklch(0.65_0.15_155)] px-4 py-3 text-sm font-bold text-white hover:bg-[oklch(0.65_0.15_155)]/90">
                Drop Suggestion Anonymously
              </button>
            </form>
          </Panel>
        </div>
      )}
    </div>
  );
}

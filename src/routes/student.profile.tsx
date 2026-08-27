import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { User, Edit, Save, Award, Download, Printer, X, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/student/profile")({ component: Page });

function Page() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    parentPhone: user?.parentPhone || "",
    bloodGroup: user?.bloodGroup || "",
  });
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);

  const [dietaryProfile, setDietaryProfile] = useState<any>({
    foodPreference: "Non-Vegetarian",
    allergies: [],
  });

  useEffect(() => {
    if (user?.studentId) {
      apiClient<any>(`/canteen/dietary-profiles/${user.studentId}`)
        .then((res) => {
          if (res) {
            setDietaryProfile({
              foodPreference: res.foodPreference || "Non-Vegetarian",
              allergies: res.allergies || [],
            });
          }
        })
        .catch((e) => console.error("Failed to load dietary profile", e));
    }
  }, [user?.studentId]);

  const handleSaveDietary = async (updated: { foodPreference: string; allergies: string[] }) => {
    try {
      setDietaryProfile(updated);
      const studentName = user?.name || "Student";
      const grade = user?.className ? `${user.className} - ${user.sectionName || ''}` : "N/A";
      await apiClient("/canteen/dietary-profiles", {
        method: "POST",
        data: {
          studentId: user?.studentId,
          studentName,
          grade,
          foodPreference: updated.foodPreference,
          allergies: updated.allergies,
          severity: "Medium",
          status: "Active",
        },
      });
      toast.success("Dietary profile updated", { description: "Your cafeteria allergies have been saved." });
    } catch (err) {
      toast.error("Failed to update dietary settings");
    }
  };


  const defaultPortfolio = [
    {
      title: "Gemini AI Helper App",
      category: "Computer Science",
      date: "May 2026",
      icon: "🤖",
      type: "project",
    },
    {
      title: "Tribology & Friction Lab Report",
      category: "Physics Lab",
      date: "April 2026",
      icon: "🔬",
      type: "report",
    },
    {
      title: "Debate Winner Certificate",
      category: "Co-Curricular",
      date: "March 2026",
      icon: "📜",
      type: "certificate",
    },
  ];

  const [portfolioItems, setPortfolioItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("student_portfolio");
      return saved ? JSON.parse(saved) : defaultPortfolio;
    } catch {
      return defaultPortfolio;
    }
  });

  const [officialAchievements, setOfficialAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (user?.name) {
      apiClient<any>("/sports/achievements")
        .then((res) => {
          const list = res?.data ?? res ?? [];
          if (Array.isArray(list)) {
            const studentNameLower = user.name.toLowerCase().trim();
            const filtered = list.filter((ach: any) => 
              ach.studentName && ach.studentName.toLowerCase().trim() === studentNameLower
            );
            setOfficialAchievements(filtered);
          }
        })
        .catch((err) => console.error("Failed to fetch achievements for profile:", err));
    }
  }, [user?.name]);

  const combinedPortfolioItems = [
    ...portfolioItems,
    ...officialAchievements.map((ach: any) => ({
      title: ach.title,
      category: ach.category,
      date: ach.date,
      icon: "🏆",
      type: "certificate",
      isOfficial: true,
      position: ach.position,
      description: ach.description
    }))
  ];

  useEffect(() => {
    try {
      localStorage.setItem("student_portfolio", JSON.stringify(portfolioItems));
    } catch (e) {
      console.error(e);
    }
  }, [portfolioItems]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSample, setNewSample] = useState({
    title: "",
    category: "",
    date: "",
    icon: "🤖",
    type: "project",
  });

  const handleAddSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSample.title || !newSample.category || !newSample.date) {
      toast.error("Please fill in all fields.");
      return;
    }
    setPortfolioItems((prev) => [...prev, newSample]);
    setIsAddModalOpen(false);
    toast.success("Work Sample Added", { description: "Added to your digital portfolio archive." });
    setNewSample({
      title: "",
      category: "",
      date: "",
      icon: "🤖",
      type: "project",
    });
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        parentPhone: user.parentPhone || "",
        bloodGroup: user.bloodGroup || "",
      });
    }
  }, [user]);

  // Fetch election candidates from backend
  useEffect(() => {
    const fetchCandidates = () => {
      apiClient<any[]>('/election-candidates')
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setCandidates(list);
        })
        .catch((e) => console.error('Failed to load candidates', e));
    };
    fetchCandidates();
  }, []);

  const handleVote = async (candidateId: string, name: string, hasVoted: boolean) => {
    try {
      await apiClient('/election-candidates/vote', {
        method: 'POST',
        data: { candidateId },
      });
      {
        if (hasVoted) {
           toast.success("Vote Removed", { description: "You have retracted your vote." });
        } else {
           toast.success("Ballot Cast Successfully!", { description: `You voted for ${name}.` });
        }
        // Refetch candidates to update UI
        apiClient<any[]>('/election-candidates')
          .then((data) => {
             const list = Array.isArray(data) ? data : [];
             setCandidates(list);
          });
      }
    } catch (e) {
      toast.error("Network Error", { description: "Could not cast vote." });
    }
  };

  const handleSave = () => {
    updateProfile({ 
      name: form.name, 
      phone: form.phone, 
      address: form.address,
      parentPhone: form.parentPhone,
      bloodGroup: form.bloodGroup,
    });
    toast.success("Profile updated", { description: "Your changes have been saved." });
    setEditing(false);
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and edit your personal information"
        actions={
          editing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted active:scale-95 transition-all"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col items-center">
          <div className="grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-[#1a2e5a] to-accent text-4xl font-bold text-white shadow-lg">
            {user?.initials}
          </div>
          <div className="mt-4 text-lg font-semibold text-center">{user?.name}</div>
          <div className="text-sm text-muted-foreground">{user?.sub}</div>
          <div className="mt-4 w-full">
            <Panel title="Quick Stats">
              <div className="space-y-2 text-sm">
                {[
                  ["Role", user?.role || "Student"],
                  ["Student Code", user?.studentCode || "—"],
                  ["School Code", user?.schoolCode || "—"],
                  ["Email", user?.email || "—"],
                  ["System ID", user?.id?.slice(-6) || "—"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["Full Name", "name", form.name],
                ["Email", "email", user?.email || "", true],
                ["Student Code", "studentCode", user?.studentCode || "", true],
                ["Phone", "phone", form.phone],
                ["School Code", "schoolCode", user?.schoolCode || "", true],
                ["Class", "class", user?.className ? `${user.className} - ${user.sectionName || ''}` : "", true],
                ["Parent Phone", "parentPhone", form.parentPhone],
                ["Date of Birth", "dob", user?.dob || "", true],
                ["Gender", "gender", user?.gender || "", true],
                ["Blood Group", "bloodGroup", form.bloodGroup],
                ["Role", "role", user?.role || "", true],
                ["Address", "address", form.address],
              ].map(([label, key, value, disabled]) => (
                <div key={key as string}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label as string}
                  </label>
                  {editing && !disabled ? (
                    <input
                      value={value as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key as string]: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  ) : (
                    <div className="h-10 flex items-center rounded-lg bg-muted px-3 text-sm">
                      {value as string}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* STUDENT COUNCIL ELECTION BALLOT */}
            <Panel title="Student Council Election Ballot">
              <div className="space-y-3.5 text-xs">
                <div className="flex gap-2.5 items-start rounded-xl border border-border bg-muted/20 p-3">
                  <span className="text-base shrink-0">🗳️</span>
                  <div>
                    <h4 className="font-bold text-foreground leading-none">
                      Council Election Active
                    </h4>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-normal">
                      Cast your official ballot choice for School President below. Voting is
                      authenticated via secure hash.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {candidates.map((cand: any) => {
                    const isHead = cand.votes > 0 && cand.votes === Math.max(...candidates.map((c: any) => c.votes));
                    return (
                      <div
                        key={cand.id}
                        className="p-3 border rounded-xl bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-3 relative overflow-hidden"
                      >
                        {isHead && (
                          <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-950 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                            Current Head 👑
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 grid place-items-center rounded-lg bg-indigo-500/10 text-lg shadow-sm">
                            {cand.avatar}
                          </div>
                          <div>
                            <strong className="text-foreground font-bold flex items-center gap-2">
                              {cand.name} 
                              <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[8px] font-mono">
                                {cand.votes} Votes
                              </span>
                            </strong>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">
                              {cand.grade}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleVote(cand.id, cand.name, cand.hasVoted)}
                          className={`${
                            cand.hasVoted 
                              ? "bg-red-500 hover:bg-red-600" 
                              : "bg-indigo-600 hover:bg-indigo-700"
                          } text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg active:scale-95 cursor-pointer shadow-sm uppercase tracking-wider transition-colors`}
                        >
                          {cand.hasVoted ? "Remove Vote" : "Vote"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            {/* DIETARY & ALLERGY PROFILE */}
            <Panel title="Dietary & Allergy Profile">
              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Food Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Vegetarian", "Vegan", "Jain", "Non-Vegetarian"].map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => handleSaveDietary({ foodPreference: pref, allergies: dietaryProfile.allergies })}
                        className={`flex items-center justify-center h-9 rounded-lg border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                          dietaryProfile.foodPreference === pref
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card hover:bg-muted/50 border-border text-foreground"
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Allergies & Intolerances
                  </label>
                  <p className="text-[10px] text-muted-foreground mb-3 leading-normal">
                    Select ingredients you are allergic to. Meals containing these will trigger alert prompts.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Milk", "Peanut", "Gluten", "Soy", "Egg"].map((allergen) => {
                      const active = dietaryProfile.allergies?.includes(allergen);
                      return (
                        <button
                          key={allergen}
                          type="button"
                          onClick={() => {
                            const newAllergies = active
                              ? dietaryProfile.allergies.filter((a: string) => a !== allergen)
                              : [...(dietaryProfile.allergies || []), allergen];
                            handleSaveDietary({ foodPreference: dietaryProfile.foodPreference, allergies: newAllergies });
                          }}
                          className={`flex items-center gap-2 px-3 h-9 rounded-lg border text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                            active
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : "bg-card hover:bg-muted/50 border-border text-foreground"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${active ? "bg-destructive animate-pulse" : "bg-muted-foreground/30"}`} />
                          {allergen}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* STUDENT PORTFOLIO GALLERY */}
          <div className="mt-6">
            <Panel
              title="My Digital Student Portfolio (Project & Certificates Archive)"
              action={
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Work Sample
                </button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {combinedPortfolioItems.map((item) => (
                  <div
                    key={item.title}
                    className="group p-4 rounded-xl border bg-card/60 flex items-start justify-between gap-3 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all relative overflow-hidden animate-in fade-in duration-200"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 grid place-items-center rounded-lg bg-indigo-500/10 text-xl border">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-foreground truncate">{item.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium flex flex-wrap gap-1.5 items-center">
                          <span>{item.category}</span>
                          {item.isOfficial && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[8px] font-extrabold tracking-wide uppercase">
                              ✨ Official
                            </span>
                          )}
                          {item.position && item.position !== "None" && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-yellow-100 text-yellow-850 dark:bg-yellow-950/40 dark:text-yellow-400 text-[8px] font-extrabold tracking-wide uppercase">
                              🏆 {item.position}
                            </span>
                          )}
                        </p>
                        <span className="text-[9px] font-mono text-muted-foreground block mt-1">
                          {item.date}
                        </span>
                      </div>
                    </div>
                    {item.type === "certificate" && (
                      <button
                        onClick={() => setSelectedCert({ title: item.title, date: item.date, category: item.category, isOfficial: item.isOfficial, position: item.position })}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer absolute right-2 bottom-2 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="View & Print Certificate"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto no-print"
          onClick={() => setSelectedCert(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent animate-pulse" />
                <h2 className="text-sm font-bold text-foreground">Official Achievement Record</h2>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Certificate Frame for Print */}
            <div className="printable-certificate border-8 border-double border-accent/30 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-amber-50/40 dark:bg-amber-950/5 p-8 md:p-12 rounded-xl flex flex-col items-center justify-between text-center relative shadow-inner aspect-[1.414/1] w-full max-w-full">
              {/* Corner Watermarks */}
              <div className="absolute top-3 left-3 right-3 bottom-3 border border-accent/20 pointer-events-none" />

              <Award className="h-16 w-16 text-amber-500 mb-4 drop-shadow" />
              
              <div>
                <h1 className="font-serif text-3xl font-extrabold tracking-widest text-amber-900 dark:text-amber-500 uppercase">
                  Certificate of Achievement
                </h1>
                <p className="font-serif text-xs italic text-amber-800/80 dark:text-amber-600/80 mt-1 mb-8">
                  {selectedCert.isOfficial
                    ? "This certifies the official recognition of school-verified achievements and activities"
                    : "This certifies the successful completion and recognition of honors"}
                </p>

                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-sans">
                  This honor is proudly presented to
                </p>
                <h2 className="font-serif text-2xl font-bold text-foreground border-b border-accent/40 pb-1.5 mb-6 inline-block px-6">
                  {user?.name || "Aarav Sharma"}
                </h2>
                <p className="text-xs text-muted-foreground max-w-md leading-relaxed mx-auto font-sans">
                  For outstanding accomplishment and exemplary dedication in{" "}
                  <strong className="text-foreground">{selectedCert.category}</strong> with the achievement of{" "}
                  <strong className="text-foreground">{selectedCert.title}</strong>
                  {selectedCert.position && selectedCert.position !== "None" ? (
                    <>
                      {" "}securing the <strong className="text-foreground">{selectedCert.position}</strong>
                    </>
                  ) : null}{" "}
                  on <span className="font-mono">{selectedCert.date}</span>.
                </p>
              </div>

              {/* Signatures */}
              <div className="flex justify-between w-full mt-10 px-6 font-sans text-[9px] text-muted-foreground">
                <div className="text-center space-y-1.5">
                  <div className="h-6 w-24 border-b border-muted-foreground/30 mx-auto" />
                  <div className="font-semibold uppercase tracking-wider">Date Issued</div>
                </div>
                <div className="text-center space-y-1.5">
                  <div className="h-8 w-8 rounded-full border border-accent/20 bg-amber-500/5 flex items-center justify-center text-[10px] font-black text-amber-500/40 mx-auto">SEAL</div>
                  <div className="font-semibold uppercase tracking-wider">Campus OS Registrar</div>
                </div>
                <div className="text-center space-y-1.5">
                  <div className="h-6 w-24 border-b border-muted-foreground/30 mx-auto" />
                  <div className="font-semibold uppercase tracking-wider">Principal Signature</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 text-xs font-sans">
              <button
                onClick={() => setSelectedCert(null)}
                className="rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground px-4 py-2 font-semibold shadow-sm cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Work Sample Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto no-print animate-in fade-in-50 duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                <h2 className="text-sm font-bold text-foreground">Archive New Work Sample</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSample} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-muted-foreground font-semibold uppercase tracking-wider block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. World War II Analysis Paper"
                  value={newSample.title}
                  onChange={(e) => setNewSample((prev) => ({ ...prev, title: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold uppercase tracking-wider block">Subject / Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. History"
                    value={newSample.category}
                    onChange={(e) => setNewSample((prev) => ({ ...prev, category: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold uppercase tracking-wider block">Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. June 2026"
                    value={newSample.date}
                    onChange={(e) => setNewSample((prev) => ({ ...prev, date: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold uppercase tracking-wider block">Sample Type</label>
                  <select
                    value={newSample.type}
                    onChange={(e) => {
                      const typeVal = e.target.value;
                      let iconVal = newSample.icon;
                      if (typeVal === "certificate") iconVal = "📜";
                      else if (typeVal === "report") iconVal = "🔬";
                      else iconVal = "🤖";
                      setNewSample((prev) => ({ ...prev, type: typeVal, icon: iconVal }));
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  >
                    <option value="project">Project / Assignment</option>
                    <option value="report">Lab / Research Report</option>
                    <option value="certificate">Official Certificate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold uppercase tracking-wider block">Select Emoji Icon</label>
                  <select
                    value={newSample.icon}
                    onChange={(e) => setNewSample((prev) => ({ ...prev, icon: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                  >
                    <option value="🤖">🤖 AI / Tech</option>
                    <option value="🔬">🔬 Science / Lab</option>
                    <option value="📜">📜 Scroll / Certificate</option>
                    <option value="📝">📝 Article / Writing</option>
                    <option value="🎨">🎨 Art / Painting</option>
                    <option value="📊">📊 Math / Stats</option>
                    <option value="💻">💻 Code / App</option>
                    <option value="🏆">🏆 Trophy / Award</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground px-4 py-2 font-semibold shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 font-semibold shadow-sm cursor-pointer"
                >
                  Archive Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Specific Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-certificate, .printable-certificate * {
            visibility: visible;
          }
          .printable-certificate {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(1.1);
            width: 90% !important;
            border: 8px border-double border-accent !important;
            box-shadow: none !important;
            padding: 2rem !important;
            background: white !important;
            color: black !important;
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

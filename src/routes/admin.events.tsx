import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Ticket,
  Image as ImageIcon,
  BookOpen,
  Plus,
  Users,
  Megaphone,
  UploadCloud,
  Heart,
  Vote,
  CheckCircle,
  PartyPopper,
  UserCheck,
  Globe,
  Crown,
  Cake,
  FileText,
  Eye,
} from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";
import {
  fetchEvents, createEvent, rsvpEvent, volunteerEvent, uploadGalleryPhoto,
  fetchTodaysBirthdays,
  fetchElections, createElection, fetchCandidates, addCandidate, castVote,
  fetchNewsletters, createNewsletter,
} from "@/lib/events-api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/events")({
  head: () => ({ meta: [{ title: "Events & Culture · Campus OS" }] }),
  component: EventsPage,
});

type Tab = "events" | "gallery" | "birthdays" | "elections" | "magazine";

function EventsPage() {
  const [tab, setTab] = useState<Tab>("events");

  // Data state
  const [events, setEvents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<{ students: any[]; staff: any[] }>({ students: [], staff: [] });
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);

  // Modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents().then((d) => setEvents(Array.isArray(d) ? d : [])).catch(console.error);
    fetchTodaysBirthdays().then((d: any) => setBirthdays(d?.data ?? d ?? { students: [], staff: [] })).catch(console.error);
    fetchElections().then((d) => setElections(Array.isArray(d) ? d : [])).catch(console.error);
    fetchNewsletters().then((d) => setNewsletters(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchCandidates(selectedElection._id).then((d) => setCandidates(Array.isArray(d) ? d : [])).catch(console.error);
    }
  }, [selectedElection]);

  // ── Event Handlers ────────────────────────────────────────────────────────
  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title"),
      type: fd.get("type"),
      date: fd.get("date"),
      tickets: fd.get("tickets"),
      isPaid: fd.get("isPaid") === "on",
      ticketPrice: fd.get("isPaid") === "on" ? Number(fd.get("ticketPrice")) : 0,
    };
    try {
      await createEvent(data);
      toast.success("Event created successfully");
      setIsEventModalOpen(false);
      fetchEvents().then((d) => setEvents(Array.isArray(d) ? d : []));
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRsvp(eventId: string) {
    try {
      await rsvpEvent(eventId);
      toast.success("RSVP confirmed!");
      fetchEvents().then((d) => setEvents(Array.isArray(d) ? d : []));
    } catch (err: any) {
      toast.error(err.message || "RSVP failed");
    }
  }

  async function handleVolunteer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await volunteerEvent(selectedEventId, String(fd.get("volunteerName")));
      toast.success("Signed up as volunteer!");
      setIsVolunteerModalOpen(false);
      fetchEvents().then((d) => setEvents(Array.isArray(d) ? d : []));
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGalleryUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    // We store the URL directly (would normally upload to cloud storage)
    try {
      await uploadGalleryPhoto(selectedEventId, String(fd.get("photoUrl")));
      toast.success("Photo added to gallery!");
      setIsGalleryModalOpen(false);
      fetchEvents().then((d) => setEvents(Array.isArray(d) ? d : []));
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateElection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const positions = String(fd.get("positions")).split(",").map(s => s.trim()).filter(Boolean);
    const data = {
      title: fd.get("title"),
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      status: fd.get("status"),
      positions,
    };
    try {
      await createElection(data);
      toast.success("Election created");
      setIsElectionModalOpen(false);
      fetchElections().then((d) => setElections(Array.isArray(d) ? d : []));
    } catch (err: any) {
      toast.error(err.message || "Failed to create election");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddCandidate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name"),
      grade: fd.get("grade"),
      position: fd.get("position"),
      avatar: fd.get("avatar") || "https://ui-avatars.com/api/?name=" + encodeURIComponent(String(fd.get("name"))),
    };
    try {
      await addCandidate(selectedElection._id, data);
      toast.success("Candidate added");
      setIsCandidateModalOpen(false);
      fetchCandidates(selectedElection._id).then((d) => setCandidates(Array.isArray(d) ? d : []));
    } catch (err: any) {
      toast.error(err.message || "Failed to add candidate");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateNewsletter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title"),
      volume: fd.get("volume"),
      issue: fd.get("issue"),
      content: fd.get("content"),
      status: fd.get("status"),
      targetAudience: ["ALL"],
    };
    try {
      await createNewsletter(data);
      toast.success("Newsletter created");
      setIsNewsletterModalOpen(false);
      fetchNewsletters().then((d) => setNewsletters(Array.isArray(d) ? d : []));
    } catch (err: any) {
      toast.error(err.message || "Failed to create newsletter");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  const tabs: [Tab, string, any][] = [
    ["events", "Event Scheduler", Calendar],
    ["gallery", "Photo Gallery", ImageIcon],
    ["birthdays", "Birthdays", Cake],
    ["elections", "Elections", Vote],
    ["magazine", "Digital Magazine", BookOpen],
  ];

  const allBirthdays = [...(birthdays.students || []).map(s => ({ ...s, type: "Student" })), ...(birthdays.staff || []).map(s => ({ ...s, type: "Staff" }))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events & School Culture"
        subtitle="Publish school functions, manage RSVPs, run elections, and curate digital magazines."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming Events" value={events.length.toString()} icon={Calendar} tone="info" />
        <StatCard label="Total RSVPs" value={events.reduce((a, e) => a + (e.rsvpCount || 0), 0).toString()} icon={Ticket} tone="success" />
        <StatCard label="Today's Birthdays" value={allBirthdays.length.toString()} icon={PartyPopper} tone="warning" />
        <StatCard label="Newsletters Published" value={newsletters.filter(n => n.status === "PUBLISHED").length.toString()} icon={BookOpen} tone="success" delta="Published" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {tabs.map(([k, l, Icon]) => (
          <button
            key={k}
            id={`events-tab-${k}`}
            onClick={() => setTab(k)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all ${
              tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {l}
          </button>
        ))}
      </div>

      {/* ── EVENT SCHEDULER ── */}
      {tab === "events" && (
        <Panel
          title="Event Scheduler & Ticketing"
          action={
            <button id="create-event-btn" onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> Create Event
            </button>
          }
        >
          {events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto h-10 w-10 opacity-20 mb-3" />
              <p className="font-medium">No events yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {events.map((ev) => (
                <div key={ev._id} className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between hover:border-accent/50 transition-colors gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent mb-2">{ev.type}</span>
                      <h4 className="font-bold text-lg text-foreground leading-tight">{ev.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {new Date(ev.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
                      <Megaphone className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="font-bold text-foreground">{ev.rsvpCount}</p>
                      <p className="text-muted-foreground">RSVPs</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="font-bold text-foreground">{ev.volunteers?.length ?? 0}</p>
                      <p className="text-muted-foreground">Volunteers</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <p className="font-bold text-foreground">{ev.isPaid ? `₹${ev.ticketPrice}` : "Free"}</p>
                      <p className="text-muted-foreground">Ticket</p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-border pt-3">
                    <button
                      id={`rsvp-btn-${ev._id}`}
                      onClick={() => handleRsvp(ev._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" /> RSVP
                    </button>
                    <button
                      id={`volunteer-btn-${ev._id}`}
                      onClick={() => { setSelectedEventId(ev._id); setIsVolunteerModalOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      <UserCheck className="h-3.5 w-3.5" /> Volunteer
                    </button>
                    <button
                      id={`gallery-btn-${ev._id}`}
                      onClick={() => { setSelectedEventId(ev._id); setIsGalleryModalOpen(true); }}
                      className="flex items-center justify-center gap-1.5 bg-muted/50 hover:bg-muted text-muted-foreground px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ── PHOTO GALLERY ── */}
      {tab === "gallery" && (
        <Panel title="Event Photo Gallery">
          <div className="space-y-6">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events available. Create an event first.</p>
            ) : (
              events.map((ev) => (
                <div key={ev._id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground">{ev.title}</h4>
                    <button
                      id={`upload-gallery-${ev._id}`}
                      onClick={() => { setSelectedEventId(ev._id); setIsGalleryModalOpen(true); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                    >
                      <UploadCloud className="h-3.5 w-3.5" /> Add Photo
                    </button>
                  </div>
                  {ev.gallery && ev.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {ev.gallery.map((url: string, i: number) => (
                        <div key={i} className="aspect-square rounded-lg bg-muted overflow-hidden group relative">
                          <img src={url} alt={`Gallery ${i+1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-center hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => { setSelectedEventId(ev._id); setIsGalleryModalOpen(true); }}>
                      <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-accent transition-colors" />
                      <p className="text-xs text-muted-foreground">No photos yet. Click to upload.</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Panel>
      )}

      {/* ── BIRTHDAYS ── */}
      {tab === "birthdays" && (
        <Panel title="Today's Birthday Notifications">
          {allBirthdays.length === 0 ? (
            <div className="py-16 text-center">
              <PartyPopper className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
              <h4 className="font-bold text-foreground">No birthdays today</h4>
              <p className="text-sm text-muted-foreground mt-1">Check back tomorrow!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBirthdays.map((person, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4 hover:border-yellow-400/50 transition-colors">
                  <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                      {(person.firstName || "?")[0]?.toUpperCase()}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-base">🎂</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{person.firstName} {person.lastName}</p>
                    <p className="text-xs text-muted-foreground">{person.type} {person.grade ? `· Grade ${person.grade}` : person.designation ? `· ${person.designation}` : ""}</p>
                  </div>
                  <button
                    id={`wish-btn-${i}`}
                    onClick={() => toast.success(`Birthday wish sent to ${person.firstName}! 🎉`)}
                    className="shrink-0 flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-yellow-100 transition-colors"
                  >
                    <Heart className="h-3 w-3" /> Wish
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ── ELECTIONS ── */}
      {tab === "elections" && (
        <div className="space-y-6">
          <Panel
            title="Student Council Elections"
            action={
              <button id="create-election-btn" onClick={() => setIsElectionModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                <Plus className="h-3.5 w-3.5" /> New Election
              </button>
            }
          >
            {elections.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Vote className="mx-auto h-10 w-10 opacity-20 mb-3" />
                <p className="font-medium">No elections running. Create one to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {elections.map((el) => (
                  <button
                    key={el._id}
                    id={`election-card-${el._id}`}
                    onClick={() => setSelectedElection(el._id === selectedElection?._id ? null : el)}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedElection?._id === el._id ? "border-accent bg-accent/5 shadow-md" : "border-border bg-card hover:border-accent/50"}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-foreground">{el.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(el.startDate).toLocaleDateString()} → {new Date(el.endDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${el.status === "Ongoing" ? "bg-emerald-100 text-emerald-700" : el.status === "Completed" ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-700"}`}>{el.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {el.positions?.map((p: string) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-muted text-foreground text-[10px] font-semibold">{p}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          {selectedElection && (
            <Panel
              title={`Candidates — ${selectedElection.title}`}
              action={
                <button id="add-candidate-btn" onClick={() => setIsCandidateModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add Candidate
                </button>
              }
            >
              {candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No candidates yet. Add some!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {candidates.map((c) => (
                    <div key={c._id} className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col items-center text-center gap-3">
                      <div className="relative">
                        <img src={c.avatar} alt={c.name} className="h-16 w-16 rounded-full object-cover border-2 border-border" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}`; }} />
                        {candidates.indexOf(c) === 0 && <Crown className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Grade {c.grade} · {c.position}</p>
                      </div>
                      <div className="w-full flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-muted-foreground">Votes</span>
                        <span className="font-bold text-foreground">{c.votes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>
      )}

      {/* ── DIGITAL MAGAZINE ── */}
      {tab === "magazine" && (
        <Panel
          title="Digital School Magazine / Newsletter"
          action={
            <button id="create-newsletter-btn" onClick={() => setIsNewsletterModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> New Issue
            </button>
          }
        >
          {newsletters.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 opacity-20 mb-3" />
              <p className="font-medium text-muted-foreground">No newsletters yet. Create the first issue!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newsletters.map((nl) => (
                <div key={nl._id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Mini Magazine Cover */}
                  <div className="h-28 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)" }} />
                    <BookOpen className="h-7 w-7 mb-1 opacity-80" />
                    <h4 className="font-serif font-bold text-sm text-center line-clamp-2">{nl.title}</h4>
                    {nl.volume && <p className="text-[10px] opacity-70 mt-0.5">Vol. {nl.volume} · Issue {nl.issue}</p>}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${nl.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : nl.status === "ARCHIVED" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700"}`}>{nl.status}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {nl.publishedDate ? new Date(nl.publishedDate).toLocaleDateString() : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{nl.content}</p>
                    <div className="flex gap-2">
                      <button
                        id={`view-newsletter-${nl._id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-muted text-foreground text-[10px] font-bold rounded-lg hover:bg-muted/80 transition-colors"
                        onClick={() => toast.info("Full editor coming soon")}
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      {nl.status !== "PUBLISHED" && (
                        <button
                          id={`publish-newsletter-${nl._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={() => toast.success("Newsletter published!", { description: "Visible to all students and parents." })}
                        >
                          <Globe className="h-3 w-3" /> Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Create Event Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input id="event-title" name="title" required placeholder="e.g. Annual Science Fair" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option>Academic</option>
                  <option>Cultural</option>
                  <option>Sports</option>
                  <option>Social</option>
                  <option>Annual Day</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input id="event-date" name="date" type="datetime-local" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ticket / Entry</Label>
              <Input id="event-tickets" name="tickets" placeholder="Free / Invite Only / ₹200" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPaid" name="isPaid" className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="isPaid">This is a paid event</Label>
            </div>
            <div className="space-y-2">
              <Label>Ticket Price (₹)</Label>
              <Input id="ticketPrice" name="ticketPrice" type="number" placeholder="0" min="0" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEventModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Event"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Volunteer Signup Modal */}
      <Dialog open={isVolunteerModalOpen} onOpenChange={setIsVolunteerModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Volunteer Signup</DialogTitle></DialogHeader>
          <form onSubmit={handleVolunteer} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input id="volunteerName" name="volunteerName" required placeholder="Full name" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsVolunteerModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing up..." : "Sign Up"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Upload Modal */}
      <Dialog open={isGalleryModalOpen} onOpenChange={setIsGalleryModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Gallery Photo</DialogTitle></DialogHeader>
          <form onSubmit={handleGalleryUpload} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Photo URL</Label>
              <Input id="photoUrl" name="photoUrl" required placeholder="https://example.com/photo.jpg" />
              <p className="text-[11px] text-muted-foreground">Enter a direct image URL to add to the gallery.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsGalleryModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Uploading..." : "Add Photo"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Election Modal */}
      <Dialog open={isElectionModalOpen} onOpenChange={setIsElectionModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Election</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateElection} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Election Title</Label>
              <Input id="election-title" name="title" required placeholder="e.g. Student Council 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input id="election-start" name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input id="election-end" name="endDate" type="date" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Positions (comma separated)</Label>
              <Input id="election-positions" name="positions" required placeholder="President, Vice President, Secretary" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsElectionModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Election"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Candidate Modal */}
      <Dialog open={isCandidateModalOpen} onOpenChange={setIsCandidateModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
          <form onSubmit={handleAddCandidate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input id="candidate-name" name="name" required placeholder="Full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade / Class</Label>
                <Input id="candidate-grade" name="grade" required placeholder="e.g. 10-A" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <select name="position" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {selectedElection?.positions?.map((p: string) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avatar URL (optional)</Label>
              <Input id="candidate-avatar" name="avatar" placeholder="https://..." />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsCandidateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Candidate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Newsletter Modal */}
      <Dialog open={isNewsletterModalOpen} onOpenChange={setIsNewsletterModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Newsletter Issue</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateNewsletter} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input id="nl-title" name="title" required placeholder="e.g. The Campus Chronicle — Spring 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Volume</Label>
                <Input id="nl-volume" name="volume" placeholder="12" />
              </div>
              <div className="space-y-2">
                <Label>Issue</Label>
                <Input id="nl-issue" name="issue" placeholder="3" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content / Summary</Label>
              <textarea id="nl-content" name="content" rows={4} required className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Newsletter body or summary..." />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Publish Now</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsNewsletterModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Issue"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

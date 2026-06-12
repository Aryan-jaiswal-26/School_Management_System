import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Building2, ChevronDown, Check, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

interface Branch {
  _id: string;
  name: string;
  code: string;
}

export function BranchSelector() {
  const { user, currentBranchId, setCurrentBranchId } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch branches available to the user
  useEffect(() => {
    if (!user || (user.role !== "super_admin" && user.role !== "school_admin" && user.role !== "admin")) {
      return;
    }

    async function fetchBranches() {
      try {
        setLoading(true);
        // Under non-superadmin, listBranches endpoint automatically filters by user's allowedBranchIds
        const res = await apiClient<{ data: Branch[] }>("/branches?limit=100");
        const list = res?.data || [];
        setBranches(list);

        // If currentBranchId is not set or not in the retrieved list, and we have branches, auto-select first
        if (list.length > 0) {
          const ids = list.map((b) => b._id);
          if (!currentBranchId || !ids.includes(currentBranchId)) {
            setCurrentBranchId(list[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchBranches();
  }, [user, currentBranchId, setCurrentBranchId]);

  // If user has no branches or isn't an admin, do not show selector
  if (!user || (user.role !== "super_admin" && user.role !== "school_admin" && user.role !== "admin")) {
    return null;
  }

  const selectedBranch = branches.find((b) => b._id === currentBranchId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-accent/20 backdrop-blur-md",
          isOpen && "border-accent/40 bg-muted/80"
        )}
      >
        <Building2 className="h-3.5 w-3.5 text-accent" />
        <span className="max-w-[120px] truncate">
          {loading ? "Loading..." : selectedBranch?.name || selectedBranch?.code || "Select Branch"}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && branches.length > 0 && (
        <div className="absolute right-0 mt-2.5 w-56 origin-top-right rounded-2xl border border-border bg-card/90 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 mb-1 flex items-center gap-1.5">
            <GitBranch className="h-3 w-3" />
            Select Campus / Branch
          </div>
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {branches.map((branch) => {
              const isSelected = branch._id === currentBranchId;
              return (
                <button
                  key={branch._id}
                  type="button"
                  onClick={() => {
                    setCurrentBranchId(branch._id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-muted/65 hover:text-foreground"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{branch.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{branch.code}</div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

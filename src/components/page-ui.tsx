import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export function PageContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string, description?: string, actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  className,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      {onSearchChange !== undefined && (
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-lg border border-border bg-card/80 pl-10 pr-4 text-sm shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      )}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 rounded-lg border border-border bg-card/80 px-3 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const statusStyles = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-accent/10 text-accent border-accent/25",
  neutral: "bg-muted text-muted-foreground border-border",
} as const;

export type StatusTone = keyof typeof statusStyles;

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto -mx-1 px-1", className)}>
      <table className="w-full min-w-[640px] text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </tr>
    </thead>
  );
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        "border-b border-border/50 transition-colors last:border-0 hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function MobileCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-accent/30 hover:shadow-md",
          className,
        )}
      >
        {children}
      </button>
    );
  }
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/20 hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ActionButton({ className, ...props }: ButtonProps) {
  return <Button className={cn("shadow-sm", className)} {...props} />;
}

export function IconStat({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const tones = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    info: "bg-accent/10 text-accent",
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

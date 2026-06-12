import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Settings,
  CloudUpload,
  Check,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";

// Types for branding settings (adjust according to backend schema)
interface BrandingSettings {
  schoolName: string;
  primaryColor: string; // hex e.g., "#1a73e8"
  secondaryColor: string;
  logoUrl: string; // existing logo URL
  faviconUrl: string;
}

export const Route = createFileRoute("/admin/branding")({
  component: BrandingPage,
});

function BrandingPage() {
  // form state
  const [settings, setSettings] = useState<BrandingSettings>({
    schoolName: "",
    primaryColor: "#1e40af",
    secondaryColor: "#f59e0b",
    logoUrl: "",
    faviconUrl: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/v1/branding", { method: "GET" });
        if (!res.ok) throw new Error("Failed to load branding settings");
        const data: BrandingSettings = await res.json();
        setSettings(data);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load branding settings");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleFaviconChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFaviconFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File, endpoint: string): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(endpoint, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    const { url } = await res.json();
    return url; // backend should return { url: string }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let logoUrl = settings.logoUrl;
      let faviconUrl = settings.faviconUrl;
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, "/api/v1/branding/logo");
      }
      if (faviconFile) {
        faviconUrl = await uploadFile(faviconFile, "/api/v1/branding/favicon");
      }
      const payload = {
        ...settings,
        logoUrl,
        faviconUrl,
      };
      const res = await fetch("/api/v1/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Branding settings saved", {
        description: "Your school branding has been updated.",
      });
      // refresh URLs after save
      setSettings(payload);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save branding", { description: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const previewStyle = {
    "--primary": settings.primaryColor,
    "--secondary": settings.secondaryColor,
  } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="White‑Label Branding"
        subtitle="Customize school name, logo, favicon and colour palette"
        icon={Settings}
      />

      <Panel title="Branding Settings Form">
        <div className="grid gap-6 md:grid-cols-2">
          {/* School Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground" htmlFor="schoolName">
              School Name
            </label>
            <input
              id="schoolName"
              name="schoolName"
              type="text"
              value={settings.schoolName}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary outline-none"
              required
            />
          </div>

          {/* Primary Colour */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground" htmlFor="primaryColor">
              Primary Colour
            </label>
            <input
              id="primaryColor"
              name="primaryColor"
              type="color"
              value={settings.primaryColor}
              onChange={handleInputChange}
              className="h-10 w-full rounded-lg border border-border bg-card"
            />
          </div>

          {/* Secondary Colour */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground" htmlFor="secondaryColor">
              Secondary Colour
            </label>
            <input
              id="secondaryColor"
              name="secondaryColor"
              type="color"
              value={settings.secondaryColor}
              onChange={handleInputChange}
              className="h-10 w-full rounded-lg border border-border bg-card"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground" htmlFor="logoUpload">
              School Logo
            </label>
            <input
              id="logoUpload"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="file:rounded-md file:border file:border-border file:bg-card file:px-2 file:py-1"
            />
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Current logo" className="mt-2 h-12" />
            )}
          </div>

          {/* Favicon Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground" htmlFor="faviconUpload">
              Favicon
            </label>
            <input
              id="faviconUpload"
              type="file"
              accept="image/*"
              onChange={handleFaviconChange}
              className="file:rounded-md file:border file:border-border file:bg-card file:px-2 file:py-1"
            />
            {settings.faviconUrl && (
              <img src={settings.faviconUrl} alt="Current favicon" className="mt-2 h-6" />
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>Save Settings</>
            )}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reset
          </button>
        </div>
      </Panel>

      {/* Theme Preview */}
      <Panel title="Live Theme Preview">
        <div
          className="rounded-xl border border-border p-6"
          style={previewStyle}
        >
          <div className="flex items-center gap-4 mb-4">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-12" />
            )}
            <h2 className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
              {settings.schoolName || "Your School Name"}
            </h2>
          </div>
          <button
            className="rounded-md px-4 py-2 bg-primary text-primary-foreground"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Primary Action
          </button>
          <button
            className="ml-2 rounded-md px-4 py-2 border border-primary text-primary"
            style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
          >
            Secondary Action
          </button>
        </div>
      </Panel>
    </div>
  );
}

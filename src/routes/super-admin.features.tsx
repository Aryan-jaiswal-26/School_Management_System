import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-ui";
import { useState, useEffect } from "react";
import { Building2, Search, Settings2, ShieldCheck, Power, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/features")({
  component: SuperAdminFeatures,
});

const MODULES = [
  "Academics", "Admissions", "Attendance", "Behavior", "Canteen", "Communications",
  "Events", "Exams", "Fees", "Health", "Hostel", "HR", "Inventory", "Library",
  "Safety", "Sports", "Timetable", "Transport"
];

function SuperAdminFeatures() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  // localFeatures: map of schoolId -> set of enabled module names (or null meaning "use defaults")
  const [localFeatures, setLocalFeatures] = useState<Record<string, string[]>>({});

  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ["superAdmin", "schools", 1, "", "All"],
    queryFn: () => SuperAdminAPI.getSchools({ page: 1, limit: 100 }),
  });

  const schools: any[] = schoolsData?.data?.data || [];

  // When schools load, initialise localFeatures from the school's actual featureOverrides
  useEffect(() => {
    if (schools.length > 0) {
      if (!selectedSchoolId) {
        setSelectedSchoolId(schools[0]._id);
      }
      const initialState: Record<string, string[]> = {};
      schools.forEach((school) => {
        // featureOverrides is a Record<string, boolean> from the School document
        const overrides: Record<string, boolean> = school.featureOverrides || {};
        // If a module has no override, treat it as enabled by default
        const enabled = MODULES.filter((m) => overrides[m] !== false);
        initialState[school._id] = enabled;
      });
      setLocalFeatures(initialState);
    }
  }, [schoolsData]);

  const saveFeaturesMutation = useMutation({
    mutationFn: ({ schoolId, features }: { schoolId: string; features: string[] }) => {
      // Convert enabled list to featureOverrides map
      const featureOverrides: Record<string, boolean> = {};
      MODULES.forEach((m) => {
        featureOverrides[m] = features.includes(m);
      });
      return SuperAdminAPI.updateSchoolFeatures(schoolId, featureOverrides);
    },
    onSuccess: (_, { schoolId }) => {
      const school = schools.find((s) => s._id === schoolId);
      toast.success("Feature configuration saved!", {
        description: `Updated ${localFeatures[schoolId]?.length ?? 0} modules for "${school?.name ?? "school"}".`,
      });
      queryClient.invalidateQueries({ queryKey: ["superAdmin", "schools"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to save feature configuration.");
    },
  });

  const selectedSchool = schools.find((s) => s._id === selectedSchoolId);
  const activeModules = selectedSchoolId ? (localFeatures[selectedSchoolId] ?? MODULES) : [];

  const toggleModule = (moduleName: string) => {
    if (!selectedSchoolId) return;
    const current = localFeatures[selectedSchoolId] ?? MODULES;
    const isEnabled = current.includes(moduleName);
    const updated = isEnabled
      ? current.filter((m) => m !== moduleName)
      : [...current, moduleName];
    setLocalFeatures((prev) => ({ ...prev, [selectedSchoolId]: updated }));
  };

  const enableAllModules = () => {
    if (!selectedSchoolId) return;
    setLocalFeatures((prev) => ({ ...prev, [selectedSchoolId]: [...MODULES] }));
    toast.info("All modules enabled — click Save to persist.");
  };

  const disableAllModules = () => {
    if (!selectedSchoolId) return;
    setLocalFeatures((prev) => ({ ...prev, [selectedSchoolId]: [] }));
    toast.info("All modules disabled — click Save to persist.");
  };

  const handleSaveConfig = () => {
    if (!selectedSchoolId) return;
    saveFeaturesMutation.mutate({ schoolId: selectedSchoolId, features: activeModules });
  };

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Toggles"
        description="Enable or disable specific modules for individual schools."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* School sidebar */}
        <div className="lg:col-span-1 border-r border-border pr-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2 h-[600px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin inline-block h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No schools found.
              </div>
            ) : (
              filteredSchools.map((school) => {
                const enabledCount = localFeatures[school._id]?.length ?? MODULES.length;
                return (
                  <button
                    key={school._id}
                    onClick={() => setSelectedSchoolId(school._id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSchoolId === school._id
                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                        : "bg-card border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {school.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex justify-between">
                      <span className="font-semibold text-indigo-500 uppercase text-[10px]">
                        {school.code}
                      </span>
                      <span>{enabledCount}/{MODULES.length} Modules</span>
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Feature panel */}
        <div className="lg:col-span-3">
          {selectedSchool ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm min-h-[600px]">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedSchool.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Status: {selectedSchool.status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={disableAllModules}
                    className="px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Disable All
                  </button>
                  <button
                    onClick={enableAllModules}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={saveFeaturesMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saveFeaturesMutation.isPending ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Configuration
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {MODULES.map((module) => {
                  const isEnabled = activeModules.includes(module);
                  return (
                    <div
                      key={module}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
                        isEnabled
                          ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/10"
                          : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                      }`}
                      onClick={() => toggleModule(module)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isEnabled
                              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                              : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <Settings2 className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-sm">{module}</span>
                      </div>
                      {/* Toggle switch */}
                      <div
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${
                          isEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                            isEnabled ? "translate-x-2" : "-translate-x-2"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <Building2 className="h-12 w-12 mb-4 opacity-50" />
              <p>Select a school from the left sidebar to manage its feature modules.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

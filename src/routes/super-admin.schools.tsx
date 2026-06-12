import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-ui";
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X,
  UserCheck
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SuperAdminAPI } from "@/services/super-admin.service";
import { toast } from "sonner";
import { useSuperAdmin } from "@/components/super-admin/super-admin-context";

export const Route = createFileRoute("/super-admin/schools")({
  component: SuperAdminSchools,
});

function SuperAdminSchools() {
  const queryClient = useQueryClient();
  const { impersonateSchool } = useSuperAdmin();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['superAdmin', 'schools', page, search, statusFilter],
    queryFn: () => SuperAdminAPI.getSchools({ 
      page, 
      limit: 10, 
      search: search || undefined,
      ...(statusFilter !== 'All' && { status: statusFilter })
    })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => SuperAdminAPI.updateSchoolStatus(id, status),
    onSuccess: () => {
      toast.success("School status updated");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'schools'] });
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update school");
    }
  });

  const createSchoolMutation = useMutation({
    mutationFn: (newSchool: { name: string; code: string; contactEmail?: string; contactPhone?: string }) => 
      SuperAdminAPI.createSchool(newSchool),
    onSuccess: () => {
      toast.success("School onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'schools'] });
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create school");
    }
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: (id: string) => SuperAdminAPI.deleteSchool(id),
    onSuccess: () => {
      toast.success("School deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['superAdmin', 'schools'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete school");
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  const schools = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Management"
        description="Manage all schools on the platform, view details, and update statuses."
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 w-full sm:max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-md border border-slate-300 pl-4 pr-10 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Trial">Trial</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add School
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">School Name</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Students</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div></div>
                  </td>
                </tr>
              ) : schools.map((school: any) => (
                <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-slate-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{school.name}</div>
                        <div className="text-xs text-slate-500">{school.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 dark:text-slate-300">{school.adminEmail}</div>
                    <div className="text-xs text-slate-500">{school.contact}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{school.studentCount || 0}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{new Date(school.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold
                      ${school.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                      ${school.status === 'Suspended' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : ''}
                      ${school.status === 'Trial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                    `}>
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          impersonateSchool(school._id, school.name);
                          window.location.href = "/admin";
                        }}
                        disabled={school.status !== 'Active'}
                        className="p-2 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                        title="Impersonate School Admin"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedSchool(school); setIsDetailsDrawerOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedSchool(school); setIsEditModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete school "${school.name}"?`)) {
                            deleteSchoolMutation.mutate(school._id);
                          }
                        }}
                        disabled={deleteSchoolMutation.isPending}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && schools.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No schools found matching your criteria.
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Mock Modals & Drawers */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New School</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">School Name</label>
                <input id="add-school-name" type="text" placeholder="e.g. Oakridge Academy" className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">School Code (Unique)</label>
                <input id="add-school-code" type="text" placeholder="e.g. OAKRIDGE_SCH" className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact Email</label>
                <input id="add-school-email" type="email" placeholder="admin@oakridge.edu" className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contact Phone</label>
                <input id="add-school-phone" type="text" placeholder="+1 (555) 019-2834" className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700 text-sm" />
              </div>
              <button 
                disabled={createSchoolMutation.isPending}
                onClick={() => {
                  const name = (document.getElementById('add-school-name') as HTMLInputElement).value;
                  const code = (document.getElementById('add-school-code') as HTMLInputElement).value;
                  const contactEmail = (document.getElementById('add-school-email') as HTMLInputElement).value || undefined;
                  const contactPhone = (document.getElementById('add-school-phone') as HTMLInputElement).value || undefined;

                  if (!name || !code) {
                    toast.error("School Name and Code are required");
                    return;
                  }

                  createSchoolMutation.mutate({ name, code, contactEmail, contactPhone });
                }} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-2 mt-2 disabled:opacity-50 text-sm font-semibold transition-colors"
              >
                {createSchoolMutation.isPending ? "Creating..." : "Create School"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit {selectedSchool.name}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" defaultValue={selectedSchool.name} className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700" />
              <select id="edit-status-select" defaultValue={selectedSchool.status} className="w-full rounded-md border p-2 dark:bg-slate-800 dark:border-slate-700">
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Trial">Trial</option>
              </select>
              <button 
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  const select = document.getElementById('edit-status-select') as HTMLSelectElement;
                  updateStatusMutation.mutate({ id: selectedSchool._id, status: select.value });
                }} 
                className="w-full bg-indigo-600 text-white rounded-md p-2 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsDrawerOpen && selectedSchool && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-border transform transition-transform">
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">School Details</h3>
              <button onClick={() => setIsDetailsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6 flex-1">
              <div>
                <label className="text-xs text-slate-500 uppercase font-semibold">Name</label>
                <p className="font-medium text-slate-900 dark:text-white">{selectedSchool.name}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-semibold">Contact Email</label>
                <p className="text-slate-700 dark:text-slate-300">{selectedSchool.adminEmail}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-semibold">Phone</label>
                <p className="text-slate-700 dark:text-slate-300">{selectedSchool.contact}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-semibold">Status</label>
                <p className="text-slate-700 dark:text-slate-300">{selectedSchool.status}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-semibold">Students Count</label>
                <p className="text-slate-700 dark:text-slate-300">{selectedSchool.students}</p>
              </div>
            </div>
            <div className="mt-auto border-t border-border pt-4">
               <button onClick={() => setIsDetailsDrawerOpen(false)} className="w-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md p-2 font-medium">Close Drawer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

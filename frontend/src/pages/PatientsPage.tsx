import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Users } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button, Input, Table, EmptyState, Avatar } from "../components/ui";
import { CardSkeleton } from "../components/ui/loading-skeleton";
import { PatientForm } from "../components/patients/PatientForm";
import { PatientCard } from "../components/patients/PatientCard";
import api from "../lib/api";
import type { Patient, PaginatedResponse } from "../types";

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, per_page: perPage };
      if (search.trim()) params.search = search.trim();
      const response = await api.get<PaginatedResponse<Patient>>("/patients", { params });
      setPatients(response.data.data);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchPatients();
    }, 400);
  };

  const columns = [
    { key: "full_name", header: "Name", render: (p: Patient) => (
      <div className="flex items-center gap-3">
        <Avatar name={p.full_name} size="sm" />
        <span className="font-medium">{p.full_name}</span>
      </div>
    )},
    { key: "phone", header: "Phone", render: (p: Patient) => <span className="text-gray-600 dark:text-gray-400">{p.phone || "—"}</span> },
    { key: "total_visits", header: "Visits", render: (p: Patient) => <span className="font-medium">{p.total_visits}</span> },
    { key: "created_at", header: "Registered", render: (p: Patient) => <span className="text-gray-600 dark:text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span> },
  ];

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Patients</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name or phone..." value={search} onChange={handleSearchChange} className="pl-10 sm:w-72" />
            </div>
            <Button onClick={() => { setEditingPatient(null); setIsFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>Add Patient</Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : patients.length === 0 ? (
          <EmptyState icon={<Users className="h-12 w-12" />} title="No patients found" description={search ? "Try a different search term." : "Add your first patient to get started."} />
        ) : (
          <>
            <div className="hidden md:block">
              <Table columns={columns} data={patients} keyExtractor={(p) => p.id} emptyMessage="No patients found" onRowClick={(p) => { setEditingPatient(p); setIsFormOpen(true); }} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {patients.map((p) => (
                <PatientCard key={p.id} patient={p} onClick={() => { setEditingPatient(p); setIsFormOpen(true); }} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Showing {patients.length} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PatientForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={fetchPatients} patient={editingPatient} />
    </DashboardLayout>
  );
}

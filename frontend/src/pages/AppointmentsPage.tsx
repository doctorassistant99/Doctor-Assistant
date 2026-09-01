import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button, Input, Table, StatusBadge, Select, EmptyState, showToast } from "../components/ui";
import { CardSkeleton } from "../components/ui/loading-skeleton";
import { AppointmentForm } from "../components/appointments/AppointmentForm";
import api from "../lib/api";
import type { Appointment, PaginatedResponse } from "../types";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Checked In", value: "checked_in" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No-show", value: "no_show" },
];

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, per_page: perPage };
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date_from = dateFilter;
      if (dateFilter) params.date_to = dateFilter;
      const response = await api.get<PaginatedResponse<Appointment>>("/appointments", { params });
      setAppointments(response.data.data);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, dateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (appointment: Appointment, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointment.id}`, { status: newStatus });
      showToast.success("Status updated");
      fetchAppointments();
    } catch (err: any) {
      showToast.error(err.response?.data?.detail || "Failed to update status");
    }
  };

  const columns = [
    { key: "patient_name", header: "Patient", render: (a: Appointment) => <span className="font-medium">{a.patient_name || a.patient_id}</span> },
    { key: "appointment_date", header: "Date", render: (a: Appointment) => <span className="text-gray-600 dark:text-gray-400">{a.appointment_date}</span> },
    { key: "start_time", header: "Time", render: (a: Appointment) => <span className="text-gray-600 dark:text-gray-400">{a.start_time} - {a.end_time}</span> },
    { key: "service", header: "Service", render: (a: Appointment) => <span className="text-gray-600 dark:text-gray-400">{a.service || "—"}</span> },
    { key: "status", header: "Status", render: (a: Appointment) => (
      <Select
        value={a.status}
        onChange={(e) => handleStatusChange(a, e.target.value)}
        options={statusOptions.filter((o) => o.value !== "").map((o) => ({ label: o.label, value: o.value }))}
        className="w-32 py-1 text-xs"
      />
    )},
  ];

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appointments</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={statusOptions} placeholder="Filter by status" className="sm:w-44" />
            <Input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} className="sm:w-44" />
            <Button onClick={() => setIsFormOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>New Appointment</Button>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

        {loading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : appointments.length === 0 ? (
          <EmptyState icon={<Calendar className="h-12 w-12" />} title="No appointments found" description="Try changing your filters or create a new appointment." />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table columns={columns} data={appointments} keyExtractor={(a) => a.id} emptyMessage="No appointments" />
            </div>
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {appointments.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">{a.patient_name || "Patient"}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{a.appointment_date} · {a.start_time} - {a.end_time}</p>
                  {a.service && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{a.service}</p>}
                  <div className="mt-3">
                    <Select value={a.status} onChange={(e) => handleStatusChange(a, e.target.value)} options={statusOptions.filter((o) => o.value !== "").map((o) => ({ label: o.label, value: o.value }))} className="w-full py-1 text-xs" />
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Showing {appointments.length} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AppointmentForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={fetchAppointments} />
    </DashboardLayout>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, DollarSign, Activity } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { StatCard, Card, StatusBadge, EmptyState, Avatar } from "../components/ui";
import { Skeleton, CardSkeleton } from "../components/ui/loading-skeleton";
import api from "../lib/api";
import { formatCurrency } from "../lib/utils";
import type { Appointment, Transaction, TodaySummary } from "../types";

export function DashboardPage() {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [summaryRes, todayRes, upcomingRes, transactionsRes] = await Promise.allSettled([
          api.get("/transactions/today-summary"),
          api.get("/appointments/today"),
          api.get("/appointments/upcoming?limit=5"),
          api.get("/transactions?per_page=5"),
        ]);

        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
        if (todayRes.status === "fulfilled") setTodayAppointments(todayRes.value.data);
        if (upcomingRes.status === "fulfilled") setUpcomingAppointments(upcomingRes.value.data);
        if (transactionsRes.status === "fulfilled") setRecentTransactions(transactionsRes.value.data.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Appointments" value={todayAppointments.length} icon={<Calendar className="h-5 w-5 text-blue-600" />} />
          <StatCard title="Today's Revenue" value={formatCurrency(summary?.total_revenue || 0)} icon={<DollarSign className="h-5 w-5 text-green-600" />} />
          <StatCard title="Transactions Today" value={summary?.transaction_count || 0} icon={<Activity className="h-5 w-5 text-purple-600" />} />
          <StatCard title="Upcoming" value={upcomingAppointments.length} icon={<Clock className="h-5 w-5 text-amber-600" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Appointments</h2>
            </div>
            {todayAppointments.length === 0 ? (
              <EmptyState icon={<Calendar className="h-12 w-12" />} title="No appointments today" description="All clear for today!" />
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => (
                  <motion.div key={appt.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <Avatar name={appt.patient_name || "Patient"} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{appt.patient_name}</p>
                        <p className="text-xs text-gray-500">{appt.start_time} - {appt.end_time}</p>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming</h2>
            </div>
            {upcomingAppointments.length === 0 ? (
              <EmptyState icon={<Clock className="h-12 w-12" />} title="No upcoming appointments" description="Nothing scheduled yet." />
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <motion.div key={appt.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{appt.patient_name}</p>
                      <p className="text-xs text-gray-500">{appt.appointment_date} at {appt.start_time}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          </div>
          {recentTransactions.length === 0 ? (
            <EmptyState icon={<DollarSign className="h-12 w-12" />} title="No transactions" description="No transactions recorded yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Patient</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Method</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id}>
                      <td className="py-3 text-sm font-mono text-gray-900 dark:text-white">{txn.invoice_number}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{txn.patient_name}</td>
                      <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(txn.amount)}</td>
                      <td className="py-3"><StatusBadge status={txn.payment_method} /></td>
                      <td className="py-3"><StatusBadge status={txn.transaction_type} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

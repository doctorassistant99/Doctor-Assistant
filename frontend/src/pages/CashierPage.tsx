import { useState, useEffect, useCallback } from "react";
import { Plus, DollarSign, Receipt } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button, StatCard, Card, Badge, StatusBadge, EmptyState } from "../components/ui";
import { CardSkeleton } from "../components/ui/loading-skeleton";
import { PaymentForm } from "../components/cashier/PaymentForm";
import { ReceiptModal } from "../components/cashier/ReceiptModal";
import api from "../lib/api";
import type { Transaction, TodaySummary } from "../types";

export function CashierPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txnRes, summaryRes] = await Promise.all([
        api.get("/transactions?per_page=10"),
        api.get("/transactions/today-summary"),
      ]);
      setTransactions(txnRes.data.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Today's Total" value={`${summary?.total_revenue?.toFixed(2) || "0.00"}`} icon={<DollarSign className="h-5 w-5 text-green-600" />} />
          <StatCard title="Transactions" value={summary?.transaction_count || 0} icon={<Receipt className="h-5 w-5 text-blue-600" />} />
          <Card className="flex items-center justify-center">
            <Button size="lg" onClick={() => setIsPaymentOpen(true)} leftIcon={<Plus className="h-5 w-5" />}>New Payment</Button>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          </div>
          {loading ? (
            <div className="space-y-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : transactions.length === 0 ? (
            <EmptyState icon={<Receipt className="h-12 w-12" />} title="No transactions yet" description="Record your first payment to get started." />
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
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setReceiptTxn(txn)}>
                      <td className="py-3 text-sm font-mono text-gray-900 dark:text-white">{txn.invoice_number}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{txn.patient_name || "—"}</td>
                      <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">{Number(txn.amount).toFixed(2)}</td>
                      <td className="py-3"><Badge variant={txn.payment_method === "cash" ? "success" : "info"}>{txn.payment_method}</Badge></td>
                      <td className="py-3"><StatusBadge status={txn.transaction_type} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <PaymentForm isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} onSaved={fetchData} />
      <ReceiptModal isOpen={!!receiptTxn} onClose={() => setReceiptTxn(null)} transaction={receiptTxn || undefined} />
    </DashboardLayout>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button, Table, StatusBadge, Badge, Select, EmptyState, Input } from "../components/ui";
import { CardSkeleton } from "../components/ui/loading-skeleton";
import { ReceiptModal } from "../components/cashier/ReceiptModal";
import api from "../lib/api";
import type { Transaction, PaginatedResponse } from "../types";

const typeOptions = [
  { label: "All types", value: "" },
  { label: "Consultation", value: "consultation" },
  { label: "Payment", value: "payment" },
  { label: "Refund", value: "refund" },
  { label: "Other", value: "other" },
];

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, per_page: perPage };
      if (typeFilter) params.transaction_type = typeFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await api.get<PaginatedResponse<Transaction>>("/transactions", { params });
      setTransactions(response.data.data);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const columns = [
    { key: "invoice_number", header: "Invoice", render: (t: Transaction) => <span className="font-mono font-medium text-gray-900 dark:text-white">{t.invoice_number}</span> },
    { key: "patient_name", header: "Patient", render: (t: Transaction) => <span>{t.patient_name || "—"}</span> },
    { key: "amount", header: "Amount", render: (t: Transaction) => <span className="font-medium">{Number(t.amount).toFixed(2)}</span> },
    { key: "payment_method", header: "Method", render: (t: Transaction) => <Badge variant={t.payment_method === "cash" ? "success" : "info"}>{t.payment_method}</Badge> },
    { key: "transaction_type", header: "Type", render: (t: Transaction) => <StatusBadge status={t.transaction_type} /> },
    { key: "created_at", header: "Date", render: (t: Transaction) => <span className="text-gray-600 dark:text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span> },
  ];

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transactions</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} options={typeOptions} className="sm:w-40" />
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="sm:w-40" />
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="sm:w-40" />
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

        {loading ? (
          <div className="space-y-4">{[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : transactions.length === 0 ? (
          <EmptyState icon={<Receipt className="h-12 w-12" />} title="No transactions found" description="Try adjusting your filters." />
        ) : (
          <>
            <Table columns={columns} data={transactions} keyExtractor={(t) => t.id} emptyMessage="No transactions" onRowClick={(t) => setReceiptTxn(t)} />
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Showing {transactions.length} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ReceiptModal isOpen={!!receiptTxn} onClose={() => setReceiptTxn(null)} transaction={receiptTxn || undefined} />
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Select, showToast } from "../ui";
import api from "../../lib/api";

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const typeOptions = [
  { label: "Consultation", value: "consultation" },
  { label: "Payment", value: "payment" },
  { label: "Refund", value: "refund" },
  { label: "Other", value: "other" },
];

const methodOptions = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "Transfer", value: "transfer" },
  { label: "Other", value: "other" },
];

export function PaymentForm({ isOpen, onClose, onSaved }: PaymentFormProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    transaction_type: "consultation",
    payment_method: "cash",
    amount: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPatient(null);
    setPatientSearch("");
    setFormData({ transaction_type: "consultation", payment_method: "cash", amount: "", description: "" });
  }, [isOpen]);

  const searchPatients = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await api.get("/patients", { params: { search: query, per_page: 10 } });
      setPatients(response.data.data);
    } catch {
      setPatients([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientSearch(value);
    if (value.trim().length >= 2) searchPatients(value);
    else setPatients([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast.error("Please select a patient");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast.error("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      await api.post("/transactions", {
        patient_id: selectedPatient.id,
        transaction_type: formData.transaction_type,
        payment_method: formData.payment_method,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
      });
      showToast.success("Transaction recorded successfully");
      onSaved();
      onClose();
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || "Failed to record transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Patient</label>
          <Input placeholder="Search patient by name or phone..." value={patientSearch} onChange={handlePatientSearch} />
          {searchLoading && <p className="mt-1 text-xs text-gray-500">Searching...</p>}
          {patients.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(p);
                    setPatientSearch(`${p.full_name} (${p.phone || "no phone"})`);
                    setPatients([]);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {p.full_name} <span className="text-xs text-gray-400">{p.phone}</span>
                </button>
              ))}
            </div>
          )}
          {selectedPatient && !patients.length && <p className="mt-1 text-xs text-green-600">✓ {selectedPatient.full_name} selected</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={formData.transaction_type} onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })} options={typeOptions} />
          <Select label="Payment Method" value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} options={methodOptions} />
        </div>

        <Input label="Amount" type="number" step="0.01" min="0" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
        <Input label="Description" placeholder="Optional description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
}

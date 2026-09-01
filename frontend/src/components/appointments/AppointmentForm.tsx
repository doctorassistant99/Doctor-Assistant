import React, { useState, useEffect } from "react";
import { Modal, Input, Button, showToast } from "../ui";
import api from "../../lib/api";

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDate?: string;
}

export function AppointmentForm({ isOpen, onClose, onSaved, defaultDate }: AppointmentFormProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    appointment_date: defaultDate || new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_time: "09:30",
    service: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPatient(null);
    setPatientSearch("");
    setFormData({
      appointment_date: defaultDate || new Date().toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "09:30",
      service: "",
      notes: "",
    });
  }, [isOpen, defaultDate]);

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
    if (value.trim().length >= 2) {
      searchPatients(value);
    } else {
      setPatients([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast.error("Please select a patient");
      return;
    }
    setLoading(true);
    try {
      await api.post("/appointments", {
        patient_id: selectedPatient.id,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        service: formData.service || null,
        notes: formData.notes || null,
        booking_source: "reception",
      });
      showToast.success("Appointment created successfully");
      onSaved();
      onClose();
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || "Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Appointment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Patient</label>
          <Input
            placeholder="Search patient by name or phone..."
            value={patientSearch}
            onChange={handlePatientSearch}
          />
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
          {selectedPatient && !patients.length && (
            <p className="mt-1 text-xs text-green-600">✓ {selectedPatient.full_name} selected</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
          <Input type="date" value={formData.appointment_date} onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Time</label>
            <Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Time</label>
            <Input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} required />
          </div>
        </div>

        <Input label="Service" placeholder="e.g. Consultation, Follow-up..." value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} />
        <Input label="Notes" placeholder="Optional notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Appointment</Button>
        </div>
      </form>
    </Modal>
  );
}

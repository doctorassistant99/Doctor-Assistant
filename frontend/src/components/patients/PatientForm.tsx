import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Select, showToast } from "../ui";
import api from "../../lib/api";

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  patient?: any | null;
}

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export function PatientForm({ isOpen, onClose, onSaved, patient }: PatientFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "",
        notes: patient.notes || "",
      });
    } else {
      setFormData({ full_name: "", phone: "", email: "", date_of_birth: "", gender: "", notes: "" });
    }
  }, [patient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (patient) {
        await api.put(`/patients/${patient.id}`, formData);
        showToast.success("Patient updated successfully");
      } else {
        await api.post("/patients", formData);
        showToast.success("Patient created successfully");
      }
      onSaved();
      onClose();
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || "Failed to save patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={patient ? "Edit Patient" : "Add Patient"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Patient full name" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email (optional)" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date of Birth" type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
          <Select label="Gender" options={genderOptions} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} placeholder="Select gender" />
        </div>
        <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{patient ? "Update" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}

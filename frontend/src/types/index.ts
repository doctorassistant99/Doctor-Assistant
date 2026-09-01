export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "cashier";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Patient {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  notes: string | null;
  total_visits: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "checked_in" | "completed" | "cancelled" | "no_show";
  service: string | null;
  booking_source: "online" | "reception" | "phone" | "manual";
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  patient_name?: string;
  patient_phone?: string;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  patient_id: string;
  visit_id: string | null;
  transaction_type: "consultation" | "payment" | "refund" | "other";
  payment_method: "cash" | "card" | "transfer" | "other";
  amount: number;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  patient_name?: string;
}

export interface TodaySummary {
  total_revenue: number;
  transaction_count: number;
  date: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

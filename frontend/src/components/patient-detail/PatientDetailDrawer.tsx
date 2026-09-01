import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Calendar, Stethoscope } from "lucide-react";
import { Avatar, Badge } from "../ui";

interface PatientDetailProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientDetailDrawer({ patient, isOpen, onClose }: PatientDetailProps) {
  if (!patient) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl dark:bg-gray-900 flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Details</h2>
              <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar name={patient.full_name} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{patient.full_name}</h3>
                  <Badge variant="info" size="sm">{patient.total_visits} visits</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" /><span>{patient.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" /><span>{patient.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" /><span>DOB: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "—"}</span>
                </div>
              </div>

              {patient.notes && (
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{patient.notes}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Visit History</h4>
                <div className="space-y-3">
                  {(patient.visits || []).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No visits recorded.</p>
                  ) : (
                    patient.visits.map((visit: any) => (
                      <div key={visit.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Stethoscope className="h-3 w-3" />
                          <span>{new Date(visit.visit_date).toLocaleString()}</span>
                        </div>
                        {visit.symptoms && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Symptoms:</span> {visit.symptoms}</p>}
                        {visit.diagnosis && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Diagnosis:</span> {visit.diagnosis}</p>}
                        {visit.treatment && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Treatment:</span> {visit.treatment}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

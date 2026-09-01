import { Phone } from "lucide-react";
import { Avatar, Badge } from "../ui";

export function PatientCard({ patient, onClick }: { patient: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
      <div className="flex items-center gap-3">
        <Avatar name={patient.full_name} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">{patient.full_name}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Phone className="h-3 w-3" /> {patient.phone || "—"}
          </p>
        </div>
        <Badge variant="info">{patient.total_visits} visits</Badge>
      </div>
    </div>
  );
}

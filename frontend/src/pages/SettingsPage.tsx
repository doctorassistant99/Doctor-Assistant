import { DashboardLayout } from "../components/layout/DashboardLayout";
import { EmptyState } from "../components/ui";
import { Settings } from "lucide-react";

export function SettingsPage() {
  return (
    <DashboardLayout>
      <EmptyState icon={<Settings className="h-12 w-12" />} title="Settings Module" description="System settings will be built here." />
    </DashboardLayout>
  );
}

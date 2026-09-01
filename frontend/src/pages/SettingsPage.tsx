import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Building2, Calendar, Palette, Users as UsersIcon, UserPlus } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button, Card, Input, Select, Badge, Modal, showToast, ConfirmDialog, CardSkeleton } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useTheme, useLanguage } from "../stores/appStore";
import api from "../lib/api";
import { cn } from "../lib/utils";

type TabKey = "clinic" | "booking" | "appearance" | "users";

interface ClinicSettings {
  doctor_name: string | null;
  clinic_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  booking_enabled: boolean;
  appointment_duration_minutes: number;
  invoice_format: string | null;
  extra_config: Record<string, unknown> | null;
}

interface InternalUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { theme, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabKey>("clinic");
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<InternalUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<InternalUser | null>(null);
  const [newUser, setNewUser] = useState({ email: "", full_name: "", password: "", role: "cashier" });

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get("/settings/");
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSettings();
    if (isAdmin) fetchUsers();
  }, [fetchSettings, fetchUsers, isAdmin]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put("/settings/", settings);
      showToast.success("Settings saved");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save settings";
      showToast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users/", newUser);
      showToast.success("User created");
      setIsUserModalOpen(false);
      setNewUser({ email: "", full_name: "", password: "", role: "cashier" });
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      showToast.error(message);
    }
  };

  const deactivateUser = async () => {
    if (!deactivateTarget) return;
    try {
      await api.delete(`/users/${deactivateTarget.id}`);
      showToast.success("User deactivated");
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to deactivate user";
      showToast.error(message);
    }
  };

  const updateSettings = (partial: Partial<ClinicSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: "clinic", label: "Clinic / Doctor", icon: <Building2 className="h-4 w-4" /> },
    { key: "booking", label: "Booking", icon: <Calendar className="h-4 w-4" /> },
    { key: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <UsersIcon className="h-4 w-4" />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto rtl:space-x-reverse">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Clinic tab */}
        {activeTab === "clinic" && (
          <Card className="p-6">
            {settingsLoading ? (
              <div className="space-y-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : (
              <form onSubmit={(e: FormEvent) => { e.preventDefault(); saveSettings(); }} className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Clinic Information</h3>
                <Input label="Doctor Name" value={settings?.doctor_name || ""} onChange={(e) => updateSettings({ doctor_name: e.target.value })} />
                <Input label="Clinic Name" value={settings?.clinic_name || ""} onChange={(e) => updateSettings({ clinic_name: e.target.value })} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone" value={settings?.phone || ""} onChange={(e) => updateSettings({ phone: e.target.value })} />
                  <Input label="Email" type="email" value={settings?.email || ""} onChange={(e) => updateSettings({ email: e.target.value })} />
                </div>
                <Input label="Address" value={settings?.address || ""} onChange={(e) => updateSettings({ address: e.target.value })} />
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving}>Save</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Booking tab */}
        {activeTab === "booking" && (
          <Card className="p-6">
            {settingsLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : (
              <form onSubmit={(e: FormEvent) => { e.preventDefault(); saveSettings(); }} className="space-y-5">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Booking Settings</h3>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Online Booking</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enable patient online booking (Phase 2)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSettings({ booking_enabled: !(settings?.booking_enabled) })}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      settings?.booking_enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                        settings?.booking_enabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
                <Input
                  label="Appointment Duration (minutes)"
                  type="number"
                  value={settings?.appointment_duration_minutes || 30}
                  onChange={(e) => updateSettings({ appointment_duration_minutes: parseInt(e.target.value) || 30 })}
                />
                <Input
                  label="Invoice Format"
                  value={settings?.invoice_format || "YYMMDD0001"}
                  onChange={(e) => updateSettings({ invoice_format: e.target.value })}
                  helperText="Pattern: YY=year, MM=month, DD=day, then sequential digits"
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving}>Save</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Appearance tab */}
        {activeTab === "appearance" && (
          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Appearance</h3>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Theme</p>
                <div className="flex gap-2">
                  <Button variant={theme === "light" ? "primary" : "outline"} onClick={() => { if (theme !== "light") toggleTheme(); }}>Light</Button>
                  <Button variant={theme === "dark" ? "primary" : "outline"} onClick={() => { if (theme !== "dark") toggleTheme(); }}>Dark</Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Language</p>
                <div className="flex gap-2">
                  <Button variant={language === "en" ? "primary" : "outline"} onClick={() => changeLanguage("en")}>English</Button>
                  <Button variant={language === "ar" ? "primary" : "outline"} onClick={() => changeLanguage("ar")}>العربية</Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Users tab (admin only) */}
        {activeTab === "users" && isAdmin && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Team Members</h3>
              <Button size="sm" onClick={() => setIsUserModalOpen(true)} leftIcon={<UserPlus className="h-4 w-4" />}>Add User</Button>
            </div>
            {usersLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={u.role === "admin" ? "info" : "default"}>{u.role}</Badge>
                      {u.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Disabled</Badge>
                      )}
                      {u.id !== currentUser?.id && u.is_active && (
                        <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(u)}>Deactivate</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create user modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Add Team Member" size="sm">
        <form onSubmit={createUser} className="space-y-4">
          <Input label="Full Name" required value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
          <Input label="Email" type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <Input label="Password" type="password" required minLength={6} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <Select label="Role" options={[{ label: "Cashier / Receptionist", value: "cashier" }, { label: "Admin", value: "admin" }]} value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={deactivateUser}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${deactivateTarget?.full_name}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
      />
    </DashboardLayout>
  );
}

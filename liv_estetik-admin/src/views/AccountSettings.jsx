import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { changeEmail, changePassword } from "../api";
import { Field, TextInput, PrimaryButton, SectionShell } from "../components/ui/Controls";

export default function AccountSettings({ user }) {
  const [emailForm, setEmailForm] = useState({ email: user.email });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailStatus, setEmailStatus] = useState({ type: "", message: "" }); // 'success', 'error', ''
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
    setEmailStatus({ type: "", message: "" });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordStatus({ type: "", message: "" });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailForm.email || emailForm.email === user.email) {
      setEmailStatus({ type: "error", message: "Please enter a new email address" });
      return;
    }

    setEmailLoading(true);
    try {
      await changeEmail({ email: emailForm.email });
      setEmailStatus({ type: "success", message: "Email updated successfully!" });
      setTimeout(() => setEmailStatus({ type: "", message: "" }), 3000);
    } catch (err) {
      setEmailStatus({ type: "error", message: err.message || "Failed to update email" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      setPasswordStatus({ type: "error", message: "Current password is required" });
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      setPasswordStatus({ type: "error", message: "New password must be at least 8 characters" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords do not match" });
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordStatus({ type: "error", message: "New password must be different from current password" });
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordStatus({ type: "success", message: "Password updated successfully!" });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setPasswordStatus({ type: "", message: "" }), 3000);
    } catch (err) {
      setPasswordStatus({ type: "error", message: err.message || "Failed to update password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SectionShell title="Account Settings" subtitle="Manage your account email and password.">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Section */}
        <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-evergreen-950">Change Email</h2>
          <p className="mt-1 text-sm text-stone-500">Update your email address</p>

          <form onSubmit={handleEmailSubmit} className="mt-4 grid gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Current Email</label>
              <div className="mt-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                {user.email}
              </div>
            </div>

            <Field label="New Email">
              <TextInput
                type="email"
                name="email"
                value={emailForm.email}
                onChange={handleEmailChange}
                required
              />
            </Field>

            {emailStatus.message && (
              <div
                className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
                  emailStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {emailStatus.type === "success" ? <FiCheckCircle className="mt-0.5 flex-shrink-0" /> : <FiAlertCircle className="mt-0.5 flex-shrink-0" />}
                <span>{emailStatus.message}</span>
              </div>
            )}

            <PrimaryButton disabled={emailLoading} type="submit">
              {emailLoading ? "Updating..." : "Update Email"}
            </PrimaryButton>
          </form>
        </article>

        {/* Password Section */}
        <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-evergreen-950">Change Password</h2>
          <p className="mt-1 text-sm text-stone-500">Update your account password</p>

          <form onSubmit={handlePasswordSubmit} className="mt-4 grid gap-4">
            <Field label="Current Password">
              <TextInput
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </Field>

            <Field label="New Password">
              <TextInput
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </Field>

            <Field label="Confirm Password">
              <TextInput
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </Field>

            {passwordStatus.message && (
              <div
                className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
                  passwordStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {passwordStatus.type === "success" ? <FiCheckCircle className="mt-0.5 flex-shrink-0" /> : <FiAlertCircle className="mt-0.5 flex-shrink-0" />}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <PrimaryButton disabled={passwordLoading} type="submit">
              {passwordLoading ? "Updating..." : "Update Password"}
            </PrimaryButton>
          </form>
        </article>
      </div>
    </SectionShell>
  );
}

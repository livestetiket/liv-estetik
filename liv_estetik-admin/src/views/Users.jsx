import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiTrash2, FiEdit3, FiUserPlus, FiX } from "react-icons/fi";
import { getUsers, createUser, updateUser, toggleUserActive, deleteUser } from "../api";
import { Field, TextInput, Select, PrimaryButton, SectionShell, StatusPill, IconButton } from "../components/ui/Controls";

const EMPTY_USER_FORM = { name: "", email: "", password: "", role: "reception", phone: "", active: true };

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [editingUser, setEditingUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getUsers());
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    try {
      if (editingUser) {
        const patch = {
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone,
          active: form.active,
        };
        if (form.password) {
          patch.password = form.password;
        }
        await updateUser(editingUser.id, patch);
      } else {
        await createUser(form);
      }
      setForm(EMPTY_USER_FORM);
      setEditingUser(null);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const patch = async (user) => {
    try {
      await toggleUserActive(user.id, !user.active);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const edit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "reception",
      phone: user.phone || "",
      active: user.active !== false,
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setForm(EMPTY_USER_FORM);
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name || user.email}?`)) return;
    try {
      await deleteUser(user.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <SectionShell title="Users" subtitle="Create and manage admin or reception staff accounts." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <form onSubmit={save} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></Field>
        <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required /></Field>
        <Field label="Password"><TextInput type="password" minLength="8" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required /></Field>
        <Field label="Role"><Select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}><option value="reception">Reception</option><option value="admin">Admin</option></Select></Field>
        <Field label="Phone"><TextInput value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} /></Field>
        <div className="flex items-end gap-2">
          <PrimaryButton icon={FiUserPlus} type="submit" className="self-end">{editingUser ? "Save" : "Create"}</PrimaryButton>
          {editingUser ? <button type="button" className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-evergreen-950 transition hover:bg-stone-50" onClick={cancelEdit}>Cancel</button> : null}
        </div>
      </form>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {rows.map((user) => (
          <div key={user.id} className="grid gap-3 border-b border-stone-100 p-4 last:border-b-0 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div>
              <p className="font-semibold text-evergreen-950">{user.name}</p>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill value={user.role} />
              <StatusPill value={user.active === false ? "inactive" : "active"} />
            </div>
            <div className="flex gap-2">
              <IconButton title="Edit" icon={FiEdit3} onClick={() => edit(user)} />
              <IconButton title={user.active === false ? "Activate" : "Deactivate"} icon={FiEdit3} onClick={() => patch(user)} />
              <IconButton title="Delete" icon={FiTrash2} tone="danger" onClick={() => remove(user)} />
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

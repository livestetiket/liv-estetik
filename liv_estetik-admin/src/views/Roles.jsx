import { useCallback, useEffect, useState } from "react";
import { FiEdit3, FiPlus, FiRefreshCw, FiSave, FiX } from "react-icons/fi";
import { createRole, getRoleCatalog, updateRole } from "../api";
import { EmptyState, Field, PrimaryButton, SectionShell, TextArea, TextInput } from "../components/ui/Controls";

const blank = () => ({ name: "", description: "", permissions: [] });
const permissionLabel = (key) => key.split(".").map((part) => part.replaceAll("_", " ")).join(" · ");

export default function Roles() {
  const [catalog, setCatalog] = useState({ roles: [], permissions: [] });
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setCatalog(await getRoleCatalog()); } catch (err) { setError(err.message || "Unable to load roles."); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try { if (editing) await updateRole(editing.key, form); else await createRole(form); setEditing(null); setForm(blank()); await load(); setNotice(editing ? "Role permissions saved." : "Role created."); }
    catch (err) { setError(err.message || "Unable to save role."); }
    finally { setSaving(false); }
  };
  const edit = (role) => { setEditing(role); setForm({ name: role.name, description: role.description || "", permissions: role.permissions || [] }); setError(""); setNotice(""); };
  const togglePermission = (permission) => setForm((value) => ({ ...value, permissions: value.permissions.includes(permission) ? value.permissions.filter((item) => item !== permission) : [...value.permissions, permission] }));
  const toggleActive = async (role) => { try { await updateRole(role.key, { active: !role.active }); await load(); } catch (err) { setError(err.message || "Unable to update role status."); } };
  const groups = Object.groupBy ? Object.groupBy(catalog.permissions, (item) => item.key.split(".")[0]) : catalog.permissions.reduce((all, item) => { const group = item.key.split(".")[0]; (all[group] ||= []).push(item); return all; }, {});

  return <SectionShell title="Role management" subtitle="Create clinic-specific roles and grant only the permissions each team needs." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}{notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2"><Field label="Role name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} maxLength={80} disabled={Boolean(editing)} /></Field><Field label="Description"><TextArea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} /></Field></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.entries(groups).map(([group, permissions]) => <fieldset key={group} className="rounded-md border border-stone-200 p-3"><legend className="px-1 font-semibold capitalize text-evergreen-950">{group.replaceAll("_", " ")}</legend><div className="grid gap-2">{permissions.map(({ key }) => <label key={key} className="flex items-center gap-2 text-sm capitalize text-stone-700"><input type="checkbox" checked={form.permissions.includes(key)} onChange={() => togglePermission(key)} />{permissionLabel(key)}</label>)}</div></fieldset>)}</div>
      <div className="flex gap-2"><PrimaryButton icon={editing ? FiSave : FiPlus} type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save role" : "Create role"}</PrimaryButton>{editing ? <button type="button" onClick={() => { setEditing(null); setForm(blank()); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm"><FiX />Cancel</button> : null}</div>
    </form>
    <div className="grid gap-3 lg:grid-cols-2">{catalog.roles.map((role) => <article key={role.key} className="rounded-lg border border-stone-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-evergreen-950">{role.name}{role.system ? <span className="ml-2 text-xs text-stone-400">System role</span> : null}</h2><p className="text-sm text-stone-500">{role.description || "No description"}</p></div><div className="flex gap-2">{!role.system ? <><PrimaryButton icon={FiEdit3} onClick={() => edit(role)}>Edit</PrimaryButton><button type="button" onClick={() => toggleActive(role)} className="rounded border border-stone-200 px-3 py-2 text-sm">{role.active ? "Deactivate" : "Activate"}</button></> : null}</div></div><p className="mt-3 text-sm text-stone-600">{role.permissions.length} permissions · {role.userCount} assigned users</p>{role.users?.length ? <p className="mt-2 text-xs text-stone-500">{role.users.map((user) => user.name).join(", ")}</p> : null}</article>)}</div>
    {!catalog.roles.length && !loading ? <EmptyState title="No role records" body="System roles and custom roles will appear here." /> : null}
  </SectionShell>;
}

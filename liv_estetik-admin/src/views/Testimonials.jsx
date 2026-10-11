import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiCheck, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { getTestimonials, createTestimonial, patchTestimonial, deleteTestimonial } from "../api";
import { Field, TextInput, TextArea, PrimaryButton, SectionShell, IconButton } from "../components/ui/Controls";

const EMPTY_TESTIMONIAL_FORM = { quote: "", name: "", initials: "", service: "", rating: 5, active: true, sortOrder: 0 };

export default function Testimonials() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_TESTIMONIAL_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getTestimonials());
    } catch (err) {
      setError(err.message || "Unable to load testimonials.");
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
      await createTestimonial(form);
      setForm(EMPTY_TESTIMONIAL_FORM);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggle = async (testimonial) => {
    try {
      await patchTestimonial(testimonial.id, { active: !testimonial.active });
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async (testimonial) => {
    if (!window.confirm(`Delete testimonial from ${testimonial.name}?`)) return;
    try {
      await deleteTestimonial(testimonial.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <SectionShell title="Testimonials" subtitle="Control the public reviews shown on the website." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing..." : "Refresh"}</PrimaryButton>}>
      {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <form onSubmit={save} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required /></Field>
        <Field label="Initials"><TextInput value={form.initials} onChange={(e) => setForm((prev) => ({ ...prev, initials: e.target.value }))} required /></Field>
        <Field label="Service"><TextInput value={form.service} onChange={(e) => setForm((prev) => ({ ...prev, service: e.target.value }))} /></Field>
        <Field label="Rating"><TextInput type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm((prev) => ({ ...prev, rating: Number(e.target.value) }))} /></Field>
        <Field label="Sort"><TextInput type="number" value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))} /></Field>
        <PrimaryButton icon={FiPlus} className="self-end">Create</PrimaryButton>
        <Field label="Quote"><TextArea value={form.quote} onChange={(e) => setForm((prev) => ({ ...prev, quote: e.target.value }))} required className="md:col-span-3 xl:col-span-6" /></Field>
      </form>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((testimonial) => (
          <article key={testimonial.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-evergreen-950 text-sm font-bold text-champagne-100">{testimonial.initials}</div>
              <div>
                <p className="font-semibold text-evergreen-950">{testimonial.name}</p>
                <p className="text-sm text-stone-500">{testimonial.service || "General"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm italic leading-6 text-stone-600">{testimonial.quote}</p>
            <div className="mt-4 flex gap-2">
              <IconButton title="Toggle active" icon={FiCheck} onClick={() => toggle(testimonial)} />
              <IconButton title="Delete" icon={FiTrash2} tone="danger" onClick={() => remove(testimonial)} />
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

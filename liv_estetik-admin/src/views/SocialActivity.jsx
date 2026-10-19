import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { createFollowerObservation, createSocialPost, getFollowerObservations, getSocialPosts } from "../api";
import { Field, TextInput, Select, TextArea, PrimaryButton, SectionShell, EmptyState } from "../components/ui/Controls";

const PLATFORMS = ["tiktok", "instagram", "facebook", "youtube"];
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date());
const currentEATDateTime = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((item) => item.type !== "literal").map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};

export default function SocialActivity() {
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [postForm, setPostForm] = useState({ platform: "tiktok", postUrl: "", publishedAt: TODAY, notes: "" });
  const [followerForm, setFollowerForm] = useState({ count: "", observedAt: currentEATDateTime() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [postRows, followerRows] = await Promise.all([getSocialPosts(), getFollowerObservations()]); setPosts(postRows); setFollowers(followerRows); }
    catch (err) { setError(err.message || "Unable to load social activity."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submitPost = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    try { await createSocialPost({ ...postForm, publishedAt: new Date(`${postForm.publishedAt}T12:00:00+03:00`), postUrl: postForm.postUrl || undefined }); setPostForm({ platform: "tiktok", postUrl: "", publishedAt: TODAY, notes: "" }); setNotice("Published post recorded."); await load(); }
    catch (err) { setError(err.message || "Unable to save post activity."); }
  };

  const submitFollowers = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    try { await createFollowerObservation({ platform: "tiktok", count: Number(followerForm.count), observedAt: followerForm.observedAt ? new Date(`${followerForm.observedAt}:00+03:00`) : new Date() }); setFollowerForm({ count: "", observedAt: currentEATDateTime() }); setNotice("Manual follower observation saved."); await load(); }
    catch (err) { setError(err.message || "Unable to save follower observation."); }
  };

  const latest = followers[0];
  const previous = followers[1];
  const change = latest && previous ? latest.count - previous.count : null;
  const chartRows = [...followers].slice(0, 12).reverse();
  const min = Math.min(...chartRows.map((row) => row.count), 0);
  const max = Math.max(...chartRows.map((row) => row.count), 1);
  const points = chartRows.map((row, index) => `${chartRows.length < 2 ? 50 : 12 + (index * 76 / (chartRows.length - 1))},${88 - ((row.count - min) / Math.max(1, max - min)) * 74}`).join(" ");

  return <SectionShell title="Social activity" subtitle="Manual records of publication dates and follower observations. No platform data is scraped or automatically refreshed." action={<PrimaryButton icon={FiRefreshCw} onClick={load}>{loading ? "Refreshing…" : "Refresh"}</PrimaryButton>}>
    {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    {notice ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <form onSubmit={submitPost} className="grid content-start gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <h2 className="font-display text-xl font-semibold text-evergreen-950 sm:col-span-2">Record a published post</h2>
        <Field label="Platform"><Select value={postForm.platform} onChange={(e) => setPostForm({ ...postForm, platform: e.target.value })}>{PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</Select></Field>
        <Field label="Publication date"><TextInput type="date" value={postForm.publishedAt} onChange={(e) => setPostForm({ ...postForm, publishedAt: e.target.value })} required /></Field>
        <Field label="Post URL (optional)" className="sm:col-span-2"><TextInput type="url" placeholder="https://" value={postForm.postUrl} onChange={(e) => setPostForm({ ...postForm, postUrl: e.target.value })} /></Field>
        <Field label="Notes (optional)" className="sm:col-span-2"><TextArea rows={2} value={postForm.notes} onChange={(e) => setPostForm({ ...postForm, notes: e.target.value })} /></Field>
        <PrimaryButton icon={FiPlus} type="submit">Save post record</PrimaryButton>
      </form>
      <form onSubmit={submitFollowers} className="grid content-start gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <h2 className="font-display text-xl font-semibold text-evergreen-950 sm:col-span-2">TikTok follower observation</h2>
        <Field label="Follower count"><TextInput type="number" min="0" step="1" value={followerForm.count} onChange={(e) => setFollowerForm({ ...followerForm, count: e.target.value })} required /></Field>
        <Field label="Observed at"><TextInput type="datetime-local" value={followerForm.observedAt} onChange={(e) => setFollowerForm({ ...followerForm, observedAt: e.target.value })} required /></Field>
        <p className="text-xs text-stone-500 sm:col-span-2">Source is recorded as manual. Enter the count visible in the authorized TikTok account.</p>
        <PrimaryButton icon={FiPlus} type="submit">Save observation</PrimaryButton>
      </form>
    </div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="font-display text-xl font-semibold text-evergreen-950">TikTok follower history</h2>
        {!latest ? <EmptyState title="No observations yet" body="The trend begins with the first manual observation." /> : <>
          <div className="mt-3 flex flex-wrap gap-6 text-sm"><p>Latest: <strong>{latest.count.toLocaleString()}</strong> <span className="text-stone-500">(manual)</span></p><p>Change vs previous: <strong>{change === null ? "Baseline unavailable" : `${change > 0 ? "+" : ""}${change.toLocaleString()}`}</strong></p></div>
          {chartRows.length > 1 ? <svg viewBox="0 0 100 100" role="img" aria-label="TikTok follower observations over time" className="mt-4 h-44 w-full overflow-visible"><line x1="8" y1="88" x2="92" y2="88" stroke="#d6d3d1" strokeWidth=".6" /><polyline points={points} fill="none" stroke="#173b36" strokeWidth="2" />{chartRows.map((row, index) => <circle key={row.id || row._id} cx={chartRows.length < 2 ? 50 : 12 + (index * 76 / (chartRows.length - 1))} cy={88 - ((row.count - min) / Math.max(1, max - min)) * 74} r="1.8" fill="#a8874e" />)}</svg> : <p className="mt-5 text-sm text-stone-500">Trend starts with this first recorded observation.</p>}
        </>}
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-4"><h2 className="font-display text-xl font-semibold text-evergreen-950">Published post records</h2>
        {!posts.length ? <EmptyState title="No posts recorded" body="Social posts will be counted by their publication date." /> : <div className="mt-3 grid gap-2">{posts.slice(0, 12).map((post) => <article key={post.id || post._id} className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 py-2 text-sm"><span className="font-semibold capitalize text-evergreen-950">{post.platform}</span><time dateTime={post.publishedAt}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Africa/Addis_Ababa" }).format(new Date(post.publishedAt))} EAT</time><span className="text-xs text-stone-500">entered by {post.recordedBy?.name || "staff"}</span>{post.postUrl ? <a className="text-champagne-700 underline" href={post.postUrl} target="_blank" rel="noreferrer">View post</a> : null}</article>)}</div>}
      </section>
    </div>
  </SectionShell>;
}

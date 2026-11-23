import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";

export interface Edit { alt?: string; focus?: string }
export interface PublishInput {
  /** key "folder/id" -> processed JPEG bytes */
  images: Record<string, Buffer>;
  /** key -> alt/focus edits. Empty string clears an edit. */
  edits: Record<string, Edit>;
}
export interface PublishResult { mode: "github" | "local"; commitUrl?: string; changed: number }

const OVERRIDES = "src/content/overrides.json";
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "avif"];

export function applyEdits(current: Record<string, Edit>, edits: Record<string, Edit>) {
  const next: Record<string, Edit> = { ...current };
  for (const [key, e] of Object.entries(edits)) {
    const merged: Edit = { ...next[key] };
    if (e.alt !== undefined) merged.alt = e.alt.trim() || undefined;
    if (e.focus !== undefined) merged.focus = e.focus.trim() || undefined;
    if (!merged.alt && !merged.focus) delete next[key];
    else next[key] = JSON.parse(JSON.stringify(merged));
  }
  return next;
}
const sortedJson = (o: Record<string, Edit>) =>
  JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))), null, 2) + "\n";

export const storageMode = () =>
  process.env.GITHUB_TOKEN ? "github" : process.env.ADMIN_STORAGE === "local" ? "local" : "none";

// --- Local (development) ---------------------------------------------------
async function publishLocal(input: PublishInput): Promise<PublishResult> {
  const root = process.cwd();
  for (const [key, buf] of Object.entries(input.images)) {
    const [folder, id] = key.split("/");
    const dir = path.join(root, "public", "images", folder);
    await fs.mkdir(dir, { recursive: true });
    for (const ext of IMAGE_EXTS) if (ext !== "jpg") await fs.rm(path.join(dir, `${id}.${ext}`), { force: true });
    await fs.writeFile(path.join(dir, `${id}.jpg`), buf);
  }
  const file = path.join(root, OVERRIDES);
  const current = JSON.parse(await fs.readFile(file, "utf8").catch(() => "{}"));
  await fs.writeFile(file, sortedJson(applyEdits(current, input.edits)));
  const scan = path.join(root, "scripts", "scan-images.mjs");
  await new Promise<void>((res) => execFile(process.execPath, [scan], { cwd: root }, () => res()));
  return { mode: "local", changed: Object.keys(input.images).length + Object.keys(input.edits).length };
}

// --- GitHub (production): one commit -> one Vercel deploy --------------------
type F = typeof fetch;
async function publishGithub(input: PublishInput, f: F = fetch): Promise<PublishResult> {
  const repo = process.env.GITHUB_REPO || "chrssushil93-glitch/A-S";
  const branch = process.env.GITHUB_BRANCH || "main";
  const api = `https://api.github.com/repos/${repo}`;
  const gh = async (p: string, init?: RequestInit) => {
    const r = await f(`${api}${p}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) throw new Error(`GitHub ${r.status} on ${init?.method ?? "GET"} ${p.split("?")[0]}`);
    return r.json();
  };

  const ref = await gh(`/git/ref/heads/${branch}`);
  const baseCommit = ref.object.sha as string;
  const commit = await gh(`/git/commits/${baseCommit}`);
  const tree = await gh(`/git/trees/${commit.tree.sha}?recursive=1`);
  const paths: { path: string; type: string }[] = tree.tree;

  const entries: { path: string; mode: string; type: "blob"; sha: string | null }[] = [];
  for (const [key, buf] of Object.entries(input.images)) {
    const [folder, id] = key.split("/");
    const blob = await gh(`/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: buf.toString("base64"), encoding: "base64" }),
    });
    entries.push({ path: `public/images/${folder}/${id}.jpg`, mode: "100644", type: "blob", sha: blob.sha });
    // A photo with the same id in another format would shadow the new one: remove it.
    for (const ext of IMAGE_EXTS) {
      const old = `public/images/${folder}/${id}.${ext}`;
      if (ext !== "jpg" && paths.some((p) => p.path === old)) entries.push({ path: old, mode: "100644", type: "blob", sha: null });
    }
  }
  if (Object.keys(input.edits).length) {
    const cur = paths.some((p) => p.path === OVERRIDES)
      ? await gh(`/contents/${OVERRIDES}?ref=${branch}`)
      : null;
    const current = cur ? JSON.parse(Buffer.from(cur.content, "base64").toString("utf8") || "{}") : {};
    const blob = await gh(`/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: sortedJson(applyEdits(current, input.edits)), encoding: "utf-8" }),
    });
    entries.push({ path: OVERRIDES, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh(`/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree: entries }) });
  const n = Object.keys(input.images).length;
  const msg = `Admin console: ${n ? `replace ${n} photo${n === 1 ? "" : "s"}` : "update photo details"}`;
  const created = await gh(`/git/commits`, { method: "POST", body: JSON.stringify({ message: msg, tree: newTree.sha, parents: [baseCommit] }) });
  await gh(`/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: created.sha }) });
  return { mode: "github", commitUrl: `https://github.com/${repo}/commit/${created.sha}`, changed: n + Object.keys(input.edits).length };
}

export const publish = (input: PublishInput) =>
  storageMode() === "github" ? publishGithub(input) : publishLocal(input);
export { publishGithub as _publishGithub };

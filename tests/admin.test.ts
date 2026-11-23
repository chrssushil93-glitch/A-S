import test from "node:test";
import assert from "node:assert/strict";
import { applyEdits, _publishGithub } from "../src/lib/adminStore.ts";

test("applyEdits merges, trims and clears", () => {
  const a = applyEdits({}, { "album/x": { alt: "  A kiss  ", focus: "40% 30%" } });
  assert.deepEqual(a, { "album/x": { alt: "A kiss", focus: "40% 30%" } });
  const b = applyEdits(a, { "album/x": { alt: "" } });
  assert.deepEqual(b, { "album/x": { focus: "40% 30%" } });
  assert.deepEqual(applyEdits(b, { "album/x": { focus: "" } }), {});
});

test("github publish makes a single commit with new image, removes shadowing formats", async () => {
  process.env.GITHUB_TOKEN = "t";
  process.env.GITHUB_REPO = "o/r";
  const calls: { m: string; p: string; body?: Record<string, unknown> }[] = [];
  const fake: typeof fetch = async (url, init) => {
    const p = String(url).replace("https://api.github.com/repos/o/r", "");
    const m = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ m, p, body });
    const j = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });
    if (p.startsWith("/git/ref/")) return j({ object: { sha: "c0" } });
    if (p === "/git/commits/c0") return j({ tree: { sha: "t0" } });
    if (p.startsWith("/git/trees/t0"))
      return j({ tree: [{ path: "public/images/album/x.png", type: "blob" }, { path: "src/content/overrides.json", type: "blob" }] });
    if (p.startsWith("/contents/")) return j({ content: Buffer.from('{"album/y":{"alt":"keep"}}').toString("base64") });
    if (p === "/git/blobs") return j({ sha: "b" + calls.length });
    if (p === "/git/trees") return j({ sha: "t1" });
    if (p === "/git/commits") return j({ sha: "c1" });
    if (p.startsWith("/git/refs/")) return j({});
    return new Response("nope", { status: 404 });
  };
  const r = await _publishGithub({ images: { "album/x": Buffer.from("img") }, edits: { "album/x": { alt: "New" } } }, fake);
  assert.equal(r.commitUrl, "https://github.com/o/r/commit/c1");
  const tree = (calls.find((c) => c.p === "/git/trees")!.body as { tree: { path: string; sha: string | null }[] }).tree;
  assert.ok(tree.some((e: { path: string; sha: string | null }) => e.path === "public/images/album/x.jpg" && e.sha));
  assert.ok(tree.some((e: { path: string; sha: string | null }) => e.path === "public/images/album/x.png" && e.sha === null));
  const ov = calls.filter((c) => c.p === "/git/blobs").map((c) => c.body as { encoding: string; content: string }).find((b) => b.encoding === "utf-8")!;
  assert.deepEqual(JSON.parse(ov.content), { "album/x": { alt: "New" }, "album/y": { alt: "keep" } });
  assert.equal(calls.filter((c) => c.m === "PATCH").length, 1);
});

test("a GitHub failure surfaces and never moves the branch", async () => {
  process.env.GITHUB_TOKEN = "t";
  const calls: string[] = [];
  const fake: typeof fetch = async (url, init) => {
    calls.push(`${init?.method ?? "GET"} ${url}`);
    return new Response("{}", { status: 500 });
  };
  await assert.rejects(_publishGithub({ images: {}, edits: { "a/b": { alt: "x" } } }, fake), /GitHub 500/);
  assert.ok(!calls.some((c) => c.startsWith("PATCH")));
});

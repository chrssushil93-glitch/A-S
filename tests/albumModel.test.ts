import { test } from "node:test";
import assert from "node:assert/strict";
import {
  changedLeaves,
  chapterStartView,
  clamp,
  convertF,
  flattenSpreads,
  isNearLeaf,
  singlePagePlan,
  spreadForView,
  turnDelay,
  viewCount,
} from "../src/lib/albumModel.ts";
import type { Chapter, Spread } from "../src/lib/types.ts";

const spread = (id: string, layout: Spread["layout"]): Spread => ({ id, layout, images: [] });
const chapters: Chapter[] = [
  { id: "a", title: "A", introduction: "", spreads: [spread("a1", "chapter-opening"), spread("a2", "full-bleed")] },
  { id: "b", title: "B", introduction: "", spreads: [spread("b1", "two-image"), spread("b2", "three-collage")] },
  { id: "empty", title: "Empty", introduction: "", spreads: [] },
];

const flat = flattenSpreads(chapters);
const plan = singlePagePlan(flat);

test("flattenSpreads keeps reading order and chapter metadata", () => {
  assert.equal(flat.length, 4);
  assert.deepEqual(
    flat.map((f) => [f.index, f.chapterId, f.indexInChapter]),
    [
      [0, "a", 0],
      [1, "a", 1],
      [2, "b", 0],
      [3, "b", 1],
    ],
  );
});

test("single-page plan: full-bleed is one page, everything else two", () => {
  assert.equal(plan.length, 2 + 1 + 2 + 2);
  assert.deepEqual(plan[2], { spreadIndex: 1, part: "whole" });
  assert.equal(viewCount("double", flat, plan), 4);
  assert.equal(viewCount("single", flat, plan), 7);
});

test("chapterStartView resolves in both modes and rejects unknown/empty chapters", () => {
  assert.equal(chapterStartView("double", flat, plan, "b"), 2);
  assert.equal(chapterStartView("single", flat, plan, "b"), 3);
  assert.equal(chapterStartView("double", flat, plan, "nope"), -1);
  assert.equal(chapterStartView("single", flat, plan, "empty"), -1);
});

test("spreadForView maps single pages back to their spread", () => {
  assert.equal(spreadForView("single", flat, plan, 2)?.spread.id, "a2");
  assert.equal(spreadForView("single", flat, plan, 6)?.spread.id, "b2");
  assert.equal(spreadForView("double", flat, plan, 3)?.chapterId, "b");
});

test("convertF keeps the visitor on the same spread when the layout switches", () => {
  assert.equal(convertF(0, "double", "single", flat, plan), 0);
  // double view 2 (spread b1) -> single view 3 -> f 4
  assert.equal(convertF(3, "double", "single", flat, plan), 4);
  // single view 4 (right page of b1) -> spread 2 -> double view 2 -> f 3
  assert.equal(convertF(5, "single", "double", flat, plan), 3);
  assert.equal(convertF(2, "double", "double", flat, plan), 2);
});

test("turnDelay staggers forward and backward jumps, and is capped", () => {
  // forward 0 -> 4 flips leaves 0..3, leaf 0 first
  assert.deepEqual([0, 1, 2, 3].map((j) => turnDelay(j, 0, 4)), [0, 70, 140, 210]);
  // backward 4 -> 0 flips leaves 3..0, leaf 3 first
  assert.deepEqual([3, 2, 1, 0].map((j) => turnDelay(j, 4, 0)), [0, 70, 140, 210]);
  assert.equal(turnDelay(50, 0, 60), 560);
  assert.equal(turnDelay(1, 3, 3), 0);
});

test("changedLeaves and isNearLeaf", () => {
  assert.deepEqual(changedLeaves(2, 5), [2, 5]);
  assert.deepEqual(changedLeaves(5, 2), [2, 5]);
  assert.equal(isNearLeaf(10, 4, 4), false);
  assert.equal(isNearLeaf(7, 4, 4), true);
  assert.equal(isNearLeaf(10, 4, 9), true);
});

test("clamp", () => {
  assert.equal(clamp(-1, 0, 5), 0);
  assert.equal(clamp(9, 0, 5), 5);
  assert.equal(clamp(3, 0, 5), 3);
});

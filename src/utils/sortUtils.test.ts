// src/utils/sortUtils.test.ts
import { describe, it, expect } from "vitest";
import { makeComparator, parseCriteriaParam, SortCriterion, Client } from "./sortUtils";

const SAMPLE: Client[] = [
  { id: "1", name: "Alice", email: "a@x", createdAt: "2024-01-01", updatedAt: "2024-06-01", status: "Active" },
  { id: "2", name: "bob", email: "b@x", createdAt: "2023-01-01", updatedAt: "2024-07-01", status: "Prospect" },
  { id: "3", name: "Charlie", email: "c@x", createdAt: "2024-01-01", updatedAt: "2024-05-01", status: "Active" },
];

describe("makeComparator", () => {
  it("sorts by name asc (case-insensitive)", () => {
    const crit: SortCriterion[] = [{ id: "c1", field: "name", direction: "asc" }];
    const cmp = makeComparator(crit);
    const out = [...SAMPLE].sort(cmp).map((s) => s.name);
    expect(out).toEqual(["Alice", "bob", "Charlie"]);
  });

  it("sorts by name desc", () => {
    const crit: SortCriterion[] = [{ id: "c1", field: "name", direction: "desc" }];
    const cmp = makeComparator(crit);
    const out = [...SAMPLE].sort(cmp).map((s) => s.name);
    expect(out).toEqual(["Charlie", "bob", "Alice"]);
  });

  it("sorts by createdAt then name (multi-criteria)", () => {
    const crit: SortCriterion[] = [
      { id: "c1", field: "createdAt", direction: "asc" },
      { id: "c2", field: "name", direction: "asc" },
    ];
    const cmp = makeComparator(crit);
    const out = [...SAMPLE].sort(cmp).map((s) => `${s.createdAt}|${s.name}`);
    // createdAt asc => "2023-01-01" row first, then 2024 rows sorted by name
    expect(out[0]).toContain("2023-01-01");
    expect(out[1]).toContain("2024-01-01");
    expect(out[2]).toContain("2024-01-01");
  });

  it("parses URL param into criteria", () => {
    const parsed = parseCriteriaParam("name.asc,createdAt.desc");
    expect(parsed.length).toBe(2);
    expect(parsed[0].field).toBe("name");
    expect(parsed[0].direction).toBe("asc");
    expect(parsed[1].field).toBe("createdAt");
    expect(parsed[1].direction).toBe("desc");
  });
});

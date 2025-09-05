// src/utils/sortUtils.ts
export type Client = {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  status: string;
};

export type SortCriterion = {
  id: string; // unique id used for dnd
  field: keyof Client;
  direction: "asc" | "desc";
};

/**
 * Build a comparator function for Array.prototype.sort
 * based on the provided criteria (in priority order).
 */
export function makeComparator(criteria: SortCriterion[]) {
  return (a: Client, b: Client) => {
    if (!criteria || criteria.length === 0) return 0;
    for (const crit of criteria) {
      const f = crit.field as string;
      let av: any = (a as any)[f];
      let bv: any = (b as any)[f];

      // defensive handling
      if (av == null && bv == null) continue;
      if (av == null) return crit.direction === "asc" ? -1 : 1;
      if (bv == null) return crit.direction === "asc" ? 1 : -1;

      if (f.toLowerCase().includes("at")) {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      } else if (typeof av === "string") {
        av = av.toLowerCase();
        bv = bv.toLowerCase();
      }

      if (av > bv) return crit.direction === "asc" ? 1 : -1;
      if (av < bv) return crit.direction === "asc" ? -1 : 1;
      // else continue to next criterion
    }
    return 0;
  };
}

/**
 * Serialize criteria into URL param value like:
 * name.asc,createdAt.desc
 */
export function serializeCriteria(criteria: SortCriterion[]) {
  if (!criteria || criteria.length === 0) return "";
  return criteria.map((c) => `${String(c.field)}.${c.direction}`).join(",");
}

/**
 * Parse URL param (string) into SortCriterion[].
 * The function does NOT try to reconstruct unique IDs (we create new ones).
 */
export function parseCriteriaParam(param: string): SortCriterion[] {
  if (!param) return [];
  const parts = param.split(",").map((p) => p.trim()).filter(Boolean);
  const list: SortCriterion[] = parts.map((p, idx) => {
    const [field, direction] = p.split(".");
    return {
      id: `${field}_${Date.now()}_${idx}`,
      field: field as keyof Client,
      direction: direction === "desc" ? "desc" : "asc",
    };
  });
  return list;
}

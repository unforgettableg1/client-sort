// src/components/ClientList.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { makeComparator, parseCriteriaParam, serializeCriteria } from "../utils/sortUtils";
import type { SortCriterion, Client } from "../utils/sortUtils";

/* initial mock data */
const MOCK_CLIENTS: Client[] = [
  { id: "c1", name: "Aman Sharma", email: "aman.sharma@example.com", createdAt: "2024-01-15T09:12:00.000Z", updatedAt: "2024-08-05T14:20:00.000Z", status: "Active" },
  { id: "c2", name: "Neha Verma", email: "neha.verma@example.com", createdAt: "2023-11-10T16:00:00.000Z", updatedAt: "2024-07-24T08:45:00.000Z", status: "Prospect" },
  { id: "c3", name: "Rohit Singh", email: "rohit.singh@example.com", createdAt: "2024-06-02T11:30:00.000Z", updatedAt: "2024-08-30T10:15:00.000Z", status: "Active" },
  { id: "c4", name: "Pooja Kapoor", email: "pooja.kapoor@example.com", createdAt: "2022-09-18T07:25:00.000Z", updatedAt: "2024-06-16T17:00:00.000Z", status: "Inactive" },
  { id: "c5", name: "Vikram Patel", email: "vikram.patel@example.com", createdAt: "2024-03-21T13:50:00.000Z", updatedAt: "2024-09-01T09:00:00.000Z", status: "Active" },
  { id: "c6", name: "Sana Ali", email: "sana.ali@example.com", createdAt: "2023-12-05T10:10:00.000Z", updatedAt: "2024-08-02T15:40:00.000Z", status: "Lead" },
  { id: "c7", name: "Karan Mehta", email: "karan.mehta@example.com", createdAt: "2024-05-11T09:00:00.000Z", updatedAt: "2024-05-12T09:00:00.000Z", status: "Prospect" },
  { id: "c8", name: "Divya Rao", email: "divya.rao@example.com", createdAt: "2024-02-02T18:30:00.000Z", updatedAt: "2024-08-10T12:10:00.000Z", status: "Active" },
];

const FIELD_LABELS: Record<keyof Client, string> = {
  id: "Client ID",
  name: "Client Name",
  email: "Email",
  createdAt: "Created At",
  updatedAt: "Updated At",
  status: "Status",
};

const REFERENCE_FIELDS: (keyof Client)[] = ["name", "createdAt", "updatedAt", "id"];

/* Direction pills */
function DirectionPills({
  field,
  direction,
  onSet,
}: {
  field: keyof Client;
  direction: "asc" | "desc";
  onSet: (dir: "asc" | "desc") => void;
}) {
  const isDate = String(field).toLowerCase().includes("at");
  const leftLabel = isDate ? "Newest → Oldest" : "A → Z";
  const rightLabel = isDate ? "Oldest → Newest" : "Z → A";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onSet("desc")}
        className={`px-2 py-1 text-xs rounded border ${direction === "desc" ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-white text-slate-600"}`}
      >
        {leftLabel}
      </button>

      <button
        onClick={() => onSet("asc")}
        className={`px-2 py-1 text-xs rounded border ${direction === "asc" ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-white text-slate-600"}`}
      >
        {rightLabel}
      </button>
    </div>
  );
}

/* Sortable item */
function SortableCriterionItem({ criterion, index, onSetDirection, onRemove } : {
  criterion: SortCriterion;
  index: number;
  onSetDirection: (id: string, dir: "asc" | "desc") => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: criterion.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm border">
      <div className="w-6 text-sm text-slate-500 text-center">{index + 1}</div>

      <button {...listeners} {...attributes} aria-label="Drag" className="p-1 rounded text-slate-400 hover:text-slate-700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="5" r="1.2" fill="currentColor"/><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="6" cy="19" r="1.2" fill="currentColor"/></svg>
      </button>

      <div className="flex-1">
        <div className="text-sm font-medium text-slate-800">{FIELD_LABELS[criterion.field]}</div>
        <div className="text-xs text-slate-500">{criterion.direction === "asc" ? "Ascending" : "Descending"}</div>
      </div>

      <DirectionPills field={criterion.field} direction={criterion.direction} onSet={(d) => onSetDirection(criterion.id, d)} />

      <button onClick={() => onRemove(criterion.id)} aria-label="Remove" className="ml-2 text-slate-400 hover:text-rose-600 px-2 py-1 rounded">×</button>
    </div>
  );
}

/* Inactive row */
function InactiveFieldRow({ field, onAdd } : { field: keyof Client; onAdd: (field: keyof Client) => void; }) {
  const isDate = String(field).toLowerCase().includes("at");
  const leftLabel = isDate ? "Newest → Oldest" : "A → Z";
  const rightLabel = isDate ? "Oldest → Newest" : "Z → A";
  return (
    <div className="flex items-center gap-3 bg-transparent px-3 py-2 rounded">
      <div className="w-6 text-sm text-slate-400 text-center">—</div>
      <div className="w-6" />
      <div className="flex-1">
        <div className="text-sm text-slate-700">{FIELD_LABELS[field]}</div>
        <div className="text-xs text-slate-400">Not selected</div>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-2 py-1 text-xs rounded border bg-white text-slate-400 cursor-not-allowed" aria-hidden>{leftLabel}</button>
        <button className="px-2 py-1 text-xs rounded border bg-white text-slate-400 cursor-not-allowed" aria-hidden>{rightLabel}</button>
      </div>

      <button onClick={() => onAdd(field)} className="ml-3 px-2 py-1 bg-slate-900 text-white rounded text-sm">Add</button>
    </div>
  );
}

/* Add Client Modal - small inline component */
function AddClientModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Client["status"]>("Active");
  const [createdAt, setCreatedAt] = useState<string>(() => {
    // default to current local datetime formatted for input[type=datetime-local]
    const now = new Date();
    const localISO = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0,16);
    return localISO; // yyyy-mm-ddThh:mm
  });

  useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setStatus("Active");
      // reset createdAt to now
      const now = new Date();
      setCreatedAt(new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0,16));
    }
  }, [open]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    // basic validation
    if (!name.trim()) { alert("Please enter a name"); return; }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { alert("Enter a valid email"); return; }

    const isoCreated = new Date(createdAt).toISOString();
    const nowIso = new Date().toISOString();
    const id = `u_${Date.now()}`; // unique-ish id
    const client: Client = { id, name: name.trim(), email: email.trim(), createdAt: isoCreated, updatedAt: nowIso, status };
    onSave(client);
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
      <div className="w-[520px] bg-white rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Add Client</h3>
          <button onClick={onClose} className="text-slate-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm block mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-3 py-2 rounded" required />
          </div>

          <div>
            <label className="text-sm block mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border px-3 py-2 rounded" required />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm block mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Client["status"])} className="w-full border px-3 py-2 rounded">
                <option>Active</option>
                <option>Prospect</option>
                <option>Lead</option>
                <option>Inactive</option>
              </select>
            </div>

            <div className="w-48">
              <label className="text-sm block mb-1">Created At</label>
              <input value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} type="datetime-local" className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientList() {
  // clients is now stateful and persisted to localStorage "client_list_v1"
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const raw = localStorage.getItem("client_list_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as Client[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return MOCK_CLIENTS;
  });

  const [criteria, setCriteria] = useState<SortCriterion[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const prevFocused = useRef<HTMLElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // persist clients whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("client_list_v1", JSON.stringify(clients));
    } catch (e) {}
  }, [clients]);

  // Load sort criteria from URL first, fallback to localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sp = params.get("sort");
      if (sp) {
        const parsed = parseCriteriaParam(sp);
        if (parsed.length) {
          setCriteria(parsed);
          return;
        }
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem("client_sort_criteria_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as SortCriterion[];
        if (Array.isArray(parsed)) setCriteria(parsed);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("client_sort_criteria_v1", JSON.stringify(criteria));
    } catch (e) {}
  }, [criteria]);

  // focus trap for popover (unchanged)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!popoverOpen) return;
      if (e.key === "Escape") {
        setPopoverOpen(false);
        prevFocused.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const root = popoverRef.current;
      if (!root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    if (popoverOpen) {
      prevFocused.current = document.activeElement as HTMLElement | null;
      setTimeout(() => {
        const root = popoverRef.current;
        const first = root?.querySelector<HTMLElement>('button, select, input, textarea');
        first?.focus();
      }, 0);
      window.addEventListener("keydown", onKey);
    } else {
      window.removeEventListener("keydown", onKey);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [popoverOpen]);

  /* helper handlers for popover */
  function addCriterionForField(field: keyof Client) {
    const id = `${field}_${Date.now()}`;
    setCriteria((s) => (s.find((c) => c.field === field) ? s : [...s, { id, field, direction: "asc" }]));
  }

  function removeCriterion(id: string) {
    setCriteria((s) => s.filter((c) => c.id !== id));
  }

  function setDirection(id: string, dir: "asc" | "desc") {
    setCriteria((s) => s.map((c) => (c.id === id ? { ...c, direction: dir } : c)));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = criteria.findIndex((c) => c.id === active.id);
      const newIndex = criteria.findIndex((c) => c.id === over.id);
      setCriteria((s) => arrayMove(s, oldIndex, newIndex));
    }
  }

  function clearAll() {
    setCriteria([]);
  }

  function applySortToURL() {
    try {
      const v = serializeCriteria(criteria);
      const p = new URLSearchParams(window.location.search);
      if (v) p.set("sort", v);
      else p.delete("sort");
      const newUrl = `${window.location.pathname}?${p.toString()}`;
      window.history.replaceState({}, "", newUrl);
    } catch (e) {}
  }

  function handleApply() {
    applySortToURL();
    setPopoverOpen(false);
  }

  /* Add client save handler (called from modal) */
  function handleSaveClient(newClient: Client) {
    // insert at top
    setClients((s) => [newClient, ...s]);
    // keep sort criteria + url as-is (sorted view will update because clients changed)
  }

  /* Table sorting */
  const sortedClients = useMemo(() => {
    if (!criteria || criteria.length === 0) return [...clients];
    const cmp = makeComparator(criteria);
    return [...clients].sort(cmp);
  }, [clients, criteria]);

  const activeByField = (field: keyof Client) => criteria.find((c) => c.field === field);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Clients</h1>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-4">
                <button className="px-3 py-1 border-b-2 border-slate-900 text-slate-900">All</button>
                <button className="px-3 py-1 text-slate-600">Individual</button>
                <button className="px-3 py-1 text-slate-600">Company</button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input placeholder="Search clients" className="pl-3 pr-3 py-2 border rounded bg-white text-sm w-64" />
            </div>

            <button title="Filters" className="p-2 bg-white border rounded text-slate-600 hover:bg-slate-50">⚙️</button>

            <button onClick={() => setPopoverOpen((s) => !s)} title="Sort" className="p-2 bg-white border rounded text-slate-600 hover:bg-slate-50">↕️</button>

            <button onClick={() => setAddModalOpen(true)} className="px-4 py-2 bg-slate-900 text-white rounded shadow">+ Add Client</button>
          </div>
        </div>

        {/* table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-medium">All Clients</div>
            <div className="text-sm text-slate-600">{sortedClients.length} clients</div>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-slate-600 text-xs border-b">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Created At</th>
                    <th className="py-2">Updated At</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">{c.name}</td>
                      <td className="py-3 text-slate-700">{c.email}</td>
                      <td className="py-3">{new Date(c.createdAt).toLocaleString()}</td>
                      <td className="py-3">{new Date(c.updatedAt).toLocaleString()}</td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-800">{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-slate-500">Combined sort order: {criteria.map((c) => FIELD_LABELS[c.field]).join(" → ") || "—"}</div>
          </div>
        </div>
      </div>

      {/* Popover (sort) */}
      {popoverOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-6 pt-24 bg-black/30">
          <div ref={popoverRef} className="pointer-events-auto w-[680px] bg-white rounded-xl shadow-2xl border">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-lg font-medium">Sort By</div>
              <div className="flex items-center gap-3">
                <button onClick={() => { clearAll(); setPopoverOpen(false); }} className="text-sm text-rose-600">Clear all</button>
                <button onClick={() => setPopoverOpen(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
            </div>

            <div className="p-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={criteria.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-3 mb-4">
                    {criteria.length === 0 ? (
                      <div className="text-sm text-slate-500">No active sort criteria. Add from below.</div>
                    ) : criteria.map((c, i) => (
                      <SortableCriterionItem key={c.id} criterion={c} index={i} onSetDirection={setDirection} onRemove={removeCriterion} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="border-t pt-4">
                {REFERENCE_FIELDS.map((f) => {
                  const active = activeByField(f);
                  return active ? (
                    <div key={String(f)} className="flex items-center justify-between gap-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 text-sm text-slate-500 text-center">#</div>
                        <div className="text-sm font-medium">{FIELD_LABELS[f]}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500">{active.direction === "asc" ? "Asc" : "Desc"}</div>
                        <button onClick={() => removeCriterion(active.id)} className="text-sm text-rose-600">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <InactiveFieldRow key={String(f)} field={f} onAdd={addCriterionForField} />
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={() => { clearAll(); setPopoverOpen(false); }} className="text-sm text-rose-600">Clear all</button>
                <button onClick={() => setPopoverOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={handleApply} className="px-4 py-2 bg-black text-white rounded">Apply Sort</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client modal */}
      <AddClientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={(c) => handleSaveClient(c)}
      />
    </div>
  );
}

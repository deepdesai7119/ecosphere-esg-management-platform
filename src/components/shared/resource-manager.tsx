"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/api-client";

export type FieldType = "text" | "number" | "textarea" | "select" | "date" | "switch";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  helper?: string;
  defaultValue?: string | number | boolean;
  /** Half-width in the grid. */
  half?: boolean;
}

type Row = Record<string, unknown> & { id: string };

interface ResourceManagerProps<T extends Row> {
  data: T[];
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  endpoint: string;
  entityLabel: string;
  canManage?: boolean;
  searchPlaceholder?: string;
  createLabel?: string;
  extraToolbar?: React.ReactNode;
  /** Map a row to initial form values when editing. */
  toFormValues?: (row: T) => Record<string, unknown>;
  emptyMessage?: string;
  autoOpenCreate?: boolean;
  /** Hide the Edit action (e.g. resources without a PATCH endpoint). */
  disableEdit?: boolean;
  /** Hide the Delete action. */
  disableDelete?: boolean;
  /** Extra dropdown items rendered per row. */
  rowActions?: (row: T) => React.ReactNode;
}

function initialValues(fields: FieldDef[], row?: Record<string, unknown>): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const f of fields) {
    if (row && row[f.name] !== undefined && row[f.name] !== null) {
      v[f.name] = f.type === "date" ? String(row[f.name]).slice(0, 10) : row[f.name];
    } else {
      v[f.name] = f.defaultValue ?? (f.type === "switch" ? false : "");
    }
  }
  return v;
}

export function ResourceManager<T extends Row>({
  data,
  columns,
  fields,
  endpoint,
  entityLabel,
  canManage = false,
  searchPlaceholder,
  createLabel,
  extraToolbar,
  toFormValues,
  emptyMessage,
  autoOpenCreate = false,
  disableEdit = false,
  disableDelete = false,
  rowActions,
}: ResourceManagerProps<T>) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpenCreate);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(fields));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  function openCreate() {
    setEditing(null);
    setValues(initialValues(fields));
    setOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    setValues(initialValues(fields, toFormValues ? toFormValues(row) : row));
    setOpen(true);
  }

  function setField(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function buildPayload(): Record<string, unknown> | null {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      let val = values[f.name];
      if (f.type === "number") {
        if (val === "" || val === undefined) {
          val = undefined;
        } else {
          val = Number(val);
        }
      }
      if (f.required && (val === "" || val === undefined || val === null)) {
        toast.error(`${f.label} is required.`);
        return null;
      }
      if (val !== "" && val !== undefined) payload[f.name] = val;
      else if (f.type === "switch") payload[f.name] = Boolean(val);
    }
    return payload;
  }

  async function submit() {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`${endpoint}/${editing.id}`, payload);
        toast.success(`${entityLabel} updated.`);
      } else {
        await api.post(endpoint, payload);
        toast.success(`${entityLabel} created.`);
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await api.delete(`${endpoint}/${deleteTarget.id}`);
      toast.success(`${entityLabel} deleted.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete.");
      throw e;
    }
  }

  const allColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!canManage) return columns;
    return [
      ...columns,
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" aria-label="Row actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!disableEdit && (
                <DropdownMenuItem onClick={() => openEdit(row.original)}>
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
              )}
              {rowActions?.(row.original)}
              {!disableDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(row.original)}
                >
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, canManage]);

  return (
    <>
      <DataTable
        data={data}
        columns={allColumns}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        toolbar={
          <>
            {extraToolbar}
            {canManage && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" /> {createLabel ?? `New ${entityLabel}`}
              </Button>
            )}
          </>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${entityLabel}` : `New ${entityLabel}`}
            </DialogTitle>
            <DialogDescription>
              {editing ? `Update the ${entityLabel.toLowerCase()} details.` : `Create a new ${entityLabel.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {fields.map((f) => (
              <div
                key={f.name}
                className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}
              >
                <Label htmlFor={f.name} className="mb-1.5 block">
                  {f.label}
                  {f.required && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setField(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={values[f.name] ? String(values[f.name]) : undefined}
                    onValueChange={(v) => setField(f.name, v)}
                  >
                    <SelectTrigger id={f.name}>
                      <SelectValue placeholder={f.placeholder ?? "Select…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "switch" ? (
                  <div className="flex h-9 items-center">
                    <Switch
                      id={f.name}
                      checked={Boolean(values[f.name])}
                      onCheckedChange={(c) => setField(f.name, c)}
                    />
                  </div>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    step={f.type === "number" ? "any" : undefined}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setField(f.name, e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
                {f.helper && <p className="mt-1 text-xs text-muted-foreground">{f.helper}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${entityLabel}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={remove}
      />
    </>
  );
}

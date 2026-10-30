import { useState } from "react";
import { FiHash, FiSave, FiType } from "react-icons/fi";
import { Button, Input } from "../../components/ui";
import { TextArea } from "../../components/workspace";
import { DateField, SelectField } from "../../components/project";
import { EDITABLE_STATUSES, KEY_PATTERN, PRIORITIES, PRIORITY, STATUS, suggestKey } from "../../project/projectMeta";

const toForm = (p = {}) => ({
  name: p.name || "",
  key: p.key || "",
  description: p.description || "",
  status: p.status && p.status !== "archived" ? p.status : "planning",
  priority: p.priority || "medium",
  startDate: p.startDate || "",
  dueDate: p.dueDate || "",
  teamId: p.team?.id || "",
});

// create: saare bhare fields; edit: sirf badle hue fields
const buildPayload = (form, initial) => {
  const next = {
    name: form.name.trim(),
    key: form.key.trim().toUpperCase(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    startDate: form.startDate || null,
    dueDate: form.dueDate || null,
    teamId: form.teamId || null,
  };
  if (!initial) {
    const payload = { name: next.name, status: next.status, priority: next.priority };
    if (next.key) payload.key = next.key;
    if (next.description) payload.description = next.description;
    if (next.startDate) payload.startDate = next.startDate;
    if (next.dueDate) payload.dueDate = next.dueDate;
    if (next.teamId) payload.teamId = next.teamId;
    return payload;
  }
  const before = {
    name: initial.name,
    key: initial.key,
    description: (initial.description || "").trim(),
    status: initial.status,
    priority: initial.priority,
    startDate: initial.startDate || null,
    dueDate: initial.dueDate || null,
    teamId: initial.team?.id || null,
  };
  const payload = {};
  for (const field of Object.keys(next)) {
    if (next[field] !== before[field]) payload[field] = next[field];
  }
  return payload;
};

const ProjectForm = ({ initial, teams, onSubmit, onCancel, submitLabel = "Create project" }) => {
  const [form, setForm] = useState(() => toForm(initial));
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const datesInvalid = form.startDate && form.dueDate && form.dueDate < form.startDate;
  const payload = buildPayload(form, initial);
  const unchanged = initial && Object.keys(payload).length === 0;

  const submit = async (e) => {
    e.preventDefault();
    if (datesInvalid) return;
    setSaving(true);
    try {
      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input
          label="Project name"
          hint="2–120 characters"
          icon={FiType}
          placeholder="Website redesign"
          value={form.name}
          onChange={set("name")}
          minLength={2}
          maxLength={120}
          required
          autoFocus={!initial}
        />
      </div>
      <Input
        label={initial ? "Key" : "Key (optional)"}
        hint={!initial && !form.key && form.name ? `auto: ${suggestKey(form.name)}` : "e.g. WEB, APP2"}
        icon={FiHash}
        placeholder={form.name ? suggestKey(form.name) : "WEB"}
        value={form.key}
        onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
        pattern={KEY_PATTERN}
        title="2-10 letters or numbers, starting with a letter"
        maxLength={10}
        required={Boolean(initial)}
      />
      <SelectField label="Team (optional)" value={form.teamId} onChange={set("teamId")}>
        <option value="">No team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </SelectField>
      <SelectField label="Status" value={form.status} onChange={set("status")}>
        {EDITABLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS[s].label}
          </option>
        ))}
      </SelectField>
      <SelectField label="Priority" value={form.priority} onChange={set("priority")}>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY[p].label}
          </option>
        ))}
      </SelectField>
      <DateField label="Start date" value={form.startDate} onChange={set("startDate")} max={form.dueDate || undefined} />
      <div>
        <DateField label="Due date" value={form.dueDate} onChange={set("dueDate")} min={form.startDate || undefined} />
        {datesInvalid && <p className="mt-1.5 text-xs text-rose-300">Due date can’t be before the start date.</p>}
      </div>
      <div className="sm:col-span-2">
        <TextArea
          label="Description (optional)"
          hint={`${form.description.length}/2000`}
          placeholder="Goals, scope, links…"
          value={form.description}
          onChange={set("description")}
          maxLength={2000}
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={saving} loadingText="Saving..." disabled={datesInvalid || unchanged}>
          <FiSave /> {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;

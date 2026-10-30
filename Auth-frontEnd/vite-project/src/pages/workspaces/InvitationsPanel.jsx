import { useEffect, useState } from "react";
import { FiMail, FiRefreshCw, FiSend, FiXCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { Button, Card, Input, Spinner } from "../../components/ui";
import { WorkspaceRoleBadge } from "../../components/workspace";
import { apiError } from "../../api/workspaces";
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from "../../api/invitations";

const statusStyles = {
  pending: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  expired: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  accepted: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  revoked: "border-slate-400/20 bg-white/5 text-slate-400",
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyles[status]}`}>
    {status}
  </span>
);

const relative = (date) => {
  const days = Math.round((new Date(date) - Date.now()) / 86_400_000);
  if (days > 1) return `expires in ${days} days`;
  if (days === 1) return "expires tomorrow";
  if (days === 0) return "expires today";
  return `expired ${-days} day${days === -1 ? "" : "s"} ago`;
};

// backend jaisa hi rule: owner sab, admin sirf member invitations
const canManage = (myRole, inviteRole) => myRole === "owner" || (myRole === "admin" && inviteRole === "member");

const InvitationsPanel = ({ workspace }) => {
  const [invitations, setInvitations] = useState(null);
  const [form, setForm] = useState({ email: "", role: "member" });
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listInvitations(workspace.id)
      .then((list) => !cancelled && setInvitations(list))
      .catch((error) => {
        if (cancelled) return;
        setInvitations([]);
        toast.error(apiError(error, "Could not load invitations"));
      });
    return () => {
      cancelled = true;
    };
  }, [workspace.id]);

  const replace = (inv) => setInvitations((list) => list.map((i) => (i.id === inv.id ? inv : i)));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await createInvitation(workspace.id, { email: form.email.trim(), role: form.role });
      setInvitations((list) => [res.invitation, ...list]);
      setForm({ email: "", role: "member" });
      if (res.emailSent) toast.success(`Invitation sent to ${res.invitation.email}`);
      else toast.error("Invitation saved, but the email could not be sent. Try Resend.");
    } catch (error) {
      toast.error(apiError(error, "Could not send invitation"));
    } finally {
      setSending(false);
    }
  };

  const resend = async (inv) => {
    setBusyId(inv.id);
    try {
      const res = await resendInvitation(workspace.id, inv.id);
      replace(res.invitation);
      if (res.emailSent) toast.success(`Invitation resent to ${inv.email}`);
      else toast.error("Invitation renewed, but the email could not be sent.");
    } catch (error) {
      toast.error(apiError(error, "Could not resend invitation"));
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (inv) => {
    setBusyId(inv.id);
    try {
      replace(await revokeInvitation(workspace.id, inv.id));
      toast.success(`Invitation for ${inv.email} revoked`);
    } catch (error) {
      toast.error(apiError(error, "Could not revoke invitation"));
    } finally {
      setBusyId(null);
    }
  };

  const open = (invitations || []).filter((i) => i.status === "pending" || i.status === "expired");
  const history = (invitations || []).filter((i) => i.status === "accepted" || i.status === "revoked");

  const renderRow = (inv) => {
    const manageable = canManage(workspace.role, inv.role);
    const actionable = inv.status === "pending" || inv.status === "expired";
    return (
      <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3 animate-fade-in">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/5 text-slate-400">
          <FiMail className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{inv.email}</p>
          <p className="truncate text-xs text-slate-500">
            {inv.status === "accepted" && inv.acceptedAt
              ? `joined ${new Date(inv.acceptedAt).toLocaleDateString("en-IN")}`
              : inv.status === "revoked"
                ? "revoked"
                : relative(inv.expiresAt)}
            {inv.invitedBy?.name && ` · by ${inv.invitedBy.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WorkspaceRoleBadge role={inv.role} />
          <StatusBadge status={inv.status} />
        </div>
        {actionable && manageable && (
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            {busyId === inv.id ? (
              <Spinner className="size-5 text-violet-300" />
            ) : (
              <>
                <button
                  onClick={() => resend(inv)}
                  title="Send a new link (the old one stops working)"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200"
                >
                  <FiRefreshCw className="size-3.5" /> Resend
                </button>
                <button
                  onClick={() => revoke(inv)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <FiXCircle className="size-3.5" /> Revoke
                </button>
              </>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <Card className="p-7 animate-fade-up" style={{ animationDelay: "200ms" }}>
      <h2 className="font-display text-lg font-semibold">Invite people</h2>
      <p className="mt-1 text-sm text-slate-400">
        They’ll get an email with a link that works once and expires in 7 days.
        {workspace.role === "admin" && " Admins can invite members; only owners can invite admins."}
      </p>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Email"
            icon={FiMail}
            type="email"
            placeholder="teammate@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <label className="block sm:w-36">
          <span className="mb-1.5 block text-xs font-medium text-slate-400">Role</span>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition focus:border-violet-500/70 focus:ring-4 focus:ring-violet-500/15 [&>option]:bg-[#0d0d1c]"
          >
            <option value="member">Member</option>
            {workspace.role === "owner" && <option value="admin">Admin</option>}
          </select>
        </label>
        <Button type="submit" loading={sending} loadingText="Sending...">
          <FiSend /> Invite
        </Button>
      </form>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pending invitations {invitations && `(${open.length})`}
        </h3>
        {invitations === null ? (
          <div className="mt-3 space-y-2">
            <div className="skeleton h-12 rounded-xl" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
        ) : open.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No pending invitations.</p>
        ) : (
          <ul className="mt-1 divide-y divide-white/5">{open.map(renderRow)}</ul>
        )}

        {history.length > 0 && (
          <div className="mt-4 border-t border-white/5 pt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs font-medium text-slate-400 transition hover:text-white"
            >
              {showHistory ? "Hide" : "Show"} accepted & revoked ({history.length})
            </button>
            {showHistory && (
              <ul className="mt-1 divide-y divide-white/5">{history.map(renderRow)}</ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default InvitationsPanel;

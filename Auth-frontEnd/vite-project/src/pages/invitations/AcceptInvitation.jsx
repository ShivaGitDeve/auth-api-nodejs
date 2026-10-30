import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiAlertTriangle, FiArrowRight, FiCheck, FiLogIn, FiLogOut, FiUserPlus, FiXCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import AuthLayout from "../../components/AuthLayout";
import { Button, Spinner } from "../../components/ui";
import { WorkspaceAvatar, WorkspaceRoleBadge } from "../../components/workspace";
import { useAuth } from "../../auth/Auth-context";
import { useWorkspaces } from "../../workspace/WorkspaceContext";
import { acceptInvitation, previewInvitation } from "../../api/invitations";
import { apiError } from "../../api/workspaces";
import {
  ACCEPT_PATH,
  authQuery,
  clearPendingInvite,
  readPendingInvite,
  savePendingInvite,
} from "../../workspace/pendingInvite";

const statusText = {
  accepted: { title: "Invitation already used", body: "This invitation has already been accepted." },
  revoked: { title: "Invitation revoked", body: "This invitation was cancelled by the workspace. Ask them for a new one." },
  expired: { title: "Invitation expired", body: "This invitation link has expired. Ask the workspace owner or admin to resend it." },
};

const Problem = ({ title, body }) => (
  <AuthLayout title={title}>
    <div className="flex flex-col items-center text-center">
      <div className="mb-5 grid size-16 place-items-center rounded-full bg-amber-500/15 text-amber-300 animate-scale-in">
        <FiAlertTriangle className="size-7" />
      </div>
      <p className="text-sm text-slate-400">{body}</p>
      <Link to="/" className="mt-8 w-full">
        <Button variant="ghost" className="w-full">
          Go to home
        </Button>
      </Link>
    </div>
  </AuthLayout>
);

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const { refresh, selectWorkspace } = useWorkspaces();

  // email link ka ?token= sessionStorage mein - login/signup ke baad bhi mil jaaye
  const [token] = useState(() => {
    const fromUrl = searchParams.get("token");
    if (fromUrl) {
      savePendingInvite(fromUrl);
      return fromUrl;
    }
    return readPendingInvite();
  });
  const [preview, setPreview] = useState(token ? { loading: true } : null);
  const [accepting, setAccepting] = useState(false);

  // token ko address bar / history se hata do
  useEffect(() => {
    if (searchParams.has("token")) navigate(ACCEPT_PATH, { replace: true });
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    previewInvitation(token)
      .then((data) => !cancelled && setPreview({ data }))
      .catch((error) => {
        if (cancelled) return;
        if (error.response?.status === 404) clearPendingInvite();
        setPreview({ error: apiError(error, "Could not load this invitation"), status: error.response?.status });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <Problem title="No invitation found" body="Open the invitation link from your email to join a workspace." />;
  }

  if (preview.loading || authLoading) {
    return (
      <AuthLayout title="Loading invitation">
        <div className="flex justify-center py-6">
          <Spinner className="size-8 text-violet-300" />
        </div>
      </AuthLayout>
    );
  }

  if (preview.error) {
    return (
      <Problem
        title={preview.status === 404 ? "Invalid invitation" : "Something went wrong"}
        body={preview.status === 404 ? "This invitation link is invalid or has been replaced by a newer one." : preview.error}
      />
    );
  }

  const { invitation, accountExists } = preview.data;

  if (invitation.status !== "pending") {
    clearPendingInvite();
    return <Problem {...statusText[invitation.status]} />;
  }

  const emailMatches = user && user.email.trim().toLowerCase() === invitation.email;

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await acceptInvitation(token);
      clearPendingInvite();
      await refresh().catch(() => {});
      selectWorkspace(res.workspace.id);
      toast.success(res.alreadyMember ? `You're already in ${res.workspace.name}` : `Welcome to ${res.workspace.name}!`);
      navigate(`/workspaces/${res.workspace.id}`, { replace: true });
    } catch (error) {
      const status = error.response?.status;
      if (status === 404 || status === 410) {
        clearPendingInvite();
        setPreview({ error: apiError(error, "This invitation can no longer be used"), status: 410 });
      }
      toast.error(apiError(error, "Could not accept the invitation"));
      setAccepting(false);
    }
  };

  const switchAccount = async () => {
    await logout();
    navigate(`/login${authQuery({ next: ACCEPT_PATH, email: invitation.email })}`);
  };

  const decline = () => {
    clearPendingInvite();
    navigate(user ? "/dashboard" : "/");
  };

  return (
    <AuthLayout title="You’re invited" subtitle="Join your team on TeamFlow.">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-4">
          <WorkspaceAvatar name={invitation.workspaceName} className="size-14 rounded-xl text-lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold text-white">{invitation.workspaceName}</p>
            <p className="text-sm text-slate-400">
              {invitation.invitedByName ? `${invitation.invitedByName} invited you` : "You were invited"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4 text-sm text-slate-400">
          Join as <WorkspaceRoleBadge role={invitation.role} />
          <span className="ml-auto truncate text-xs">for {invitation.email}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {!user && (
          <>
            <p className="text-sm text-slate-400">
              {accountExists
                ? "Sign in with the invited email to accept."
                : "Create an account with the invited email to accept. You’ll come right back here."}
            </p>
            {accountExists ? (
              <Link to={`/login${authQuery({ next: ACCEPT_PATH, email: invitation.email })}`} className="block">
                <Button className="w-full">
                  <FiLogIn /> Sign in to accept
                </Button>
              </Link>
            ) : (
              <>
                <Link to={`/signup${authQuery({ next: ACCEPT_PATH, email: invitation.email })}`} className="block">
                  <Button className="w-full">
                    <FiUserPlus /> Create account
                  </Button>
                </Link>
                <Link to={`/login${authQuery({ next: ACCEPT_PATH, email: invitation.email })}`} className="block">
                  <Button variant="ghost" className="w-full">
                    <FiLogIn /> I already have an account
                  </Button>
                </Link>
              </>
            )}
          </>
        )}

        {user && emailMatches && (
          <Button className="w-full" onClick={accept} loading={accepting} loadingText="Joining...">
            <FiCheck /> Accept & join workspace <FiArrowRight />
          </Button>
        )}

        {user && !emailMatches && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            You’re signed in as <span className="font-semibold">{user.email}</span>, but this invitation is for{" "}
            <span className="font-semibold">{invitation.email}</span>.
            <Button variant="ghost" className="mt-4 w-full" onClick={switchAccount}>
              <FiLogOut /> Sign out and switch account
            </Button>
          </div>
        )}

        <button
          onClick={decline}
          className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs text-slate-500 transition hover:text-slate-300"
        >
          <FiXCircle className="size-3.5" /> Not now
        </button>
      </div>
    </AuthLayout>
  );
};

export default AcceptInvitation;

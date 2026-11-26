import { useEffect, useRef, useState } from "react";
import { Loader2, MailPlus, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { invitationService } from "@/features/auth/services/invitation.services";
import {
  projectService,
  type ApiProject,
  type ProjectMemberCandidate,
} from "@/services/project.service";
import { useProjectStore } from "@/store/projectStore";

interface Props {
  project: ApiProject;
  isAdmin: boolean;
  onClose: () => void;
}

type Tab = "existing" | "invite";

function getErrorMessage(error: unknown, fallback: string) {
  const message = (
    error as { response?: { data?: { message?: string } } }
  )?.response?.data?.message;

  return message ?? fallback;
}

export default function ProjectMembersDialog({
  project,
  isAdmin,
  onClose,
}: Props) {
  const refreshProjects = useProjectStore((state) => state.refreshProjects);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [tab, setTab] = useState<Tab>("existing");
  const [members, setMembers] = useState<ProjectMemberCandidate[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [retryMembers, setRetryMembers] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.focus();

    return () => previousFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingMembers(true);
    setMembersError("");

    projectService
      .getEligibleProjectMembers(project.id)
      .then(({ data }) => {
        if (!active) return;
        setMembers(data.members);
        setSelectedUserId(data.members[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMembersError(
          getErrorMessage(error, "Could not load eligible organization members.")
        );
      })
      .finally(() => {
        if (active) setLoadingMembers(false);
      });

    return () => {
      active = false;
    };
  }, [project.id, retryMembers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
      } else if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) return;

    setSubmitting(true);
    setActionError("");
    setRefreshWarning("");
    try {
      await projectService.addProjectMember(project.id, selectedUserId);
      const memberName =
        members.find((member) => member.id === selectedUserId)?.name ??
        "The selected member";
      setMembers((current) =>
        current.filter((member) => member.id !== selectedUserId)
      );
      setSelectedUserId(
        members.find((member) => member.id !== selectedUserId)?.id ?? ""
      );
      setSuccessMessage(`${memberName} was added to ${project.name}.`);
      toast.success("Member added to project");

      try {
        await refreshProjects();
      } catch (error: unknown) {
        const message = getErrorMessage(
          error,
          "The project list could not be refreshed."
        );
        setRefreshWarning(
          `The member was added, but the dashboard could not refresh. ${message}`
        );
        toast.error("Member added, but the project count could not be refreshed");
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not add this member.");
      setActionError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setActionError("");
    setRefreshWarning("");

    try {
      await invitationService.create({
        name: name.trim(),
        email: email.trim(),
        systemRole: "member",
        projectId: project.id,
        role: "member",
      });
      setSuccessMessage(
        `An invitation for ${email.trim()} was sent. Project access is granted when they accept.`
      );
      toast.success("Invitation sent");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Could not send this invitation.");
      setActionError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeFromBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !submitting) onClose();
  };

  const inputClass =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 disabled:bg-zinc-800 disabled:text-zinc-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onMouseDown={closeFromBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-members-title"
        aria-describedby="project-members-description"
        tabIndex={-1}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl outline-none sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500 dark:text-orange-400">
              Project collaboration
            </p>
            <h2
              id="project-members-title"
              className="mt-1 truncate text-lg font-bold text-zinc-100"
            >
              Manage members
            </h2>
            <p
              id="project-members-description"
              className="mt-1 text-sm text-zinc-400"
            >
              Add people to <span className="font-medium text-zinc-200">{project.name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close member management"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 py-5 sm:px-6">
          {successMessage ? (
            <div className="space-y-4" role="status">
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <p className="font-semibold text-green-300">
                  {tab === "invite" ? "Invitation sent" : "Member added"}
                </p>
                <p className="mt-1 text-sm leading-5 text-green-300">
                  {successMessage}
                </p>
              </div>
              {refreshWarning && (
                <p
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
                  role="alert"
                >
                  {refreshWarning}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Member management options"
                onKeyDown={(event) => {
                  if (
                    !isAdmin ||
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
                  ) {
                    return;
                  }

                  event.preventDefault();
                  const nextTab: Tab =
                    event.key === "Home"
                      ? "existing"
                      : event.key === "End"
                        ? "invite"
                        : tab === "existing"
                          ? "invite"
                          : "existing";
                  setTab(nextTab);
                  document
                    .getElementById(
                      nextTab === "existing"
                        ? "existing-members-tab"
                        : "invite-member-tab"
                    )
                    ?.focus();
                }}
                className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-950 p-1"
              >
                <button
                  type="button"
                  id="existing-members-tab"
                  role="tab"
                  aria-selected={tab === "existing"}
                  aria-controls="existing-members-panel"
                  tabIndex={tab === "existing" ? 0 : -1}
                  onClick={() => {
                    setTab("existing");
                    setActionError("");
                  }}
                  className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    tab === "existing"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  Existing member
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    id="invite-member-tab"
                    role="tab"
                    aria-selected={tab === "invite"}
                    aria-controls="invite-member-panel"
                    tabIndex={tab === "invite" ? 0 : -1}
                    onClick={() => {
                      setTab("invite");
                      setActionError("");
                    }}
                    className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      tab === "invite"
                        ? "bg-zinc-800 text-zinc-100 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    Invite by email
                  </button>
                ) : (
                  <div className="flex items-center justify-center rounded-lg px-2 text-center text-xs text-zinc-500">
                    Email invites are for admins
                  </div>
                )}
              </div>

              {tab === "existing" ? (
                <section
                  id="existing-members-panel"
                  role="tabpanel"
                  aria-labelledby="existing-members-tab"
                  className="pt-5"
                >
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                      <label
                        htmlFor="eligible-project-member"
                        className="mb-1.5 block text-sm font-semibold text-zinc-200"
                      >
                        Organization member
                      </label>
                      {loadingMembers ? (
                        <div
                          className="flex min-h-12 items-center gap-2 rounded-xl border border-zinc-700 px-3.5 text-sm text-zinc-400"
                          role="status"
                        >
                          <Loader2
                            size={16}
                            className="animate-spin text-orange-500 dark:text-orange-400"
                            aria-hidden="true"
                          />
                          Loading eligible members…
                        </div>
                      ) : membersError ? (
                        <div
                          className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5"
                          role="alert"
                        >
                          <p className="text-sm text-red-300">{membersError}</p>
                          <button
                            type="button"
                            onClick={() => setRetryMembers((value) => value + 1)}
                            className="text-sm font-semibold text-red-300 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          >
                            Try again
                          </button>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-5 text-center">
                          <p className="text-sm font-semibold text-zinc-200">
                            No eligible members
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            All active organization members are already on this project.
                          </p>
                        </div>
                      ) : (
                        <select
                          id="eligible-project-member"
                          value={selectedUserId}
                          onChange={(event) => setSelectedUserId(event.target.value)}
                          disabled={submitting}
                          className={inputClass}
                        >
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} · {member.email}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {actionError && (
                      <p
                        className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                        role="alert"
                      >
                        {actionError}
                      </p>
                    )}

                    {members.length > 0 && !membersError && (
                      <div className="flex justify-end border-t border-zinc-800 pt-4">
                        <button
                          type="submit"
                          disabled={submitting || loadingMembers || !selectedUserId}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <UserPlus size={16} aria-hidden="true" />
                          )}
                          Add to project
                        </button>
                      </div>
                    )}
                  </form>

                  {!isAdmin && (
                    <p className="mt-4 rounded-lg bg-orange-500/10 px-3.5 py-3 text-sm text-orange-200">
                      Only system admins can send email invitations. You can still add
                      existing organization members here.
                    </p>
                  )}
                </section>
              ) : (
                <section
                  id="invite-member-panel"
                  role="tabpanel"
                  aria-labelledby="invite-member-tab"
                  className="pt-5"
                >
                  <p className="mb-4 text-sm leading-5 text-zinc-400">
                    The invitation will be linked to this project and grant access after
                    the recipient accepts it.
                  </p>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label
                        htmlFor="invitee-name"
                        className="mb-1.5 block text-sm font-semibold text-zinc-200"
                      >
                        Full name
                      </label>
                      <input
                        id="invitee-name"
                        type="text"
                        autoComplete="name"
                        required
                        minLength={2}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={submitting}
                        placeholder="Jordan Lee"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="invitee-email"
                        className="mb-1.5 block text-sm font-semibold text-zinc-200"
                      >
                        Email address
                      </label>
                      <input
                        id="invitee-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={submitting}
                        placeholder="jordan@example.com"
                        className={inputClass}
                      />
                    </div>

                    {actionError && (
                      <p
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                        role="alert"
                      >
                        {actionError}
                      </p>
                    )}

                    <div className="flex justify-end border-t border-zinc-800 pt-4">
                      <button
                        type="submit"
                        disabled={submitting || !name.trim() || !email.trim()}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <MailPlus size={16} aria-hidden="true" />
                        )}
                        Send invitation
                      </button>
                    </div>
                  </form>
                </section>
              )}
              {tab !== "existing" && (
                <section
                  id="existing-members-panel"
                  role="tabpanel"
                  aria-labelledby="existing-members-tab"
                  hidden
                />
              )}
              {isAdmin && tab !== "invite" && (
                <section
                  id="invite-member-panel"
                  role="tabpanel"
                  aria-labelledby="invite-member-tab"
                  hidden
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

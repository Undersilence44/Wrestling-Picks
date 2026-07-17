"use client";

import { useState } from "react";

export type LeaguePick = {
  matchId: string;
  matchOrder: number;
  matchTitle: string;
  predictedWinner: string;
  confidenceRank: number | null;
  hasPick: boolean;
  isCorrect: boolean;
};

export type LeaguePickMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  submittedCount: number;
  totalAwarded: number;
  isCurrentUser: boolean;
  picks: LeaguePick[];
};

type LeaguePicksProps = {
  locked: boolean;
  isFinal: boolean;
  isFixed: boolean;
  matchCount: number;
  members: LeaguePickMember[];
};

function MemberAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-yellow-500/40 bg-yellow-950 text-sm font-black text-white">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${displayName} avatar`}
          className="h-full w-full object-cover"
        />
      ) : (
        displayName.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

export default function LeaguePicks({
  locked,
  isFinal,
  isFixed,
  matchCount,
  members,
}: LeaguePicksProps) {
  const currentUser = members.find((member) => member.isCurrentUser);

  const [openUserId, setOpenUserId] = useState<string | null>(
    currentUser?.userId || null,
  );

  function toggleMember(userId: string) {
    setOpenUserId((current) => (current === userId ? null : userId));
  }

  return (
    <section className="card mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            League Picks
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Member Selections
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            League member picks become visible after the event locks.
            Interference predictions and wagers remain private.
          </p>
        </div>
      </div>

      {!locked ? (
        <p className="mt-6 rounded-2xl border border-yellow-800 bg-yellow-950/30 p-4 text-yellow-100">
          Other members&apos; picks are hidden until this event locks.
        </p>
      ) : members.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-slate-300">
          No active league members were found.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {members.map((member) => {
            const isOpen = openUserId === member.userId;
            const contentId = `member-picks-${member.userId}`;

            return (
              <article
                key={member.userId}
                className={`overflow-hidden rounded-3xl border bg-black/40 ${
                  member.isCurrentUser
                    ? "border-blue-500/60"
                    : "border-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleMember(member.userId)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-white/10 p-4 text-left md:cursor-default md:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <MemberAvatar
                      avatarUrl={member.avatarUrl}
                      displayName={member.displayName}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-black text-white md:text-lg">
                          {member.displayName}
                        </h3>

                        {member.isCurrentUser ? (
                          <span className="rounded-full border border-blue-700 bg-blue-950/50 px-2 py-0.5 text-[10px] font-black uppercase text-blue-200">
                            You
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400 md:text-xs md:tracking-[0.2em]">
                        {member.role} · {member.submittedCount}/{matchCount} picks
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isFinal ? (
                      <span className="rounded-full border border-green-700 bg-green-950/50 px-2.5 py-1 text-[11px] font-black text-green-200 md:px-3 md:text-xs">
                        {member.totalAwarded} pts
                      </span>
                    ) : null}

                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className={`h-5 w-5 text-slate-300 transition-transform duration-200 md:hidden ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </button>

                <div
                  id={contentId}
                  className={`${isOpen ? "block" : "hidden"} md:block`}
                >
                  <div className="divide-y divide-white/10">
                    {member.picks.map((pick) => (
                      <div
                        key={`${member.userId}-${pick.matchId}`}
                        className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                            Match {pick.matchOrder}
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-200">
                            {pick.matchTitle}
                          </p>

                          <p className="mt-2 text-base font-black text-white">
                            {pick.predictedWinner}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          {!isFixed && pick.confidenceRank ? (
                            <span className="rounded-full border border-blue-700 bg-blue-950/40 px-3 py-1 text-xs font-black text-blue-200">
                              Confidence {pick.confidenceRank}
                            </span>
                          ) : null}

                          {isFinal && pick.hasPick ? (
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${
                                pick.isCorrect
                                  ? "border-green-700 bg-green-950/50 text-green-200"
                                  : "border-red-700 bg-red-950/50 text-red-200"
                              }`}
                            >
                              {pick.isCorrect ? "Correct" : "Wrong"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

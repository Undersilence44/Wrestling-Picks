"use client";

import { useState } from "react";

type EventPickCardProps = {
  match: any;
  index: number;
  options: string[];
  pickedWinner: string;
  officialWinner: string;
  currentPick: any;
  locked: boolean;
  isFinal: boolean;
  isFixed: boolean;
  matchCount: number;
};

export default function EventPickCard({
  match,
  index,
  options,
  pickedWinner,
  officialWinner,
  currentPick,
  locked,
  isFinal,
  isFixed,
  matchCount,
}: EventPickCardProps) {
  const [selectedWinner, setSelectedWinner] = useState(pickedWinner || "");

  const gotItRight =
    isFinal &&
    officialWinner &&
    selectedWinner &&
    officialWinner === selectedWinner;

  const gotItWrong =
    isFinal &&
    officialWinner &&
    selectedWinner &&
    officialWinner !== selectedWinner;

  return (
    <div
      className={`rounded-[28px] border p-5 ${
        gotItRight
          ? "border-green-700 bg-green-950/20"
          : gotItWrong
            ? "border-red-700 bg-red-950/20"
            : "border-white/10 bg-black/40"
      }`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
            Match {index + 1}
          </p>

          <h3 className="mt-2 text-2xl font-black uppercase text-white">
            {match.match_title || `${match.competitor_a} vs ${match.competitor_b}`}
          </h3>

          {match.description && (
            <p className="mt-2 text-sm text-slate-300">
              {match.description}
            </p>
          )}
        </div>

        {!isFixed && (
          <label className="w-full sm:w-40">
            Confidence
            <input
              name={`rank_${match.id}`}
              type="number"
              min="1"
              max={matchCount}
              defaultValue={currentPick?.confidence_rank || ""}
              disabled={locked}
              placeholder={`1-${matchCount}`}
            />
          </label>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option: string) => {
          const selected = selectedWinner === option;
          const winner = officialWinner === option;

          return (
            <label
              key={option}
              className={`cursor-pointer rounded-2xl border p-4 transition duration-200 ${
                selected
                  ? "border-blue-400 bg-blue-950/70 shadow-lg shadow-blue-950/40"
                  : "border-white/10 bg-black/45 hover:border-blue-500/40 hover:bg-blue-950/20"
              } ${winner && isFinal ? "ring-2 ring-green-500/50" : ""}`}
            >
              <input
                type="radio"
                name={`winner_${match.id}`}
                value={option}
                checked={selected}
                disabled={locked}
                required={!locked}
                onChange={() => setSelectedWinner(option)}
                className="sr-only"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="font-black text-white">
                  {option}
                </span>

                {selected && (
                  <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-black uppercase text-white">
                    Picked
                  </span>
                )}

                {winner && isFinal && (
                  <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-black uppercase text-white">
                    Winner
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {isFinal && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Official Winner
            </p>
            <p className="mt-1 font-black text-blue-200">
              {officialWinner || "No winner set"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Your Pick
            </p>
            <p
              className={`mt-1 font-black ${
                gotItRight
                  ? "text-green-300"
                  : gotItWrong
                    ? "text-red-300"
                    : "text-slate-300"
              }`}
            >
              {selectedWinner || "No pick submitted"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Result
            </p>
            <p
              className={`mt-1 font-black ${
                gotItRight
                  ? "text-green-300"
                  : gotItWrong
                    ? "text-red-300"
                    : "text-slate-300"
              }`}
            >
              {gotItRight
                ? `Correct +${currentPick?.points_awarded || 0}`
                : gotItWrong
                  ? "Wrong +0"
                  : "Not scored"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

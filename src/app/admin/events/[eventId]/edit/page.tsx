{event.status === "open" ? (
  <section className="card mt-8">
    <h2 className="text-2xl font-black">Add Another Match</h2>
    <p className="mt-2 text-slate-300">
      Add late-announced matches while this event is still open.
    </p>

    <form action={addMatchToEvent.bind(null, event.id)} className="mt-6 grid gap-4">
      <label>
        Match Title / Description
        <input
          name="match_title"
          placeholder="Roman Reigns vs Cody Rhodes for the WWE Title"
          required
        />
      </label>

      <label>
        Extra Match Notes
        <textarea
          name="description"
          placeholder="Optional match details, stipulation, title match, etc."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          Option 1
          <input name="option_1" placeholder="Roman Reigns" required />
        </label>

        <label>
          Option 2
          <input name="option_2" placeholder="Cody Rhodes" required />
        </label>

        <label>
          Option 3
          <input name="option_3" placeholder="Optional" />
        </label>

        <label>
          Option 4
          <input name="option_4" placeholder="Optional" />
        </label>

        <label>
          Option 5
          <input name="option_5" placeholder="Optional" />
        </label>

        <label>
          Option 6
          <input name="option_6" placeholder="Optional" />
        </label>
      </div>

      <button type="submit" className="btn-primary w-fit">
        Add Match
      </button>
    </form>
  </section>
) : (
  <section className="card mt-8 border-yellow-700">
    <h2 className="text-2xl font-black text-yellow-300">Match Adding Locked</h2>
    <p className="mt-2 text-slate-300">
      Matches can only be added while the event status is open.
    </p>
  </section>
)}

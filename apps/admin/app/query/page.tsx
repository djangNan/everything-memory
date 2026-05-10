import { Suspense } from "react";
import CohortConsole from "../components/CohortConsole";

export default function QueryPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cohort console
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Narrow a cohort and ask in plain English.
        </p>
      </div>

      <div
        role="note"
        className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600"
      >
        Individual user access is disabled. Cohort queries return aggregate
        answers when 2+ users match. Demographics are inferred periodically by
        the LLM from cross-site behavior — never user-supplied.
      </div>

      <section className="mt-8">
        <Suspense fallback={null}>
          <CohortConsole />
        </Suspense>
      </section>
    </div>
  );
}

import { DataTable } from "@/components/charts/ChartFigure";
import { EvalLivePanel } from "@/components/EvalLiveStatus";
import { Source } from "@/components/Source";
import { repoUrl, src } from "@/content/sources";
import type { CaseStudy } from "./types";

// Static claims below are pinned to 1d349fd (the results commit of 15 Sep 2026)
// and dated in the text. The live panel reads the moving file on main.

function Body() {
  return (
    <>
      <section className="summary-box prose" aria-labelledby="short-version">
        <h2 id="short-version">The short version</h2>
        <ul>
          <li>
            Every night a GitHub Action runs four evaluation tracks against open-weight models on Groq and commits the
            results to the repository. A Next.js dashboard on Vercel reads that file, and so does the panel below.
          </li>
          <li>
            The main track asks whether a model can triage anti-money-laundering alerts: 26 hand-written synthetic
            cases, each answered as ESCALATE, CLEAR or REVIEW with cited evidence, and scored by a fixed parser rather
            than by another model.
          </li>
          <li>
            The number that matters most is the <strong>false clear</strong>: a case that should have been escalated
            and was cleared.
          </li>
          <li>
            Every score carries a bootstrap interval, and a drift flag fires only when a score moves 5 points or more
            and the intervals separate.
          </li>
        </ul>
      </section>

      <EvalLivePanel />

      <div className="prose">
        <h2>The four tracks</h2>
      </div>
      <div className="table-block">
        <div className="table-scroll">
          <DataTable
            table={{
              columns: [{ label: "Track" }, { label: "Question" }, { label: "Size" }, { label: "Scored by" }],
              rows: [
                [
                  "AML alert triage",
                  "Does the model make the right escalate, clear or review call, cite evidence that exists, and avoid false clears?",
                  "26 cases: 14 escalate, 8 clear, 4 review",
                  "A fixed parser for a four-line decision block",
                ],
                [
                  "Prompt injection",
                  "Does it resist direct and indirect injection and jailbreak prompts?",
                  "30 attacks",
                  "String and canary matching; quoting the payload counts as a breach",
                ],
                [
                  "Capability and drift",
                  "Is it competent on a fixed set, and did that change since the last run?",
                  "50 items",
                  "Automatic grading",
                ],
                [
                  "Judge reliability",
                  "Can the model be trusted to grade other answers?",
                  "24 pairwise items with human labels, in both orders",
                  "Agreement, position bias, verbosity bias, Cohen's and Fleiss' kappa",
                ],
              ],
            }}
          />
        </div>
        <Source
          prefix="Code and data"
          source={[
            src("evals", "eval/data/kyc_cases.jsonl"),
            src("evals", "eval/data/attacks.jsonl"),
            src("evals", "eval/grading.py", [142, 164]),
            src("evals", "eval/tracks/judge.py"),
          ]}
        />
      </div>

      <div className="prose">
        <h2>How the numbers are computed</h2>
        <ul>
          <li>
            Intervals are a percentile bootstrap with 5,000 resamples and a fixed seed, so rerunning on the same answers
            gives the same interval.
          </li>
          <li>
            A drift flag needs the score to move by at least 5 points and the two runs&apos; intervals not to overlap, so
            ordinary night-to-night noise does not raise it.
          </li>
          <li>If every model is skipped in a night, the run fails instead of overwriting the last good results.</li>
          <li>The statistics use NumPy only, and the test suite runs before each evaluation.</li>
        </ul>
        <p>
          <Source
            prefix="Code"
            source={[
              src("evals", "eval/config.py", [22, 29]),
              src("evals", "eval/stats.py", [34, 56]),
              src("evals", "eval/stats.py", [70, 90]),
              src("evals", "eval/run_eval.py", [117, 125]),
              src("evals", ".github/workflows/nightly-eval.yml"),
            ]}
          />
        </p>

        <h2>What the history shows so far</h2>
        <p>
          From 2 August to 15 September 2026, GPT-OSS 120B completed the triage track on 29 nights and never cleared a
          case that should have been escalated. Its accuracy on the same 26 cases moved between 92.3% and 100% from
          night to night, which is a reason to report intervals and trends rather than one run. On the injection set it
          defended 93.3% to 96.7% of attacks over 31 nights; Llama 3.3 70B defended 73.3% to 83.3% over the 19 nights
          it completed.
        </p>
        <p>
          <Source source={src("evals", "public/data/history.jsonl")} />
        </p>
        <p>
          The pipeline is honest about its own gaps. A model is skipped for the night when Groq&apos;s free tier
          returns an error or rate-limits it, and the panel above reports how many configured models finished and how
          many recent nights produced results at all.
        </p>

        <h2>What this does not show</h2>
        <ul className="limits">
          <li>The cases are synthetic and written by me. This is not a compliance benchmark, and real alerts are messier.</li>
          <li>
            Samples are small. With 4 ambiguous cases, the review-routing score moves in 25-point steps, and at 100% a
            bootstrap interval collapses to a single point.
          </li>
          <li>
            Several scores sit at the ceiling. The judge items are too easy to separate the two GPT-OSS judges, which
            also come from one vendor.
          </li>
          <li>Drift is compared only with the previous night.</li>
          <li>Which models are measured on a given night depends on free-tier availability.</li>
        </ul>
      </div>
    </>
  );
}

const evalObservatory: CaseStudy = {
  slug: "llm-eval-observatory",
  title: "LLM Eval Observatory",
  kicker: "LLM evaluation / automation",
  deck:
    "Can an open-weight model triage anti-money-laundering alerts without a person checking every case? A nightly evaluation that commits its results with intervals, so the numbers can be checked.",
  description:
    "Nightly LLM evaluation on GitHub Actions: AML alert triage scored by a fixed parser, prompt-injection robustness, capability drift and LLM-as-judge reliability, with bootstrap intervals.",
  meta: ["Real results since 28 Jul 2026", "Python, GitHub Actions, Next.js", "Groq free tier"],
  links: [
    { label: "Dashboard", href: "https://llm-eval-observatory.vercel.app" },
    { label: "Repository", href: repoUrl("evals") },
  ],
  Body,
};

export default evalObservatory;

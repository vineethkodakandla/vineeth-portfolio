import { ChartFigure, DataTable } from "@/components/charts/ChartFigure";
import { RowChart, type ChartRow, type Scale } from "@/components/charts/RowChart";
import { Source } from "@/components/Source";
import { blob, repoUrl, src } from "@/content/sources";
import type { CaseStudy } from "./types";

// All values are copied from the scorecards at v0.3.1 (6aa651d), including their
// rounding, so the page and the repository print the same digits. Where a share
// is 0% or 100% the bootstrap has no spread, so those rows draw the exact
// interval that counts prompts (the scorecard's "by prompt" bound), which is the
// more conservative unit because runs of one prompt are correlated.

type Rate = { label: string; sub?: string; v: number; lo: number; hi: number; text: string; ci: string };
type Option = Rate & { distinct: string; paired: string };

const PCT: Scale = { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], unit: "%", title: "runs" };

const GPU_RATES: Rate[] = [
  { label: "c2", v: 95.63, lo: 90.94, hi: 99.06, text: "95.6%", ci: "90.9 to 99.1" },
  { label: "c4", v: 99.69, lo: 98.13, hi: 100, text: "99.7%", ci: "98.1 to 100.0" },
  { label: "c8", v: 100, lo: 91.19, hi: 100, text: "100.0%", ci: "98.9 to 100.0 by run; 91.2 to 100.0 by prompt" },
  { label: "c16", v: 99.69, lo: 98.13, hi: 100, text: "99.7%", ci: "98.1 to 100.0" },
  { label: "c32", v: 98.44, lo: 94.38, hi: 100, text: "98.4%", ci: "94.4 to 100.0" },
];

const CPU_RATES: Rate[] = [
  { label: "c2", v: 54.38, lo: 43.75, hi: 65.01, text: "54.4%", ci: "43.8 to 65.0" },
  { label: "c4", v: 72.5, lo: 63.13, hi: 80.63, text: "72.5%", ci: "63.1 to 80.6" },
  { label: "c8", v: 71.25, lo: 58.75, hi: 82.19, text: "71.2%", ci: "58.8 to 82.2" },
  { label: "c16", v: 70.31, lo: 56.25, hi: 82.81, text: "70.3%", ci: "56.2 to 82.8" },
  { label: "c32", v: 70.63, lo: 56.88, hi: 83.44, text: "70.6%", ci: "56.9 to 83.4" },
];

const GPU_OPTIONS: Option[] = [
  { label: "Default", sub: "f16 activations, 4-bit KV cache", v: 100, lo: 91.19, hi: 100, text: "100.0%", ci: "98.9 to 100.0 by run; 91.2 to 100.0 by prompt", distinct: "7.22", paired: "reference" },
  { label: "f16 KV cache", v: 51.25, lo: 39.38, hi: 63.13, text: "51.2%", ci: "39.4 to 63.1", distinct: "3.00", paired: "−48.8 (−60.6 to −36.9)" },
  { label: "Dynamic quantization off", v: 100, lo: 91.19, hi: 100, text: "100.0%", ci: "98.9 to 100.0 by run; 91.2 to 100.0 by prompt", distinct: "1.25", paired: "0.0 (both rows at 100%)" },
  { label: "Both changes", sub: "f16 KV cache, dynamic quantization off", v: 60.31, lo: 45.63, hi: 75, text: "60.3%", ci: "45.6 to 75.0", distinct: "1.12", paired: "−39.7 (−54.4 to −25.0)" },
  { label: "16-token step budget", sub: "shared with decode tokens", v: 99.69, lo: 98.13, hi: 100, text: "99.7%", ci: "98.1 to 100.0", distinct: "6.68", paired: "−0.3 (−1.9 to 0.0)" },
];

const CPU_OPTIONS: Option[] = [
  { label: "Default", sub: "f32 activations, 8-bit KV cache", v: 71.25, lo: 58.75, hi: 82.19, text: "71.2%", ci: "58.8 to 82.2", distinct: "3.32", paired: "reference" },
  { label: "f32 KV cache", v: 71.56, lo: 59.38, hi: 82.81, text: "71.6%", ci: "59.4 to 82.8", distinct: "3.30", paired: "+0.3 (−14.7 to +15.0)" },
  { label: "Dynamic quantization off", v: 21.25, lo: 10.63, hi: 32.81, text: "21.2%", ci: "10.6 to 32.8", distinct: "1.45", paired: "−50.0 (−64.4 to −34.7)" },
  { label: "Both changes", sub: "f32 KV cache, dynamic quantization off", v: 0, lo: 0, hi: 8.81, text: "0 of 320", ci: "0.0 to 1.1 by run; 0.0 to 8.8 by prompt", distinct: "1.00", paired: "−71.2 (−82.2 to −58.8)" },
  { label: "16-token step budget", sub: "shared with decode tokens", v: 90, lo: 82.81, hi: 95.63, text: "90.0%", ci: "82.8 to 95.6", distinct: "5.80", paired: "+18.8 (+5.3 to +32.2)" },
];

// "71.2%" reads "71.2% of runs"; a count like "0 of 320" reads "0 of 320 runs".
const runsPhrase = (text: string) => (text.endsWith("%") ? `${text} of runs` : `${text} runs`);

function dotRows(rows: Rate[]): ChartRow[] {
  return rows.map((r) => ({
    label: r.label,
    sub: r.sub,
    marks: [
      { type: "whisker", from: r.lo, to: r.hi },
      { type: "dot", value: r.v },
    ],
    value: r.text,
    tip: [`${runsPhrase(r.text)} had changed tokens`, `95% interval, percent of runs: ${r.ci}`],
  }));
}

function barRows(rows: Option[]): ChartRow[] {
  return rows.map((r) => ({
    label: r.label,
    sub: r.sub,
    marks: [
      { type: "bar", to: r.v },
      { type: "whisker", from: r.lo, to: r.hi },
    ],
    value: r.text,
    tip: [
      `${runsPhrase(r.text)} had changed tokens`,
      `95% interval, percent of runs: ${r.ci}`,
      `${r.distinct} distinct outputs per prompt`,
      r.paired === "reference" ? "Reference row" : `Paired difference vs default, percentage points: ${r.paired}`,
    ],
  }));
}

const GPU_SUMMARY = "results/openvino/gpu/summary.csv";
const CPU_SUMMARY = "results/openvino/cpu/summary.csv";

function Body() {
  return (
    <>
      <section className="summary-box prose" aria-labelledby="short-version">
        <h2 id="short-version">The short version</h2>
        <ul>
          <li>
            Under each device&apos;s default settings, a batched run&apos;s tokens differed from the same prompt served
            alone in <strong>95.6 to 100% of iGPU runs</strong> and <strong>54.4 to 72.5% of CPU runs</strong>, within
            the first 128 generated tokens.
          </li>
          <li>
            Given its arrival schedule, the output was reproducible where tested: replaying the eight c8 schedules
            reproduced <strong>all 320 runs on each device</strong>, bit for bit.
          </li>
          <li>
            On the CPU, turning off dynamic activation quantization cut the share of changed runs at c8 from 71.2% to
            21.2%. Adding an f32 KV cache brought it to 0 of 320 runs (95% upper bound 8.8% counting prompts), although
            logprobs still moved. No tested iGPU setting removed the changes.
          </li>
          <li>
            The two devices run different quantized defaults, so the gap between them is not a hardware comparison.
          </li>
        </ul>
      </section>

      <div className="prose">
        <h2>Setup</h2>
        <p>
          The engine is OpenVINO GenAI 2026.3&apos;s ContinuousBatchingPipeline serving Qwen2.5-Coder-0.5B-Instruct
          with INT4 weights, on the Arc iGPU and the CPU of an Intel Core Ultra 7 155H. Decoding is greedy, with up to
          128 new tokens.
        </p>
        <p>
          The prompts are 40 short instructions built from 4 templates and 10 LLM-serving topics. Each prompt is first
          served alone to get its batch-of-1 output. Then all 40 arrive on a Poisson schedule and share engine steps. A
          run counts as changed when its tokens differ from that batch-of-1 output at any position, and as not bitwise
          identical when its tokens or any chosen-token logprob differ.
        </p>
        <p>
          Load is an arrival rate written c2 to c32: the average number of arrivals per maximum-length generation, on
          a virtual clock of 20 ms engine steps. It is not a number of concurrent users. Every device and option set
          sees the same arrival schedules, although batches at later steps can differ once outputs stop at different
          lengths, and prefill options change how requests are grouped into steps even when output lengths match. Each
          configuration ran 8 trials, so every row covers 320 runs: 12 configurations make 3,840 runs per device and
          7,680 in total.
        </p>
        <p>
          Both devices quantize by default. As compiled, the iGPU runs f16 activations with a 4-bit KV cache and
          dynamic quantization in groups of 32; the CPU runs f32 activations with an 8-bit KV cache and the same
          dynamic quantization.
        </p>
        <p>
          <Source
            prefix="Compiled properties"
            source={[
              src("bitwise", "analysis/precision_probe/output/summary.json", [93, 107]),
              src("bitwise", "analysis/precision_probe/output/summary.json", [225, 242]),
            ]}
          />
        </p>

        <h2>Findings</h2>
        <h3>Sharing engine steps usually changed the tokens</h3>
      </div>

      <ChartFigure
        title="Runs whose tokens changed, by arrival rate"
        description="Default options. Dots are the share of 320 runs. Lines are 95% intervals: a bootstrap over prompts and trials, widened to the exact interval on runs; where the share is 100% the line shows the exact interval counting prompts instead. Each device has its own panel because each runs its own quantized defaults."
        table={{
          columns: [
            { label: "Arrival rate" },
            { label: "iGPU", numeric: true },
            { label: "iGPU 95% interval", numeric: true },
            { label: "CPU", numeric: true },
            { label: "CPU 95% interval", numeric: true },
          ],
          rows: GPU_RATES.map((g, i) => [g.label, g.text, g.ci, CPU_RATES[i].text, CPU_RATES[i].ci]),
        }}
        sources={[src("bitwise", GPU_SUMMARY, [2, 7]), src("bitwise", CPU_SUMMARY, [2, 7]), src("bitwise", "results/openvino/gpu/scorecard.md", [17, 22])]}
      >
        <p className="chart-panel-title">Arc iGPU</p>
        <RowChart label="Arc iGPU: share of runs with changed tokens by arrival rate" rows={dotRows(GPU_RATES)} scale={PCT} />
        <p className="chart-panel-title">CPU</p>
        <RowChart label="CPU: share of runs with changed tokens by arrival rate" rows={dotRows(CPU_RATES)} scale={PCT} />
      </ChartFigure>

      <div className="prose">
        <p>
          On the CPU the share rose between c2 and c4, by 18.1 points (95% CI 5.3 to 30.3). The two comparisons made
          beyond c4 (c16 against c4 and c32 against c8) detected no change, so these data do not show the share growing
          with load beyond that step.
        </p>
        <p>
          <Source prefix="Paired rate comparisons" source={src("bitwise", "analysis/output/readme_stats.md", [11, 18])} />
        </p>

        <h3>The same schedule gives the same output</h3>
      </div>

      <div className="stat-inline">
        <div className="figure-stat">
          <div className="value">320 of 320</div>
          <div className="label">iGPU runs at c8 with identical tokens, chosen-token logprobs and batch sizes on replay</div>
          <Source source={src("bitwise", "analysis/output/readme_stats.json", [802, 808])} />
        </div>
        <div className="figure-stat">
          <div className="value">320 of 320</div>
          <div className="label">CPU runs at c8 with identical tokens, chosen-token logprobs and batch sizes on replay</div>
          <Source source={src("bitwise", "analysis/output/readme_stats.json", [943, 949])} />
        </div>
      </div>

      <div className="prose">
        <p>
          Replaying the eight c8 arrival schedules with default options, in the same process, reproduced every run on
          both devices. Batch-of-1 output was also bitwise identical across two passes before the trials and one after
          them, for every option set. So the output here is a fixed function of the arrival schedule, where that was
          tested: a different schedule can change it, and the same schedule gives it back.
        </p>
        <p>
          <Source
            prefix="Batch-of-1 checks"
            source={[
              src("bitwise", "results/openvino/gpu/baseline_checks.csv", [2, 7]),
              src("bitwise", "results/openvino/cpu/baseline_checks.csv", [2, 7]),
            ]}
          />
        </p>

        <h3>What changed the rate</h3>
      </div>

      <ChartFigure
        title="Runs whose tokens changed at c8, by engine setting"
        description="Each row is measured against the same prompts served alone under that row's own settings. Lines are 95% intervals as in the chart above; rows at 0% or 100% show the interval counting prompts. The table adds paired differences against the default row."
        table={{
          rowHeaders: 2,
          columns: [
            { label: "Setting" },
            { label: "Device" },
            { label: "Runs changed", numeric: true },
            { label: "95% interval", numeric: true },
            { label: "Distinct outputs per prompt", numeric: true },
            { label: "Paired difference vs default, points (95% CI)", numeric: true },
          ],
          rows: [
            ...GPU_OPTIONS.map((o) => [o.sub ? `${o.label} (${o.sub})` : o.label, "iGPU", o.text, o.ci, o.distinct, o.paired]),
            ...CPU_OPTIONS.map((o) => [o.sub ? `${o.label} (${o.sub})` : o.label, "CPU", o.text, o.ci, o.distinct, o.paired]),
          ],
        }}
        sources={[
          src("bitwise", GPU_SUMMARY, [7, 11]),
          src("bitwise", CPU_SUMMARY, [7, 11]),
          src("bitwise", "results/openvino/gpu/paired.csv", [3, 7]),
          src("bitwise", "results/openvino/cpu/paired.csv", [3, 7]),
          src("bitwise", "results/openvino/gpu/scorecard.md", [19, 27]),
          src("bitwise", "results/openvino/cpu/scorecard.md", [19, 27]),
        ]}
      >
        <p className="chart-panel-title">Arc iGPU</p>
        <RowChart label="Arc iGPU: runs with changed tokens at c8 by engine setting" rows={barRows(GPU_OPTIONS)} scale={PCT} />
        <p className="chart-panel-title">CPU</p>
        <RowChart label="CPU: runs with changed tokens at c8 by engine setting" rows={barRows(CPU_OPTIONS)} scale={PCT} />
      </ChartFigure>

      <div className="prose">
        <p>
          On the CPU, turning off dynamic activation quantization was the main lever: the share at c8 fell by 50.0
          points (paired 95% CI 34.7 to 64.4). An f32 KV cache on its own had no detectable effect on the share (+0.3
          points, paired 95% CI −14.7 to +15.0), although its batch-of-1 outputs differed from the default&apos;s on
          77.5% of prompts. With both changes, 0 of 320 runs had changed tokens at c8, and 0 of 320 at c32. The exact
          95% upper bound is 8.8% counting prompts, the fairer unit because runs of the same prompt are correlated, and
          1.1% counting runs.
        </p>
        <p>
          That setting is still not batch-invariant: every one of those runs had chosen-token logprobs that differed
          from batch-of-1, by at most 2.9e-5.
        </p>
        <p>
          <Source
            source={[
              src("bitwise", "results/openvino/cpu/paired.csv", [3, 4]),
              src("bitwise", "analysis/output/readme_stats.json", [376, 395]),
              src("bitwise", "results/openvino/cpu/baseline_checks.csv", [4]),
            ]}
          />
        </p>
        <p>
          On the CPU at c8, capping each engine step at 16 tokens (a budget shared with decode tokens, so prompts are
          split across several steps) raised the share from 71.2% to 90.0% (paired difference +18.8 points, 95% CI 5.3
          to 32.2). That option also changed batch-of-1 output on 36 of 40 prompts.
        </p>
        <p>
          <Source
            source={[
              src("bitwise", "results/openvino/cpu/paired.csv", [7]),
              src("bitwise", "results/openvino/cpu/baseline_checks.csv", [6]),
            ]}
          />
        </p>
        <p>
          On the iGPU no tested setting removed the changes. An f16 KV cache lowered the share to 51.2%. Turning off
          dynamic quantization left it at 100% but cut the distinct outputs per prompt from 7.22 to 1.25. There is no
          float32 row: none of the eight builds given the f32 inference precision hint served even one 2-token request
          in this OpenVINO GenAI version with this driver. Two did not compile, four failed on the first engine step
          and two on the second.
        </p>
        <p>
          <Source
            prefix="Float32 probe"
            source={[
              src("bitwise", "analysis/precision_probe/README.md", [72, 106]),
              src("bitwise", "analysis/precision_probe/output/f32_bare_request.json"),
            ]}
          />
        </p>

        <h3>Where the outputs fork</h3>
        <p>
          On the iGPU most changed runs forked early: 58.1% of c8 runs had already diverged within the first 16
          tokens. On the CPU, forks came later.
        </p>
      </div>

      <div className="table-block">
        <div className="table-scroll">
          <DataTable
            table={{
              caption: "Share of runs whose first changed token fell within the first N generated tokens (320 runs per row)",
              columns: [
                { label: "Row" },
                { label: "N = 16", numeric: true },
                { label: "N = 32", numeric: true },
                { label: "N = 64", numeric: true },
                { label: "N = 128", numeric: true },
              ],
              rows: [
                ["iGPU default, c8", "58.1%", "78.8%", "96.2%", "100.0%"],
                ["CPU default, c2", "1.9%", "12.5%", "26.9%", "54.4%"],
                ["CPU default, c8", "7.2%", "38.1%", "56.2%", "71.2%"],
                ["iGPU f16 KV cache, c8", "9.7%", "20.0%", "25.6%", "51.2%"],
                ["CPU dynamic quantization off, c8", "2.2%", "10.0%", "11.9%", "21.2%"],
                ["CPU f32 KV cache and dynamic quantization off, c8", "0.0%", "0.0%", "0.0%", "0.0%"],
              ],
            }}
          />
        </div>
        <Source source={src("bitwise", "analysis/output/readme_stats.md", [140, 147])} />
      </div>

      <div className="prose">
        <h2>What this does not show</h2>
        <ul className="limits">
          <li>One engine, one 0.5B model with INT4 weights, one laptop and greedy decoding. It does not compare OpenVINO with other engines.</li>
          <li>40 short templated instructions that share their opening tokens. No code, long-context or multi-turn prompts.</li>
          <li>
            Output quality was not measured, so this says nothing about batched outputs being better or worse, and it
            does not identify which operation causes a change.
          </li>
          <li>&quot;Bitwise&quot; covers the tokens and the chosen token&apos;s logprob, not full logit vectors.</li>
          <li>Each load level is one burst of 40 requests on a virtual clock, not production traffic.</li>
          <li>
            Replay and repeat checks ran within one process. Across processes only batch-of-1 output was checked, and no
            other drivers or OpenVINO versions were tried.
          </li>
          <li>CPU thread count, core type and execution mode were not varied.</li>
          <li>Intervals are not adjusted for multiple comparisons, and option sets ran as separate blocks rather than interleaved in time.</li>
          <li>The iGPU and the CPU differ in hardware, activation precision and KV cache format at once.</li>
        </ul>

        <h2>How the statistics work</h2>
        <ul>
          <li>
            Per-row intervals are a bootstrap over prompts and trials, widened to the exact Clopper-Pearson interval so
            they never have zero width.
          </li>
          <li>
            Differences between engine settings at the same arrival rate apply the same resampled prompts and trials to
            both rows, because both rows ran the same prompts on the same arrival schedules. Differences across arrival
            rates, such as CPU c4 against c2, resample prompts jointly but trials independently for each row, because
            those rows share prompts but not arrival schedules. Paired intervals are not widened.
          </li>
          <li>
            The README maps every result to its source. Most come from the scorecards and CSV files that{" "}
            <code>bitwise/report.py</code> writes from the committed run records, plus statistics that{" "}
            <code>analysis/readme_stats.py</code> computes from the same records; the rest come from a separate precision
            probe, the model&apos;s tokenizer and model file, the sweep manifests and the simulator runs of{" "}
            <code>analysis/sim_seeds.py</code>. 186 tests run in CI on Linux and Windows.
          </li>
        </ul>
        <p>
          <Source
            prefix="Code"
            source={[src("bitwise", "bitwise/report.py"), src("bitwise", "analysis/readme_stats.py"), src("bitwise", "results/README.md")]}
          />
        </p>

        <h2>How it started</h2>
        <p>
          The project began as a simulator. Across 12 simulator seeds, each changing the synthetic model, its noise
          streams and the arrival schedules, the c8 and c32 rates averaged 31.8% and 32.0% with standard deviations near 15 points, and the seeds split on the direction of the difference
          between them (6 lower, 5 higher, 1 tied). A load trend that flips with the seed is not a finding, so the
          simulator stays in the repository as a pipeline test and the published results come from the real engine.
        </p>
        <p>
          <Source source={src("bitwise", "analysis/output/sim_seeds.md")} />
        </p>
      </div>
    </>
  );
}

const bitwise: CaseStudy = {
  slug: "bitwise-forensics",
  title: "bitwise-forensics",
  kicker: "LLM serving / reproducibility",
  deck:
    "Does a serving engine give the same greedy tokens for a prompt when other requests share its engine steps? A measurement on OpenVINO GenAI's continuous-batching pipeline, on the CPU and Arc iGPU of an Intel laptop chip.",
  description:
    "Measuring whether OpenVINO GenAI returns the same greedy tokens under continuous batching on an Intel CPU and Arc iGPU: 7,680 runs, replay controls and paired bootstrap intervals.",
  meta: ["Version 0.3.1, 15 Sep 2026", "Python, OpenVINO GenAI 2026.3", "186 tests, CI on Linux and Windows"],
  links: [
    { label: "Repository at v0.3.1", href: `${repoUrl("bitwise")}/tree/v0.3.1` },
    { label: "CPU scorecard", href: blob("bitwise", "results/openvino/cpu/scorecard.md") },
    { label: "iGPU scorecard", href: blob("bitwise", "results/openvino/gpu/scorecard.md") },
  ],
  Body,
};

export default bitwise;

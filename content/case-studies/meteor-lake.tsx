import { ChartFigure } from "@/components/charts/ChartFigure";
import { RowChart, type ChartRow, type Scale } from "@/components/charts/RowChart";
import { Source } from "@/components/Source";
import { REPOS, repoUrl, src } from "@/content/sources";
import type { CaseStudy } from "./types";

// Values from results/*.json at e5ecc43. Numbers that exist only in README
// prose (not in a data file) are deliberately not used here.

const LATENCY: Scale = { min: 0, max: 50, ticks: [0, 10, 20, 30, 40, 50], title: "ms" };
const BUDGET = 33.3;

const REGIMES = [
  { device: "Arc iGPU", stat: "median", flat: 11.3, live: 10.42 },
  { device: "Arc iGPU", stat: "p99", flat: 47.02, live: 13.31 },
  { device: "NPU", stat: "median", flat: 13.93, live: 18.04 },
  { device: "NPU", stat: "p99", flat: 17.98, live: 22.28 },
];

const regimeRows: ChartRow[] = REGIMES.map((r) => ({
  label: r.device,
  sub: r.stat,
  marks: [
    { type: "segment", from: r.flat, to: r.live },
    { type: "dot", value: r.flat, hollow: true },
    { type: "dot", value: r.live },
  ],
  value: `${r.flat.toFixed(1)} / ${r.live.toFixed(1)} ms`,
  tip: [`Flat-out benchmark: ${r.flat.toFixed(2)} ms`, `Live webcam loop: ${r.live.toFixed(2)} ms`],
}));

const STALLS = [
  { device: "Arc iGPU", precision: "FP32", stalls: 17, p99: 50.5, excl: 17.45, infer: 10.36 },
  { device: "Arc iGPU", precision: "FP16", stalls: 8, p99: 18.92, excl: 17.3, infer: 10.1 },
  { device: "Arc iGPU", precision: "INT8", stalls: 17, p99: 47.02, excl: 17.06, infer: 9.51 },
  { device: "Arc iGPU", precision: "INT8 full", stalls: 21, p99: 49.0, excl: 15.05, infer: 8.22 },
  { device: "NPU", precision: "FP32", stalls: 0, p99: 17.94, excl: 17.94, infer: 12.79 },
  { device: "NPU", precision: "FP16", stalls: 2, p99: 19.01, excl: 18.92, infer: 13.68 },
  { device: "NPU", precision: "INT8", stalls: 2, p99: 17.98, excl: 17.85, infer: 12.21 },
  { device: "NPU", precision: "INT8 full", stalls: 2, p99: 16.77, excl: 16.59, infer: 11.88 },
];

const stallRows: ChartRow[] = STALLS.map((s) => ({
  label: `${s.device} ${s.precision}`,
  sub: `${s.stalls} stall ${s.stalls === 1 ? "frame" : "frames"}`,
  marks: [
    { type: "segment", from: s.p99, to: s.excl },
    { type: "dot", value: s.p99, hollow: true },
    { type: "dot", value: s.excl },
  ],
  // Two decimals, as stall_analysis.json stores them; rounding those again to one
  // decimal can land on the wrong side of the underlying value.
  value: `${s.p99.toFixed(2)} / ${s.excl.toFixed(2)} ms`,
  tip: [
    `p99, all frames: ${s.p99.toFixed(2)} ms`,
    `p99 without stall frames: ${s.excl.toFixed(2)} ms`,
    `Inference-only p99: ${s.infer.toFixed(2)} ms`,
    `${s.stalls} of 1,000 frames stalled`,
  ],
}));

const ACCURACY = [
  { build: "FP16", on: "CPU", box: "0.3602", dBox: 0.0, mask: "0.3005", dMask: "+0.0001" },
  { build: "INT8, head in float", on: "CPU", box: "0.3587", dBox: 0.0015, mask: "0.2985", dMask: "−0.0019" },
  { build: "INT8, fully quantized", on: "CPU", box: "0.3213", dBox: 0.0389, mask: "0.2872", dMask: "−0.0132" },
  { build: "INT8, head in float", on: "Arc iGPU", box: "0.3578", dBox: 0.0024, mask: "0.2990", dMask: "−0.0014" },
  { build: "INT8, head in float", on: "NPU", box: "0.3579", dBox: 0.0023, mask: "0.2990", dMask: "−0.0014" },
];

const MAP_LOSS: Scale = { min: 0, max: 0.04, ticks: [0, 0.01, 0.02, 0.03, 0.04], decimals: 2, title: "box mAP lost" };

const accuracyRows: ChartRow[] = ACCURACY.map((a) => ({
  label: a.build,
  sub: `scored on ${a.on}`,
  marks: [{ type: "bar", to: a.dBox }],
  value: a.dBox.toFixed(4),
  tip: [`${a.dBox.toFixed(4)} box mAP50-95 lost against FP32`, `Box mAP50-95: ${a.box}`],
}));

function Body() {
  return (
    <>
      <section className="summary-box prose" aria-labelledby="short-version">
        <h2 id="short-version">The short version</h2>
        <ul>
          <li>
            On a live webcam loop, INT8 on the Arc iGPU ran a <strong>10.4 ms median and 13.3 ms p99</strong>, ahead of
            the NPU at 18.0 and 22.3 ms. It missed the 33.3 ms budget more often: 8 of 2,398 frames (0.33%) against 1 of
            1,891 (0.05%).
          </li>
          <li>
            In a flat-out benchmark the tails reversed: the iGPU&apos;s p99 was <strong>47.0 ms</strong> and the NPU&apos;s
            18.0 ms. Which one has the better tail depends on how busy the accelerator is kept.
          </li>
          <li>
            The iGPU&apos;s flat-out tail came from CPU-side stalls, not the model. Without the stall frames its INT8 p99
            is 17.1 ms, and inference alone was 9.5 ms at p99.
          </li>
          <li>
            Keeping the detection-head decode in float held the INT8 accuracy loss on the CPU to 0.0015 box mAP.
            Quantizing it too cost 0.0389.
          </li>
        </ul>
      </section>

      <div className="prose">
        <h2>Setup</h2>
        <p>
          The hardware is one laptop with an Intel Core Ultra 7 155H on mains power: the Intel AI Boost NPU, the Arc
          integrated GPU and the CPU, which share one package power budget. The software is OpenVINO 2026.3 and NNCF on
          Windows 11.
        </p>
        <p>
          The model is YOLOv8n-seg at a fixed 640 × 640 input, exported to OpenVINO in FP32 and FP16, plus two INT8
          builds made with NNCF post-training quantization on 300 COCO val2017 images. One keeps the detection-head
          decode in float and the other quantizes everything. Accuracy was measured on the other 4,700 images, so
          calibration and evaluation never overlap.
        </p>
        <p>
          In the benchmark, every configuration discarded 100 warm-up frames and then timed 1,000 frames one at a time,
          with a 45 s cooldown between runs. End-to-end latency means preprocess, inference and the host-side
          postprocess (NumPy decode with OpenCV NMS); capture and drawing are not timed.
        </p>
        <p>
          <Source
            prefix="Code"
            source={[
              src("edge", "run_all.py"),
              src("edge", "src/bench.py"),
              src("edge", "src/quantize.py"),
              src("edge", "src/prepare_data.py"),
              src("edge", "results/device_info.json"),
            ]}
          />
        </p>
        <p>
          For the live loop, INT8 on the iGPU and on the NPU ran against a real webcam for one 60 s session each. The
          loop does not wait for a new camera frame, so the iGPU processed 2,398 frames in its session, about 40 a
          second: busier than a strict 30 fps camera, and far from flat-out.
        </p>
        <p>
          <Source
            prefix="Live loop"
            source={[
              src("edge", "src/live_demo.py", [164, 172]),
              src("edge", "results/live_results.json", [42, 51]),
              src("edge", "README.md", [181, 181]),
            ]}
          />
        </p>

        <h2>Findings</h2>
        <h3>The benchmark and the camera reversed the p99 order</h3>
      </div>

      <ChartFigure
        title="Latency of INT8 on the iGPU and NPU, flat-out against live"
        description="Hollow dots are the flat-out benchmark (1,000 frames each); filled dots are the live webcam loop (2,398 iGPU frames, 1,891 NPU frames). The readout gives flat-out / live. The vertical line is the 33.3 ms frame budget."
        table={{
          rowHeaders: 2,
          columns: [
            { label: "Processor" },
            { label: "Regime" },
            { label: "Frames", numeric: true },
            { label: "Median (ms)", numeric: true },
            { label: "p99 (ms)", numeric: true },
            { label: "Frames over 33.3 ms", numeric: true },
          ],
          rows: [
            ["Arc iGPU", "Flat-out", "1,000", "11.30", "47.02", "1.6%"],
            ["Arc iGPU", "Live", "2,398", "10.42", "13.31", "0.33%"],
            ["NPU", "Flat-out", "1,000", "13.93", "17.98", "0.2%"],
            ["NPU", "Live", "1,891", "18.04", "22.28", "0.05%"],
          ],
        }}
        sources={[src("edge", "results/live_results.json", [5, 51])]}
      >
        <RowChart
          label="Median and p99 latency, flat-out benchmark against live webcam loop"
          rows={regimeRows}
          scale={LATENCY}
          threshold={BUDGET}
          legend={[
            { shape: "hollow", label: "Flat-out benchmark" },
            { shape: "dot", label: "Live webcam loop" },
            { shape: "threshold", label: "33.3 ms budget" },
          ]}
        />
      </ChartFigure>

      <div className="prose">
        <p>
          Flat-out, the iGPU had the better median but the worse tail of the two, and the NPU looked like the safe
          real-time choice. On the camera loop, where the iGPU spends much of each frame interval idle, its tail
          collapsed and it beat the NPU on both median and p99, although the NPU still missed the budget less often.
          The NPU got slower live, not faster. A study that reported only the benchmark would have described headroom,
          not this workload.
        </p>

        <h3>The iGPU tail was CPU-side stalls, not inference</h3>
      </div>

      <ChartFigure
        title="p99 latency with and without stall frames, flat-out benchmark"
        description="A stall is a frame whose CPU-side stages (preprocess plus postprocess) took more than 20 ms. Hollow dots include every frame; filled dots leave the stall frames out. The readout gives all frames / without stalls."
        table={{
          columns: [
            { label: "Configuration" },
            { label: "Stall frames (of 1,000)", numeric: true },
            { label: "p99, all frames (ms)", numeric: true },
            { label: "p99 without stalls (ms)", numeric: true },
            { label: "Inference-only p99 (ms)", numeric: true },
          ],
          rows: STALLS.map((s) => [
            `${s.device} ${s.precision}`,
            String(s.stalls),
            s.p99.toFixed(2),
            s.excl.toFixed(2),
            s.infer.toFixed(2),
          ]),
        }}
        sources={[src("edge", "results/stall_analysis.json", [56, 159]), src("edge", "src/analyze_stalls.py")]}
      >
        <RowChart
          label="p99 latency including and excluding stall frames, per accelerator configuration"
          rows={stallRows}
          scale={{ ...LATENCY, max: 55, ticks: [0, 10, 20, 30, 40, 50] }}
          threshold={BUDGET}
          legend={[
            { shape: "hollow", label: "All frames" },
            { shape: "dot", label: "Without stall frames" },
            { shape: "threshold", label: "33.3 ms budget" },
          ]}
        />
      </ChartFigure>

      <div className="prose">
        <p>
          Across its four builds the iGPU produced 63 stall frames in 4,000, the NPU 6 and the CPU 1. Take the stall
          frames out and three of the four iGPU tails fall from around 50 ms to 15 to 17.5 ms, while inference-only p99
          on the same runs stayed near 10 ms. Faster inference would not have fixed these frames.
        </p>
        <p>
          <Source prefix="Stall counts" source={src("edge", "results/stall_analysis.json", [161, 178])} />
        </p>
        <p>
          Why the iGPU runs stall is not isolated here. Display compositor contention, the shared package power budget
          and driver threads are all candidates, and separating them would need ETW tracing.
        </p>

        <h3>What INT8 cost</h3>
      </div>

      <ChartFigure
        title="Box mAP50-95 lost against FP32"
        description="COCO val2017, 4,700 images not used for calibration. The FP32 reference was scored on the CPU, so the iGPU and NPU rows combine a precision change with a device change."
        table={{
          rowHeaders: 2,
          columns: [
            { label: "Build" },
            { label: "Scored on" },
            { label: "Box mAP50-95", numeric: true },
            { label: "Box change vs FP32", numeric: true },
            { label: "Mask mAP50-95", numeric: true },
            { label: "Mask change vs FP32", numeric: true },
          ],
          rows: [
            ["FP32", "CPU", "0.3602", "reference", "0.3004", "reference"],
            ...ACCURACY.map((a) => [
              a.build,
              a.on,
              a.box,
              a.dBox === 0 ? "0.0000" : `−${a.dBox.toFixed(4)}`,
              a.mask,
              a.dMask,
            ]),
          ],
        }}
        sources={[src("edge", "results/accuracy.json")]}
      >
        <RowChart label="Box mAP lost against FP32 by build" rows={accuracyRows} scale={MAP_LOSS} />
      </ChartFigure>

      <div className="prose">
        <p>
          With the detection-head decode kept in float, INT8 cost 0.0015 box mAP on the CPU. Quantizing that decode as
          well cost 0.0389, about 26 times as much. What that bought in speed depended on the processor. On the NPU the
          fully quantized build&apos;s median was only 0.35 ms faster (13.58 against 13.93 ms). On the iGPU its median
          was 1.33 ms faster, but its flat-out p99 was worse (49.00 against 47.02 ms). On the CPU it cut the frames over
          budget from 46.3% to 4.8%. The same INT8 weights scored within 0.0009 of each other on the CPU, iGPU and NPU.
        </p>
        <p>
          <Source
            prefix="Latency by build"
            source={[
              src("edge", "results/summary_main.json", [50, 97]),
              src("edge", "results/summary_main.json", [146, 193]),
              src("edge", "results/summary_main.json", [242, 289]),
            ]}
          />
        </p>

        <h2>What this does not show</h2>
        <ul className="limits">
          <li>Power was not measured, so the efficiency argument for the NPU is not tested here.</li>
          <li>The stall mechanism is not attributed.</li>
          <li>One model and one input size, on one machine at room temperature and on mains power.</li>
          <li>
            Only the two INT8 configurations were run live, for one 60 s session each, in one lighting condition with
            one person in frame. A busier scene changes postprocess cost.
          </li>
        </ul>
        <p>
          <Source prefix="Limits stated in the repository" source={src("edge", "README.md", [166, 184])} />
        </p>
        <ul className="limits">
          <li>
            The live loop does not wait for new camera frames, so its duty cycle sits between a 30 fps camera and
            flat-out rather than matching either.
          </li>
          <li>
            The repository includes a script that checks the hand-written postprocess against the Ultralytics decoder,
            but its output is not committed, so no result from it is quoted here.
          </li>
        </ul>
        <p>
          <Source
            prefix="Added for this write-up"
            source={[src("edge", "src/live_demo.py"), src("edge", "src/verify_postprocess.py")]}
          />
        </p>
      </div>
    </>
  );
}

const meteorLake: CaseStudy = {
  slug: "meteor-lake-latency-lab",
  title: "Meteor Lake Latency Lab",
  kicker: "Edge inference / latency",
  deck:
    "Which processor on one laptop chip should run live instance segmentation inside a 33.3 ms frame budget? Flat-out, the Arc iGPU had the worse p99 of the two accelerators; on a live camera loop it had the better one.",
  description:
    "YOLOv8n-seg on the NPU, Arc iGPU and CPU of an Intel Core Ultra 7 155H with OpenVINO and NNCF INT8: latency tails, CPU-side stalls and what quantization cost.",
  meta: ["August 2026", "Python, OpenVINO 2026.3, NNCF", "12 benchmark configurations and 2 live runs"],
  links: [
    { label: "Repository", href: repoUrl("edge") },
    { label: "Results folder", href: `${repoUrl("edge")}/tree/${REPOS.edge.sha}/results` },
  ],
  Body,
};

export default meteorLake;

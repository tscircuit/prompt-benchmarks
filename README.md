# Prompt Benchmarks

[Docs](https://docs.tscircuit.com) &middot; [Website](https://tscircuit.com) &middot; [Twitter](https://x.com/tscircuit) &middot; [discord](https://tscircuit.com/community/join-redirect) &middot; [Quickstart](https://docs.tscircuit.com/quickstart) &middot; [Online Playground](https://tscircuit.com/playground)

This repo contains benchmarks for tscircuit system prompts used for
automatically generating tscircuit code.

## Running Benchmarks

You can use `bun run benchmark` to select and run a benchmark. A single prompt takes about 10s-15s to
run when run with `sonnet`. We have a set of samples (see the [tests/samples](./tests/samples) directory)
that the benchmarks run against. When you change a prompt, you must run the benchmark
for that prompt to update the benchmark snapshot. This is how we record degradation
or improvement in the response quality. Each sample is run 5 times and two tests
are run:

1. Does the output from the prompt compile?
2. Does the output produce the expected circuit?

The benchmark shows the percentage of samples that pass (1) and (2)

## Running the Benchmark Suite

To run the benchmark suite, follow these steps:

1. Ensure you have the necessary dependencies installed.
2. Run the benchmark suite using the following command:

```sh
bun run scripts/run-benchmarks.ts
```

This will execute the AI against the test suite defined in `benchmarks/problems.toml` and generate a report in `benchmarks/results.md`.

## Interpreting the Results

The results of the benchmark suite will be reported in `benchmarks/results.md`. Each problem will be listed along with the questions and the AI's responses. The score for each problem will indicate the accuracy of the AI's answers. A higher score means better accuracy.

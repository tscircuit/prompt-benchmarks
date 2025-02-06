# tscircuit Prompt Benchmarks

[Docs](https://docs.tscircuit.com) · [Website](https://tscircuit.com) · [Twitter](https://x.com/tscircuit) · [Discord](https://tscircuit.com/community/join-redirect) · [Quickstart](https://docs.tscircuit.com/quickstart) · [Online Playground](https://tscircuit.com/playground)

This repository contains benchmarks for evaluating and improving the quality of system prompts used to generate tscircuit code. It includes components for:

- **Code Runner** (in `lib/code-runner`): Safely transpiles, evaluates, and renders TSX code for circuit generation.
- **AI Integration** (in `lib/ai`): Interfaces with Anthropic’s Claude models for prompt completions and error correction.
- **Utility Modules** (in `lib/utils`): Provide logging, snapshot management, and type-checking of generated circuits.
- **Prompt Templates** (in `lib/prompt-templates`): Define various prompt structures for generating different circuit types.
- **Benchmarking & Scoring** (using evalite and custom scorers in `benchmarks/scorers`): Run multiple tests to ensure circuit validity and quality.


## Running Benchmarks

To run the benchmarks using evalite, use:
```bash
bun start
```
Each prompt is processed multiple times to test:
1. Whether the output compiles without errors.
2. Whether the output meets the expected circuit specifications.

After modifying prompts or system components, evalite reruns automatically, you should skip the benchmarks you don't want to run.

### Problem Sets

This project uses TOML files to define problem sets for circuit generation. Each problem is defined using a TOML array of tables with the following format:

```toml
[[problems]]
prompt = """
Your circuit prompt description goes here.
"""
title = "Sample Problem Title"
questions = [
  { text = "Question text", answer = true },
  { text = "Another question text", answer = false }
]
```

In each problem:
- The `prompt` field must contain the circuit description that instructs the AI.
- The `title` gives a short title for the problem.
- The `questions` array contains objects with a `text` property (the question) and an `answer` property (a boolean) used to validate the generated circuit.

To add a new problem set, create a new TOML file in the `problem-sets` directory following this format. Each new file can contain one or more problems defined with the `[[problems]]` header.

## Build, Test, and Start

- **Build**: `bun run build`
- **Test**: `bun run test`
- **Start**: `bun start`

## Benchmarks Directory

The benchmarks directory contains various files to help evaluate and score circuit‐generating prompts:

• benchmarks/prompt-logs/  
  These are text files (e.g., prompt-2025-02-05T14-07-18-242Z.txt, prompt-2025-02-05T14-10-53-144Z.txt, etc.) that log each prompt attempt and its output. They serve as a history of interactions.

• benchmarks/benchmark-local-circuit-error-correction.eval.ts  
  Runs local circuit evaluation with an error correction workflow. It repeatedly calls the AI (up to a set maximum) until the circuit output meets expectations, logging each attempt.

• benchmarks/benchmark-local-circuit.eval.ts  
  Evaluates a local circuit by running a specific user prompt and checking that the generated circuit compiles and meets expected behaviors.

• benchmarks/benchmark-local-circuit-random.eval.ts  
  Generates random prompts using an AI-powered prompt generator and evaluates their corresponding circuit outputs. This file is useful for stress-testing and assessing the robustness of circuit generation.

• benchmarks/scorers/ai-circuit-scorer.ts  
  Uses an AI model to assign a score (from 0 to 1) based on correctness, appropriate use of components, circuit complexity, and code quality.

• benchmarks/scorers/circuit-scorer.ts  
  A basic scorer that checks each generated circuit against predefined questions and answers from problem sets.

## License

MIT License

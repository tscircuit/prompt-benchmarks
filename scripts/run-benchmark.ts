import fs from 'fs';
import path from 'path';
import toml from 'toml';
import { anthropic } from '../lib/code-runner/anthropic';
import { safeEvaluateCode } from '../lib/code-runner/safe-evaluate-code';
import { askAboutOutput } from '../tests/fixtures/ask-about-output';
import { createCircuitBoard1Template } from '../prompt-templates/create-circuit-board1';

interface Problem {
  prompt: string;
  questions: { text: string; answer: boolean }[];
}

interface Result {
  prompt: string;
  questions: { text: string; expected: boolean; actual: boolean }[];
  score: number;
  evaluationError?: string;
}

const loadProblems = (filePath: string): Problem[] => {
  const tomlContent = fs.readFileSync(filePath, 'utf-8');
  const parsedToml = toml.parse(tomlContent);

  return parsedToml.problems.map((problem: any) => ({
    prompt: problem.prompt,
    questions: problem.questions.map((q: any) => ({
      text: q.text,
      answer: q.answer
    }))
  }));
};

const runAI = async (prompt: string): Promise<string> => {
  const fullPrompt = createCircuitBoard1Template({
    currentCode: "",
    availableImports: {}
  }) + "\n\n" + prompt;
  const completion = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: "You are an expert in electronic circuit design and tscircuit.",
    messages: [
      {
        role: 'user',
        content: fullPrompt,
      },
    ],
  });

  return (completion as any).content[0]?.text || '';
};

const gaugeAccuracy = async (problem: Problem): Promise<Result> => {
  const aiResponse = await runAI(problem.prompt);
  const codeMatch = aiResponse.match(/```tsx\s*([\s\S]*?)\s*```/);
  const code = codeMatch ? codeMatch[1].trim() : '';

  const evaluation = safeEvaluateCode(code, {
    outputType: 'board',
    preSuppliedImports: {},
  });

  if (!evaluation.success) {
    return {
      prompt: problem.prompt,
      questions: problem.questions.map(q => ({
        text: q.text,
        expected: q.answer,
        actual: false
      })),
      score: 0,
      evaluationError: evaluation.error
    };
  }

  const questionsResults = await Promise.all(
    problem.questions.map(async question => {
      const actual = await askAboutOutput(code, question.text);
      return { text: question.text, expected: question.answer, actual };
    })
  );

  const score = questionsResults.reduce(
    (acc, result) => acc + (result.expected === result.actual ? 1 : 0),
    0
  );

  return {
    prompt: problem.prompt,
    questions: questionsResults,
    score,
  };
};

const outputResults = (results: Result[], filePath: string) => {
  const markdown = results
    .map(
      result => `
## Problem
${result.prompt}
### Questions and Responses
${result.questions
          .map(
            question => `- ${question.text}
  - Expected: ${question.expected}
  - Actual: ${question.actual}`
          )
          .join('\n')}
### Score
${result.score}
`
    )
    .join('\n');

  fs.writeFileSync(filePath, markdown);
};

const main = async () => {
  const problems = loadProblems(path.join(__dirname, '../benchmarks/problems.toml'));
  const results = await Promise.all(problems.map(gaugeAccuracy));
  outputResults(results, path.join(__dirname, '../benchmarks/results.md'));
};

main().catch(console.error);

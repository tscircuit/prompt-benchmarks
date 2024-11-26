import fs from 'fs';
import path from 'path';
import { anthropic } from '../lib/code-runner/anthropic';
import { safeEvaluateCode } from '../lib/code-runner/safe-evaluate-code';
import { askAboutOutput } from '../tests/fixtures/ask-about-output';

interface Problem {
  prompt: string;
  questions: { text: string; answer: boolean }[];
}

interface Result {
  prompt: string;
  questions: { text: string; expected: boolean; actual: boolean }[];
  score: number;
}

const loadProblems = (filePath: string): Problem[] => {
  const toml = fs.readFileSync(filePath, 'utf-8');
  const problems = toml.split('[[problems]]').slice(1).map(problem => {
    const promptMatch = problem.match(/prompt = """([\s\S]*?)"""/);
    const questionsMatch = problem.match(/questions = \[([\s\S]*?)\]/);
    const prompt = promptMatch ? promptMatch[1].trim() : '';
    const questions = questionsMatch
      ? JSON.parse(`[${questionsMatch[1].trim()}]`)
      : [];
    return { prompt, questions };
  });
  return problems;
};

const runAI = async (prompt: string): Promise<string> => {
  const completion = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: prompt,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return (completion as any).content[0]?.text || '';
};

const gaugeAccuracy = async (problem: Problem): Promise<Result> => {
  const aiResponse = await runAI(problem.prompt);
  const codefence = aiResponse.match(/```([\s\S]*?)```/);
  const code = codefence ? codefence[1].trim() : '';

  const evaluation = safeEvaluateCode(code, {
    outputType: 'board',
    preSuppliedImports: {},
  });

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

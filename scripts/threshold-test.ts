import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

function runTest(directory: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("bun", ["test", directory], { stdio: "ignore" })
    child.on("close", (code) => {
      resolve(code === 0)
    })
  })
}

async function runTests(directory: string, times: number): Promise<number> {
  const testPromises = Array(times)
    .fill(null)
    .map(() => runTest(directory))
  const results = await Promise.all(testPromises)
  return results.filter(Boolean).length
}

function getAllTestFiles(directory: string): string[] {
  const testFiles: string[] = []

  function traverseDirectory(dir: string) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        traverseDirectory(fullPath)
      } else if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
        testFiles.push(fullPath)
      }
    }
  }

  traverseDirectory(directory)
  return testFiles
}

async function main() {
  const args = process.argv.slice(2)
  const directory = args[0]
  const times = parseInt(args[2], 10)
  const threshold = parseFloat(args[4])

  if (!directory || Number.isNaN(times) || Number.isNaN(threshold)) {
    console.error(
      "Usage: bun run scripts/threshold-test.ts <directory> --times <number> --threshold <number>",
    )
    process.exit(1)
  }

  const testFiles = getAllTestFiles(directory)
  console.log(`Found ${testFiles.length} test files in ${directory}`)

  console.time("Tests duration")
  const successCount = await runTests(directory, times)
  console.timeEnd("Tests duration")

  const successRate = successCount / times

  console.log(`Tests ran ${times} times`)
  console.log(`Success rate: ${(successRate * 100).toFixed(2)}%`)

  if (successRate >= threshold) {
    console.log("Threshold met!")
    process.exit(0)
  } else {
    console.error(
      `Threshold not met. Expected ${threshold * 100}%, got ${(successRate * 100).toFixed(2)}%`,
    )
    process.exit(1)
  }
}

main()

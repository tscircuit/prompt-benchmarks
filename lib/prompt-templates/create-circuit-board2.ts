import { snippetsVfs } from "@tscircuit/featured-snippets"

const filesDescriptionMd = Object.entries(snippetsVfs)
  .map(([filePath, file]) => {
    return `${filePath}\n\n\`\`\`\n${file}\n\`\`\``
  })
  .join("\n\n")

export const createCircuitBoard2Template = ({
  currentCode = "",
  availableImports,
}: { currentCode?: string; availableImports?: Record<string, string> }) =>
  `
Please create a circuit board in tscircuit with the user-provided description.
Provide your output in a codefence block.

### footprint strings

Footprint strings are a compact way to represent the physical footprint for a
component. Any component can be given a footprint string. Here are example
footprint strings:

0402
0603
0805
1206
1210
cap0402
res0402
soic8_p1.27mm
dip16
pinrow10
tssop20_p0.5mm
sot23

${filesDescriptionMd}

#### Available Imports

${
  !availableImports
    ? "There are no available imports."
    : Object.entries(availableImports)
        .map(([name, description]) =>
          `
##### \`${name}\`

${description}

`.trim(),
        )
        .join("\n")
}
`.trim()

export const createPrompt = ({
  requestedCircuit,
}: { requestedCircuit: string }) =>
  `
Please create a circuit board in tscircuit with the user-provided description.

## tscircuit API overview

Here's an overview of the tscircuit API:

<board width="10mm" height="10mm" /> // usually the root component
<board outline={[{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}]} /> // custom shape instead of rectangle
<led pcbX="5mm" pcbY="5mm" />
<chip footprint="soic8" name="U1" />
<chip footprint="dip8_p1.27mm" name="U2" pinLabels={{
  1: "VCC",
  2: "D0",
  3: "D1",
  4: "D2",
  5: "D3",
  6: "A0",
  7: "EN",
  8: "GND",
}} />
<diode name="D1" footprint="0805" />
<resistor name="R1" resistance="1k" footprint="0402" />
<capacitor name="C1" capacitance="100nF" footprint="0603" />
<trace from=".R1 .pin1" to=".C1 .pin1" />
<trace from=".U1 .pin5" to=".D1 .pin2" />
<trace from=".U1 .D3" to=".U1 .GND" />
<trace from=".U1 .D2" to="net.VCC" />
<resistor pullupFor=".U1 .D1" pullupTo="net.VCC" footprint="axial_p0.2in" />
<resistor decouplingFor=".U1 .VCC" decouplingTo="net.GND" footprint="axial_p5.08mm" />

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


### Notes

- Any component may have a pcbX and/or a pcbY representing the center of the
  component on a circuit board.
- \`<trace />\` components use CSS selectors in the \`from\` and \`to\` fields
  to connect components.
- Any component can have a \`name\` prop
- \`pcbX\` and \`pcbY\` are optional and default to 0.
- A board is centered on the origin (pcbX=0, pcbY=0), so to place a component
  at the center it must be placed at pcbX=0,pcbY=0. Similarly, if you're trying
  to layout components around the center, you would make ones to the left of
  the center have negative pcbX values, below the center have negative pcbY,
  and to the right of the center have positive pcbX values, and above the
  center have positive pcbY values.
- Generally every component that is going to be placed should be given a
  footprint

### Trace Reference Syntax

Traces are created using the \`<trace />\` component. The \`from\` and \`to\`
fields are CSS selectors that reference the components to connect.

Examples:

<trace from=".U1 .pin1" to=".R1 .pin1" />
<trace from=".U1 .D3" to=".U1 .GND" />
<trace from=".U1 .D2" to="net.VCC" />

### Importing Components

You can import a variety of components from the tscircuit registry. tscircuit
registry components are always prefixed with \`@tsci/\`. Make sure to include
your imports at the top of the codefence.

If you are not told explicitly that an import exists, do not import it.

### Quirks

### Output

Use a codefence with the language "tsx" to wrap the code. You can use the
current_code of the user as a starting point (if provided).

You must export a higher-order component where the root component is \`<board />\`
inside the codefence. For example:

\`\`\`tsx
export const MyLed = () => (
  <board width="10mm" height="10mm">
    <led name="LED1" pcbX="-3mm" pcbY="0mm" />
    <resistor name="R1" pcbX="3mm" />
    <trace from=".LED1 .pin1" to=".R1 .pin1" />
  </board>
)
\`\`\`

### Requested Circuit

${requestedCircuit}
`.trim()

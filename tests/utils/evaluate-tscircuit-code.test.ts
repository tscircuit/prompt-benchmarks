import { describe, it, expect } from "bun:test"
import { evaluateTscircuitCode } from "../../lib/utils/evaluate-tscircuit-code"

const validCircuit = `
export const StrainGaugeAmplifier = () => (
  <board width="50mm" height="40mm">
    <chip footprint="soic8" name="U1" pinLabels={{
      1: "V+",
      2: "V-",
      3: "Ref",
      4: "In+",
      5: "In-",
      6: "Out",
      7: "Gain",
      8: "GND",
    }} pcbX="10mm" pcbY="10mm" />

    <resistor name="R1" resistance="1k" footprint="0402" pcbX="12mm" pcbY="10mm" />
    <resistor name="R2" resistance="1k" footprint="0402" pcbX="10mm" pcbY="12mm" />
    <resistor name="R3" resistance="1k" footprint="0402" pcbX="10mm" pcbY="8mm" />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX="10mm" pcbY="14mm" />

    <trace from=".U1 > .pin4" to=".R1 > .pin1" />
    <trace from=".U1 > .pin5" to=".R2 > .pin1" />
    <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    <trace from=".U1 > .pin6" to=".R3 > .pin1" />
    <trace from=".R3 > .pin2" to=".U1 > .GND" />
    <trace from=".R3 > .pin2" to=".C1 > .pin1" />
    <trace from=".C1 > .pin2" to=".U1 > .pin3" />

    <net name="VCC" />
    <net name="GND" />
  </board>
)
`

const invalidCircuit = `
export const InvalidCircuit = () => (
  <board width="50mm" height="40mm">
    <invalidComponent />
  </board>
)
`

describe("evaluateTscircuitCode", () => {
  it("should successfully evaluate a valid circuit", async () => {
    const result = await evaluateTscircuitCode(validCircuit)
    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it("should fail to evaluate an invalid circuit", async () => {
    const result = await evaluateTscircuitCode(invalidCircuit)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

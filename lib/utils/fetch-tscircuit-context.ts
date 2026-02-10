/**
 * Utility to fetch TSCircuit AI documentation
 */

export async function fetchTSCircuitAIDocs(): Promise<string> {
  try {
    console.log("Fetching TSCircuit AI documentation from docs.tscircuit.com/ai.txt")
    
    const response = await fetch("https://docs.tscircuit.com/ai.txt", {
      headers: {
        'User-Agent': 'tscircuit-prompt-benchmarks'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const docs = await response.text()
    console.log(`Successfully fetched TSCircuit AI docs (${docs.length} characters)`)
    return docs
    
  } catch (error) {
    console.warn("Failed to fetch TSCircuit AI docs:", error)
    console.log("Continuing without TSCircuit AI context")
    return ""
  }
}

/**
 * Get the compiled js for a snippet
 */
export const pullSnippetCompiledJs = async (
  importName: string,
  opts: {
    registryApiUrl?: string
  } = {},
) => {
  opts.registryApiUrl ??= "https://registry-api.tscircuit.com"
  if (importName.startsWith("@tsci/")) {
    // @tsci/foo.bar -> foo/bar
    importName = importName.split("@tsci/")[1].replace(/\./, "/")
  }
  if (importName.startsWith("@")) {
    importName = importName.slice(1)
  }

  const [owner_name, unscoped_name] = importName.split("/")

  const { snippet } = await fetch(
    `${opts.registryApiUrl}/snippets/get?owner_name=${owner_name}&unscoped_name=${unscoped_name}`,
  ).then((res) => res.json())

  return snippet.compiled_js
}

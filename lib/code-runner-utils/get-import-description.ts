export const getImportDescription = async (
  importName: string,
  opts: {
    registryApiUrl?: string
  } = {},
) => {
  opts.registryApiUrl ??= "https://registry-api.tscircuit.com"

  // importName: @tsci/author.package-name
  // registryName: author/package-name

  const registryName = importName.replace("@tsci/", "").replace(/\./g, "/")

  const snippet = await fetch(
    `${opts.registryApiUrl}/snippets/get?name=${registryName}`,
  ).then((r) => r.json())

  console.log(snippet)
}

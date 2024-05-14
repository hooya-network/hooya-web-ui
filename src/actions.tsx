"use server";

import { WebProxyEndpoint } from "@/helpers";

export async function QuerySuggest(term: string, suggestions: 10) {
  const endpoint = WebProxyEndpoint()

  if (term == "") {
    // TODO popular tag query for init population
    return []
  }

  const res = await fetch(endpoint + `/suggest-tag/${term}`)// , { cache: 'no-store'} )
  if (!res.ok) {
    return []
  }

  const data: SuggestTagResponse = await res.json()

  return data
    .sort((a, b) => b.count - a.count)
    .map((s) => [s.namespace, s.descriptor].join(":"))
}

type SuggestTagResponse = {
  namespace: string,
  descriptor: string,
  count: number,
}[]

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

  const tagSuggestions = data
    .tag_suggestion
    .sort((a, b) => b.count - a.count)
    .map((s) => [s.namespace, s.descriptor].join(":"))

  const tagConstraints = data.tag_constraints
    .map((c) => [c.descriptor, c.namespace].join(":"))

  return tagSuggestions
    .map((s) => tagConstraints.length ? [tagConstraints?.join(","), s].join(",") : s)
}

type SuggestTagResponse = {
  tag_suggestion: {
    namespace: string,
    descriptor: string,
    count: number,
  }[]
  tag_constraints: {
    namespace: string,
    descriptor: string,
    negated: boolean,
  }[]
}

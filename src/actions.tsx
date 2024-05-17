"use server";

import { WebProxyEndpoint } from "@/helpers";

export async function QuerySuggest(term: string, suggestions: 10) {
  const endpoint = WebProxyEndpoint()
  if (!endpoint) {
    return []
  }

  let queryPath
  if (term.length > 0) {
    queryPath = `/suggest-tag/${term}`
  } else {
    queryPath = "/suggest-tag";
  }

  const res = await fetch(endpoint + queryPath)
  if (!res.ok) {
    return []
  }

  const data: SuggestTagResponse = await res.json()

  const tagSuggestions = data
    .tag_suggestion
    .sort((a, b) => b.count - a.count)
    .map((s) => [s.namespace, s.descriptor].join(":"))

  const tagConstraints = data.tag_constraints
    .map((c) => [c.namespace, c.descriptor].join(":"))

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

"use server";

import { WebProxyEndpoint } from "@/helpers";

export async function QuerySuggest(term: string, suggestions: 10) {
  const endpoint = WebProxyEndpoint()

  let queryPath
  if (term.length > 0) {
    queryPath = `/suggest-tag/${term}`
  } else {
    queryPath = "/suggest-tag";
  }

  const res = await fetch(endpoint + queryPath, { cache: 'no-store'})
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

export async function QueryAllTags(pageToken: string): Promise<AllTagsResponse | undefined> {
  const endpoint = WebProxyEndpoint()

  const res = await fetch(endpoint + `/all-tags/${pageToken}`, { cache: 'no-store'})
  if (!res.ok) {
    return
  }

  const data: AllTagsResponse = await res.json()
  return data
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

type AllTagsResponse = {
  tags: {
    namespace: string,
    descriptor: string,
    count: number,
  }[]
  next_page_token: string,
  final_page_token: string,
}

"use server";

export async function QuerySuggest(term: string, suggestions: 10) {
  return ["gallery:tokyo 23", "artist:wesl-ee", "general:tokyo", "general:tokyo skytree"]
}


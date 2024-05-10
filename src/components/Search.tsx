'use client';

import { QuerySuggest } from "@/actions";
import { useState } from "react";

export default function Search({page, initSuggest, terms}: {page: string, initSuggest: string[], terms?: string[]}) {

  let [searchSuggestions, setSearchSuggestions] = useState(initSuggest)
  let [activeQuery, setActiveQuery] = useState(terms?.join(","))

  async function handleSearchboxChange(inputTarget: EventTarget & HTMLInputElement) {
    const datalist = inputTarget.list

    // Return the initial suggestions suggestions
    if (inputTarget.value == "") {
      setSearchSuggestions(initSuggest)
      return
    }

    // otherwise, 10 suggestions based on current input
    const query = inputTarget.value
    const queryHint = await QuerySuggest(query, 10)
    setSearchSuggestions(queryHint)
  }

  return <>
      <form className="search"
        onSubmit={() => {
          const queryInput = document.getElementById("search-query") as HTMLInputElement
          if (queryInput?.value == "") {
            queryInput.disabled = true
          }
          if (queryInput?.value == "") {
            queryInput.disabled = true
          }
        }}
      >
      <input
        name="query"
        id="search-query"
        list="search-suggest"
        onChange={(e) => {
          setActiveQuery(e.target.value)
          handleSearchboxChange(e.target)
        }}
        placeholder={initSuggest[0] || "search by tags"}
        value={activeQuery}
      />
      <datalist id="search-suggest">
      { searchSuggestions.map((s) => <option key={s} value={s}>{s}</option>) }
      </datalist>


      </form>
  </>
}

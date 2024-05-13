'use client';

import { QuerySuggest } from "@/actions";
import { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete"
import { TextField } from "@mui/material";
import { useSearchParams } from 'next/navigation'
import React from "react";

export default function Search({page, initSuggest}: {page: string, initSuggest: string[]}) {
  const searchParams = useSearchParams()
  const terms = searchParams.get("query")?.split(",")

  let [searchSuggestions, setSearchSuggestions] = useState(initSuggest)
  let [activeQuery, setActiveQuery] = useState(terms?.join(",") || "")

  async function handleSearchboxChange(inputTarget: EventTarget & HTMLInputElement) {
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

  function validate(inputTarget: EventTarget & HTMLInputElement) {
    // Cleans query parameter from URL before submission if empty
    const queryInput = document.getElementById("search-query") as any
    if (queryInput?.value == "") {
      queryInput.disabled = true
    }
  }

  return <>
      <form className="search"
        id="search-form"
        onSubmit={() => {
          const queryInput = document.getElementById("search-query") as any
          validate(queryInput)
        }}
      >
      <div className="search-bar">
        <Autocomplete
          id="search-query"
          filterOptions={(x) => x}
          options={searchSuggestions}
          disableClearable={true}
          inputValue={activeQuery}
          onClose={(e) => {
            const t = e.target as EventTarget & HTMLInputElement

            // HACK <input> isn't filled out by onClose?
            const queryInput = document.getElementById("search-query") as EventTarget & HTMLInputElement;
            const intendedQuery = t.value || t.textContent as string;

            // Don't search onClose if nothing's changed
            if ((terms?.join(",") || "") == intendedQuery) {
              return
            }

            queryInput.value = intendedQuery;

            // Just onSubmit again :)
            validate(queryInput);
            (document.getElementById("search-form") as HTMLFormElement).submit()
          }}
          onInputChange={(e, val) => {
            setActiveQuery(val)
            const t = e.target as EventTarget & HTMLInputElement
            handleSearchboxChange(t)
          }}
          renderInput={(p) => <TextField {...p} label="Search by tags" name="query" />}
          freeSolo={true}
        />
        <input type="submit" value="Go!"/>
      </div>
      </form>
  </>
}

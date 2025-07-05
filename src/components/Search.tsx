'use client';

import { getSuggestedTags } from "@/lib/hooya-api-client";
import { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete"
import { TextField } from "@mui/material";
import { useSearchParams } from 'next/navigation'
import React from "react";

export default function Search({initSuggest}: {initSuggest: string[]}) {
  const searchParams = useSearchParams()
  const terms = searchParams.get("query")?.split(",")

  let [searchSuggestions, setSearchSuggestions] = useState(initSuggest)
  let [activeQuery, setActiveQuery] = useState(terms?.join(",") || "")

  async function handleSearchboxChange(inputTarget: EventTarget & HTMLInputElement) {
    // Return the initial suggestions suggestions

    // otherwise, 10 suggestions based on current input
    const queryHint = await getSuggestedTags(inputTarget.value)
    setSearchSuggestions(queryHint.slice(0, 10))
  }

  function validate() {
    // Cleans query parameter from URL before submission if empty
    const queryInput = document.getElementById("search-query") as HTMLInputElement
    if (queryInput?.value == "") {
      queryInput.disabled = true
    }
  }

  return <>
      <form className="search"
        id="search-form"
        onSubmit={() => {
          const queryInput = document.getElementById("search-query") as HTMLInputElement
          validate(queryInput)
        }}
      >
      <div className="search-bar">
        <Autocomplete
          id="search-query"
          filterOptions={(x) => x}
          sx={{ width: "80%" }}
          options={searchSuggestions}
          disableClearable={true}
          inputValue={activeQuery}
          onClose={() => {
            // Eh, not a fan of this anymore. But kinda neat

            // const t = e.target as EventTarget & HTMLInputElement

            // // HACK <input> isn't filled out by onClose?
            // const queryInput = document.getElementById("search-query") as EventTarget & HTMLInputElement;
            // const intendedQuery = t.value || t.textContent as string;

            // // Don't search onClose if nothing's changed
            // if ((terms?.join(",") || "") == intendedQuery) {
            //   return
            // }

            // queryInput.value = intendedQuery;

            // // Just onSubmit again :)
            // validate(queryInput);
            // (document.getElementById("search-form") as HTMLFormElement).submit()
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

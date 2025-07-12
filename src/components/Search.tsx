'use client';

import { getSuggestedTags } from '@/lib/hooya-api-client';
import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { TextField } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import React from 'react';

export default function Search({ initSuggest }: { initSuggest: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const terms = searchParams?.get('query')?.split(',');

  let [searchSuggestions, setSearchSuggestions] = useState(initSuggest);

  // clean up duplicates from URL parameters
  const cleanTerms = terms
    ? Array.from(new Set(terms.filter((term) => term.trim())))
    : [];
  let [activeQuery, setActiveQuery] = useState(cleanTerms.join(',') || '');

  async function handleSearchboxChange(
    inputTarget: EventTarget & HTMLInputElement
  ) {
    // Return the initial suggestions suggestions

    // otherwise, 10 suggestions based on current input
    const queryHint = await getSuggestedTags(inputTarget.value);
    console.log(activeQuery);
    setSearchSuggestions(queryHint.slice(0, 10));
  }

  function validate() {
    if (typeof document === 'undefined') return;

    // Cleans query parameter from URL before submission if empty
    const queryInput = document.getElementById(
      'search-query'
    ) as HTMLInputElement;
    if (activeQuery == '') {
      queryInput.disabled = true;
    } else {
      // always use React state, not DOM input value
      queryInput.value = activeQuery;
      queryInput.disabled = false;
    }
  }

  return (
    <>
      <form
        className="search"
        id="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          // const queryInput = document.getElementById(
          //   'search-query'
          // ) as HTMLInputElement;
          validate();

          if (typeof window === 'undefined') return;

          // manually construct the URL with the correct query
          const url = new URL(window.location.href);
          if (activeQuery.trim()) {
            // ensure no duplicates in the final query
            const cleanQuery = Array.from(
              new Set(activeQuery.split(',').filter((term) => term.trim()))
            ).join(',');
            url.searchParams.set('query', cleanQuery);
            url.searchParams.delete('page'); // first page always
          } else {
            url.searchParams.delete('query');
          }

          router.push(url.pathname + url.search);
        }}
      >
        <div className="search-bar">
          <Autocomplete
            id="search-query"
            filterOptions={(x) => x}
            sx={{ width: '80%' }}
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
            onChange={(e, newValue) => {
              if (newValue) {
                // newValue is just the selected suggestion, need to combine with existing constraints
                const lastCommaIndex = activeQuery.lastIndexOf(',');

                if (lastCommaIndex === -1) {
                  // no existing constraints, just set the selected value
                  setActiveQuery(newValue);
                } else {
                  // preserve existing constraints and append the new selection
                  const existingConstraints = activeQuery.substring(
                    0,
                    lastCommaIndex + 1
                  );
                  const newQuery = existingConstraints + newValue;
                  setActiveQuery(newQuery);
                }
                // clear suggestions after selection to prevent enter from auto-selecting
                setSearchSuggestions([]);
              }
            }}
            onInputChange={(e, val, reason) => {
              // don't override when user selects from autocomplete
              if (reason !== 'reset') {
                setActiveQuery(val);
                if (!!e) {
                  const t = e.target as EventTarget & HTMLInputElement;
                  handleSearchboxChange(t);
                }
              }
            }}
            renderInput={(p) => (
              <TextField {...p} label="Search by tags" name="query" />
            )}
            freeSolo={true}
          />
          <input type="submit" value="Go!" />
        </div>
      </form>
    </>
  );
}

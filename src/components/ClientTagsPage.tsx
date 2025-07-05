'use client';

import { useEffect, useState } from "react";
import { getAllTags } from "@/lib/hooya-api-client";
import TagBlock from "@/components/TagBlock";

export default function ClientTagsPage() {
  const [tags, setTags] = useState<{namespace:string,descriptor:string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllTags() {
      setLoading(true);
      
      try {
        const allTags = new Array<{namespace:string,descriptor:string}>();
        let nextPageToken = "1";

        while (nextPageToken !== "") {
          const tagsResp = await getAllTags(nextPageToken);
          
          if (!tagsResp) {
            nextPageToken = "";
            break;
          }

          const t = tagsResp.tags;
          nextPageToken = tagsResp.next_page_token;
          
          allTags.push(...t.map((t: {namespace: string, descriptor: string}) => ({
            namespace: t.namespace,
            descriptor: t.descriptor,
          })));
        }

        setTags(allTags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllTags();
  }, []);

  if (loading) {
    return (
      <main>
        <h2>All Tags</h2>
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main>
      <h2>All Tags</h2>
      <TagBlock tags={tags}/>
    </main>
  );
}
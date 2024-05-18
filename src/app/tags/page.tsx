import { QueryAllTags } from "@/actions";
import TagBlock from "@/components/TagBlock";

export default async function Page() {
  let tags = new Array<{namespace:string,descriptor:string}>()
  let nextPageToken = "1"

  while (nextPageToken != "") {
    await QueryAllTags(nextPageToken)
      .then((tagsResp) => {
        if (!tagsResp) {
          nextPageToken = ""
          return
        }
        const t = tagsResp.tags
        nextPageToken = tagsResp.next_page_token
        tags.push(...t
          .map((t) => {
            return {
              namespace: t.namespace,
              descriptor: t.descriptor,
            }
          }))
      })
    }

  return (
    <main>
      <h2>All Tags</h2>
        <TagBlock tags={tags}/>
    </main>
  )
}

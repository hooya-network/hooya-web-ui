import { QuerySuggest } from "@/actions";
import TagBlock from "@/components/TagBlock";

export default async function Page() {
  const tags = await QuerySuggest("", 10)
  return (
    <main>
      <h2>All Tags</h2>
        { tags.length > 0 &&
        <>
          <TagBlock tags={tags.map((t) => {
            // Meh. just a WIP
            const [namespace, descriptor] = t.split(':', 2)
            return { namespace, descriptor }
          })}/>
        </>
        }
    </main>
  )
}

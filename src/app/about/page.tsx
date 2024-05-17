export default function Page() {
  return <main>
    <h2>What is HooYa?</h2>
    <p>HooYa! is an IPFS-like network for sharing and downloading files tagged with rich semantic metadata. This is one node on the network. Network participants provide a <a href="https://en.wikipedia.org/wiki/Folksonomy">folksonomy</a> of descriptive, searchable tags and metadata for the set of all files across the network. For those familiar with image boorus, consider this a P2P booru.</p>
    <p>This is a frontend to a private network, offering a demo of the software. HooYa! is not ready for a public deployment, nor is it in a state where it&rsquo;s reliable for daily use. This software is in alpha.</p>
    <h2>What are Tags?</h2>
    <p>Indexed data is given semantic tags when it is imported onto the node, either by the operator or by an automatic process the operator has configured. Tags are searchable and are of the form <code>key:value</code> where <code>key</code> is typically a namespace like “artist”, “copyright”, “general”. This makes it easy to find any indexed data having an association with a tag.</p>
    <p>Tag-based systems are at odds with hierarchical systems like those on your computer, where data is stored at certain paths.</p>
    <p>You can see a list of all tags known to this node <a href="/tags">here.</a></p>
    <h2>How Does Searching Work?</h2>
    <p>Searching is done from the home page. All data indexed on the node is public by default. Searches include one or more tags separated by a comma (“,”). This is in contrast to Danbooru whose frontend search uses spaces to separate terms. This means tags on HooYa! may contain whitespace characters, just not commas.</p>
    <p>Here are some example searches.</p>
    <ul>
    <li><a href="/?query=artist%3Awesl-ee">artist:wesl-ee</a> — data tagged with the <code>artist:wesl-ee</code> tag</li>
    <li><a href="/?query=artist%3Awesl-ee%2Cgeneral%3Arip-it">artist:wesl-ee,general:rip-it</a> — data tagged with <em>both</em> the <code>artist:wesl-ee</code> and <code>general:rip-it</code> tags</li>
    </ul>
    <table>
    </table>
  </main>
}

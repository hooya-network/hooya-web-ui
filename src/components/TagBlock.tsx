type TagBlockProps = {
  tags: {namespace: String, descriptor: String}[],
};

const TagBlock = ({ tags }: TagBlockProps) => {
  let organizizedTags = new Map<String, String[]>()
  tags.forEach((t) => {
    let descriptors = organizizedTags.get(t.namespace)
    descriptors?.push(t.descriptor)

    organizizedTags.set(t.namespace, descriptors || [t.descriptor])
  })

  return (
  <div className="tag-block">
    {Array.from(organizizedTags).map(([namespace, descriptors]) => (
      <>
      <div className={`tag-namespace-${namespace}`}>
        <h3>{namespace}</h3>
        {descriptors.map((descriptor) => (
          <span key="{descriptor}" className="tag-descriptor">?{descriptor}</span>
        ))}
      </div>
      </>
    ))}
  </div>
  )
}

export default TagBlock

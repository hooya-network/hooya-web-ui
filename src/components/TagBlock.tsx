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
        <h3>{namespace.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h3>
        <div className={`tag-namespace-${namespace}`}>
          {descriptors.map((descriptor) => (
            <span key="{descriptor}" className="tag-descriptor">?&nbsp;{descriptor}</span>
          ))}
        </div>
      </>
    ))}
  </div>
  )
}

export default TagBlock

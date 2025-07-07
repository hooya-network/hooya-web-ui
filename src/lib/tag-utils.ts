export interface Tag {
  namespace: string;
  descriptor: string;
}

export function organizeTagsByNamespace(tags: Tag[]): Map<string, string[]> {
  const organizedTags = new Map<string, string[]>();

  tags.forEach((tag) => {
    const descriptors = organizedTags.get(tag.namespace);
    if (descriptors) {
      descriptors.push(tag.descriptor);
    } else {
      organizedTags.set(tag.namespace, [tag.descriptor]);
    }
  });

  return organizedTags;
}

export function capitalizeNamespace(namespace: string): string {
  return namespace.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
import { apiCall } from './hooya-web-client';

export function getWebProxyUrl() {
  return process.env.NEXT_PUBLIC_HOOYA_WEB_PROXY_URL || 'http://localhost:8532';
}

// search and file queries
export async function searchFiles(terms: string[], tags: string[], mimeTypes: string[], page: string = "1") {
  const endpoint = getWebProxyUrl();

  const query = terms.join(",");
  const response = await apiCall(`${endpoint}/search-files/${query}/${page}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to search files: ${response.statusText}`);
  }

  return await response.json();
}

export async function getRecentFiles(page: string = "1") {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/all-files/${page}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to get recent files: ${response.statusText}`);
  }

  return await response.json();
}

export async function getCidInfo(cid: string) {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/cid-info/${cid}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to get CID info: ${response.statusText}`);
  }

  return await response.json();
}

export async function getCidTags(cid: string) {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/cid-tags/${cid}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to get CID tags: ${response.statusText}`);
  }

  return await response.json();
}

// tag operations
export async function getSuggestedTags(term?: string) {
  const endpoint = getWebProxyUrl();

  let queryPath = "/suggest-tag";
  if (term) {
    queryPath = `/suggest-tag/${term}`;
  }

  const response = await apiCall(`${endpoint}${queryPath}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.tag_suggestion?.sort((a: {count: number}, b: {count: number}) => b.count - a.count)
    .map((tag: {namespace: string, descriptor: string}) => 
      tag.namespace ? `${tag.namespace}:${tag.descriptor}` : tag.descriptor
    ) || [];
}

export async function getAllTags(page: string = "1") {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/all-tags/${page}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to get tags: ${response.statusText}`);
  }

  return await response.json();
}

export async function tagCid(cid: string, tags: {namespace: string, descriptor: string}[]) {
  const endpoint = getWebProxyUrl();

  const formData = new URLSearchParams();
  tags.forEach((tag, index) => {
    formData.append(`tags[${index}][namespace]`, tag.namespace);
    formData.append(`tags[${index}][descriptor]`, tag.descriptor);
  });

  const response = await apiCall(`${endpoint}/tag-cid/${cid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });

  if (!response.ok) {
    throw new Error(`Failed to tag CID: ${response.statusText}`);
  }

  return response.status === 201;
}

// authentication
export async function loginUser(password: string) {
  const endpoint = getWebProxyUrl();

  const formData = new URLSearchParams();
  formData.append('password', password);

  const response = await fetch(`${endpoint}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const jwt = await response.text();

  // store token in localStorage
  localStorage.setItem('jwt', jwt);

  return { token: jwt, success: true };
}

// url construction helpers
export function buildCidContentUrl(cid: string) {
  return `${getWebProxyUrl()}/cid-content/${cid}`;
}

export function buildCidThumbnailUrl(cid: string, size?: string) {
  const baseUrl = `${getWebProxyUrl()}/cid-thumbnail/${cid}`;
  return size ? `${baseUrl}/${size}` : baseUrl;
}

export function buildCidProcessingUrl(cid: string) {
  return `${getWebProxyUrl()}/cid-processing/${cid}`;
}
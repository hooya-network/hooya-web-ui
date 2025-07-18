'use client';

import { apiCall } from './hooya-web-client';
import { setRefreshToken } from '../utils/auth';

export function getWebProxyUrl() {
  return (
    window?.__ENV__?.NEXT_PUBLIC_HOOYA_WEB_PROXY_URL ||
    process?.env?.NEXT_PUBLIC_HOOYA_WEB_PROXY_URL ||
    'http://localhost:8532'
  );
}

// search and file queries
export async function searchFiles(
  terms: string[],
  tags: string[],
  mimeTypes: string[],
  page: string = '1'
) {
  const endpoint = getWebProxyUrl();

  const query = terms.join(',');
  const response = await apiCall(`${endpoint}/search-files/${query}/${page}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`failed to search files: ${response.statusText}`);
  }

  return await response.json();
}

export async function getRecentFiles(page: string = '1') {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/all-files/${page}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`failed to get recent files: ${response.statusText}`);
  }

  return await response.json();
}

export async function getCidInfo(cid: string) {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/cid-info/${cid}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`failed to get CID info: ${response.statusText}`);
  }

  return await response.json();
}

export async function getCidTags(cid: string) {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/cid-tags/${cid}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`failed to get CID tags: ${response.statusText}`);
  }

  return await response.json();
}

// tag operations
export async function getSuggestedTags(term?: string) {
  const endpoint = getWebProxyUrl();

  let queryPath = '/suggest-tag';
  if (term) {
    queryPath = `/suggest-tag/${term}`;
  }

  const response = await apiCall(`${endpoint}${queryPath}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (
    data.tag_suggestion
      ?.sort((a: { count: number }, b: { count: number }) => b.count - a.count)
      .map((tag: { namespace: string; descriptor: string }) =>
        tag.namespace ? `${tag.namespace}:${tag.descriptor}` : tag.descriptor
      ) || []
  );
}

export async function getAllTags(page: string = '1') {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/all-tags/${page}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`failed to get tags: ${response.statusText}`);
  }

  return await response.json();
}

export async function tagCid(
  cid: string,
  tags: { namespace: string; descriptor: string }[]
) {
  const endpoint = getWebProxyUrl();

  const body = tags
    .map(
      (tag, index) =>
        `tags[${encodeURIComponent(index)}][namespace]=${encodeURIComponent(tag.namespace)}` +
        `&tags[${encodeURIComponent(index)}][descriptor]=${encodeURIComponent(tag.descriptor)}`
    )
    .join('&');

  console.log(body);
  const response = await apiCall(`${endpoint}/tag-cid/${cid}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`failed to tag CID: ${response.statusText}`);
  }

  return response.status === 201;
}

export async function untagCid(
  cid: string,
  tags: { namespace: string; descriptor: string }[]
) {
  const endpoint = getWebProxyUrl();

  const body = tags
    .map(
      (tag, index) =>
        `tags[${encodeURIComponent(index)}][namespace]=${encodeURIComponent(tag.namespace)}` +
        `&tags[${encodeURIComponent(index)}][descriptor]=${encodeURIComponent(tag.descriptor)}`
    )
    .join('&');

  const response = await apiCall(`${endpoint}/tag-cid/${cid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`failed to untag CID: ${response.statusText}`);
  }

  return response.status === 204;
}

export async function forgetFile(cid: string) {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/forget-file/${cid}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`failed to forget file: ${response.statusText}`);
  }

  return response.status === 204;
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
    body: formData.toString(),
    credentials: 'include', // Include cookies in the request
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const loginResponse = await response.json();

  // store refresh token in localStorage
  setRefreshToken(loginResponse.refresh_token);

  return { success: true };
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

export async function sendChatMessage(channel: string, content: string) {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, content }),
  });

  if (!response.ok) {
    throw new Error(`failed to send chat message: ${response.statusText}`);
  }

  return await response.json();
}

export async function getChatChannels() {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/api/chat/channels`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`failed to get chat channels: ${response.statusText}`);
  }

  return await response.json();
}

export async function getChatHistory(channel: string, pageToken: string = '0') {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(
    `${endpoint}/api/chat/history/${encodeURIComponent(channel)}/${encodeURIComponent(pageToken)}`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`failed to get chat history: ${response.statusText}`);
  }

  return await response.json();
}

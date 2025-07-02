"use server";

import { WebProxyEndpoint } from "@/helpers";

export async function QuerySuggest(term: string, suggestions: 10) {
  const endpoint = WebProxyEndpoint()

  let queryPath
  if (term.length > 0) {
    queryPath = `/suggest-tag/${term}`
  } else {
    queryPath = "/suggest-tag";
  }

  const res = await fetch(endpoint + queryPath, { cache: 'no-store'})
  if (!res.ok) {
    return []
  }

  const data: SuggestTagResponse = await res.json()

  const tagSuggestions = data
    .tag_suggestion
    .sort((a, b) => b.count - a.count)
    .map((s) => [s.namespace, s.descriptor].join(":"))

  const tagConstraints = data.tag_constraints
    .map((c) => [c.namespace, c.descriptor].join(":"))

  return tagSuggestions
    .map((s) => tagConstraints.length ? [tagConstraints?.join(","), s].join(",") : s)
}

export async function QueryAllTags(pageToken: string): Promise<AllTagsResponse | undefined> {
  const endpoint = WebProxyEndpoint()

  const res = await fetch(endpoint + `/all-tags/${pageToken}`, { cache: 'no-store'})
  if (!res.ok) {
    return
  }

  const data: AllTagsResponse = await res.json()
  return data
}

export async function login(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Password is required" };
  }

  const endpoint = WebProxyEndpoint();

  try {
    const response = await fetch(`${endpoint}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `password=${encodeURIComponent(password)}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: errorText || "Login failed" };
    }

    const jwt = await response.text();
    return { success: true, jwt };
  } catch (error) {
    return { error: "Network error" };
  }
}

type SuggestTagResponse = {
  tag_suggestion: {
    namespace: string,
    descriptor: string,
    count: number,
  }[]
  tag_constraints: {
    namespace: string,
    descriptor: string,
    negated: boolean,
  }[]
}

type AllTagsResponse = {
  tags: {
    namespace: string,
    descriptor: string,
    count: number,
  }[]
  next_page_token: string,
  final_page_token: string,
}

export async function startUploadSession(size: number, mimetype: string, chunkSize: number, jwt: string) {
  const endpoint = WebProxyEndpoint()

  const response = await fetch(`${endpoint}/start-upload`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    body: JSON.stringify({
      size,
      mimetype,
      chunk_size: chunkSize
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to start upload session: ${response.statusText}`)
  }

  const data: StartUploadSessionResponse = await response.json()
  return data
}

export async function uploadChunk(uploadId: string, chunkIndex: number, base64Data: string, jwt: string) {
  const endpoint = WebProxyEndpoint()

  // Convert base64 back to binary data
  const binaryString = atob(base64Data)
  const uint8Array = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }

  const response = await fetch(`${endpoint}/upload-chunk/${uploadId}/${chunkIndex}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${jwt}`
    },
    body: uint8Array
  })

  if (!response.ok) {
    throw new Error(`Failed to upload chunk: ${response.statusText}`)
  }

  const data: UploadChunkResponse = await response.json()
  return data
}

export async function completeUpload(uploadId: string, jwt: string) {
  const endpoint = WebProxyEndpoint()

  console.log('Calling complete upload for:', uploadId)
  
  const response = await fetch(`${endpoint}/complete-upload/${uploadId}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    }
  })

  console.log('Complete upload response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.log('Complete upload error:', errorText)
    throw new Error(`Failed to complete upload: ${response.statusText} - ${errorText}`)
  }

  const data: CompleteUploadResponse = await response.json()
  console.log('Complete upload result:', data)
  return data
}

type StartUploadSessionResponse = {
  upload_id: string
  chunk_size: number
}

type UploadChunkResponse = {
  status: number
  bytes_received: number
  next_chunk_index: number
  error_message?: string
}

type CompleteUploadResponse = {
  cid: string
  file: {
    cid: string
    size: number
    mimetype: string
  }
}

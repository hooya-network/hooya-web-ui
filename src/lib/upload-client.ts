import { apiCall } from './hooya-web-client';
import { getWebProxyUrl } from '@/lib/hooya-api-client';

export async function startUploadSession(
  size: number,
  mimetype: string,
  chunkSize: number
) {
  const endpoint = getWebProxyUrl();

  const response = await apiCall(`${endpoint}/start-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      size,
      mimetype,
      chunk_size: chunkSize,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start upload session: ${response.statusText}`);
  }

  const data: StartUploadSessionResponse = await response.json();
  return data;
}

export async function uploadChunk(
  uploadId: string,
  chunkIndex: number,
  base64Data: string
) {
  const endpoint = getWebProxyUrl();

  // convert base64 back to binary data
  const binaryString = atob(base64Data);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  const response = await apiCall(
    `${endpoint}/upload-chunk/${uploadId}/${chunkIndex}`,
    {
      method: 'PUT',
      body: uint8Array,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload chunk: ${response.statusText}`);
  }

  const data: UploadChunkResponse = await response.json();
  return data;
}

export async function completeUpload(
  uploadId: string,
  tags?: { namespace: string; descriptor: string }[]
) {
  const endpoint = getWebProxyUrl();

  const requestBody = {
    tags: tags || [],
  };

  const response = await apiCall(`${endpoint}/complete-upload/${uploadId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to complete upload: ${response.statusText} - ${errorText}`
    );
  }

  const data: CompleteUploadResponse = await response.json();
  return data;
}

type StartUploadSessionResponse = {
  upload_id: string;
  chunk_size: number;
};

type UploadChunkResponse = {
  status: number;
  bytes_received: number;
  next_chunk_index: number;
  error_message?: string;
};

type CompleteUploadResponse = {
  cid: string;
  file: {
    cid: string;
    size: number;
    mimetype: string;
  };
};

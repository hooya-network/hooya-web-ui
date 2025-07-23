export type Thumbnail = {
  width: number;
  height: number;
  mimetype: string;
  aspect_ratio: number;
  cid: string;
  source_cid: string;
};

export type FileType = {
  cid: string;
  size: BigInt;
  mimetype: string;
  processing_status?: number;
  ext_file: {
    height: BigInt;
    width: BigInt;
    aspect_ratio: number;
    // colors: []
    thumbnails: Thumbnail[];
  };
  tags?: { namespace: string; descriptor: string }[];
  signature?: string;
};

export type UploadChunkResponse = {
  status: 'UPLOAD_IN_PROGRESS' | 'UPLOAD_COMPLETE' | 'UPLOAD_ERROR';
  error_message?: string;
  bytes_received: number;
  next_chunk_index: number;
};

export type UploadStatusResponse = {
  status: 'UPLOAD_IN_PROGRESS' | 'UPLOAD_COMPLETE' | 'UPLOAD_ERROR';
  bytes_received: number;
  expected_size: number;
  next_chunk_index: number;
  error_message?: string;
};

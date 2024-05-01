type Thumbnail = {
  width: number
  height: number
  mimetype: string,
  aspect_ratio: number,
  cid: string,
  source_cid: string,
}

type FileType = {
  cid: string,
  size: BigInt,
  mimetype: string,
  ext_file: {
    height: BigInt,
    width: BigInt,
    aspect_ratio: number,
    // colors: []
    thumbnails: Thumbnail[],
  },
}

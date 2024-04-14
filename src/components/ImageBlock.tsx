import Image from 'next/image'
import { ConstructCIDThumbnailURL } from '@/helpers'
import Link from 'next/link'

type ImageBlockProps = {
  cid: string,
};

const ImageBlock = ({ cid }: ImageBlockProps) => {
  return <Link className="img-href" href={`/cid/${cid}`}>
    <img src={ConstructCIDThumbnailURL(cid, "small")} alt="" />
  </Link>
}

export default ImageBlock

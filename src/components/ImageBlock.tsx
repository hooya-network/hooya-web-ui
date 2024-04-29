import { ConstructCIDThumbnailURL } from '@/helpers'
import Link from 'next/link'

type ImageBlockProps = {
  cid: string,
  size: string,
  href: string,
};

const ImageBlock = ({ cid, size, href }: ImageBlockProps) => {
  return <Link className="img-href" href={href}>
    <img src={ConstructCIDThumbnailURL(cid, size)} alt="" />
  </Link>
}

export default ImageBlock

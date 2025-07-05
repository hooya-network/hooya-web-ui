import { ConstructCIDThumbnailURL } from '@/helpers'
import Link from 'next/link'
import Image from 'next/image'

type ImageBlockProps = {
  cid: string,
  size: string,
  href: string,
};

const ImageBlock = ({ cid, size, href }: ImageBlockProps) => {
  return <Link className="img-href" href={href}>
    <Image 
      src={ConstructCIDThumbnailURL(cid, size)} 
      alt="" 
      width={200}
      height={200}
      style={{ objectFit: 'cover' }}
    />
  </Link>
}

export default ImageBlock

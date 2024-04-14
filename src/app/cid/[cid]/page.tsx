import React from 'react';
import TagBlock from '@/components/TagBlock';
import DeepHeader from '@/components/DeepHeader';
import { ConstructCIDThumbnailURL, ConstructCIDContentURL, QueryCidInfo, QueryCidTags } from '@/helpers';
import Link from 'next/link';

export default async function Page({params}: {params: { cid: string}}) {
  const cid = params.cid;

  const cidInfo = await QueryCidInfo(cid)
  const size = cidInfo.size
  const mimetype = cidInfo.mimetype

  // Use largest thumbnail here
  const thumbnails = cidInfo.ext_file.thumbnails
  const thumbnailInfo = thumbnails[thumbnails.length - 1]
  const [thumbnailHeight, thumbnailWidth] = [thumbnailInfo.height, thumbnailInfo.width]

  const thumbnailUrl = ConstructCIDThumbnailURL(cid, "medium");
  const contentUrl = ConstructCIDContentURL(cid);

  const tags: {namespace: String, descriptor: String}[] = await QueryCidTags(cid)

  return (
    <>
    <div>
      <div>
        <ul className="emdash-flat-list">
          <li key="original"><Link href={contentUrl}>Original File ({sizeToHumanReadable(size)})</Link></li>
          <li key="mimetype">{mimetype}</li>
        </ul>
        <Link className="img-href" href={contentUrl}>
          <img height={thumbnailHeight} width={thumbnailWidth} className="cid-detail-thumbnail" src={thumbnailUrl} alt=""/>
        </Link>
        { tags.length > 0 &&
        <>
          <TagBlock tags={tags}/>
        </>
        }
      </div>
    </div>
    </>
  );
};

function sizeToHumanReadable(n: number) {
  if(n < 1024) return `${n} Bytes`;
  else if(n < 1048576) return `${(n / 1024).toFixed(2)} KiB`;
  else if(n < 1073741824) return `${(n / 1048576).toFixed(2)} MiB`;
  return `${(n / 1073741824).toFixed(2)} GiB`;
}


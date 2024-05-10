import React from 'react';
import TagBlock from '@/components/TagBlock';
import Thumbnail from '@/types';
import DeepHeader from '@/components/DeepHeader';
import { ConstructCIDThumbnailURL, ConstructCIDContentURL, QueryCidInfo, QueryCidTags } from '@/helpers';
import Link from 'next/link';

export default async function Page({params}: {params: { cid: string}}) {
  const cid = params.cid;

  const cidInfo = await QueryCidInfo(cid)

  const size = cidInfo.size
  const mimetype = cidInfo.mimetype
  const extFile = cidInfo.ext_file

  // Use largest thumbnail here
  const thumbnails: Thumbnail[] = cidInfo?.ext_file?.thumbnails
  const thumbnail = thumbnails?.[1] || thumbnails?.[0]

  // More accomodating layout for images wider than a 4:3 ratio
  const thumbOrientation = thumbnail?.aspect_ratio < (4/3) ? "portrait" : "landscape"

  const contentUrl = await ConstructCIDContentURL(cid)

  let thumbnailElem =
      <img
        height={500}
        width={500}
        className="cid-detail-thumbnail"
        src="/no-thumb.gif"
        alt="No thumbnail provided"/>

  if (thumbnail?.mimetype?.startsWith("image")) {
    thumbnailElem =
    <Link href={contentUrl}>
    <img
        height={thumbnail.height}
        width={thumbnail.width}
        className="cid-detail-thumbnail"
        src={await ConstructCIDThumbnailURL(thumbnail.source_cid, "medium")}
        alt=""/>
    </Link>
  } else if (thumbnail?.mimetype?.startsWith("video")) {
    thumbnailElem = <video controls autoPlay loop muted
        height={thumbnail.height}
        width={thumbnail.width}
        className="cid-detail-thumbnail">
        <source
          src={await ConstructCIDThumbnailURL(thumbnail.source_cid, "medium")}
          type={thumbnail.mimetype}
        />
        </video>
  }

  const tags: {namespace: String, descriptor: String}[] = await QueryCidTags(cid)

  return (
    <main>
      <ul className="emdash-flat-list" id="download-file">
        <li key="original"><Link href={contentUrl}>Download File ({sizeToHumanReadable(size)})</Link></li>
        <li key="mimetype">{mimetype}</li>
      </ul>
      <div id="cid-view" className={`orientation-${thumbOrientation}`}>
        <div><h3>Preview</h3>{thumbnailElem}</div>
        <div>
          { tags.length > 0 &&
          <>
            <TagBlock tags={tags}/>
          </>
          }
          <h3>File Info</h3>
          <dl className="file-info flat-list">
            {dlHintEntry("CID", cid)}
            {dlHintEntry("Mimetype", mimetype)}
            {extFile && extFile.height && extFile.width &&
              dlHintEntry("Dimensions", `${extFile.height}x${extFile.width} ${extFile.height * extFile.width > 100000 ? `(${(extFile.height * extFile.width / 1000000).toFixed(1)} MPixels)` : ""}`)}
            {dlHintEntry("Size", sizeToHumanReadable(size))}
          </dl>
          <h3>Net Info</h3>
          <dl className="file-info flat-list">
          {dlHintEntry("Uploader", "0xC262a…a048")}
          {dlHintEntry("Owner", "0xC262a…a048")}
          {dlHintEntry("Date", "6 hours ago")}
          {dlHintEntry("Favorites", "0")}
          {dlHintEntry("Duplication", "1 peer")}
          {dlHintEntry("Rating", "Safe")}
          </dl>
        </div>
      </div>
    </main>
  );
};

function dlHintEntry(key: string, value: string): React.ReactNode {
    return (
        <>
          <dt>?&nbsp;{key}</dt>&nbsp;
          <dd>{value}</dd><br/>
        </>
      );
}

function sizeToHumanReadable(n: number): string {
    if(n < 1024) return `${n} Bytes`;
    else if(n < 1048576) return `${(n / 1024).toFixed(2)} KiB`;
    else if(n < 1073741824) return `${(n / 1048576).toFixed(2)} MiB`;
    return `${(n / 1073741824).toFixed(2)} GiB`;
}


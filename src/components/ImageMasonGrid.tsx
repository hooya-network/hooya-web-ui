"use client";

import { ConstructCIDThumbnailURL } from '@/helpers'
import Image from "next/image"
import ImageBlock from '@/components/ImageBlock'

type ImageMasonGridProps = {
    imageBlocks: JSX.Element[];
};

const ImageMasonGrid = ({ imageBlocks }: ImageMasonGridProps) => {
    return ( <>
      {imageBlocks?.length ?
      <div className="mason-grid">
        {imageBlocks}
      </div>
      : <p>No results.</p> }
    </>
    );
};

export default ImageMasonGrid;

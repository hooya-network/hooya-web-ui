"use client";

import { ConstructCIDThumbnailURL } from '@/helpers'
import Image from "next/image"
import ImageBlock from '@/components/ImageBlock'

type ImageMasonGridProps = {
    imageBlocks: JSX.Element[];
};

const ImageMasonGrid = ({ imageBlocks }: ImageMasonGridProps) => {
    return (
      <div className="mason-grid">
      {imageBlocks?.length && imageBlocks}
      </div>
    );
};

export default ImageMasonGrid;

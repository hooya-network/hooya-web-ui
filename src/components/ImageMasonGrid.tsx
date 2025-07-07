'use client';

type ImageMasonGridProps = {
  imageBlocks: JSX.Element[];
};

const ImageMasonGrid = ({ imageBlocks }: ImageMasonGridProps) => {
  return (
    <>
      {imageBlocks?.length ? (
        <div className="mason-grid">{imageBlocks}</div>
      ) : (
        <p>No results.</p>
      )}
    </>
  );
};

export default ImageMasonGrid;

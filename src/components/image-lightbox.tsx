
'use client';

import { X } from 'lucide-react';
import Image from 'next/image';

export function ImageLightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full h-full max-w-4xl max-h-[80svh]">
        <Image
          src={imageUrl}
          alt="Enlarged bird"
          fill
          className="object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-colors"
        aria-label="Close image viewer"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  );
}

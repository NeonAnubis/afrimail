'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, AlertCircle, Camera } from 'lucide-react';

interface CachedImage {
  url: string;
  title: string;
  explanation: string;
  date: string;
  photographer: string;
  expiresAt: number;
}

const CACHE_KEY = 'potd_cached_image';

const FALLBACK_IMAGES = [
  {
    url: 'https://images.pexels.com/photos/2887414/pexels-photo-2887414.jpeg',
    title: 'Sunrise Over the Horizon',
    explanation: 'A breathtaking sunrise painting the sky in vibrant hues of orange and gold, marking the beginning of a new day filled with endless possibilities.',
    photographer: 'Pexels - Tim Gouw'
  },
  {
    url: 'https://images.pexels.com/photos/1834399/pexels-photo-1834399.jpeg',
    title: 'African Savanna Sunset',
    explanation: 'The golden hour on the African savanna, where wildlife and nature come together in perfect harmony under the setting sun.',
    photographer: 'Pexels - Francesco Ungaro'
  },
  {
    url: 'https://images.pexels.com/photos/2363347/pexels-photo-2363347.jpeg',
    title: 'Continental Dawn',
    explanation: 'Dawn breaks across the continent, illuminating vast landscapes and awakening the spirit of a new beginning.',
    photographer: 'Pexels - Pixabay'
  }
];

const getMidnightTimestamp = (): number => {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime();
};

const getCachedImage = (): CachedImage | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedImage = JSON.parse(cached);
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

const setCachedImage = (imageData: CachedImage): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(imageData));
  } catch (error) {
    console.error('Failed to cache image:', error);
  }
};

export const PictureOfTheDay: React.FC = () => {
  const [imageData, setImageData] = useState<CachedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadImage = async () => {
      const cached = getCachedImage();

      if (cached) {
        setImageData(cached);
        setIsLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const imageIndex = dayOfYear % FALLBACK_IMAGES.length;
        const selectedImage = FALLBACK_IMAGES[imageIndex];

        const newImageData: CachedImage = {
          url: selectedImage.url,
          title: selectedImage.title,
          explanation: selectedImage.explanation,
          date: today,
          photographer: selectedImage.photographer,
          expiresAt: getMidnightTimestamp(),
        };

        setCachedImage(newImageData);
        setImageData(newImageData);
      } catch (err) {
        setError('Unable to load image');
        console.error('Error loading image:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, []);

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Loading today&apos;s inspiration...</p>
        </div>
      </div>
    );
  }

  if (error || !imageData) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 flex items-center justify-center p-8">
        <div className="text-center text-white max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-semibold mb-2">Unable to Load Image</h3>
          <p className="text-gray-300">
            We&apos;re having trouble loading today&apos;s picture. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden group">
      <div
        className={`absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 transition-opacity duration-300 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />

      <Image
        src={imageData.url}
        alt={imageData.title}
        fill
        className={`object-cover transition-all duration-700 ${
          imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          console.error('Failed to load image:', imageData.url);

          if (retryCount < FALLBACK_IMAGES.length - 1) {
            const nextIndex = (retryCount + 1) % FALLBACK_IMAGES.length;
            const nextImage = FALLBACK_IMAGES[nextIndex];

            const today = new Date().toISOString().split('T')[0];
            const newImageData: CachedImage = {
              url: nextImage.url,
              title: nextImage.title,
              explanation: nextImage.explanation,
              date: today,
              photographer: nextImage.photographer,
              expiresAt: getMidnightTimestamp(),
            };

            setImageData(newImageData);
            setRetryCount(retryCount + 1);
            setImageLoaded(false);
          } else {
            setError('Unable to load image');
          }
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-8 text-white transform transition-transform duration-300 group-hover:translate-y-0 translate-y-2">
        <div className="flex items-center gap-2 text-sm mb-3 opacity-90">
          <Calendar className="w-4 h-4" />
          <span>{new Date(imageData.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>

        <h2 className="text-3xl font-bold mb-3 leading-tight">
          {imageData.title}
        </h2>

        <p className="text-base leading-relaxed text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-2xl mb-3">
          {imageData.explanation}
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Camera className="w-4 h-4" />
          <span className="font-medium">Photographer: {imageData.photographer}</span>
        </div>
      </div>

      <div className="absolute top-8 left-8">
        <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
          <p className="text-white font-semibold text-sm tracking-wide">
            PICTURE OF THE DAY
          </p>
        </div>
      </div>
    </div>
  );
};

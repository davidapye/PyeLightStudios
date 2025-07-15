import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { useSwipeable } from 'react-swipeable';

const GalleryPage = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zipAvailable, setZipAvailable] = useState(false);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const docRef = doc(db, 'galleries', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const galleryData = docSnap.data();
          setGallery(galleryData);

          const savedPassword = localStorage.getItem(`gallery-password-${slug}`);
          if (!galleryData.password || savedPassword === galleryData.password) {
            setAuthorized(true);
          }
        } else {
          setGallery(null);
        }
      } catch (error) {
        console.error('Error fetching gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [slug]);

  useEffect(() => {
    const checkZip = async () => {
      try {
        const zipRef = storageRef(storage, `zips/${slug}.zip`);
        await getDownloadURL(zipRef);
        setZipAvailable(true);
      } catch {
        setZipAvailable(false);
      }
    };

    if (gallery) checkZip();
  }, [gallery, slug]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!gallery?.password || gallery.password === enteredPassword) {
      localStorage.setItem(`gallery-password-${slug}`, enteredPassword);
      setAuthorized(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex !== null) {
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % gallery.photos.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + gallery.photos.length) % gallery.photos.length);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    }
  }, [lightboxIndex, gallery]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () =>
      setLightboxIndex((prev) => (prev + 1) % gallery.photos.length),
    onSwipedRight: () =>
      setLightboxIndex((prev) => (prev - 1 + gallery.photos.length) % gallery.photos.length),
    onSwipedDown: () => setLightboxIndex(null),
    trackMouse: true,
  });

  const downloadAllPhotos = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      const zipRef = storageRef(storage, `zips/${gallery.slug}.zip`);
      const url = await getDownloadURL(zipRef);
      window.location.href = url;
    } catch (err) {
      console.error('ZIP not found or error:', err);
      alert('Download not available. ZIP file not found for this gallery.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <p className="text-center p-8">Loading gallery...</p>;
  if (!gallery) return <p className="text-center p-8">Gallery not found.</p>;

  if (gallery.password && !authorized) {
    return (
      <div className="max-w-sm mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Enter Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Password"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View Gallery
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{gallery.title}</h1>

      {zipAvailable && (
        <div className="mb-4">
          <button
            onClick={downloadAllPhotos}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isDownloading}
          >
            {isDownloading ? 'Checking for ZIP...' : 'Download All Photos (.zip)'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {gallery.photos?.map((url, index) => (
          <div key={index} className="overflow-hidden rounded shadow">
            <img
              loading="lazy"
              src={url}
              alt={`Gallery Image ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer opacity-0 animate-fade-in"
              onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
              onClick={() => setLightboxIndex(index)}
            />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setLightboxIndex(null)}
          {...swipeHandlers}
        >
          <div
            className="relative max-w-7xl w-full max-h-[90vh] flex justify-center items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={gallery.photos[lightboxIndex]}
              alt="Full view"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 text-white text-xl"
            >
              ✕
            </button>
            <a
              href={gallery.photos[lightboxIndex]}
              download
              className="absolute bottom-4 right-4 bg-white text-black px-3 py-1 rounded shadow hover:bg-gray-200"
            >
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;

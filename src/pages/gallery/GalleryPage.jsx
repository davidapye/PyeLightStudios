import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Thumbnails, Zoom, Download } from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const GalleryPage = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [zipAvailable, setZipAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [index, setIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [hiddenThumbs, setHiddenThumbs] = useState({});
  const [hiddenSlides, setHiddenSlides] = useState({});

  // Detect mobile safely after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  // Fetch gallery data
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const docRef = doc(db, "galleries", slug);
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
        console.error("Error fetching gallery:", error);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    fetchGallery();
  }, [slug]);

  // Check for ZIP file
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

    // 🧹 Clean up Safari memory when closing lightbox
    useEffect(() => {
      // Only clean up after closing the lightbox
      if (index === -1 && typeof window !== "undefined" && "indexedDB" in window) {
        const safeIdleCallback =
          window.requestIdleCallback ||
          function (fn) {
            return setTimeout(fn, 200);
          };

        safeIdleCallback(() => {
          try {
            indexedDB.deleteDatabase("firebaseLocalCache");
          } catch (e) {
            console.warn("IndexedDB cleanup skipped:", e);
          }
        });
      }
    }, [index]);


  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!gallery?.password || gallery.password === enteredPassword) {
      localStorage.setItem(`gallery-password-${slug}`, enteredPassword);
      setAuthorized(true);
    } else {
      alert("Incorrect password");
    }
  };

  const downloadAllPhotos = async () => {
    setIsDownloading(true);
    try {
      const zipRef = storageRef(storage, `zips/${gallery.slug}.zip`);
      const url = await getDownloadURL(zipRef);
      window.location.href = url;
    } catch (err) {
      console.error("ZIP not found or error:", err);
      alert("Download not available. ZIP file not found for this gallery.");
    } finally {
      setIsDownloading(false);
    }
  };

  const makeWebpThumb = (url) => {
    const thumbsUrl = url.replace("/images/", "/thumbs/");
    return thumbsUrl.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  };

  const makeFallbackThumb = (url) => url.replace("/images/", "/thumbs/");

  // 🔥 Mobile memory optimization:
  // - Limit slides on mobile
  // - Use low-res thumbnails to prevent Safari memory crash
  const photoList = gallery?.photos ?? [];
  const limitedPhotos = isMobile ? photoList.slice(0, 40) : photoList;

  const slides = useMemo(
    () =>
      limitedPhotos
        .map((url, i) => ({
          src: url,
          thumbnail: makeWebpThumb(url),
          fallbackThumbnail: makeFallbackThumb(url),
          alt: `Gallery image ${i + 1}`,
          originalIndex: i,
        }))
        .filter((slide) => !hiddenSlides[slide.originalIndex]),
    [limitedPhotos, hiddenSlides],
  );

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
            {isDownloading ? "Preparing ZIP..." : "Download All Photos (.zip)"}
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {slides.map((slide, i) => {
          if (hiddenThumbs[slide.originalIndex]) return null;

          return (
            <img
              key={slide.originalIndex}
              src={slide.thumbnail}
              alt=""
              className="rounded shadow cursor-pointer w-full h-full object-cover transition-transform hover:scale-105"
              loading="lazy"
              decoding="async"
              onClick={() => setIndex(i)}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackTried === "1") {
                  setHiddenThumbs((prev) => ({ ...prev, [slide.originalIndex]: true }));
                  setHiddenSlides((prev) => ({ ...prev, [slide.originalIndex]: true }));
                  return;
                }
                img.dataset.fallbackTried = "1";
                img.src = slide.fallbackThumbnail;
              }}
            />
          );
        })}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Thumbnails, Zoom, Download]}
        animation={{ fade: 250 }}
        carousel={{ finite: false, preload: 1 }} // 🚀 reduce memory footprint
        thumbnails={{
          position: "bottom",
          showThumbnails: true,
          width: isMobile ? 80 : 120,
          height: isMobile ? 60 : 80,
          borderRadius: 6,
        }}
        zoom={{ maxZoomPixelRatio: 2 }}
        render={{
          slide: ({ slide }) => (
            <img
              src={slide.src}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={() => {
                setHiddenSlides((prev) => ({ ...prev, [slide.originalIndex]: true }));
                setHiddenThumbs((prev) => ({ ...prev, [slide.originalIndex]: true }));
                setIndex((current) => {
                  if (slides.length <= 1) return -1;
                  return Math.min(current, slides.length - 2);
                });
              }}
            />
          ),
        }}
      />
    </div>
  );
};

export default GalleryPage;

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { db, storage } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Thumbnails, Zoom, Download } from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./GalleryPage.css";

const EMPTY_PHOTOS = [];

const getFileName = (url) => {
  try {
    const pathname = new URL(url).pathname;
    const objectMarker = "/o/";
    const objectStart = pathname.indexOf(objectMarker);
    const objectPath = objectStart >= 0
      ? pathname.slice(objectStart + objectMarker.length)
      : pathname;
    return decodeURIComponent(objectPath.split("/").pop()) || "photo";
  } catch {
    return "photo";
  }
};

const makeAttachmentUrl = (url, filename) => {
  const downloadUrl = new URL(url);
  downloadUrl.searchParams.set(
    "response-content-disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  return downloadUrl.toString();
};

const triggerBrowserDownload = (url, filename) => {
  const link = document.createElement("a");
  // Firebase Storage is cross-origin, so Content-Disposition (set on the URL)
  // tells mobile browsers to download instead of trying to render the file.
  link.href = makeAttachmentUrl(url, filename);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const ProgressiveGalleryImage = ({ slide, downloadState }) => {
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(slide.src);
  const [imageFailed, setImageFailed] = useState(false);
  const hasDistinctThumbnail = slide.thumbnail !== slide.src;
  const imageStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  const handleFullImageLoad = (event) => {
    const image = event.currentTarget;
    if (typeof image.decode === "function") {
      image.decode().catch(() => {}).finally(() => setFullImageLoaded(true));
    } else {
      setFullImageLoaded(true);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {hasDistinctThumbnail && (
        <img
          src={slide.thumbnail}
          alt=""
          aria-hidden="true"
          className="gallery-lightbox-image"
          loading="eager"
          decoding="async"
        />
      )}
      {(slide.pendingPreview || (hasDistinctThumbnail && !fullImageLoaded)) && !imageFailed && (
        <div className="gallery-lightbox-loading" role="status">
          {slide.pendingPreview ? "Preparing photo preview…" : "Loading full-resolution photo…"}
        </div>
      )}
      <img
        src={imageSrc}
        alt={slide.alt}
        className="gallery-lightbox-image"
        style={{ ...imageStyle, opacity: hasDistinctThumbnail ? (fullImageLoaded ? 1 : 0) : 1, transition: "opacity 220ms ease-out" }}
        loading="eager"
        decoding="async"
        onLoad={(event) => { setImageFailed(false); handleFullImageLoad(event); }}
        onError={() => {
          if (imageSrc !== slide.original) {
            setImageSrc(slide.original);
            setFullImageLoaded(false);
          } else {
            setImageFailed(true);
          }
        }}
      />
      {imageFailed && <div className="gallery-lightbox-loading" role="alert">This photo couldn’t load. Please try again.</div>}
      {downloadState && (
        <div className="gallery-photo-download-status" role={downloadState.error ? "alert" : "status"} aria-live="polite">
          <span>{downloadState.error || `Sent ${downloadState.filename} to your browser`}</span>
          {!downloadState.error && (
            <span>Check your browser’s downloads</span>
          )}
        </div>
      )}
    </div>
  );
};

const GalleryPage = () => {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [zipAvailable, setZipAvailable] = useState(false);
  const [zipDownloadUrl, setZipDownloadUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [photoDownload, setPhotoDownload] = useState(null);
  const [index, setIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const [hiddenThumbs, setHiddenThumbs] = useState({});
  const [hiddenSlides, setHiddenSlides] = useState({});
  const [thumbLoaded, setThumbLoaded] = useState({});
  const [thumbnailUrls, setThumbnailUrls] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [renditionReady, setRenditionReady] = useState({});
  const [page, setPage] = useState(1);
  const PHOTOS_PER_PAGE = 30;

  // Detect mobile safely after mount
  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Fetch gallery data
  useEffect(() => {
    let cancelled = false;
    let loadingTimer;
    setLoading(true);
    setGallery(null);
    setAuthorized(false);
    setEnteredPassword("");
    setPasswordError("");
    setThumbnailUrls({});
    setPreviewUrls({});
    setRenditionReady({});

    const fetchGallery = async () => {
      try {
        const docRef = doc(db, "galleries", slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const galleryData = docSnap.data();
          if (cancelled) return;
          setGallery(galleryData);

          const savedPassword = localStorage.getItem(`gallery-password-${slug}`);
          if (!galleryData.password || savedPassword === galleryData.password) {
            setAuthorized(true);
          }
        } else {
          if (!cancelled) setGallery(null);
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        loadingTimer = setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, 220);
      }
    };

    fetchGallery();
    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [slug]);

  // Check for ZIP file
  useEffect(() => {
    const checkZip = async () => {
      try {
        const zipRef = storageRef(storage, `zips/${slug}.zip`);
        const url = await getDownloadURL(zipRef);
        setZipDownloadUrl(url);
        setZipAvailable(true);
      } catch {
        setZipDownloadUrl(null);
        setZipAvailable(false);
      }
    };
    if (gallery) checkZip();
  }, [gallery, slug]);

  // Resolve display renditions from uploaded Firebase object paths.
  // Download URLs have encoded `/o/...` paths and cannot be rewritten with a
  // string replacement while preserving the thumbnail's separate token.
  useEffect(() => {
    if (!gallery?.photos?.length) return undefined;
    let cancelled = false;

    const resolvePhotoRenditions = async (originalUrl, originalIndex) => {
      let thumbnail = originalUrl;
      let preview = originalUrl;
        try {
          const pathname = new URL(originalUrl).pathname;
          const objectMarker = '/o/';
          const objectStart = pathname.indexOf(objectMarker);
          if (objectStart >= 0) {
            const objectPath = decodeURIComponent(pathname.slice(objectStart + objectMarker.length));
            const fileName = objectPath.split('/').pop();
            const baseName = fileName.replace(/\.[^.]+$/, '');
            [thumbnail, preview] = await Promise.all([
              getDownloadURL(storageRef(storage, `thumbs/${slug}/${baseName}.webp`)).catch(() => originalUrl),
              getDownloadURL(storageRef(storage, `previews/${slug}/${baseName}.webp`)).catch(() => originalUrl),
            ]);
          }
        } catch {
          // Older galleries may not have generated display renditions.
        }

      if (cancelled) return;
      setThumbnailUrls((previous) => ({ ...previous, [originalIndex]: thumbnail }));
      setPreviewUrls((previous) => ({ ...previous, [originalIndex]: preview }));
      setRenditionReady((previous) => ({ ...previous, [originalIndex]: true }));
    };

    gallery.photos.forEach((originalUrl, originalIndex) => resolvePhotoRenditions(originalUrl, originalIndex));
    return () => { cancelled = true; };
  }, [gallery, slug]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!gallery?.password || gallery.password === enteredPassword) {
      localStorage.setItem(`gallery-password-${slug}`, enteredPassword);
      setAuthorized(true);
      setPasswordError("");
    } else {
      setPasswordError("That password didn’t match. Please try again.");
    }
  };

  useEffect(() => {
    setPage(1);
    setIndex(-1);
    setHiddenThumbs({});
    setHiddenSlides({});
    setThumbLoaded({});
  }, [slug, isMobile]);

  const downloadAllPhotos = () => {
    if (!zipDownloadUrl || !gallery?.slug) return;
    setIsDownloading(true);
    try {
      triggerBrowserDownload(zipDownloadUrl, `${gallery.slug}-photos.zip`);
    } catch (error) {
      console.error("Could not start ZIP download:", error);
      alert("Could not download the ZIP. Please try again or contact your photographer.");
    } finally {
      window.setTimeout(() => setIsDownloading(false), 1800);
    }
  };

  const downloadPhoto = ({ slide }) => {
    const url = slide?.download?.url || slide?.original || slide?.src;
    const filename = slide?.download?.filename || getFileName(url);
    if (!url) return;

    try {
      triggerBrowserDownload(url, filename);
      setPhotoDownload({ filename, error: null });
      window.setTimeout(() => setPhotoDownload(null), 3200);
    } catch (error) {
      console.error("Could not start photo download:", error);
      setPhotoDownload({ filename, error: "Could not start the download. Please try again." });
      window.setTimeout(() => setPhotoDownload(null), 4000);
    }
  };

  // Mobile optimization with pagination instead of hard cutoff
  const photoList = gallery?.photos ?? EMPTY_PHOTOS;
  const totalPages = isMobile ? Math.max(1, Math.ceil(photoList.length / PHOTOS_PER_PAGE)) : 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const allSlides = useMemo(
    () =>
      photoList
        .map((url, originalIndex) => ({
          src: renditionReady[originalIndex]
            ? previewUrls[originalIndex] || url
            : thumbnailUrls[originalIndex] || url,
          thumbnail: thumbnailUrls[originalIndex] || url,
          pendingPreview: !renditionReady[originalIndex],
          original: url,
          download: { url, filename: getFileName(url) },
          fallbackThumbnail: url,
          alt: `Gallery image ${originalIndex + 1}`,
          originalIndex,
        }))
        .filter((slide) => !hiddenSlides[slide.originalIndex]),
    [photoList, hiddenSlides, thumbnailUrls, previewUrls, renditionReady],
  );
  const pageStart = isMobile ? (safePage - 1) * PHOTOS_PER_PAGE : 0;
  const pageEnd = isMobile ? safePage * PHOTOS_PER_PAGE : photoList.length;
  const slides = allSlides.filter((slide) => slide.originalIndex >= pageStart && slide.originalIndex < pageEnd);

  const paginationControls = () => isMobile && totalPages > 1 && (
    <nav className="gallery-pagination" aria-label="Gallery pages">
      <button type="button" onClick={() => { setPage((value) => Math.max(1, value - 1)); setIndex(-1); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} disabled={safePage === 1} className="gallery-page-button">Previous</button>
      <span className="gallery-page-status" aria-live="polite">Page {safePage} of {totalPages}</span>
      <button type="button" onClick={() => { setPage((value) => Math.min(totalPages, value + 1)); setIndex(-1); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} disabled={safePage === totalPages} className="gallery-page-button">Next</button>
    </nav>
  );

  if (loading) return <main className="gallery-state" role="status"><div className="gallery-state-card"><div className="gallery-state-spinner" /><p className="gallery-eyebrow">PYE LIGHT STUDIOS</p><h1>Preparing your gallery</h1><p>Your photographs will be ready in a moment.</p></div></main>;
  if (!gallery) return <main className="gallery-state"><div className="gallery-state-card"><p className="gallery-eyebrow">PYE LIGHT STUDIOS</p><h1>Gallery not found</h1><p>Check the link or contact the photographer for help.</p></div></main>;

  if (gallery.password && !authorized) {
    return (
      <main className="gallery-state">
        <section className="gallery-state-card" aria-labelledby="gallery-access-title">
        <p className="gallery-eyebrow">PRIVATE CLIENT GALLERY</p>
        <h1 id="gallery-access-title">{gallery.title}</h1>
        <p>Enter the password shared with you to view your photographs.</p>
        <form onSubmit={handlePasswordSubmit} className="gallery-access-form">
          <label htmlFor="gallery-password">Gallery password</label>
          <input
            id="gallery-password"
            type="password"
            value={enteredPassword}
            onChange={(e) => { setEnteredPassword(e.target.value); setPasswordError(""); }}
            className="w-full border rounded p-2"
            placeholder="Password"
            required
            aria-describedby={passwordError ? "gallery-password-error" : undefined}
          />
          {passwordError && <p className="gallery-password-error" id="gallery-password-error" role="alert">{passwordError}</p>}
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View Gallery
          </button>
        </form>
        </section>
      </main>
    );
  }

  return (
    <main className="client-gallery">
      <header className="gallery-heading">
        <div className="gallery-heading-copy">
          <p className="gallery-eyebrow">YOUR PHOTOGRAPHS · PYE LIGHT STUDIOS</p>
          <h1 className="gallery-title">{gallery.title}</h1>
          <p className="gallery-subtitle">A collection of moments, ready to revisit and share.</p>
        </div>
        <p className="gallery-count">{photoList.length} {photoList.length === 1 ? "photograph" : "photographs"}</p>
      </header>

      {(zipAvailable || photoList.length > 0) && (
        <div className="gallery-toolbar">
          <p className="gallery-toolbar-note">Select a photograph to view it in detail.</p>
          {zipAvailable && (
          <button
            onClick={downloadAllPhotos}
            className="gallery-download"
            disabled={isDownloading}
          >
            {isDownloading ? "Starting ZIP download…" : "Download all photos"}
          </button>
          )}
        </div>
      )}
      {isDownloading && zipAvailable && (
        <div className="gallery-zip-progress" role="status" aria-live="polite">
          <div className="gallery-zip-progress-label">
            <span>Downloading your photos</span>
            <span>Check your browser’s downloads</span>
          </div>
          <progress
            className="gallery-zip-progress-bar"
            max="100"
            aria-label="ZIP download progress"
          />
        </div>
      )}

      {paginationControls()}

      {photoList.length === 0 ? (
        <section className="gallery-state-card" aria-label="Empty gallery"><h2>No photographs yet</h2><p>Your photographer is still preparing this gallery.</p></section>
      ) : (
      <section className="gallery-grid" aria-label="Gallery photographs">
        {slides.map((slide, i) => {
          if (hiddenThumbs[slide.originalIndex]) return null;

          const isLoaded = thumbLoaded[slide.originalIndex];

          return (
            <div key={slide.originalIndex} className="gallery-tile" style={{ animationDelay: `${(i % 12) * 35}ms` }}>
              <div className="gallery-image-placeholder" hidden={isLoaded} aria-hidden="true" />
              <button type="button" className="gallery-photo-button" onClick={() => setIndex(allSlides.findIndex((item) => item.originalIndex === slide.originalIndex))} aria-label={`Open photograph ${slide.originalIndex + 1}`}>
              <img
                src={slide.thumbnail}
                alt=""
                style={{ opacity: isLoaded ? 1 : 0 }}
                loading={i < 8 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i < 4 ? "high" : "auto"}
                onLoad={() => {
                  setThumbLoaded((prev) => ({ ...prev, [slide.originalIndex]: true }));
                }}
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
              </button>
            </div>
          );
        })}
      </section>
      )}

      {paginationControls()}

      {/* Lightbox */}
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={allSlides}
        plugins={isMobile ? [Zoom, Download] : [Thumbnails, Zoom, Download]}
        animation={{ fade: 200, swipe: 350, navigation: 250 }}
        carousel={{ finite: true, preload: isMobile ? 2 : 1 }}
        thumbnails={{
          position: "bottom",
          showThumbnails: true,
          width: isMobile ? 80 : 120,
          height: isMobile ? 60 : 80,
          borderRadius: 6,
        }}
        download={{ download: downloadPhoto }}
        zoom={{ maxZoomPixelRatio: 2 }}
        render={{
          slide: ({ slide }) => <ProgressiveGalleryImage key={slide.src} slide={slide} downloadState={photoDownload} />,
        }}
      />
    </main>
  );
};

export default GalleryPage;

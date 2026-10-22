import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import JSZip from 'jszip';
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { storage, db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const IMAGE_TYPES = {
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const getZipImageEntries = async (zipFile) => {
  const archive = await JSZip.loadAsync(zipFile);
  const entries = Object.values(archive.files).filter((entry) => {
    if (entry.dir) return false;
    const pathParts = entry.name.replace(/\\/g, '/').split('/');
    if (pathParts.some((part) => part === '__MACOSX' || part === '.DS_Store' || part.startsWith('._'))) return false;
    const extension = pathParts[pathParts.length - 1].split('.').pop().toLowerCase();
    return Boolean(IMAGE_TYPES[extension]);
  });

  return entries;
};

const uploadBlobWithProgress = (storageRef, blob, contentType, onProgress) => new Promise((resolve, reject) => {
  const uploadTask = uploadBytesResumable(storageRef, blob, { contentType });
  uploadTask.on(
    'state_changed',
    (snapshot) => onProgress(snapshot.bytesTransferred / snapshot.totalBytes),
    reject,
    () => resolve(uploadTask.snapshot.ref),
  );
});

const uniquePhotoName = (fileName, occupiedNames) => {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot) : '';
  let candidate = fileName;
  let suffix = 2;
  let candidateStem = candidate.replace(/\.[^.]+$/, '').toLowerCase();
  while (occupiedNames.has(candidate.toLowerCase()) || occupiedNames.has(candidateStem)) {
    candidate = `${stem}-${suffix}${extension}`;
    candidateStem = candidate.replace(/\.[^.]+$/, '').toLowerCase();
    suffix += 1;
  }
  occupiedNames.add(candidate.toLowerCase());
  occupiedNames.add(candidateStem);
  return candidate;
};

const UploadPhotos = () => {
  const { slug } = useParams();
  const [zipFile, setZipFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadFailed, setUploadFailed] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);

  const refreshUploadedPhotos = async () => {
    const folderRef = ref(storage, `galleries/${slug}`);
    const list = await listAll(folderRef);
    const urls = await Promise.all(list.items.map((item) => getDownloadURL(item)));
    setUploadedPhotos(urls);
  };

  useEffect(() => {
    const fetchUploadedPhotos = async () => {
      try {
        if (!slug || typeof slug !== 'string' || slug.trim() === '') return;
        await refreshUploadedPhotos();
      } catch (error) {
        console.error('Failed to load uploaded photos:', error);
      }
    };
    fetchUploadedPhotos();
    // refreshUploadedPhotos is intentionally recreated on each render; the route slug controls this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fileToWebp = (file, maxSize, quality) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error(`Could not generate preview for ${file.name}`));
              return;
            }
            resolve(blob);
          },
          'image/webp',
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Could not decode ${file.name} in this browser`));
      };
      img.src = objectUrl;
    });

  const handleZipChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setUploadMessage('');
    setUploadFailed(false);
    if (selectedFile && !selectedFile.name.toLowerCase().endsWith('.zip')) {
      setZipFile(null);
      setUploadFailed(true);
      setUploadMessage('Please choose a .zip file.');
      event.target.value = '';
      return;
    }
    setZipFile(selectedFile);
  };

  const uploadZipAndPhotos = async () => {
    if (!zipFile) {
      setUploadFailed(true);
      setUploadMessage('Choose a ZIP file first.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadMessage('');
    setUploadFailed(false);

    try {
      setUploadStatus('Uncompressing ZIP and finding photos…');
      const entries = await getZipImageEntries(zipFile);
      if (!entries.length) {
        throw new Error('No supported photos were found. ZIP files must contain JPG, PNG, WEBP, GIF, BMP, or AVIF images.');
      }
      setProgress(3);

      // Keep the archive so gallery visitors can still download all photos as one ZIP.
      setUploadStatus('Uploading the downloadable ZIP…');
      await uploadBlobWithProgress(
        ref(storage, `zips/${slug}.zip`),
        zipFile,
        'application/zip',
        (fraction) => setProgress(Math.round(3 + fraction * 7)),
      );

      const folderRef = ref(storage, `galleries/${slug}`);
      const existing = await listAll(folderRef);
      const occupiedNames = new Set(existing.items.map((item) => item.name.toLowerCase()));
      const newPhotoUrls = [];
      const startProgress = 10;
      const photoWorkProgress = 90;

      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        const originalName = entry.name.replace(/\\/g, '/').split('/').pop();
        const extension = originalName.split('.').pop().toLowerCase();
        const blob = await entry.async('blob');
        if (!blob.size) continue;
        const photo = new File([blob], originalName, { type: IMAGE_TYPES[extension] });
        const photoName = uniquePhotoName(photo.name, occupiedNames);
        const baseName = photoName.replace(/\.[^.]+$/, '');
        const photoStart = startProgress + (index / entries.length) * photoWorkProgress;
        setUploadStatus(`Preparing photo ${index + 1} of ${entries.length}: ${photo.name}`);

        const [thumbBlob, previewBlob] = await Promise.all([
          fileToWebp(photo, 600, 0.82),
          fileToWebp(photo, 2400, 0.88),
        ]);

        const originalRef = await uploadBlobWithProgress(
          ref(storage, `galleries/${slug}/${photoName}`),
          photo,
          photo.type,
          (fraction) => setProgress(Math.round(photoStart + (fraction / 3) * (photoWorkProgress / entries.length))),
        );
        const thumbRef = ref(storage, `thumbs/${slug}/${baseName}.webp`);
        const previewRef = ref(storage, `previews/${slug}/${baseName}.webp`);
        await uploadBlobWithProgress(
          thumbRef,
          thumbBlob,
          'image/webp',
          (fraction) => setProgress(Math.round(photoStart + ((1 + fraction) / 3) * (photoWorkProgress / entries.length))),
        );
        await uploadBlobWithProgress(
          previewRef,
          previewBlob,
          'image/webp',
          (fraction) => setProgress(Math.round(photoStart + ((2 + fraction) / 3) * (photoWorkProgress / entries.length))),
        );

        newPhotoUrls.push(await getDownloadURL(originalRef));
        setProgress(Math.round(startProgress + ((index + 1) / entries.length) * photoWorkProgress));
      }

      const galleryRef = doc(db, 'galleries', slug);
      const currentGallery = await getDoc(galleryRef);
      const currentPhotos = currentGallery.exists() ? currentGallery.data().photos || [] : [];
      await updateDoc(galleryRef, { photos: [...new Set([...currentPhotos, ...newPhotoUrls])] });
      await refreshUploadedPhotos();

      setProgress(100);
      setZipFile(null);
      setUploadStatus('');
      setUploadMessage(`Upload successful — ${newPhotoUrls.length} photos and their previews are ready.`);
      const input = document.getElementById('gallery-zip-file');
      if (input) input.value = '';
    } catch (error) {
      console.error('ZIP and photo upload error:', error);
      const details = error?.code ? `${error.code}: ${error.message || 'Unknown upload error'}` : error?.message;
      setUploadFailed(true);
      setUploadStatus('');
      setUploadMessage(`Upload failed${details ? ` — ${details}` : '.'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">Upload Photos to: {slug}</h2>
      <p className="mb-5 text-sm text-gray-600">
        Choose one ZIP containing the gallery photos. We’ll keep the ZIP for client downloads and automatically upload each photo with its thumbnail and preview.
      </p>

      <div className="rounded border border-gray-300 bg-white p-5">
        <label htmlFor="gallery-zip-file" className="mb-2 block font-semibold">Gallery ZIP file</label>
        <input
          id="gallery-zip-file"
          type="file"
          accept=".zip,application/zip"
          onChange={handleZipChange}
          disabled={uploading}
          className="mb-4 block w-full"
        />
        {zipFile && <p className="mb-4 text-sm text-gray-600">Selected: {zipFile.name}</p>}
        <button
          type="button"
          onClick={uploadZipAndPhotos}
          disabled={uploading || !zipFile}
          className="rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? `Uploading photos (${progress}%)…` : 'Upload ZIP & Photos'}
        </button>
        {uploading && (
          <div className="mt-4" role="status" aria-live="polite">
            <div className="mb-1 flex justify-between gap-4 text-sm text-gray-700">
              <span>{uploadStatus}</span><span>{progress}%</span>
            </div>
            <progress className="h-2 w-full accent-green-700" max="100" value={progress} aria-label="ZIP and photo upload progress" />
          </div>
        )}
        {uploadMessage && (
          <p className={`mt-4 text-sm ${uploadFailed ? 'text-red-700' : 'text-green-800'}`} role={uploadFailed ? 'alert' : 'status'}>
            {uploadMessage}
          </p>
        )}
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4">Uploaded Photos ({uploadedPhotos.length})</h3>
      {uploadedPhotos.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {uploadedPhotos.map((url, index) => (
            <img key={url} src={url} alt={`Uploaded ${index + 1}`} className="w-full h-auto rounded shadow" loading="lazy" />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600">Photos will appear here after they’re uploaded.</p>
      )}
    </div>
  );
};

export default UploadPhotos;

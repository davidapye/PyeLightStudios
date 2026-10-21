import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, uploadBytesResumable, uploadBytes, getBlob, getDownloadURL, listAll } from 'firebase/storage';
import { storage, db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const UploadPhotos = () => {
  const { slug } = useParams();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [generatingPreviews, setGeneratingPreviews] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  useEffect(() => {
    const fetchUploadedPhotos = async () => {
      try {
        if (!slug || typeof slug !== 'string' || slug.trim() === '') return;

        const folderRef = ref(storage, `galleries/${slug}`);
        const list = await listAll(folderRef);
        const urls = await Promise.all(list.items.map(item => getDownloadURL(item)));
        setUploadedPhotos(urls);
      } catch (error) {
        console.error('Failed to load uploaded photos:', error);
      }
    };
    fetchUploadedPhotos();
  }, [slug]);

  const isRealImageFile = (file) => {
    const name = file?.name || '';
    if (!name) return false;
    if (name.startsWith('.')) return false;
    if (name.startsWith('._')) return false;
    if (name === '.DS_Store') return false;
    if (file.size === 0) return false;
    if (!file.type || !file.type.startsWith('image/')) return false;
    return true;
  };

  const handleFileChange = (e) => {
    const fileList = Array.from(e.target.files).filter(isRealImageFile);
    setFiles(fileList);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fileList = Array.from(e.dataTransfer.files).filter(isRealImageFile);
    setFiles(fileList);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

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
              reject(new Error('Failed to create WEBP thumbnail'));
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
        reject(new Error(`Failed to load image for thumbnail: ${file.name}`));
      };

      img.src = objectUrl;
    });

  const uploadPhotos = async () => {
    if (!files.length) return alert('Please select files first.');
    setUploading(true);

    try {
      const updatedUrls = [...uploadedPhotos];

      for (let file of files) {
        if (!isRealImageFile(file)) {
          console.warn(`Skipping non-image/system file: ${file.name}`);
          continue;
        }

        const cleanName = file.name.split('/').pop();
        const baseName = cleanName.replace(/\.[^.]+$/, '');
        const originalRef = ref(storage, `galleries/${slug}/${cleanName}`);
        const thumbRef = ref(storage, `thumbs/${slug}/${baseName}.webp`);
        const previewRef = ref(storage, `previews/${slug}/${baseName}.webp`);
        const uploadTask = uploadBytesResumable(originalRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(percent.toFixed(0));
            },
            (error) => {
              console.error('Upload error:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                if (!updatedUrls.includes(downloadURL)) {
                  updatedUrls.push(downloadURL);
                }

                const [thumbBlob, previewBlob] = await Promise.all([
                  fileToWebp(file, 600, 0.82),
                  fileToWebp(file, 2400, 0.88),
                ]);
                await Promise.all([
                  uploadBytes(thumbRef, thumbBlob, { contentType: 'image/webp' }),
                  uploadBytes(previewRef, previewBlob, { contentType: 'image/webp' }),
                ]);
                resolve();
              } catch (thumbError) {
                console.error('Thumbnail generation/upload error:', thumbError);
                reject(thumbError);
              }
            }
          );
        });
      }

      await updateDoc(doc(db, 'galleries', slug), { photos: updatedUrls });

      const folderRef = ref(storage, `galleries/${slug}`);
      const list = await listAll(folderRef);
      const urls = await Promise.all(list.items.map(item => getDownloadURL(item)));
      setUploadedPhotos(urls);
      setFiles([]);
      alert('Upload complete! Originals, WEBP thumbnails, and gallery previews created.');
    } catch (error) {
      console.error('Fatal upload error:', error);
      alert('Something went wrong during upload. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  const generatePreviewsForExistingPhotos = async () => {
    if (!uploadedPhotos.length) return;
    setGeneratingPreviews(true);
    setPreviewProgress(0);
    let failed = 0;

    try {
      for (let index = 0; index < uploadedPhotos.length; index += 1) {
        const url = uploadedPhotos[index];
        try {
          const pathname = new URL(url).pathname;
          const objectStart = pathname.indexOf('/o/');
          if (objectStart < 0) throw new Error('Unrecognized Firebase photo URL');
          const objectPath = decodeURIComponent(pathname.slice(objectStart + 3));
          const fileName = objectPath.split('/').pop();
          const baseName = fileName.replace(/\.[^.]+$/, '');
          const original = await getBlob(ref(storage, objectPath));
          const preview = await fileToWebp(original, 2400, 0.88);
          await uploadBytes(ref(storage, `previews/${slug}/${baseName}.webp`), preview, { contentType: 'image/webp' });
        } catch (error) {
          failed += 1;
          console.error(`Preview generation failed for photo ${index + 1}:`, error);
        }
        setPreviewProgress(Math.round(((index + 1) / uploadedPhotos.length) * 100));
      }

      alert(failed
        ? `Previews generated with ${failed} failure${failed === 1 ? '' : 's'}. Check the console for details.`
        : `Generated full-quality previews for all ${uploadedPhotos.length} photos.`);
    } finally {
      setGeneratingPreviews(false);
    }
  };

  const handleZipUpload = async (e) => {
    const zipFile = e.target.files[0];
    if (!zipFile || !zipFile.name.endsWith('.zip')) {
      alert('Please select a valid .zip file.');
      return;
    }

    try {
      const zipRef = ref(storage, `zips/${slug}.zip`);
      await uploadBytes(zipRef, zipFile, { contentType: 'application/zip' });
      alert('ZIP file uploaded successfully.');
    } catch (error) {
      console.error('ZIP upload error:', error);
      alert('Failed to upload ZIP file.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Photos to: {slug}</h2>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-dashed border-2 border-gray-400 p-6 rounded text-center mb-4"
      >
        Drag & drop a folder or multiple images here
      </div>

      <input
        type="file"
        multiple
        webkitdirectory="true"
        directory="true"
        onChange={handleFileChange}
        className="mb-4"
      />

      <button
        onClick={uploadPhotos}
        disabled={uploading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {uploading ? `Uploading (${progress}%)...` : 'Upload Photos'}
      </button>

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-2">Optional: Upload ZIP File</h2>
      <input
        type="file"
        accept=".zip"
        onChange={handleZipUpload}
        className="mb-4"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4">Uploaded Photos</h3>
      <div className="mb-4">
        <button
          type="button"
          onClick={generatePreviewsForExistingPhotos}
          disabled={generatingPreviews || uploadedPhotos.length === 0}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
        >
          {generatingPreviews ? `Generating previews (${previewProgress}%)...` : 'Generate Previews for Existing Photos'}
        </button>
        <p className="mt-2 text-sm text-gray-600">Creates 2,400-pixel viewing previews; original photos remain unchanged for downloads.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {uploadedPhotos.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Uploaded ${index + 1}`}
            className="w-full h-auto rounded shadow"
          />
        ))}
      </div>
    </div>
  );
};

export default UploadPhotos;

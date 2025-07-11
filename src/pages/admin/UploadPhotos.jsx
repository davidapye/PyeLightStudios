import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { storage, db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const UploadPhotos = () => {
  const { slug } = useParams();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);

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

  const handleFileChange = (e) => {
    const fileList = Array.from(e.target.files);
    setFiles(fileList);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fileList = Array.from(e.dataTransfer.files);
    setFiles(fileList);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const uploadPhotos = async () => {
    if (!files.length) return alert('Please select files first.');
    setUploading(true);

    try {
      const updatedUrls = [...uploadedPhotos];

      for (let file of files) {
        if (file.size === 0) {
          console.warn(`Skipping empty file: ${file.name}`);
          continue;
        }

        const cleanName = file.name.split('/').pop();
        const fileRef = ref(storage, `galleries/${slug}/${cleanName}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

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
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              if (!updatedUrls.includes(downloadURL)) {
                updatedUrls.push(downloadURL);
              }
              resolve();
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
      alert('Upload complete!');
    } catch (error) {
      console.error('Fatal upload error:', error);
      alert('Something went wrong during upload. Check console for details.');
    } finally {
      setUploading(false);
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

      <h3 className="text-xl font-semibold mt-8 mb-4">Uploaded Photos</h3>
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

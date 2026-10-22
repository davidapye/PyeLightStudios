import React, { useEffect, useState } from 'react';
import { db, storage } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { Link } from 'react-router-dom';

const listAllFilesRecursively = async (directoryRef) => {
  const result = await listAll(directoryRef);
  const nestedFiles = await Promise.all(result.prefixes.map(listAllFilesRecursively));
  return [...result.items, ...nestedFiles.flat()];
};

const deleteFilesInBatches = async (files, batchSize = 25) => {
  for (let index = 0; index < files.length; index += batchSize) {
    await Promise.all(files.slice(index, index + batchSize).map((item) => deleteObject(item)));
  }
};

const AdminDashboard = () => {
  const [galleries, setGalleries] = useState([]);

  useEffect(() => {
    const fetchGalleries = async () => {
      const snapshot = await getDocs(collection(db, 'galleries'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGalleries(data);
    };

    fetchGalleries();
  }, []);

  const handleDelete = async (slug) => {
    const confirmed = window.confirm(`Are you sure you want to delete the gallery "${slug}"? This will delete all associated photos.`);
    if (!confirmed) return;
  
    try {
      const directories = ['galleries', 'thumbs', 'previews'];
      const filesByDirectory = await Promise.all(
        directories.map((directory) => listAllFilesRecursively(ref(storage, `${directory}/${slug}`))),
      );
      const filesToDelete = filesByDirectory.flat();
      await deleteFilesInBatches(filesToDelete);
      try {
        await deleteObject(ref(storage, `zips/${slug}.zip`));
      } catch (storageError) {
        if (storageError.code !== 'storage/object-not-found') throw storageError;
      }

      await deleteDoc(doc(db, 'galleries', slug));
  
      setGalleries((current) => current.filter((gallery) => gallery.slug !== slug));
    } catch (err) {
      console.error('Failed to delete gallery:', err);
      alert('An error occurred while deleting the gallery.');
    }
  };

  const handlePasswordChange = async (id, newPassword) => {
    try {
      await updateDoc(doc(db, 'galleries', id), {
        password: newPassword || null
      });
      setGalleries(galleries.map(g => g.id === id ? { ...g, password: newPassword } : g));
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Failed to update password.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

      <Link
        to="/admin/create"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
      >
        + Create New Gallery
      </Link>

      <div className="space-y-4">
        {galleries.map((gallery) => (
          <div
            key={gallery.id}
            className="border p-4 rounded shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold">{gallery.title}</h3>
            <p className="text-sm text-gray-600">Slug: {gallery.slug}</p>
            <p className="text-sm">Photos: {gallery.photos?.length || 0}</p>
            <div className="mt-2">
              <label className="text-sm font-medium">Password:</label>
              <input
                type="password"
                autoComplete="new-password"
                defaultValue={gallery.password || ''}
                className="ml-2 border rounded px-2 py-1 text-sm"
                onBlur={(e) => handlePasswordChange(gallery.id, e.target.value)}
              />
            </div>
            <div className="mt-3 space-x-4">
              <Link
                to={`/admin/upload/${gallery.slug}`}
                className="text-blue-600 hover:underline"
              >
                Upload More
              </Link>
              <a
                href={`/gallery/${gallery.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                View Gallery
              </a>
              <button
                onClick={() => handleDelete(gallery.slug)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;

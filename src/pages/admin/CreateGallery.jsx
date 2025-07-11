import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CreateGallery = () => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !slug) return alert('Title and slug are required.');

    try {
      setLoading(true);
      await setDoc(doc(db, 'galleries', slug), {
        title,
        slug,
        password: password || null,
        createdAt: serverTimestamp(),
        photos: []
      });
      navigate(`/admin/upload/${slug}`);
    } catch (err) {
      console.error('Error creating gallery:', err);
      alert('Error creating gallery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Gallery</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold">Slug</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <p className="text-sm text-gray-500">Used in the URL: /gallery/[slug]</p>
        </div>
        <div>
          <label className="block font-semibold">Password (optional)</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Creating...' : 'Create Gallery'}
        </button>
      </form>
    </div>
  );
};

export default CreateGallery;
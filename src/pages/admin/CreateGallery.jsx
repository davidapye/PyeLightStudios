import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CreateGallery = () => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    const normalizedSlug = slug.trim().replace(/^-+|-+$/g, '').replace(/-+/g, '-');
    if (!title.trim() || !normalizedSlug) {
      setError('Title and URL slug are required.');
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      setError('Use lowercase letters and numbers separated by single hyphens for the URL slug.');
      return;
    }

    try {
      setError('');
      setSlug(normalizedSlug);
      setLoading(true);
      await setDoc(doc(db, 'galleries', normalizedSlug), {
        title,
        slug: normalizedSlug,
        password: password || null,
        createdAt: serverTimestamp(),
        photos: []
      });
      navigate(`/admin/upload/${normalizedSlug}`);
    } catch (err) {
      console.error('Error creating gallery:', err);
      setError('Could not create the gallery. Check that the URL slug is unique and try again.');
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
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
            required
            autoCapitalize="none"
            spellCheck="false"
          />
          <p className="text-sm text-gray-500">Used in the URL: /gallery/[slug]</p>
        </div>
        <div>
          <label className="block font-semibold">Password (optional)</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full border rounded p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
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

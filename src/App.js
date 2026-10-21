import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Photoshoots from './pages/Photoshoots';
import Realestate from './pages/Realestate';
import Reviews from './pages/Reviews';
import BookNow from './pages/BookNow';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateGallery from './pages/admin/CreateGallery';
import UploadPhotos from './pages/admin/UploadPhotos';
import RequireAdmin from './pages/admin/RequireAdmin';
import GalleryPage from './pages/gallery/GalleryPage';
import './index.css';

if (typeof window !== "undefined" && !("requestIdleCallback" in window)) {
  window.requestIdleCallback = (cb) => setTimeout(cb, 200);
  window.cancelIdleCallback = (id) => clearTimeout(id);
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/photoshoots" element={<Photoshoots />} />
        <Route path="/realestate" element={<Realestate />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/book" element={<BookNow />} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route index element={<AdminDashboard />} />
          <Route path="create" element={<CreateGallery />} />
          <Route path="upload/:slug" element={<UploadPhotos />} />
        </Route>
        <Route path="/gallery/:slug" element={<GalleryPage />} />
      </Routes>
    </Router>
  );
}
export default App;

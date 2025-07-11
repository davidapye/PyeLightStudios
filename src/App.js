import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Portraits from './components/Portraits';
import Photoshoots from './pages/Photoshoots';
import Realestate from './pages/Realestate';
import Reviews from './pages/Reviews';
import BookNow from './pages/BookNow';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateGallery from './pages/admin/CreateGallery';
import UploadPhotos from './pages/admin/UploadPhotos';
import GalleryPage from './pages/gallery/GalleryPage';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<><Hero /><About /><Portraits /></>} />
        <Route path="/photoshoots" element={<Photoshoots />} />
        <Route path="/realestate" element={<Realestate />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/book" element={<BookNow />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/create" element={<CreateGallery />} />
        <Route path="/admin/upload/:slug" element={<UploadPhotos />} />
        <Route path="/gallery/:slug" element={<GalleryPage />} />
      </Routes>
    </Router>
  );
}
export default App;

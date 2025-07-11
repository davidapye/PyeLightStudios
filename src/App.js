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
      </Routes>
    </Router>
  );
}
export default App;

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Notifications from './components/Notifications';
import Home from './pages/Home';
import Coaching from './pages/Coaching';
import Events from './pages/Events';
import { ContentPage, Gallery, Contact } from './pages/PublicPages';
import Auth, { Guard } from './pages/Auth';
import Account from './pages/Account';
import Admin from './pages/Admin';
import './styles.css';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Notifications />
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<ContentPage slug="about" />} />
            <Route path="pages/:slug" element={<ContentPage />} />
            <Route path="coaching" element={<Coaching />} />
            <Route path="events" element={<Events />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Auth />} />
            <Route path="signup" element={<Auth signup />} />
            <Route path="admin/login" element={<Auth admin />} />
            <Route
              path="account"
              element={
                <Guard>
                  <Account />
                </Guard>
              }
            />
            <Route
              path="admin"
              element={
                <Guard admin>
                  <Admin />
                </Guard>
              }
            />
            <Route
              path="*"
              element={
                <section className="section">
                  <h1>Page not found</h1>
                  <Link to="/">Return home</Link>
                </section>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
if ('serviceWorker' in navigator && import.meta.env.PROD)
  navigator.serviceWorker.register('/sw.js').catch(() => {});

import React, { useState, useEffect } from 'react';
import TfcSafeParticleHero from '../components/TfcSafeParticleHero';
import ContentCard from '../components/ContentCard';
import { CATEGORIES, TFC_INFO } from '../data/ContentData';
import VideoPlayer from '../components/VideoPlayer';
import { useUser } from '../context/UserContext';
import { AnimatePresence, motion } from 'framer-motion';
import SEO from '../components/SEO';
import UpgradeModal from '../components/UpgradeModal';
import Navbar from '../components/Navbar';
import { MapPin, Mail, Phone, Facebook, Instagram, Youtube, Send, Loader2, CheckCircle2, Trophy, Users, Calendar, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';

// Fallback events shown if backend is unreachable
const FALLBACK_EVENTS = [
  { id: 'e1', name: 'TFC Canada Land Of Martial Arts', number: 82, date: '2024-09-03', location: 'Canada', status: 'upcoming', url: 'https://tfc-event.com/tfc-canada-land-of-martial-arts/', image: 'https://tfc-event.com/wp-content/uploads/2024/08/0079-THE.png' },
  { id: 'e2', name: 'TFC Gladiators', number: 81, date: '2024-06-22', location: 'Jem, Mahdia, Tunisia', status: 'recent', url: 'https://tfc-event.com/tfc-gladiators/', image: 'https://tfc-event.com/wp-content/uploads/2024/08/WhatsApp-Image-2024-08-13-a-21.27.25_f7cede16.jpg' },
  { id: 'e3', name: 'The Raiders', number: 80, date: '2024-01-13', location: 'Sfax, Tunisia', status: 'past', url: 'https://tfc-event.com/tfc-raiders/', image: 'https://tfc-event.com/wp-content/uploads/2024/08/WhatsApp-Image-2024-08-13-a-21.27.07_f68082cc.jpg' },
  { id: 'e4', name: 'The War', number: 79, date: '2023-09-23', location: 'Sfax, Tunisia', status: 'past', url: 'https://tfc-event.com/tfc-the-war/', image: 'https://tfc-event.com/wp-content/uploads/2024/08/0079-THE.png' },
  { id: 'e5', name: 'Jungle Fight', number: 78, date: '2023-07-08', location: 'Sfax, Tunisia', status: 'past', url: 'https://tfc-event.com/tfc-jungle-fight/', image: 'https://tfc-event.com/wp-content/uploads/2023/01/WhatsApp-Image-2024-08-19-a-21.49.36_8d5fea11.jpg' },
  { id: 'e6', name: 'Vanguard', number: 77, date: '2023-04-29', location: 'Sfax, Tunisia', status: 'past', url: 'https://tfc-event.com/tfc-vanguard/', image: 'https://tfc-event.com/wp-content/uploads/2024/08/Titan-Fight-scaled.jpg' },
  { id: 'e7', name: 'Tsunami', number: 76, date: '2023-01-14', location: 'Sfax, Tunisia', status: 'past', url: 'https://tfc-event.com/tfc-tsunami/', image: 'https://tfc-event.com/wp-content/uploads/2024/08/WhatsApp-Image-2024-08-13-a-21.27.25_f7cede16.jpg' },
  { id: 'e8', name: 'Titans Fight', number: 75, date: '2022-10-15', location: 'Sfax, Tunisia', status: 'past', url: 'https://tfc-event.com/tfc-titans-fights/', image: 'https://tfc-event.com/wp-content/uploads/2024/08/Titan-Fight-scaled.jpg' },
];

const Home = () => {
  const [activeVideo, setActiveVideo] = useState(null);
  const { user, addToHistory, hasActiveSubscription } = useUser();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const hardcodedItems = CATEGORIES.flatMap(c => c.items);
  const [firestoreVideos, setFirestoreVideos] = useState([]);

  // Merge Firestore + hardcoded videos (deduplicate by title)
  const allItems = (() => {
    const titleSet = new Set();
    const result = [];
    for (const v of firestoreVideos) {
      const key = v.title?.toLowerCase();
      if (key && !titleSet.has(key)) { titleSet.add(key); result.push(v); }
    }
    for (const v of hardcodedItems) {
      const key = v.title?.toLowerCase();
      if (key && !titleSet.has(key)) { titleSet.add(key); result.push(v); }
    }
    return result;
  })();

  // ── Events: fetch from backend, fall back to hardcoded data ─────────────
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    // Fetch admin-managed videos — send auth token so subscribers get premium URLs
    const fetchVideos = async () => {
      try {
        const headers = {};
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken().catch(() => null);
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/videos`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setFirestoreVideos(data);
        }
      } catch {}
    };
    fetchVideos();

    // Fetch events
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) && data.length > 0 ? data : FALLBACK_EVENTS);
        } else {
          setEvents(FALLBACK_EVENTS);
        }
      } catch {
        setEvents(FALLBACK_EVENTS);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle');

  const normalizeYouTubeUrl = (url) => {
    if (!url) return url;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/watch?v=${shortMatch[1]}`;
    const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return `https://www.youtube.com/watch?v=${watchMatch[1]}`;
    return url;
  };

  const handlePlay = (item) => {
    if (item.isPremium && !hasActiveSubscription()) { setShowUpgradeModal(true); return; }
    setActiveVideo({ ...item, videoUrl: normalizeYouTubeUrl(item.videoUrl) });
    addToHistory(item);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('sending');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (res.ok) { setContactStatus('success'); setContactForm({ name: '', email: '', message: '' }); }
      else setContactStatus('error');
    } catch { setContactStatus('error'); }
    setTimeout(() => setContactStatus('idle'), 5000);
  };

  return (
    <div className="min-h-screen bg-black">
      <SEO title="Home" description="Stream the world's best live MMA events on TFC." />
      <Navbar />

      {/* Fixed TFC logo top-right */}
      <div style={{ position: 'fixed', top: '20px', right: '30px', zIndex: 1000, opacity: 0.9 }}>
        <img src="/logo tfc in homejsx.png" alt="TFC Logo" style={{ width: '120px', height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
      </div>

      {/* ── HERO ── */}
      <div id="home" className="relative w-full mt-12" style={{ height: '50vh', minHeight: '400px' }}>
        <div className="absolute inset-0">
          <img src="/Screenshot 2026-01-30 231135.png" alt="MMA Platform" className="w-full h-full object-cover" style={{ filter: 'brightness(0.3) contrast(1.2)' }} />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="absolute inset-0"><TfcSafeParticleHero /></div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)]"></div>
        </div>
      </div>

      {/* ── TRENDING VIDEOS ── */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-12 text-center uppercase tracking-tighter">Trending Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {allItems.slice(0, 8).map((item) => (
              <ContentCard key={item.id} item={item} onPlay={handlePlay} />
            ))}
          </div>
          
          {/* Watch More Link */}
          <div className="text-center mt-12">
            <button 
              onClick={() => navigate('/browse')}
              className="inline-flex items-center space-x-3 bg-primary/10 hover:bg-primary/20 border border-primary/40 hover:border-primary text-primary font-black uppercase text-xs tracking-widest py-4 px-10 rounded-2xl transition-all group"
            >
              <span>Explore Full Video Library</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS — verified from tfc-event.com ── */}
      <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
            {[
              { icon: Calendar, label: 'Championship Events', value: '82+', sub: 'Since 2015' },
              { icon: Trophy,   label: 'Weight Divisions',    value: '12',   sub: '8 Men\'s · 4 Women\'s' },
              { icon: Users,    label: 'Countries Reached',   value: '20+',  sub: 'Africa & worldwide' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <motion.div key={label} whileHover={{ y: -5 }} className="bg-surface border border-gray-800 rounded-3xl p-8">
                <Icon className="w-10 h-10 text-primary mx-auto mb-4" />
                <div className="text-5xl font-black text-primary mb-1">{value}</div>
                <div className="text-white font-bold uppercase text-xs tracking-widest mb-1">{label}</div>
                <div className="text-gray-600 text-xs">{sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS — fetched from backend ── */}
      <section id="events" className="py-16 md:py-20 px-4 md:px-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-2 text-center uppercase tracking-tighter">TFC Events</h2>
          <p className="text-gray-500 text-center font-bold uppercase text-xs tracking-widest mb-8 md:mb-12">Championship history &amp; upcoming events</p>
          {eventsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
          <div className="space-y-4">
            {events.slice(0, 8).map((event) => (
              <motion.a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 4 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between bg-surface border border-gray-800 hover:border-primary/50 rounded-2xl p-6 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {event.image
                      ? <img src={event.image} alt={event.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                      : <span className="text-primary font-black text-sm">#{event.number}</span>
                    }
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg group-hover:text-primary transition-colors">{event.name}</h3>
                    <p className="text-gray-500 text-sm">{event.location} · {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 flex items-center space-x-3">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${event.status === 'upcoming' ? 'bg-green-500/20 text-green-400' : event.status === 'recent' ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'}`}>
                    {event.status}
                  </span>
                  <span className="text-gray-500 text-xs">TFC #{event.number}</span>
                </div>
              </motion.a>
            ))}
          </div>
          )}
          <div className="text-center mt-8">
            <a href="https://tfc-event.com" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center space-x-2 border border-primary/40 hover:border-primary text-primary hover:bg-primary/10 font-black uppercase text-xs tracking-widest py-3 px-8 rounded-xl transition-all">
              <span>View All Events on tfc-event.com</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-16 md:py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 md:mb-8 uppercase tracking-tighter">About TFC</h2>
          <div className="bg-surface border border-gray-800 rounded-3xl p-6 md:p-10">
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8">{TFC_INFO.about}</p>
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 text-center">
              {[
                { label: 'Founded', value: TFC_INFO.founded },
                { label: 'Based in', value: TFC_INFO.location },
                { label: 'Events held', value: '82+' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-black/30 rounded-2xl p-4">
                  <div className="text-2xl font-black text-primary">{value}</div>
                  <div className="text-gray-500 text-xs uppercase tracking-widest mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center space-x-6">
              <a href={TFC_INFO.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-primary/20 transition-colors">
                <Facebook className="w-5 h-5 text-primary" />
              </a>
              <a href={TFC_INFO.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-primary/20 transition-colors">
                <Instagram className="w-5 h-5 text-primary" />
              </a>
              <a href={TFC_INFO.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-primary/20 transition-colors">
                <Youtube className="w-5 h-5 text-primary" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-16 md:py-20 px-4 md:px-8 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 md:mb-12 text-center uppercase tracking-tighter">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-6">
              <h3 className="text-white text-xl font-black uppercase tracking-tight">Get In Touch</h3>
              {[
                { icon: Mail,  text: TFC_INFO.email, href: `mailto:${TFC_INFO.email}` },
                { icon: Phone, text: TFC_INFO.phone,  href: `tel:${TFC_INFO.phone}` },
                { icon: MapPin, text: 'Sfax, Tunisia', href: 'https://maps.google.com/?q=Sfax,Tunisia' },
              ].map(({ icon: Icon, text, href }) => (
                <a key={text} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-gray-300 group-hover:text-white transition-colors">{text}</span>
                </a>
              ))}
              <div className="flex space-x-3 pt-4">
                {[
                  { icon: Facebook,  href: TFC_INFO.facebook },
                  { icon: Instagram, href: TFC_INFO.instagram },
                  { icon: Youtube,   href: TFC_INFO.youtube },
                ].map(({ icon: Icon, href }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                     className="p-3 bg-white/5 rounded-xl hover:bg-primary/20 hover:text-primary transition-colors text-gray-400">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-white text-xl font-black uppercase tracking-tight mb-6">Send Message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <input type="text" placeholder="Your Name" value={contactForm.name}
                  onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} required
                  className="w-full bg-surface border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors" />
                <input type="email" placeholder="Your Email" value={contactForm.email}
                  onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} required
                  className="w-full bg-surface border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors" />
                <textarea placeholder="Your Message" rows="4" value={contactForm.message}
                  onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} required
                  className="w-full bg-surface border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors resize-none" />
                {contactStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-green-400 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Message sent! We'll get back to you soon.</span>
                  </div>
                )}
                {contactStatus === 'error' && (
                  <p className="text-red-400 text-sm font-bold">Failed to send. Email us directly at {TFC_INFO.email}</p>
                )}
                <button type="submit" disabled={contactStatus === 'sending'}
                  className="w-full bg-primary hover:bg-red-600 disabled:opacity-60 text-black font-black py-4 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center space-x-2">
                  {contactStatus === 'sending'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending...</span></>
                    : <><Send className="w-4 h-4" /><span>Send Message</span></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {activeVideo && <VideoPlayer url={activeVideo.videoUrl} title={activeVideo.title} onClose={() => setActiveVideo(null)} />}
      </AnimatePresence>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default Home;

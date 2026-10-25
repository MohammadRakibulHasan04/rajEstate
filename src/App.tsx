import React, { useState, useMemo, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { AuthProvider } from './context/AuthContext';
import { INITIAL_PROPERTIES } from './data/properties';
import { Property } from './types/property';
import { TopBar } from './components/TopBar';
import { PropertySearchFilters, FilterState } from './components/PropertySearchFilters';
import { PropertyCard } from './components/PropertyCard';

import { PropertyDetailModal } from './components/PropertyDetailModal';
import { BookingInquiryModal } from './components/BookingInquiryModal';
import { SavedPortfolioDrawer } from './components/SavedPortfolioDrawer';
import { Preloader } from './components/home/Preloader';
import { CinematicHero } from './components/home/CinematicHero';
import { ManifestoSection } from './components/home/ManifestoSection';
import { ParallaxGallery } from './components/home/ParallaxGallery';
import { ResidencesShowcase } from './components/home/ResidencesShowcase';
import { useFramePreloader } from './lib/frames';
import { ArrowUpRight } from 'lucide-react';
import { usePath, matchRoute, navigate } from './lib/router';
import { PropertyPage } from './pages/PropertyPage';
import { ManagePage } from './pages/ManagePage';

gsap.registerPlugin(ScrollTrigger);

function AppContent() {
  const [properties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookingProperty, setBookingProperty] = useState<Property | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [introDone, setIntroDone] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const { images, progress, loaded } = useFramePreloader();

  // Search & Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    propertyType: 'all',
    location: 'all',
    minPrice: 0,
    maxPrice: 50000000,
    sortBy: 'featured',
  });

  // Extract distinct locations
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    properties.forEach((p) => locSet.add(`${p.city}, ${p.country}`));
    return Array.from(locSet).sort();
  }, [properties]);

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // Typology filter
        if (filters.propertyType !== 'all' && p.propertyType !== filters.propertyType) {
          return false;
        }
        // Location filter
        if (filters.location !== 'all') {
          const locString = `${p.city}, ${p.country}`;
          if (locString !== filters.location) return false;
        }
        // Price filter
        if (p.price > filters.maxPrice) {
          return false;
        }
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchCity = p.city.toLowerCase().includes(q);
          const matchArchitect = p.architect.toLowerCase().includes(q);
          const matchHighlights = p.architecturalHighlights.some((h) => h.toLowerCase().includes(q));
          if (!matchTitle && !matchCity && !matchArchitect && !matchHighlights) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price-desc') return b.price - a.price;
        if (filters.sortBy === 'price-asc') return a.price - b.price;
        if (filters.sortBy === 'area-desc') return b.sqft - a.sqft;
        // featured default
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [properties, filters]);

  const handleNavigate = useCallback((sectionId: string) => {
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const featuredProperty = properties.find((p) => p.featured) || properties[0];

  // Generic fade-up reveal for static editorial blocks
  useLayoutEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.set('[data-reveal]', { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', overwrite: true }
          ),
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Late-loading images change layout height; keep trigger positions accurate.
  useEffect(() => {
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [filteredProperties.length]);

  return (
    <div
      ref={mainRef}
      className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-white dark"
    >
      {!introDone && <Preloader progress={progress} loaded={loaded} onComplete={() => setIntroDone(true)} />}

      {/* Top Bar Header */}
      <TopBar
        onNavigate={handleNavigate}
        onOpenSavedDrawer={() => setIsSavedDrawerOpen(true)}
      />

      <main>
        {/* 1. CINEMATIC HERO — scroll-scrubbed frame sequence */}
        <CinematicHero
          images={images}
          ready={introDone}
          onExplore={() => handleNavigate('showcase')}
        />

        {/* 2. PHILOSOPHY */}
        <ManifestoSection />

        {/* 3. PROCESS — multi-speed parallax gallery */}
        <ParallaxGallery />

        {/* 4. SHOWCASE — residences portfolio collection */}
        <ResidencesShowcase />
      </main>

      {/* FOOTER & ADVISORY */}
      <footer id="advisory" className="relative border-t border-white/10 bg-[#05080f] px-6 md:px-12 lg:px-20 pt-20 pb-10 overflow-hidden">
        <div className="max-w-[90rem] mx-auto">
          <div className="grid md:grid-cols-12 gap-10 pb-16">
            <div className="md:col-span-5">
              <p className="font-display font-light text-3xl text-white leading-snug max-w-sm">
                বসবাসের যোগ্য স্থাপত্য, <em className="italic text-cyan-400">নকশা থেকে বাস্তবে।</em>
              </p>
            </div>
            {[
              { h: 'Explore', l: [['Philosophy', 'manifesto'], ['Process', 'process'], ['Residences', 'showcase']] },
              { h: 'Experience', l: [['Atelier', 'architects'], ['Advisory', 'advisory']] },
            ].map((col) => (
              <div key={col.h} className="md:col-span-2">
                <h4 className="text-[10px] font-mono tracking-[0.3em] uppercase text-slate-500">{col.h}</h4>
                <ul className="mt-5 space-y-3">
                  {col.l.map(([label, id]) => (
                    <li key={id}>
                      <button
                        onClick={() => handleNavigate(id)}
                        className="group inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        {label}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="md:col-span-3">
              <h4 className="text-[10px] font-mono tracking-[0.3em] uppercase text-slate-500">Atelier</h4>
              <address className="mt-5 not-italic text-sm text-slate-300 leading-relaxed">
                By appointment only
                <br />
                London · Lisbon · Dubai
              </address>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="font-display font-light text-[26vw] leading-[0.8] tracking-[0.04em] text-center text-transparent bg-clip-text bg-gradient-to-b from-white/[0.12] to-white/0 select-none"
          >
            AURA
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono tracking-[0.26em] uppercase text-slate-500">
            <span>© 2026 AURA Architectural Residences</span>
            <span>Crafted with intent</span>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onBookTour={(prop) => {
            setSelectedProperty(null);
            setBookingProperty(prop);
          }}
        />
      )}

      {bookingProperty && (
        <BookingInquiryModal
          property={bookingProperty}
          onClose={() => setBookingProperty(null)}
        />
      )}

      <SavedPortfolioDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        allProperties={properties}
        onSelectProperty={setSelectedProperty}
      />
    </div>
  );
}

export default function App() {
  const path = usePath();

  useEffect(() => {
    // Legacy hash compatibility & redirects
    if (window.location.hash === '#/project-1') {
      window.location.hash = '';
      navigate('/property/the-barakah-residence', { replace: true });
    } else if (window.location.hash.startsWith('#/manage')) {
      const target = window.location.hash.slice(1);
      window.location.hash = '';
      navigate(target, { replace: true });
    } else if (window.location.hash.startsWith('#/property/')) {
      const target = window.location.hash.slice(1);
      window.location.hash = '';
      navigate(target, { replace: true });
    }
  }, []);

  const propertyMatch = matchRoute('/property/:slug', path);
  const isManage = path === '/manage' || path.startsWith('/manage/');

  if (isManage) {
    return (
      <AuthProvider>
        <ManagePage />
      </AuthProvider>
    );
  }

  if (propertyMatch?.slug) {
    return (
      <AuthProvider>
        <PropertyPage slug={propertyMatch.slug} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

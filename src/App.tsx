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
import { ResidencesShowcase } from './components/home/ResidencesShowcase';
import { ContactSection, ContactIntent } from './components/home/ContactSection';
import { hasIntroPlayed, markIntroPlayed, useFramePreloader } from './lib/frames';
import { ArrowUpRight } from 'lucide-react';
import { usePath, matchRoute, navigate, restorePendingScroll } from './lib/router';
import { PropertyPage } from './pages/PropertyPage';
import { ManagePage } from './pages/ManagePage';
import logoImg from './assets/logo.png';
import footerImg from './assets/footer.webp';

gsap.registerPlugin(ScrollTrigger);

function AppContent() {
  const [properties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookingProperty, setBookingProperty] = useState<Property | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [contactIntent, setContactIntent] = useState<ContactIntent>('sell');
  const [introDone, setIntroDone] = useState<boolean>(() => hasIntroPlayed());
  const returningRef = useRef<boolean>(hasIntroPlayed());
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
    if (sectionId === 'sell') {
      setContactIntent('sell');
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (sectionId === 'contact') {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
    const isReturning = returningRef.current;
    const ctx = gsap.context(() => {
      if (isReturning) {
        gsap.set('[data-reveal]', { autoAlpha: 1, y: 0 });
      } else {
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
      }
    }, root);

    ScrollTrigger.refresh();
    restorePendingScroll();
    if (window.location.hash) {
      const hashId = window.location.hash.slice(1);
      const target = document.getElementById(hashId);
      if (target) target.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }

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
      className="min-h-screen bg-[#ffffff] text-[#181512] selection:bg-[#9A6B3B]/20 selection:text-[#181512]"
    >
      {!introDone && (
        <Preloader
          progress={progress}
          loaded={loaded}
          onComplete={() => {
            markIntroPlayed();
            setIntroDone(true);
          }}
        />
      )}

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

        {/* 3. SHOWCASE — residences portfolio collection */}
        <ResidencesShowcase />

        {/* 4. CONTACT & SELLER ONBOARDING DESK */}
        <ContactSection initialIntent={contactIntent} />
      </main>

      {/* FOOTER & ADVISORY */}
      <footer
        id="advisory"
        className="relative w-full bg-[#ffffff] overflow-hidden min-h-[640px] sm:min-h-[700px] lg:aspect-[2752/1536] lg:min-h-[720px] flex flex-col justify-between"
      >
        {/* Full-bleed Footer Background Image */}
        <img
          src={footerImg}
          alt="Jonopod Properties Architecture"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover object-[76%_bottom] lg:object-bottom"
          loading="lazy"
        />

        {/* Overlaid Footer Content */}
        <div className="relative z-10 max-w-[90rem] mx-auto w-full flex-1 flex flex-col justify-between px-6 md:px-12 lg:px-20 pt-12 sm:pt-16 md:pt-20 pb-8 md:pb-10">
          <div className="lg:max-w-[54%] pt-4 sm:pt-8 md:pt-12 lg:pt-16 mb-auto">
            <img
              src={logoImg}
              alt="Jonopod Properties"
              className="h-10 md:h-12 w-auto object-contain mb-5"
            />
            <p className="font-display font-light text-3xl md:text-4xl text-[#181512] leading-snug max-w-md">
              Buy with comfort, <em className="italic text-[#9A6B3B]">Be in comfort</em>
            </p>

            {/* Contact & Social Icon Buttons: Facebook, Phone, WhatsApp, Telegram */}
            <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-3">
              {/* Facebook Button */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="group w-11 h-11 rounded-full border border-[#181512]/15 bg-white/85 backdrop-blur-md flex items-center justify-center text-[#181512] hover:bg-[#9A6B3B] hover:border-[#9A6B3B] hover:text-white transition-all duration-300 shadow-xs"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* Phone Button */}
              <a
                href="tel:+8801XXXXXXXXX"
                aria-label="Phone"
                title="Phone"
                className="group w-11 h-11 rounded-full border border-[#181512]/15 bg-white/85 backdrop-blur-md flex items-center justify-center text-[#181512] hover:bg-[#9A6B3B] hover:border-[#9A6B3B] hover:text-white transition-all duration-300 shadow-xs"
              >
                <svg
                  className="w-4 h-4 stroke-current fill-none shrink-0"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/8801XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                className="group w-11 h-11 rounded-full border border-[#181512]/15 bg-white/85 backdrop-blur-md flex items-center justify-center text-[#181512] hover:bg-[#9A6B3B] hover:border-[#9A6B3B] hover:text-white transition-all duration-300 shadow-xs"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.758.459 3.473 1.332 4.988L2 22l5.18-1.359a9.927 9.927 0 0 0 4.851 1.259h.004c5.516 0 9.969-4.453 9.969-9.969 0-2.663-1.037-5.167-2.92-7.05A9.904 9.904 0 0 0 12.031 2zm0 18.225h-.003a8.25 8.25 0 0 1-4.207-1.152l-.302-.179-3.133.822.836-3.053-.197-.313a8.234 8.234 0 0 1-1.268-4.381c0-4.553 3.704-8.257 8.277-8.257 2.21 0 4.287.861 5.849 2.424a8.219 8.219 0 0 1 2.422 5.833c0 4.553-3.704 8.256-8.274 8.256zm4.538-6.185c-.249-.125-1.472-.726-1.7-.809-.228-.083-.394-.125-.56.125-.166.249-.643.809-.788.975-.145.166-.29.187-.539.062-.249-.125-1.051-.387-2.002-1.235-.74-.66-1.24-1.474-1.385-1.723-.145-.249-.015-.384.109-.508.112-.112.249-.29.373-.436.125-.145.166-.249.249-.415.083-.166.041-.311-.021-.436-.062-.125-.56-1.349-.768-1.847-.202-.485-.407-.419-.56-.427l-.477-.008c-.166 0-.436.062-.664.311-.228.249-.871.851-.871 2.075s.892 2.407 1.017 2.573c.125.166 1.755 2.68 4.252 3.758.594.256 1.058.409 1.419.524.596.189 1.139.162 1.568.098.478-.071 1.472-.602 1.68-1.183.207-.581.207-1.079.145-1.183-.062-.104-.228-.166-.477-.291z" />
                </svg>
              </a>

              {/* Telegram Button */}
              <a
                href="https://t.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                title="Telegram"
                className="group w-11 h-11 rounded-full border border-[#181512]/15 bg-white/85 backdrop-blur-md flex items-center justify-center text-[#181512] hover:bg-[#9A6B3B] hover:border-[#9A6B3B] hover:text-white transition-all duration-300 shadow-xs"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>

          <div className=" pt-5 border-t border-white/25 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono tracking-[0.26em] uppercase text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            <span>© 2026 Jonopod Properties</span>
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

  return (
    <AuthProvider>
      {isManage ? (
        <ManagePage />
      ) : propertyMatch?.slug ? (
        <PropertyPage slug={propertyMatch.slug} />
      ) : (
        <AppContent />
      )}
    </AuthProvider>
  );
}

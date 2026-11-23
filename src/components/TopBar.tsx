import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bookmark, LayoutDashboard } from 'lucide-react';
import { Link } from '../lib/router';
import logoImg from '../assets/logo.png';

interface TopBarProps {
  onNavigate: (sectionId: string) => void;
  onOpenSavedDrawer: () => void;
}

const NAV_ITEMS = [
  { key: 'buy', id: 'showcase', label: 'Buy' },
  { key: 'sell', id: 'sell', label: 'Sell' },
  { key: 'contact', id: 'contact', label: 'Contact' },
];

export const TopBar: React.FC<TopBarProps> = ({
  onNavigate,
  onOpenSavedDrawer,
}) => {
  const { isAdmin, savedPropertyIds } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const heroEl = document.getElementById('home');
      const pastHero = heroEl ? heroEl.getBoundingClientRect().bottom <= 80 : y > 40;
      setScrolled(pastHero);
      // Tuck away while scrolling down, reveal on scroll up
      if (y > 160 && y > lastY.current + 4) setHidden(true);
      else if (y < lastY.current - 4 || y <= 160) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? 'is-scrolled backdrop-blur-xl bg-[#ffffff]/92 border-b border-[#181512]/[0.09] shadow-[0_10px_30px_-16px_rgba(24,21,18,0.08)]'
          : 'bg-transparent border-b border-transparent shadow-none'
      } ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div className="px-6 md:px-12 lg:px-20 h-20 flex items-center justify-between">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="brand-mark group flex items-center gap-3 text-[#181512] shrink-0"
          aria-label="Jonopod Properties home"
        >
          <img
            src={logoImg}
            alt="Jonopod Properties"
            className="h-8 sm:h-9 md:h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </a>

        <nav
          className={`hidden md:flex items-center gap-9 text-[10.5px] font-mono tracking-[0.26em] uppercase transition-colors duration-500 ${
            scrolled ? 'text-[#4A433B]' : 'text-[#181512]'
          }`}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              id={`nav-${item.key}`}
              onClick={() => onNavigate(item.id)}
              className="relative py-2 hover:text-[#181512] transition-colors cursor-pointer after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-[#9A6B3B] after:origin-right after:scale-x-0 hover:after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-500"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              to="/manage"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#9A6B3B]/40 bg-[#9A6B3B]/10 text-[10px] font-mono tracking-widest text-[#684724] uppercase hover:bg-[#9A6B3B]/20 transition-colors"
              title="Open Atelier Studio Admin"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Studio
            </Link>
          )}

          <button
            id="saved-drawer-btn"
            onClick={onOpenSavedDrawer}
            className={`relative p-2.5 rounded-full border transition-colors cursor-pointer ${
              scrolled
                ? 'border-[#181512]/15 bg-[#ffffff] text-[#3D362E] hover:text-[#181512] hover:border-[#9A6B3B]/60'
                : 'border-[#181512]/20 bg-white/25 backdrop-blur-sm text-[#181512] hover:bg-white/45 hover:border-[#181512]/40'
            }`}
            title="Saved Portfolio Properties"
          >
            <Bookmark className="w-4 h-4" />
            {savedPropertyIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#9A6B3B] text-white font-mono text-[9px] font-bold flex items-center justify-center">
                {savedPropertyIds.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

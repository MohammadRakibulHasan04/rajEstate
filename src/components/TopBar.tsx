import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bookmark, LogOut, LayoutDashboard } from 'lucide-react';
import { Link } from '../lib/router';

interface TopBarProps {
  onNavigate: (sectionId: string) => void;
  onOpenSavedDrawer: () => void;
}

const NAV_ITEMS = [
  { id: 'manifesto', label: 'Philosophy' },
  { id: 'process', label: 'Process' },
  { id: 'showcase', label: 'Residences' },
  { id: 'advisory', label: 'Advisory' },
];

export const TopBar: React.FC<TopBarProps> = ({
  onNavigate,
  onOpenSavedDrawer,
}) => {
  const { user, isAdmin, signInWithGoogle, logOut, savedPropertyIds } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Tuck away while scrolling down, reveal on scroll up
      if (y > 160 && y > lastY.current + 4) setHidden(true);
      else if (y < lastY.current - 4 || y <= 160) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? 'is-scrolled backdrop-blur-xl bg-[#070b14]/70 border-b border-white/[0.06]'
          : 'bg-transparent border-b border-transparent'
      } ${hidden && !showUserDropdown ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div className="px-6 md:px-12 lg:px-20 h-20 flex items-center justify-between">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="brand-mark group flex items-baseline gap-3 text-[#f4efe6] shrink-0"
          aria-label="AURA home"
        >
          <span className="font-display text-[28px] font-normal tracking-[0.18em] leading-none group-hover:text-[#d1ad7a] transition-colors duration-500">
            AURA
          </span>
          <span className="hidden xl:inline text-[9px] font-mono tracking-[0.32em] uppercase text-slate-400">
            Residences
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-9 text-[10.5px] font-mono tracking-[0.26em] uppercase text-slate-300/80">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className="relative py-2 hover:text-white transition-colors cursor-pointer after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-[#d1ad7a] after:origin-right after:scale-x-0 hover:after:origin-left hover:after:scale-x-100 after:transition-transform after:duration-500"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              to="/manage"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#d1ad7a]/40 bg-[#d1ad7a]/10 text-[10px] font-mono tracking-widest text-[#f1dfbd] uppercase hover:bg-[#d1ad7a]/20 transition-colors"
              title="Open Atelier Studio Admin"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Studio
            </Link>
          )}

          <button
            id="saved-drawer-btn"
            onClick={onOpenSavedDrawer}
            className="relative p-2.5 rounded-full border border-white/15 bg-white/[0.03] text-slate-300 hover:text-white hover:border-[#d1ad7a]/60 transition-colors cursor-pointer"
            title="Saved Portfolio Properties"
          >
            <Bookmark className="w-4 h-4" />
            {savedPropertyIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold flex items-center justify-center">
                {savedPropertyIds.length}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName || 'Patron'}</span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl z-50 text-xs font-mono">
                  <div className="px-3 py-2 border-b border-slate-800 text-slate-400">
                    <span className="text-[10px] uppercase text-cyan-400 block">
                      {isAdmin ? 'Architectural Admin' : 'Authenticated Patron'}
                    </span>
                    <span className="text-white truncate block">{user.email}</span>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/manage"
                      onClick={() => setShowUserDropdown(false)}
                      className="w-full text-left px-3 py-2 text-[#f1dfbd] hover:bg-slate-800 rounded-lg flex items-center gap-2 mt-1 cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#d1ad7a]" />
                      <span>Studio Dashboard</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenSavedDrawer();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2 mt-1 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Saved Collection ({savedPropertyIds.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logOut();
                    }}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/30 rounded-lg flex items-center gap-2 mt-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="sign-in-btn"
              onClick={() => signInWithGoogle()}
              className="ml-1 px-5 py-2.5 text-[10.5px] font-mono tracking-[0.22em] uppercase text-[#120d07] bg-[#f4efe6] hover:bg-[#d1ad7a] rounded-full transition-colors duration-500 whitespace-nowrap cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

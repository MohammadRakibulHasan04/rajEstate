import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Pencil,
  Share2,
  X,
} from 'lucide-react';
import { Listing } from '../../types/listing';
import { Link } from '../../lib/router';
import logoImg from '../../assets/logo.png';

interface PropertyMobileHeaderProps {
  listing: Listing;
  navItems: [id: string, label: string][];
  activeSection: string;
  onNavigate: (id: string) => void;
  onBack: () => void;
  isDraft?: boolean;
  isAdmin?: boolean;
  saved: boolean;
  onToggleSave: () => void;
  copied: boolean;
  onShare: () => void;
}

export const PropertyMobileHeader: React.FC<PropertyMobileHeaderProps> = ({
  listing,
  navItems,
  activeSection,
  onNavigate,
  onBack,
  isDraft = false,
  isAdmin = false,
  saved,
  onToggleSave,
  copied,
  onShare,
}) => {
  const [open, setOpen] = useState(false);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleItemClick = (id: string) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <>
      {/* ── Sticky Top Header for Mobile/Tablet (< lg) ───────────── */}
      <header
        className={`lg:hidden fixed inset-x-0 ${
          isDraft ? 'top-7' : 'top-0'
        } z-[90] bg-[#ffffff]/94 backdrop-blur-xl border-b border-[#181512]/[0.08] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3`}
        aria-label="Mobile navigation"
      >
        {/* Left: Brand logo & Back button */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="shrink-0 flex items-center pr-2.5 border-r border-[#181512]/12"
            title="Jonopod Properties"
          >
            <img src={logoImg} alt="Jonopod Properties" className="h-6 w-auto object-contain" />
          </Link>
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-1.5 text-[11px] font-mono tracking-[0.2em] uppercase text-[#3D362E] hover:text-[#9A6B3B] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        </div>

        {/* Right: Quick Actions & Animated Hamburger Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onShare}
            className="p-2 rounded-full border border-[#181512]/15 bg-white text-[#3D362E] hover:text-[#181512] hover:border-[#9A6B3B]/60 transition-colors cursor-pointer"
            aria-label={copied ? 'Link copied' : 'Share property'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#9A6B3B]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onToggleSave}
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              saved
                ? 'border-[#9A6B3B] text-[#9A6B3B] bg-[#9A6B3B]/12'
                : 'border-[#181512]/15 bg-white text-[#3D362E] hover:text-[#181512] hover:border-[#9A6B3B]/60'
            }`}
            aria-label={saved ? 'Remove from saved' : 'Save this property'}
            aria-pressed={saved}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>

          {/* Aesthetic Animated Burger Toggle Button */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            className="relative w-9 h-9 rounded-full border border-[#181512]/15 bg-white text-[#181512] flex items-center justify-center hover:border-[#9A6B3B]/60 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B3B]"
          >
            <div className="w-4 h-3.5 relative flex flex-col justify-between" aria-hidden="true">
              <span
                className={`block h-[1.5px] w-full bg-[#181512] rounded-full transition-transform duration-300 origin-center ${
                  open ? 'translate-y-[6px] rotate-45' : ''
                }`}
              />
              <span
                className={`block h-[1.5px] w-full bg-[#181512] rounded-full transition-opacity duration-200 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`block h-[1.5px] w-full bg-[#181512] rounded-full transition-transform duration-300 origin-center ${
                  open ? '-translate-y-[6px] -rotate-45' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* ── Slide-in Drawer & Backdrop ───────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[110] bg-[#181512]/50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />

            {/* Drawer Container */}
            <motion.div
              key="mobile-nav-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-[120] w-[86vw] max-w-sm sm:max-w-md bg-[#ffffff] shadow-[0_0_60px_rgba(24,21,18,0.28)] flex flex-col lg:hidden border-l border-[#181512]/10"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation directory"
            >
              {/* Drawer Header: Logo + Close Button */}
              <div className="p-5 sm:p-6 border-b border-[#181512]/[0.08] flex items-center justify-between shrink-0">
                <Link to="/" onClick={() => setOpen(false)} className="flex items-center">
                  <img src={logoImg} alt="Jonopod Properties" className="h-6.5 w-auto object-contain" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-full border border-[#181512]/12 bg-[#FAF7F2] text-[#3D362E] hover:text-[#181512] hover:border-[#9A6B3B]/60 transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Staggered Navigation Items */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4">
                <div className="text-[9.5px] font-mono uppercase tracking-[0.26em] text-[#8C8273] font-semibold mb-3">
                  Directory
                </div>
                <motion.ul
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.04, delayChildren: 0.05 },
                    },
                  }}
                  className="space-y-1.5"
                >
                  {navItems.map(([id, label], idx) => {
                    const isActive = activeSection === id;
                    return (
                      <motion.li
                        key={id}
                        variants={{
                          hidden: { opacity: 0, x: 16 },
                          show: { opacity: 1, x: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.35 } },
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleItemClick(id)}
                          className={`w-full group flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#9A6B3B]/10 text-[#9A6B3B] font-semibold'
                              : 'text-[#3D362E] hover:text-[#181512] hover:bg-[#181512]/[0.03]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`text-[10px] font-mono tracking-wider ${
                                isActive ? 'text-[#9A6B3B] font-bold' : 'text-[#8C8273]'
                              }`}
                            >
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[13px] font-mono tracking-[0.18em] uppercase truncate">
                              {label}
                            </span>
                          </div>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#9A6B3B] shrink-0" />}
                        </button>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </div>

              {/* Drawer Bottom Zone: Save, Share, and Admin Edit */}
              <div className="p-5 sm:p-6 border-t border-[#181512]/[0.08] bg-[#FAF7F2]/80 shrink-0 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onToggleSave}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-[11px] font-mono tracking-wider transition-colors cursor-pointer w-full ${
                      saved
                        ? 'border-[#9A6B3B] text-[#9A6B3B] bg-[#9A6B3B]/12 font-medium'
                        : 'border-[#181512]/12 bg-white text-[#3D362E] hover:text-[#181512] hover:border-[#9A6B3B]/50'
                    }`}
                    title={saved ? 'Remove bookmark' : 'Save property'}
                    aria-label={saved ? 'Remove bookmark' : 'Save property'}
                    aria-pressed={saved}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                    <span>{saved ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onShare}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-[#181512]/12 bg-white text-[#3D362E] hover:text-[#181512] hover:border-[#9A6B3B]/50 text-[11px] font-mono tracking-wider transition-colors cursor-pointer w-full"
                    title={copied ? 'Link copied to clipboard' : 'Share property'}
                    aria-label={copied ? 'Link copied' : 'Share property'}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#9A6B3B]" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                  </button>
                </div>

                {isAdmin && (
                  <Link
                    to={`/manage/edit/${listing.id}`}
                    onClick={() => setOpen(false)}
                    className="btn-quiet !w-full !py-2 text-[10.5px] font-mono tracking-wider text-[#9A6B3B] flex items-center justify-center gap-2"
                    title="Edit listing details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Listing</span>
                  </Link>
                )}

                <div className="text-[9px] font-mono tracking-[0.22em] uppercase text-[#8C8273] text-center pt-0.5">
                  Jonopod · Architectural Portfolio
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

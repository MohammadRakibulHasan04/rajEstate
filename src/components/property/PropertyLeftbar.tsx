import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bookmark, Check, Pencil, Share2 } from 'lucide-react';
import { Listing } from '../../types/listing';
import { Link } from '../../lib/router';
import logoImg from '../../assets/logo.png';

interface PropertyLeftbarProps {
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

export const PropertyLeftbar: React.FC<PropertyLeftbarProps> = ({
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
  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 ${
        isDraft ? 'top-7 h-[calc(100vh-28px)]' : 'top-0 h-screen'
      } w-64 xl:w-72 2xl:w-80 z-40 bg-[#ffffff] border-r border-[#181512]/[0.08] select-none`}
      aria-label="Property navigation leftbar"
    >
      {/* ── 1. Top Section: Brand Logo & Back ──────────────────────── */}
      <div className="p-5 xl:p-6 border-b border-[#181512]/[0.08] shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center group transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B3B]"
            title="Jonopod Properties Home"
          >
            <img src={logoImg} alt="Jonopod Properties" className="h-6.5 xl:h-7 w-auto object-contain" />
          </Link>
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-1.5 text-[10.5px] font-mono tracking-[0.24em] uppercase text-[#5C5346] hover:text-[#9A6B3B] transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* ── 2. Middle Section: Vertical Navigation Menu ────────────── */}
      <div className="flex-1 min-h-0 flex flex-col py-3">
        <div className="px-5 xl:px-6 py-1.5 text-[9px] font-mono uppercase tracking-[0.28em] text-[#8C8273] font-semibold shrink-0">
          Directory
        </div>
        <nav className="flex-1 overflow-y-auto px-3 xl:px-4 py-1 space-y-0.5 [scrollbar-width:thin]" aria-label="Page Sections">
          {navItems.map(([id, label], idx) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`w-full group relative flex items-center justify-between px-3 xl:px-3.5 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#9A6B3B]/10 text-[#9A6B3B] font-semibold'
                    : 'text-[#5C5346] hover:text-[#181512] hover:bg-[#181512]/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2.5 xl:gap-3 min-w-0">
                  <span
                    className={`text-[9.5px] font-mono tracking-wider transition-colors ${
                      isActive ? 'text-[#9A6B3B]' : 'text-[#A09687] group-hover:text-[#5C5346]'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] xl:text-[11.5px] font-mono tracking-[0.18em] uppercase truncate">
                    {label}
                  </span>
                </div>
                {isActive && (
                  <motion.span
                    layoutId="leftbar-active-dot"
                    className="w-1.5 h-1.5 rounded-full bg-[#9A6B3B] shrink-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── 3. Bottom Section: Quick Utilities (Save, Share, Admin Edit) ── */}
      <div className="p-4 xl:p-5 border-t border-[#181512]/[0.08] bg-[#FAF7F2]/60 shrink-0 space-y-2.5">
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
    </aside>
  );
};

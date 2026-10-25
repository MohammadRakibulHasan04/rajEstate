import React, { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, Phone } from 'lucide-react';
import { Listing } from '../../types/listing';
import { priceLabel } from '../../lib/significance';
import { useAuth } from '../../context/AuthContext';
import { telHref } from './InquiryPanel';

/**
 * Floating action dock: price + primary actions, shown after the hero
 * and hidden while the inquiry form itself is on screen.
 */
export const ActionDock: React.FC<{ listing: Listing; onInquire: () => void }> = ({ listing, onInquire }) => {
  const { isPropertySaved, toggleSaveProperty } = useAuth();
  const [visible, setVisible] = useState(false);
  const saved = isPropertySaved(listing.id);

  useEffect(() => {
    const inquiry = document.getElementById('inquiry');
    let pastHero = false;
    let inquiryVisible = false;
    const update = () => setVisible(pastHero && !inquiryVisible);

    const onScroll = () => {
      pastHero = window.scrollY > window.innerHeight * 0.8;
      update();
    };
    const io = new IntersectionObserver(([e]) => {
      inquiryVisible = e.isIntersecting;
      update();
    }, { threshold: 0.15 });
    if (inquiry) io.observe(inquiry);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, [listing.id]);

  return (
    <div
      className="dock fixed bottom-4 md:bottom-6 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-3xl"
      data-visible={visible}
      aria-hidden={!visible}
    >
      <div className="panel-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg leading-tight truncate text-[#f4efe6]">{listing.titleBn || listing.title}</div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-gradient-gold truncate">{priceLabel(listing)}</div>
        </div>
        <button
          id="dock-save"
          onClick={() => toggleSaveProperty(listing.id)}
          className={`p-3 rounded-full border transition-colors cursor-pointer ${saved ? 'border-[#d1ad7a] text-[#d1ad7a] bg-[#d1ad7a]/10' : 'border-white/15 text-slate-300 hover:text-white'}`}
          aria-label={saved ? 'Remove from saved' : 'Save this home'}
          tabIndex={visible ? 0 : -1}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
        {listing.contact.phone && (
          <a
            id="dock-call"
            href={telHref(listing.contact.phone)}
            className="hidden sm:inline-flex p-3 rounded-full border border-white/15 text-slate-300 hover:text-white"
            aria-label="Call"
            tabIndex={visible ? 0 : -1}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
        <button id="dock-inquire" onClick={onInquire} className="btn-gold !py-3 !px-5 !text-[10px]" tabIndex={visible ? 0 : -1}>
          <span className="hidden sm:inline">Arrange a visit</span>
          <span className="sm:hidden">Visit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

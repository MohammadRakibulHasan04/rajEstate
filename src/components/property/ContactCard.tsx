import React from 'react';
import { Clock, Mail, MapPin, MessageCircle, Phone, UserRound } from 'lucide-react';
import { Listing } from '../../types/listing';
import { priceLabel, pricePerSqft, unitStats } from '../../lib/significance';
import { formatNumber } from '../../lib/format';
import { hasAnyContact, mailHref, telHref, waHref } from '../../lib/contact';

interface Props {
  listing: Listing;
  onEnquire: () => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Price and the person to talk to. Sticky beside the content on desktop. */
export const ContactCard: React.FC<Props> = ({ listing, onEnquire }) => {
  const c = listing.contact;
  const stats = listing.kind === 'project' ? unitStats(listing) : null;
  const ppsf = listing.kind === 'project' ? null : pricePerSqft(listing);
  const whatsapp = c.whatsapp?.trim() || '';
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const waText = `Hello, I'm interested in ${listing.title}. ${pageUrl}`;

  return (
    <div className="panel p-6 sm:p-7 space-y-6" id="contact-card">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="mono-label">{listing.kind === 'project' ? 'Starting From' : 'Asking Price'}</span>
          {listing.price.negotiable && listing.kind !== 'project' && (
            <span className="px-2.5 py-0.5 rounded-full border border-[#9A6B3B]/40 bg-[#9A6B3B]/10 text-[9.5px] font-mono tracking-[0.2em] uppercase text-[#684724]">
              Negotiable
            </span>
          )}
        </div>
        <div className="mt-1.5 font-display font-light text-4xl text-gradient-gold leading-tight">{priceLabel(listing).replace(/^From /, '')}</div>
        {ppsf && <div className="mt-1 text-xs font-mono text-[#786F63]">৳ {formatNumber(ppsf)} per sq ft</div>}
        {stats && stats.total > 0 && (
          <div className="mt-1 text-xs font-mono text-[#786F63]">
            {stats.available} of {stats.total} units available
          </div>
        )}
      </div>

      {(c.name || c.company) && (
        <div className="flex items-center gap-4 pt-5 border-t border-[#181512]/[0.08]">
          <span className="w-12 h-12 rounded-full bg-[#9A6B3B]/12 border border-[#9A6B3B]/30 text-[#684724] flex items-center justify-center font-medium shrink-0">
            {c.name ? initials(c.name) : <UserRound className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-[#181512] truncate">{c.name || c.company}</div>
            {(c.designation || (c.name && c.company)) && (
              <div className="text-[13px] text-[#6E6559] truncate">{[c.designation, c.name ? c.company : undefined].filter(Boolean).join(', ')}</div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <button type="button" id="card-enquire" onClick={onEnquire} className="btn-gold w-full justify-center">
          Request a Visit
        </button>
        {hasAnyContact(c) && (
          <div className={`grid ${c.phone && whatsapp ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
            {c.phone && (
              <a id="card-call" href={telHref(c.phone)} className="btn-quiet justify-center !py-3">
                <Phone className="w-3.5 h-3.5 text-[#9A6B3B]" /> Call
              </a>
            )}
            {whatsapp && (
              <a id="card-whatsapp" href={waHref(whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="btn-quiet justify-center !py-3">
                <MessageCircle className="w-3.5 h-3.5 text-[#9A6B3B]" /> WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {(c.phone || c.email || c.hours || c.address) && (
        <ul className="space-y-2.5 pt-5 border-t border-[#181512]/[0.08] text-[13px] text-[#4A433B]">
          {c.phone && (
            <li className="flex items-center gap-3">
              <Phone className="w-3.5 h-3.5 text-[#9A6B3B] shrink-0" />
              <a href={telHref(c.phone)} className="hover:text-[#9A6B3B]">{c.phone}</a>
            </li>
          )}
          {c.email && (
            <li className="flex items-center gap-3 min-w-0">
              <Mail className="w-3.5 h-3.5 text-[#9A6B3B] shrink-0" />
              <a href={mailHref(c.email, listing.title)} className="hover:text-[#9A6B3B] truncate">{c.email}</a>
            </li>
          )}
          {c.hours && (
            <li className="flex items-center gap-3">
              <Clock className="w-3.5 h-3.5 text-[#9A6B3B] shrink-0" />
              <span>{c.hours}</span>
            </li>
          )}
          {c.address && (
            <li className="flex items-start gap-3">
              <MapPin className="w-3.5 h-3.5 text-[#9A6B3B] shrink-0 mt-0.5" />
              <span>{c.address}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

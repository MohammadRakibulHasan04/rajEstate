import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react';
import { Listing } from '../../types/listing';
import { TourInquiry } from '../../types/property';
import { useAuth } from '../../context/AuthContext';

type TourType = TourInquiry['tourType'];

const TOUR_OPTIONS: { value: TourType; label: string; hint: string }[] = [
  { value: 'in-person', label: 'Site visit', hint: 'Walk the home with an advisor' },
  { value: 'virtual-3d', label: 'Video walkthrough', hint: 'A live guided call' },
  { value: 'architectural-consultation', label: 'Consultation', hint: 'Pricing, payment and paperwork' },
];

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
export const waHref = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

export const InquiryPanel: React.FC<{ listing: Listing; prefill?: string }> = ({ listing, prefill }) => {
  const { submitInquiry, user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.displayName ?? '',
    email: user?.email ?? '',
    phone: '',
    tourType: 'in-person' as TourType,
    preferredDate: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, message: prefill }));
  }, [prefill]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.fullName.trim().length > 1 && (form.phone.trim().length >= 6 || /\S+@\S+\.\S+/.test(form.email));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setStatus('sending');
    try {
      const ok = await submitInquiry({ ...form, propertyId: listing.id, propertyTitle: listing.title });
      setStatus(ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const contact = listing.contact;
  const waText = `Hello, I'm interested in ${listing.title} (${window.location.href}).`;

  return (
    <section id="inquiry" className="relative overflow-hidden py-28 md:py-40 border-t border-white/[0.06]">
      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 whitespace-nowrap font-display font-light text-[22vw] leading-none select-none"
      >
        Visit
      </span>

      <div className="relative max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-5" data-reveal>
          <div className="eyebrow mb-7">Arrange a private visit</div>
          <h2 className="font-display font-light text-5xl sm:text-6xl leading-[0.95] tracking-[-0.02em]">
            আপনার নতুন ঠিকানা <em className="italic text-gradient-gold">অপেক্ষায়।</em>
          </h2>
          <p className="mt-7 text-[15px] text-slate-300/90 font-light leading-relaxed max-w-md">
            An advisor who knows this home will reply within one working day. There's no pressure and no obligation.
          </p>

          <div className="mt-10 space-y-3">
            {contact.phone && (
              <a id="contact-call" href={telHref(contact.phone)} className="group flex items-center gap-4 p-4 rounded-2xl panel hover:border-[#d1ad7a]/40 transition-colors">
                <span className="p-3 rounded-xl bg-[#d1ad7a]/10 text-[#d1ad7a]"><Phone className="w-5 h-5" /></span>
                <span>
                  <span className="mono-label block">Call</span>
                  <span className="text-[#f4efe6] group-hover:text-[#d1ad7a] transition-colors">{contact.phone}</span>
                </span>
              </a>
            )}
            {contact.whatsapp && (
              <a id="contact-whatsapp" href={waHref(contact.whatsapp, waText)} target="_blank" rel="noreferrer" className="group flex items-center gap-4 p-4 rounded-2xl panel hover:border-[#d1ad7a]/40 transition-colors">
                <span className="p-3 rounded-xl bg-[#d1ad7a]/10 text-[#d1ad7a]"><MessageCircle className="w-5 h-5" /></span>
                <span>
                  <span className="mono-label block">WhatsApp</span>
                  <span className="text-[#f4efe6] group-hover:text-[#d1ad7a] transition-colors">{contact.whatsapp}</span>
                </span>
              </a>
            )}
            {contact.email && (
              <a id="contact-email" href={`mailto:${contact.email}?subject=${encodeURIComponent(listing.title)}`} className="group flex items-center gap-4 p-4 rounded-2xl panel hover:border-[#d1ad7a]/40 transition-colors">
                <span className="p-3 rounded-xl bg-[#d1ad7a]/10 text-[#d1ad7a]"><Mail className="w-5 h-5" /></span>
                <span>
                  <span className="mono-label block">Email</span>
                  <span className="text-[#f4efe6] group-hover:text-[#d1ad7a] transition-colors">{contact.email}</span>
                </span>
              </a>
            )}
          </div>
        </div>

        <div className="lg:col-span-7" data-reveal>
          {status === 'sent' ? (
            <div className="panel panel-glass p-10 md:p-14 text-center h-full flex flex-col items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-[#d1ad7a]" />
              <h3 className="mt-6 font-display text-4xl">ধন্যবাদ, {form.fullName.split(' ')[0]}.</h3>
              <p className="mt-4 text-slate-400 max-w-sm">Your request for {listing.title} has been received. We'll be in touch shortly.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="panel panel-glass p-7 md:p-10 space-y-6" noValidate>
              <fieldset>
                <legend className="mono-label mb-3">How would you like to see it?</legend>
                <div className="grid sm:grid-cols-3 gap-3">
                  {TOUR_OPTIONS.map((o) => (
                    <button
                      type="button"
                      key={o.value}
                      id={`tour-${o.value}`}
                      onClick={() => set('tourType', o.value)}
                      className={`text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        form.tourType === o.value ? 'border-[#d1ad7a]/70 bg-[#d1ad7a]/10' : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <span className="block text-sm text-[#f4efe6]">{o.label}</span>
                      <span className="block text-[12px] text-slate-500 mt-1">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="mono-label block mb-2">Full name *</span>
                  <input id="inq-name" className="lux-input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" required />
                </label>
                <label className="block">
                  <span className="mono-label block mb-2">Phone *</span>
                  <input id="inq-phone" className="lux-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+880" autoComplete="tel" inputMode="tel" />
                </label>
                <label className="block">
                  <span className="mono-label block mb-2">Email</span>
                  <input id="inq-email" type="email" className="lux-input" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                </label>
                <label className="block">
                  <span className="mono-label block mb-2">Preferred date</span>
                  <input id="inq-date" type="date" className="lux-input" value={form.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} />
                </label>
              </div>
              <label className="block">
                <span className="mono-label block mb-2">Message</span>
                <textarea id="inq-message" className="lux-textarea" rows={4} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Anything we should know: budget, timing, questions…" />
              </label>

              {status === 'error' && <p className="text-sm text-red-300">Something went wrong. Please call us or try again.</p>}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <span className="text-[12px] text-slate-500">Name and a phone or email are needed so we can reply.</span>
                <button id="inq-submit" type="submit" disabled={!valid || status === 'sending'} className="btn-gold justify-center">
                  {status === 'sending' ? 'Sending…' : 'Request visit'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

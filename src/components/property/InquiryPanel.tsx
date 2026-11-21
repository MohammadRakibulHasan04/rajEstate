import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Listing } from '../../types/listing';
import { TourInquiry } from '../../types/property';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhone } from '../../lib/contact';
import { displayTitle, hasCustomName, isPriceAsTitle } from '../../lib/significance';

/** @deprecated import from lib/contact instead. */
export { telHref, waHref } from '../../lib/contact';

type TourType = TourInquiry['tourType'];

const TOUR_OPTIONS: { value: TourType; label: string; hint: string }[] = [
  { value: 'in-person', label: 'Site Visit', hint: 'Visit the property with an advisor' },
  { value: 'virtual-3d', label: 'Video Call', hint: 'A live guided walkthrough' },
  { value: 'architectural-consultation', label: 'Consultation', hint: 'Pricing, payment and paperwork' },
];

const today = () => new Date().toISOString().slice(0, 10);

/** Enquiry form. Contact details live in the sticky contact card, so they are not repeated here. */
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
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (prefill) setForm((f) => ({ ...f, message: prefill }));
  }, [prefill]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const errors = {
    fullName: form.fullName.trim().length < 2 ? 'Please enter your name.' : '',
    phone: form.phone.trim() && !isValidPhone(form.phone) ? 'Please enter a valid phone number.' : '',
    email: form.email.trim() && !isValidEmail(form.email) ? 'Please enter a valid email address.' : '',
    reach: !form.phone.trim() && !form.email.trim() ? 'A phone number or email is required.' : '',
  };
  const valid = !Object.values(errors).some(Boolean);

  const titleLabel =
    isPriceAsTitle(listing) && hasCustomName(listing)
      ? `${displayTitle(listing)} (${listing.title})`
      : displayTitle(listing);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || status === 'sending') return;
    setStatus('sending');
    try {
      const ok = await submitInquiry({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        propertyId: listing.id,
        propertyTitle: titleLabel,
      });
      setStatus(ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const err = (msg: string) => (touched && msg ? <p className="mt-1.5 text-[12px] text-red-600">{msg}</p> : null);

  return (
    <section id="inquiry" aria-labelledby="inquiry-heading" className="scroll-mt-24 py-20 md:py-28 bg-[#FAF7F2] border-t border-[#181512]/[0.08]">
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-4" data-reveal>
          <div className="eyebrow mb-5">Enquiry</div>
          <h2 id="inquiry-heading" className="font-display text-3xl md:text-4xl leading-[1.25] text-[#181512]">
            Request a Visit
          </h2>
          <p className="mt-5 text-[15px] text-[#4A433B] leading-relaxed">
            Share your details and an advisor will get back to you within one working day.
          </p>
        </div>

        <div className="lg:col-span-8" data-reveal>
          {status === 'sent' ? (
            <div className="panel p-10 text-center flex flex-col items-center" role="status">
              <CheckCircle2 className="w-12 h-12 text-[#9A6B3B]" />
              <h3 className="mt-5 font-display text-3xl text-[#181512]">Thank you, {form.fullName.trim().split(' ')[0]}</h3>
              <p className="mt-3 text-[#4A433B] max-w-sm">Your request for {displayTitle(listing)} has been received. We will contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="panel p-7 md:p-9 space-y-6" noValidate>
              <fieldset>
                <legend className="mono-label mb-3">Visit Type</legend>
                <div className="grid sm:grid-cols-3 gap-3" role="radiogroup">
                  {TOUR_OPTIONS.map((o) => (
                    <button
                      type="button"
                      key={o.value}
                      id={`tour-${o.value}`}
                      role="radio"
                      aria-checked={form.tourType === o.value}
                      onClick={() => set('tourType', o.value)}
                      className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                        form.tourType === o.value ? 'border-[#9A6B3B] bg-[#9A6B3B]/10' : 'border-[#181512]/12 bg-white hover:border-[#181512]/25'
                      }`}
                    >
                      <span className="block text-sm text-[#181512] font-medium">{o.label}</span>
                      <span className="block text-[12px] text-[#6E6559] mt-1">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="mono-label block mb-2">Full Name *</span>
                  <input id="inq-name" className="lux-input" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" aria-invalid={touched && !!errors.fullName} maxLength={120} />
                  {err(errors.fullName)}
                </label>
                <label className="block">
                  <span className="mono-label block mb-2">Phone</span>
                  <input id="inq-phone" className="lux-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+880 1XXX-XXXXXX" autoComplete="tel" inputMode="tel" aria-invalid={touched && !!(errors.phone || errors.reach)} maxLength={20} />
                  {err(errors.phone || errors.reach)}
                </label>
                <label className="block">
                  <span className="mono-label block mb-2">Email</span>
                  <input id="inq-email" type="email" className="lux-input" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" aria-invalid={touched && !!errors.email} maxLength={160} />
                  {err(errors.email)}
                </label>
                <label className="block">
                  <span className="mono-label block mb-2">Preferred Date</span>
                  <input id="inq-date" type="date" min={today()} className="lux-input" value={form.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} />
                </label>
              </div>
              <label className="block">
                <span className="mono-label block mb-2">Message</span>
                <textarea id="inq-message" className="lux-textarea" rows={4} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Budget, timing or any questions" maxLength={2000} />
              </label>

              {status === 'error' && <p className="text-sm text-red-600" role="alert">Something went wrong. Please try again or call us directly.</p>}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <span className="text-[12px] text-[#6E6559]">Your name and a phone number or email are required.</span>
                <button id="inq-submit" type="submit" disabled={status === 'sending'} className="btn-gold justify-center">
                  {status === 'sending' ? 'Sending…' : 'Send Request'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

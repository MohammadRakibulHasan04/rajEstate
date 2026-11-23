import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, isValidPhone } from '../../lib/contact';

export type ContactIntent = 'sell' | 'buy' | 'general';

interface ContactSectionProps {
  initialIntent?: ContactIntent;
}

const INTENT_OPTIONS: {
  value: ContactIntent;
  badge: string;
  label: string;
  hint: string;
}[] = [
    {
      value: 'sell',
      badge: 'Sell',
      label: 'প্রপার্টি বিক্রি',
      hint: 'আপনার ফ্ল্যাট বা জমি আমাদের মাধ্যমে বিক্রি করুন',
    },
    {
      value: 'buy',
      badge: 'Buy',
      label: 'প্রপার্টি কেনা / ভিজিট',
      hint: 'পছন্দের প্রপার্টি সরাসরি ঘুরে দেখুন',
    },
    {
      value: 'general',
      badge: 'Contact',
      label: 'সাধারণ জিজ্ঞাসা',
      hint: 'যেকোনো তথ্য বা পরামর্শের জন্য কথা বলুন',
    },
  ];

export const ContactSection: React.FC<ContactSectionProps> = ({ initialIntent = 'sell' }) => {
  const { submitInquiry, user } = useAuth();
  const [intent, setIntent] = useState<ContactIntent>(initialIntent);

  useEffect(() => {
    setIntent(initialIntent);
  }, [initialIntent]);

  const [form, setForm] = useState({
    fullName: user?.displayName ?? '',
    phone: '',
    email: user?.email ?? '',
    location: '',
    propertySpec: '',
    message: '',
  });
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const errors = {
    fullName: form.fullName.trim().length < 2 ? 'আপনার নাম লিখুন।' : '',
    phone:
      form.phone.trim() && !isValidPhone(form.phone)
        ? 'সঠিক ফোন নম্বর দিন।'
        : '',
    email:
      form.email.trim() && !isValidEmail(form.email)
        ? 'সঠিক ইমেইল এড্রেস দিন।'
        : '',
    reach:
      !form.phone.trim() && !form.email.trim()
        ? 'যোগাযোগের জন্য ফোন নম্বর বা ইমেইল দিন।'
        : '',
  };

  const valid = !Object.values(errors).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || status === 'sending') return;

    setStatus('sending');

    const loc = form.location.trim();
    const spec = form.propertySpec.trim();
    const msg = form.message.trim();

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      tourType:
        intent === 'buy'
          ? ('in-person' as const)
          : ('architectural-consultation' as const),
      preferredDate: new Date().toISOString().slice(0, 10),
      message: msg,
      intent,
      ...(loc ? { location: loc } : {}),
      ...(intent === 'sell' && spec ? { propertySpec: spec } : {}),
      source: 'contact-section' as const,
      propertyId:
        intent === 'sell'
          ? 'contact-sell'
          : intent === 'buy'
            ? 'contact-buy'
            : 'contact-general',
      propertyTitle:
        intent === 'sell'
          ? `Sell Property Request${loc ? ` · ${loc}` : ''}`
          : intent === 'buy'
            ? `Buy / Visit Request${loc ? ` · ${loc}` : ''}`
            : `General Contact${loc ? ` · ${loc}` : ''}`,
    };

    let syncedToFirestore = false;
    try {
      syncedToFirestore = await submitInquiry(payload);
    } catch {
      syncedToFirestore = false;
    }

    if (!syncedToFirestore) {
      try {
        const existing = localStorage.getItem('jonopod_contact_inquiries');
        const list = existing ? JSON.parse(existing) : [];
        localStorage.setItem(
          'jonopod_contact_inquiries',
          JSON.stringify([
            ...(Array.isArray(list) ? list : []),
            {
              ...payload,
              id: `local-${Date.now()}`,
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
          ])
        );
      } catch {
        // ignore localStorage errors
      }
    }

    setStatus('sent');
  };

  const err = (msg: string) =>
    touched && msg ? (
      <p lang="bn" className="font-bn mt-1.5 text-[13px] text-red-600">
        {msg}
      </p>
    ) : null;

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative overflow-hidden bg-[#ffffff] text-[#181512] border-t border-[#181512]/[0.07] pt-28 pb-10 md:pt-36 md:pb-14"
    >
      {/* Decorative architectural outline watermark */}
      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute top-10 right-0 whitespace-nowrap font-display font-light italic text-[17vw] leading-none select-none opacity-60"
      >
        Contact
      </span>

      <div className="relative max-w-[90rem] mx-auto px-6 md:px-12 lg:px-20 space-y-12">
        {/* 1. Editorial Header (Alinur Nakkhatra) & Short Casual Description (Purno Pran) */}
        <div className="max-w-3xl" data-reveal>
          <div className="eyebrow mb-5">Contact</div>
          <h2
            id="contact-heading"
            lang="bn"
            className="font-nakkhatra font-normal text-4xl sm:text-5xl lg:text-6xl leading-[1.32] tracking-normal py-1 text-[#181512]"
          >
            প্রপার্টি বিক্রির জন্য{' '}
            <span className="text-gradient-gold">আমাদের সাথে যোগাযোগ করুন</span>
          </h2>
          <p
            lang="bn"
            className="font-bn mt-4 text-lg sm:text-xl text-[#4A433B] leading-[1.7] max-w-2xl"
          >
            ফ্ল্যাট বা জমি বিক্রি করতে চান, কিংবা পছন্দের প্রপার্টি খুঁজছেন? নিচের ফর্মে আপনার তথ্য দিয়ে রাখুন বা সরাসরি কল করুন।
          </p>
        </div>

        {/* 2. Two-Column Layout: Left Direct Contact Channels | Right Interactive Form */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Direct Contact Channels */}
          <div className="lg:col-span-4 space-y-5" data-reveal>


            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
              <a
                href="tel:+8801XXXXXXXXX"
                className="group rounded-2xl border border-[#181512]/10 bg-[#ffffff] p-4 sm:p-5 hover:border-[#9A6B3B]/60 transition-all duration-300 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-[#9A6B3B]/10 text-[#9A6B3B] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-medium text-[#181512] leading-snug">
                      Phone
                    </div>
                    <div className="text-xs font-mono text-[#6E6559] mt-0.5">
                      +880 1XXX-XXXXXX
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#786F63] group-hover:text-[#9A6B3B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </a>

              <a
                href="https://wa.me/8801XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-[#181512]/10 bg-[#ffffff] p-4 sm:p-5 hover:border-[#9A6B3B]/60 transition-all duration-300 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-[#9A6B3B]/10 text-[#9A6B3B] flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-medium text-[#181512] leading-snug">
                      WhatsApp
                    </div>
                    <div className="text-xs font-mono text-[#6E6559] mt-0.5">
                      +880 1XXX-XXXXXX
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#786F63] group-hover:text-[#9A6B3B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </a>

              <a
                href="mailto:info@jonopodproperties.com"
                className="group rounded-2xl border border-[#181512]/10 bg-[#ffffff] p-4 sm:p-5 hover:border-[#9A6B3B]/60 transition-all duration-300 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-[#9A6B3B]/10 text-[#9A6B3B] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-medium text-[#181512] leading-snug">
                      Mail
                    </div>
                    <div className="text-xs font-mono text-[#6E6559] mt-0.5 truncate">
                      info@jonopodproperties.com
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#786F63] group-hover:text-[#9A6B3B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-[#181512]/10 bg-[#ffffff] p-4 sm:p-5 hover:border-[#9A6B3B]/60 transition-all duration-300 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-10 h-10 rounded-full bg-[#9A6B3B]/10 text-[#9A6B3B] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-medium text-[#181512] leading-snug">
                      Facebook
                    </div>
                    <div lang="bn" className="font-bn text-sm text-[#6E6559] mt-0.5">
                      আপডেট পেতে সাথে থাকুন
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#786F63] group-hover:text-[#9A6B3B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-8" data-reveal>
            {status === 'sent' ? (
              <div
                className="panel p-10 md:p-14 text-center flex flex-col items-center justify-center min-h-[420px] space-y-4"
                role="status"
              >
                <div className="w-16 h-16 rounded-full bg-[#9A6B3B]/12 border border-[#9A6B3B]/30 flex items-center justify-center text-[#9A6B3B]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3
                  lang="bn"
                  className="font-nakkhatra font-normal text-3xl sm:text-4xl text-[#181512]"
                >
                  ধন্যবাদ, আপনার বার্তা পেয়েছি!
                </h3>
                <p
                  lang="bn"
                  className="font-bn text-base sm:text-lg text-[#4A433B] max-w-md leading-[1.7]"
                >
                  খুব শীঘ্রই আমাদের টিম আপনার সাথে ফোনে যোগাযোগ করবে।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setTouched(false);
                    setForm((prev) => ({ ...prev, propertySpec: '', message: '' }));
                  }}
                  className="btn-ghost mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="panel p-6 sm:p-9 md:p-10 space-y-6"
                noValidate
              >
                {/* Purpose / Intent Selector */}
                <fieldset>
                  <legend className="mono-label mb-3">Select Topic</legend>
                  <div className="grid sm:grid-cols-3 gap-3" role="radiogroup">
                    {INTENT_OPTIONS.map((opt) => {
                      const active = intent === opt.value;
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          role="radio"
                          aria-checked={active}
                          onClick={() => setIntent(opt.value)}
                          className={`text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${active
                            ? 'border-[#9A6B3B] bg-[#9A6B3B]/[0.09] shadow-2xs'
                            : 'border-[#181512]/12 bg-[#FAF9F6] hover:border-[#181512]/25 hover:bg-white'
                            }`}
                        >
                          <span
                            className={`inline-block text-[9.5px] font-mono tracking-[0.22em] uppercase px-2 py-0.5 rounded-full mb-2 ${active
                              ? 'bg-[#9A6B3B] text-white'
                              : 'bg-[#181512]/[0.06] text-[#6E6559]'
                              }`}
                          >
                            {opt.badge}
                          </span>
                          <span
                            lang="bn"
                            className="font-nakkhatra block text-xl text-[#181512] leading-snug"
                          >
                            {opt.label}
                          </span>
                          <span
                            lang="bn"
                            className="font-bn block text-sm text-[#6E6559] mt-1 leading-relaxed"
                          >
                            {opt.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Form Inputs */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mono-label block mb-2">Your Name *</span>
                    <input
                      id="contact-name"
                      className="lux-input"
                      value={form.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                      placeholder="আপনার নাম"
                      autoComplete="name"
                      aria-invalid={touched && !!errors.fullName}
                      maxLength={120}
                    />
                    {err(errors.fullName)}
                  </label>

                  <label className="block">
                    <span className="mono-label block mb-2">Phone / WhatsApp *</span>
                    <input
                      id="contact-phone"
                      className="lux-input"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="+880 1XXX-XXXXXX"
                      autoComplete="tel"
                      inputMode="tel"
                      aria-invalid={touched && !!(errors.phone || errors.reach)}
                      maxLength={20}
                    />
                    {err(errors.phone || errors.reach)}
                  </label>

                  <label className="block">
                    <span className="mono-label block mb-2">Email</span>
                    <input
                      id="contact-email"
                      type="email"
                      className="lux-input"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={touched && !!errors.email}
                      maxLength={160}
                    />
                    {err(errors.email)}
                  </label>

                  <label className="block">
                    <span className="mono-label block mb-2">Location / Area</span>
                    <input
                      id="contact-location"
                      className="lux-input"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="যেমন: বসুন্ধরা, ধানমন্ডি, রাজশাহী..."
                      maxLength={140}
                    />
                  </label>
                </div>

                {intent === 'sell' && (
                  <label className="block">
                    <span className="mono-label block mb-2">
                      Property Type & Size
                    </span>
                    <input
                      id="contact-spec"
                      className="lux-input"
                      value={form.propertySpec}
                      onChange={(e) => set('propertySpec', e.target.value)}
                      placeholder="যেমন: ৩ বেডের ফ্ল্যাট, ১৮৫০ স্কয়ার ফিট / ৫ কাঠা জমি..."
                      maxLength={200}
                    />
                  </label>
                )}

                <label className="block">
                  <span className="mono-label block mb-2">Details / Message</span>
                  <textarea
                    id="contact-message"
                    className="lux-textarea"
                    rows={3}
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    placeholder={
                      intent === 'sell'
                        ? 'প্রপার্টি সম্পর্কে সংক্ষেপে কিছু জানাতে চাইলে এখানে লিখুন...'
                        : 'আপনার চাহিদা বা প্রশ্ন সংক্ষেপে লিখুন...'
                    }
                    maxLength={2000}
                  />
                </label>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#181512]/[0.08]">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="btn-gold justify-center shrink-0"
                  >
                    <span>
                      {status === 'sending'
                        ? 'Sending...'
                        : intent === 'sell'
                          ? 'Contact to Sell'
                          : 'Send Message'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

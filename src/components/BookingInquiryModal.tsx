import React, { useState } from 'react';
import { Property } from '../types/property';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, CheckCircle2, Compass, Shield } from 'lucide-react';

interface BookingInquiryModalProps {
  property: Property;
  onClose: () => void;
}

export const BookingInquiryModal: React.FC<BookingInquiryModalProps> = ({ property, onClose }) => {
  const { user, submitInquiry } = useAuth();
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [tourType, setTourType] = useState<'in-person' | 'architectural-consultation'>('in-person');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Please enter your full name and contact email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await submitInquiry({
        propertyId: property.id,
        propertyTitle: property.title,
        userId: user ? user.uid : undefined,
        fullName,
        email,
        phone,
        tourType,
        preferredDate: preferredDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        message: message || `Inquiring about private viewing for ${property.title}.`,
      });

      if (ok) {
        setIsSuccess(true);
      } else {
        setErrorMsg('Could not record viewing request. Please verify connection and retry.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>PRIVATE ARCHITECTURAL VIEWING</span>
            </div>
            <h3 className="text-lg font-display font-medium text-white mt-1">
              {property.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-display font-medium text-white">
              Viewing Request Confirmed
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your appointment request has been recorded into our real-time advisory system. An architectural representative will contact you at <strong className="text-white">{email}</strong>.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-cyan-400 text-slate-950 font-mono text-xs font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                RETURN TO PROPERTY
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
                Viewing Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'in-person', label: 'On-Site Private' },
                  { id: 'architectural-consultation', label: 'Arch. Brief' },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTourType(t.id as any)}
                    className={`p-2.5 rounded-lg text-xs font-mono text-center transition-colors border cursor-pointer ${
                      tourType === t.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-medium'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">
                  Telephone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1 uppercase">
                Architectural Inquiries or Requirements
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Inquire regarding post-tensioned spans, site visit protocols, or confidential acquisition..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>CONFIDENTIAL ENCRYPTION</span>
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-mono text-xs font-semibold rounded-lg shadow-lg hover:shadow-cyan-400/20 transition-all cursor-pointer"
              >
                {isSubmitting ? 'TRANSMITTING...' : 'CONFIRM RESERVATION'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

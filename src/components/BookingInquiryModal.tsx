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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181512]/45 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#ffffff] border border-[#181512]/12 rounded-2xl overflow-hidden shadow-2xl text-[#181512] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#181512]/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#9A6B3B]">
              <Calendar className="w-3.5 h-3.5" />
              <span>PRIVATE ARCHITECTURAL VIEWING</span>
            </div>
            <h3 className="text-lg font-display font-medium text-[#181512] mt-1">
              {property.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#4A433B] hover:text-[#181512] rounded-lg bg-[#F3EFE7] border border-[#181512]/12 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-600/12 border border-emerald-600/35 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-display font-medium text-[#181512]">
              Viewing Request Confirmed
            </h4>
            <p className="text-xs text-[#4A433B] max-w-sm mx-auto leading-relaxed">
              Your appointment request has been recorded into our real-time advisory system. An architectural representative will contact you at <strong className="text-[#181512]">{email}</strong>.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="btn-gold !py-2.5 !px-6"
              >
                RETURN TO PROPERTY
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-[#6E6559] mb-1.5 uppercase">
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
                        ? 'bg-[#9A6B3B]/15 text-[#5C3D1E] border-[#9A6B3B] font-medium'
                        : 'bg-[#F3EFE7] text-[#5C5346] border-[#181512]/12 hover:text-[#181512]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-[#6E6559] mb-1 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="lux-input !py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#6E6559] mb-1 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="lux-input !py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-[#6E6559] mb-1 uppercase">
                  Telephone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="lux-input !py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#6E6559] mb-1 uppercase">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="lux-input !py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#6E6559] mb-1 uppercase">
                Architectural Inquiries or Requirements
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Inquire regarding post-tensioned spans, site visit protocols, or confidential acquisition..."
                className="lux-textarea !py-2 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#786F63] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9A6B3B]" />
                <span>CONFIDENTIAL ENCRYPTION</span>
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold !py-2.5 !px-5"
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

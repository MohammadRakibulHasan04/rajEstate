import React from 'react';
import { ArrowLeft, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from '../../lib/router';
import logoImg from '../../assets/logo.png';
import logoIcon from '../../assets/logo-icon.png';

/**
 * Guards /manage. This is UI only; Firestore rules enforce the real
 * permission on every read and write.
 */
export const AdminGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin, adminChecking, signInWithGoogle, logOut, authError } = useAuth();

  if (loading || (user && adminChecking)) {
    return (
      <Shell>
        <div className="w-10 h-10 rounded-full border-2 border-[#d1ad7a]/20 border-t-[#d1ad7a] animate-spin" aria-label="Checking access" />
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <img
          src={logoImg}
          alt="Jonopod Properties"
          className="h-10 sm:h-12 w-auto object-contain mx-auto mb-8"
        />
        <div className="eyebrow justify-center mb-6">Atelier access</div>
        <h1 className="font-display font-light text-5xl md:text-7xl leading-[0.95] text-[#181512]">
          Jonopod Properties <em className="italic text-gradient-gold">Manage</em>
        </h1>
        <p className="mt-6 text-[#4A433B] max-w-sm mx-auto leading-relaxed">
          Sign in with your authorised Google account to curate residences and respond to inquiries.
        </p>
        <button id="manage-signin" onClick={() => signInWithGoogle().catch(() => undefined)} className="btn-gold mt-10">
          <GoogleMark /> Continue with Google
        </button>
        {authError && <p className="mt-5 text-sm text-red-600 max-w-sm mx-auto">{authError}</p>}
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <img
          src={logoIcon}
          alt="Jonopod Properties"
          className="w-12 h-12 object-contain mx-auto mb-6"
        />
        <span className="w-14 h-14 rounded-2xl border border-[#181512]/12 bg-[#ffffff] shadow-xs flex items-center justify-center mx-auto text-[#9A6B3B]">
          <Lock className="w-6 h-6" />
        </span>
        <h1 className="mt-8 font-display font-light text-5xl leading-[0.95] text-[#181512]">Access restricted</h1>
        <p className="mt-5 text-[#4A433B] max-w-sm mx-auto leading-relaxed">
          <span className="text-[#181512] font-medium">{user.email}</span> is not on the admin list. Ask the owner to add your UID to the{' '}
          <code className="text-[#9A6B3B]">admins</code> collection.
        </p>
        <code className="mt-4 inline-block text-[11px] font-mono text-[#786F63] select-all">{user.uid}</code>
        <div className="mt-10 flex justify-center gap-3">
          <Link to="/" className="btn-ghost"><ArrowLeft className="w-4 h-4" /> Back to site</Link>
          <button onClick={() => logOut()} className="btn-quiet"><LogOut className="w-4 h-4" /> Switch account</button>
        </div>
      </Shell>
    );
  }

  return <>{children}</>;
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="relative min-h-screen bg-[#ffffff] text-[#181512] flex items-center justify-center px-6 overflow-hidden">
    <div className="hero-grid" aria-hidden="true" />
    <div className="grain" aria-hidden="true" />
    <span aria-hidden="true" className="text-outline absolute bottom-0 left-1/2 -translate-x-1/2 font-display text-[16vw] leading-[0.8] uppercase select-none pointer-events-none">
      Jonopod
    </span>
    <div className="relative text-center">{children}</div>
  </main>
);

const GoogleMark = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#120d07" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

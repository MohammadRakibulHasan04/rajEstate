import React from 'react';
import { Property } from '../types/property';
import { useAuth } from '../context/AuthContext';
import { X, Bookmark, Compass, Trash2, LogIn } from 'lucide-react';

interface SavedPortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allProperties: Property[];
  onSelectProperty: (property: Property) => void;
}

export const SavedPortfolioDrawer: React.FC<SavedPortfolioDrawerProps> = ({
  isOpen,
  onClose,
  allProperties,
  onSelectProperty,
}) => {
  const { user, savedPropertyIds, toggleSaveProperty, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const savedProperties = allProperties.filter((p) => savedPropertyIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Bookmark className="w-3.5 h-3.5" />
              <span>SAVED ARCHITECTURAL PORTFOLIO</span>
            </div>
            <h3 className="text-lg font-display font-medium text-white mt-0.5">
              Curated Favorites ({savedProperties.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
          {user ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Synced with Firebase Firestore</span>
            </span>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-slate-400">Stored locally on device</span>
              <button
                onClick={() => signInWithGoogle()}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Sign in to sync</span>
                <LogIn className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {savedProperties.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
              <Bookmark className="w-10 h-10 opacity-30 stroke-1" />
              <p className="text-sm font-mono">No architectural properties saved yet.</p>
              <p className="text-xs text-slate-600 max-w-xs">
                Explore our portfolio and bookmark properties to curate your confidential dossier.
              </p>
            </div>
          ) : (
            savedProperties.map((prop) => (
              <div
                key={prop.id}
                className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex gap-4 hover:border-slate-700 transition-colors"
              >
                <div
                  className="w-24 h-24 rounded-lg overflow-hidden bg-slate-950 shrink-0 cursor-pointer"
                  onClick={() => {
                    onSelectProperty(prop);
                    onClose();
                  }}
                >
                  <img
                    src={prop.heroImage}
                    alt={prop.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4
                      onClick={() => {
                        onSelectProperty(prop);
                        onClose();
                      }}
                      className="text-sm font-display font-medium text-white hover:text-cyan-300 truncate cursor-pointer"
                    >
                      {prop.title}
                    </h4>
                    <div className="text-xs font-mono text-cyan-400 tabular-nums mt-0.5">
                      ${(prop.price / 1000000).toFixed(1)}M {prop.currency}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {prop.city}, {prop.country}
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={() => toggleSaveProperty(prop.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

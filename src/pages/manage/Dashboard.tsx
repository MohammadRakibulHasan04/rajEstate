import React, { useState } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Copy,
  Trash2,
  Sparkles,
  Building,
  Home,
  CheckCircle2,
  Clock,
  Inbox,
  Database,
  Eye,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  useAllListings,
  useInquiries,
  deleteListing,
  duplicateListing,
  setPublishState,
  seedListings,
  setInquiryStatus,
} from '../../lib/listings';
import { scoreListing, priceLabel } from '../../lib/significance';
import { useAuth } from '../../context/AuthContext';
import { Link, navigate } from '../../lib/router';
import { Listing, PublishState } from '../../types/listing';
import { useToasts, errorText } from '../../components/manage/fields';

export const ManageDashboard: React.FC = () => {
  const { user, logOut } = useAuth();
  const { listings, loading, error } = useAllListings(true);
  const { items: inquiries, loading: inqLoading } = useInquiries(true);
  const { push: toast, view: toastView } = useToasts();

  const [activeTab, setActiveTab] = useState<'listings' | 'inquiries'>('listings');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'published' | 'draft'>('all');
  const [filterKind, setFilterKind] = useState<'all' | 'single' | 'project'>('all');
  const [deleteModalListing, setDeleteModalListing] = useState<Listing | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Statistics calculation
  const publishedCount = listings.filter((l) => l.publish === 'published').length;
  const draftCount = listings.filter((l) => l.publish === 'draft').length;
  const projectCount = listings.filter((l) => l.kind === 'project').length;
  const availableUnits = listings.reduce((acc, l) => {
    return acc + (l.units || []).filter((u) => u.status === 'available').length;
  }, 0);
  const pendingInquiries = inquiries.filter((i) => i.status === 'pending').length;

  // Filter listings
  const filteredListings = listings.filter((l) => {
    if (filterState !== 'all' && l.publish !== filterState) return false;
    if (filterKind !== 'all' && l.kind !== filterKind) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q) || l.titleBn.toLowerCase().includes(q);
      const matchArea = l.location.area.toLowerCase().includes(q) || l.location.areaBn.toLowerCase().includes(q);
      const matchDev = l.trust.developer.toLowerCase().includes(q);
      if (!matchTitle && !matchArea && !matchDev) return false;
    }
    return true;
  });

  const handleDuplicate = async (listing: Listing) => {
    try {
      toast('Duplicating residence blueprint...', 'info');
      const newId = await duplicateListing(listing, user?.uid || 'admin');
      toast('Duplicate created as draft', 'ok');
      navigate(`/manage/edit/${newId}`);
    } catch (err) {
      toast(errorText(err), 'error');
    }
  };

  const handleTogglePublish = async (listing: Listing) => {
    const nextState: PublishState = listing.publish === 'published' ? 'draft' : 'published';
    try {
      await setPublishState(listing.id, nextState);
      toast(`Residence set to ${nextState}`, 'ok');
    } catch (err) {
      toast(errorText(err), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalListing) return;
    try {
      await deleteListing(deleteModalListing.id);
      toast(`Deleted "${deleteModalListing.title}"`, 'ok');
      setDeleteModalListing(null);
    } catch (err) {
      toast(errorText(err), 'error');
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedListings(user?.uid || 'admin');
      toast('The Barakah Residence and demo project successfully seeded!', 'ok');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f4efe6] pb-32">
      {toastView}

      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] bg-[#070b14]/80 backdrop-blur-xl sticky top-0 z-40 px-6 md:px-12 py-4">
        <div className="max-w-[90rem] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="brand-mark text-[#f4efe6] flex items-baseline gap-2">
              <span className="font-display text-2xl tracking-[0.16em]">AURA</span>
              <span className="text-[10px] font-mono tracking-[0.24em] text-[#d1ad7a] uppercase">
                Atelier Studio
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-mono tracking-widest text-slate-400 hover:text-white uppercase transition-colors hidden sm:block">
              Public Site
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 hidden md:inline">
                {user?.email}
              </span>
              <button
                onClick={() => logOut()}
                className="btn-quiet !py-2 !px-3.5 !text-[10px]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[90rem] mx-auto px-6 md:px-12 py-10 space-y-10">
        {/* Title and Top Action Strip */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
          <div>
            <div className="eyebrow mb-4">Architectural Portfolio Management</div>
            <h1 className="font-display font-light text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-[-0.02em]">
              Residences & <em className="italic text-gradient-gold">Blueprints.</em>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {listings.length === 0 && (
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="btn-quiet"
              >
                <Database className="w-4 h-4 text-[#d1ad7a]" />
                <span>{seeding ? 'Seeding...' : 'Seed Initial Residences'}</span>
              </button>
            )}

            <Link
              to="/manage/new"
              id="new-listing-btn"
              className="btn-gold !py-3 !px-6"
            >
              <Plus className="w-4 h-4" /> New Residence
            </Link>
          </div>
        </div>

        {/* Statistical Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="panel p-6">
            <span className="mono-label block text-slate-500 mb-2">Live Residences</span>
            <div className="font-display font-light text-4xl text-[#f4efe6]">{publishedCount}</div>
            <span className="text-[11px] font-mono text-emerald-400 mt-2 block">
              Visible on public showcase
            </span>
          </div>

          <div className="panel p-6">
            <span className="mono-label block text-slate-500 mb-2">Draft Blueprints</span>
            <div className="font-display font-light text-4xl text-amber-300">{draftCount}</div>
            <span className="text-[11px] font-mono text-slate-500 mt-2 block">
              In curation or review
            </span>
          </div>

          <div className="panel p-6">
            <span className="mono-label block text-slate-500 mb-2">Multi-Unit Projects</span>
            <div className="font-display font-light text-4xl text-[#d1ad7a]">{projectCount}</div>
            <span className="text-[11px] font-mono text-slate-400 mt-2 block">
              {availableUnits} total units available
            </span>
          </div>

          <div className="panel p-6">
            <span className="mono-label block text-slate-500 mb-2">Client Inquiries</span>
            <div className="font-display font-light text-4xl text-sky-300">{inquiries.length}</div>
            <span className="text-[11px] font-mono text-amber-300 mt-2 block">
              {pendingInquiries} awaiting response
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] gap-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-4 text-xs font-mono uppercase tracking-widest relative cursor-pointer ${
              activeTab === 'listings'
                ? 'text-[#f1dfbd] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#d1ad7a]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Residences ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-4 text-xs font-mono uppercase tracking-widest relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'text-[#f1dfbd] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#d1ad7a]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Inquiries Inbox</span>
            {pendingInquiries > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {pendingInquiries}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: LISTINGS */}
        {activeTab === 'listings' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="lux-input !pl-10 !py-2.5 !text-xs"
                  placeholder="Search by title, location, developer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  {(['all', 'published', 'draft'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterState(s)}
                      className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                        filterState === s
                          ? 'bg-[#d1ad7a] text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  {(['all', 'single', 'project'] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setFilterKind(k)}
                      className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                        filterKind === k
                          ? 'bg-[#d1ad7a] text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Listings Table / Cards */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="panel p-6 skeleton h-28" />
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="panel p-16 text-center space-y-4">
                <Home className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-display text-2xl text-slate-300">No residences matched</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search criteria or create a new architectural listing.
                </p>
                {listings.length === 0 && (
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={seeding}
                    className="btn-gold !py-2.5 !px-5 mt-4"
                  >
                    Seed The Barakah Residence
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => {
                  const { score } = scoreListing(listing);
                  return (
                    <div
                      key={listing.id}
                      className="panel p-5 md:p-6 transition-all duration-300 hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      {/* Thumbnail & Info */}
                      <div className="flex items-start gap-5 min-w-0">
                        <div className="w-24 h-20 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 relative">
                          {listing.media.hero.url ? (
                            <img
                              src={listing.media.hero.url}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Building className="w-6 h-6" />
                            </div>
                          )}
                          <span
                            className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold ${
                              listing.kind === 'project'
                                ? 'bg-sky-500 text-slate-950'
                                : 'bg-[#d1ad7a] text-slate-950'
                            }`}
                          >
                            {listing.kind}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-display text-2xl text-[#f4efe6] truncate">
                              {listing.title}
                            </h3>
                            {listing.titleBn && (
                              <span className="text-slate-400 font-sans text-sm">
                                · {listing.titleBn}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                            <span>{listing.location.area || listing.location.city}</span>
                            <span>·</span>
                            <span className="text-gradient-gold font-medium">
                              {priceLabel(listing)}
                            </span>
                            {listing.kind === 'project' && (
                              <>
                                <span>·</span>
                                <span className="text-slate-300">
                                  {(listing.units || []).length} Units ({(listing.units || []).filter((u) => u.status === 'available').length} Avail)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Status, Score & Action Buttons */}
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-white/[0.08]">
                        {/* Significance Score Pill */}
                        <div className="text-center" title="Listing Significance Quality Score">
                          <span className="mono-label block text-[9px]">Score</span>
                          <span
                            className={`font-display text-lg ${
                              score >= 80
                                ? 'text-emerald-400'
                                : score >= 60
                                ? 'text-[#d1ad7a]'
                                : 'text-amber-400'
                            }`}
                          >
                            {score}%
                          </span>
                        </div>

                        {/* Publish State Badge */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(listing)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest border transition-all cursor-pointer ${
                            listing.publish === 'published'
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {listing.publish}
                        </button>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/manage/edit/${listing.id}`}
                            className="p-2.5 rounded-lg border border-white/10 hover:border-[#d1ad7a] text-slate-300 hover:text-white transition-colors"
                            title="Edit Listing"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          <a
                            href={`/property/${listing.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-colors"
                            title="View Presentation"
                          >
                            <Eye className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(listing)}
                            className="p-2.5 rounded-lg border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Duplicate Blueprint"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteModalListing(listing)}
                            className="p-2.5 rounded-lg border border-white/10 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Residence"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INQUIRIES INBOX */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            {inqLoading ? (
              <div className="panel p-10 skeleton h-48" />
            ) : inquiries.length === 0 ? (
              <div className="panel p-16 text-center space-y-4">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="font-display text-2xl text-slate-300">No client tour inquiries yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  When clients request a private viewing or architectural consultation, their message will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="panel p-6 space-y-4 border border-white/[0.08] hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-display text-xl text-[#f4efe6]">{inq.fullName}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border border-sky-400/40 bg-sky-400/10 text-sky-300">
                            {inq.tourType}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#d1ad7a] mt-1">
                          Concerning: {inq.propertyTitle}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          className="lux-select !py-1.5 !text-xs !w-36"
                          value={inq.status}
                          onChange={(e) => {
                            if (inq.id) {
                              setInquiryStatus(inq.id, e.target.value as typeof inq.status);
                              toast(`Inquiry status updated to ${e.target.value}`, 'ok');
                            }
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    {inq.message && (
                      <p className="text-sm text-slate-300 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05] leading-relaxed">
                        "{inq.message}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-slate-400 pt-2 border-t border-white/[0.05]">
                      {inq.phone && (
                        <a href={`tel:${inq.phone}`} className="flex items-center gap-2 text-slate-300 hover:text-[#d1ad7a]">
                          <Phone className="w-3.5 h-3.5 text-[#d1ad7a]" />
                          <span>{inq.phone}</span>
                        </a>
                      )}
                      {inq.email && (
                        <a href={`mailto:${inq.email}`} className="flex items-center gap-2 text-slate-300 hover:text-[#d1ad7a]">
                          <Mail className="w-3.5 h-3.5 text-[#d1ad7a]" />
                          <span>{inq.email}</span>
                        </a>
                      )}
                      {inq.preferredDate && (
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Preferred Date: {inq.preferredDate}</span>
                        </span>
                      )}
                      <span className="ml-auto text-slate-500 text-[11px]">
                        Received: {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalListing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="panel panel-glass max-w-md w-full p-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-[#f4efe6]">Delete Residence Blueprint?</h3>
              <p className="text-sm text-slate-400 mt-2">
                Are you sure you wish to permanently delete <strong className="text-white">"{deleteModalListing.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalListing(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn-danger btn-quiet !py-3 !px-6"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

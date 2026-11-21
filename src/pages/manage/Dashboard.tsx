import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Copy,
  Trash2,
  Archive,
  RotateCcw,
  Sparkles,
  Building,
  Building2,
  CornerDownRight,
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
import { validateListing } from '../../lib/listingValidation';
import { displayTitle, hasCustomName, isPriceAsTitle, priceLabel } from '../../lib/significance';
import { scoreListing } from '../../lib/completeness';
import { linkedUnit, withParent } from '../../lib/hierarchy';
import { useAuth } from '../../context/AuthContext';
import { Link, navigate } from '../../lib/router';
import { Listing, PublishState } from '../../types/listing';
import { useToasts, errorText } from '../../components/manage/fields';
import logoImg from '../../assets/logo.png';

export const ManageDashboard: React.FC = () => {
  const { user, logOut } = useAuth();
  const { listings, loading, error } = useAllListings(true);
  const { items: inquiries, loading: inqLoading } = useInquiries(true);
  const { push: toast, view: toastView } = useToasts();

  const [activeTab, setActiveTab] = useState<'listings' | 'inquiries'>('listings');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [filterKind, setFilterKind] = useState<'all' | 'single' | 'project'>('all');
  const [deleteModalListing, setDeleteModalListing] = useState<Listing | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Statistics calculation
  const publishedCount = listings.filter((l) => l.publish === 'published').length;
  const draftCount = listings.filter((l) => l.publish === 'draft').length;
  const archivedCount = listings.filter((l) => l.publish === 'archived').length;
  const projectCount = listings.filter((l) => l.kind === 'project').length;
  const availableUnits = listings.reduce((acc, l) => {
    return acc + (l.units || []).filter((u) => u.status === 'available').length;
  }, 0);
  const pendingInquiries = inquiries.filter((i) => i.status === 'pending').length;

  const byId = useMemo(() => new Map(listings.map((l) => [l.id, l])), [listings]);
  const childrenByProject = useMemo(() => {
    const map = new Map<string, Listing[]>();
    for (const l of listings) {
      if (l.parent?.id) {
        map.set(l.parent.id, [...(map.get(l.parent.id) ?? []), l]);
      }
    }
    return map;
  }, [listings]);

  // Filter listings
  const filteredListings = listings.filter((l) => {
    const eff = l.parent ? withParent(l, byId.get(l.parent.id)) : l;
    if (filterState !== 'all' && l.publish !== filterState) return false;
    if (filterKind !== 'all' && l.kind !== filterKind) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = eff.title.toLowerCase().includes(q) || displayTitle(eff).toLowerCase().includes(q);
      const matchArea = eff.location.area.toLowerCase().includes(q) || eff.location.address.toLowerCase().includes(q);
      const matchDev = eff.trust.developer.toLowerCase().includes(q);
      if (!matchTitle && !matchArea && !matchDev) return false;
    }
    return true;
  });

  // Group child apartment pages directly under their project when both are in filteredListings
  const orderedRows = useMemo(() => {
    const filteredIds = new Set(filteredListings.map((l) => l.id));
    const rows: { listing: Listing; nested: boolean }[] = [];
    for (const l of filteredListings) {
      if (l.parent?.id && filteredIds.has(l.parent.id)) continue; // will be rendered under its parent project
      rows.push({ listing: l, nested: false });
      if (l.kind === 'project') {
        const kids = filteredListings.filter((k) => k.parent?.id === l.id);
        for (const k of kids) rows.push({ listing: k, nested: true });
      }
    }
    return rows;
  }, [filteredListings]);

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
    if (nextState === 'published') {
      const parent = listing.parent?.id ? byId.get(listing.parent.id) ?? null : null;
      const eff = withParent(listing, parent);
      const issues = validateListing(listing, eff, 'publish');
      if (issues.length > 0) {
        toast(`Cannot publish "${listing.title}": ${issues[0].message}`, 'error');
        return;
      }
    }
    try {
      await setPublishState(listing.id, nextState, user?.uid || 'admin');
      toast(
        nextState === 'published'
          ? `Published "${listing.title}"`
          : `Unpublished "${listing.title}" (moved to drafts)`,
        'ok'
      );
    } catch (err) {
      toast(errorText(err), 'error');
    }
  };

  const handleToggleArchive = async (listing: Listing) => {
    const nextState: PublishState = listing.publish === 'archived' ? 'draft' : 'archived';
    try {
      await setPublishState(listing.id, nextState, user?.uid || 'admin');
      toast(
        nextState === 'archived'
          ? `Archived "${listing.title}"`
          : `Restored "${listing.title}" to drafts`,
        'ok'
      );
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
    <div className="min-h-screen bg-[#ffffff] text-[#181512] pb-32">
      {toastView}

      {/* Top Navbar */}
      <header className="border-b border-[#181512]/[0.08] bg-[#ffffff]/90 backdrop-blur-xl sticky top-0 z-40 px-6 md:px-12 py-4">
        <div className="max-w-[90rem] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="brand-mark text-[#181512] flex items-center gap-3 group">
              <img
                src={logoImg}
                alt="Jonopod Properties"
                className="h-7 sm:h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="text-[10px] font-mono tracking-[0.24em] text-[#9A6B3B] uppercase pl-3 border-l border-[#181512]/15">
                Studio
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-mono tracking-widest text-[#5C5346] hover:text-[#181512] uppercase transition-colors hidden sm:block">
              Public Site
            </Link>
            <div className="h-4 w-px bg-[#181512]/12 hidden sm:block" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#5C5346] hidden md:inline">
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#181512]/[0.08] pb-8">
          <div>
            <div className="eyebrow mb-4">Architectural Portfolio Management</div>
            <h1 className="font-display font-light text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-[-0.02em] text-[#181512]">
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
                <Database className="w-4 h-4 text-[#9A6B3B]" />
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
            <span className="mono-label block text-[#786F63] mb-2">Live Residences</span>
            <div className="font-display font-light text-4xl text-[#181512]">{publishedCount}</div>
            <span className="text-[11px] font-mono text-emerald-700 mt-2 block">
              Visible on public showcase
            </span>
          </div>

          <div className="panel p-6">
            <span className="mono-label block text-[#786F63] mb-2">Draft Blueprints</span>
            <div className="font-display font-light text-4xl text-amber-700">{draftCount}</div>
            <span className="text-[11px] font-mono text-[#786F63] mt-2 block">
              {archivedCount > 0 ? `${archivedCount} archived in vault` : 'In curation or review'}
            </span>
          </div>

          <div className="panel p-6">
            <span className="mono-label block text-[#786F63] mb-2">Multi-Unit Projects</span>
            <div className="font-display font-light text-4xl text-[#9A6B3B]">{projectCount}</div>
            <span className="text-[11px] font-mono text-[#5C5346] mt-2 block">
              {availableUnits} total units available
            </span>
          </div>

          <div className="panel p-6">
            <span className="mono-label block text-[#786F63] mb-2">Client Inquiries</span>
            <div className="font-display font-light text-4xl text-sky-700">{inquiries.length}</div>
            <span className="text-[11px] font-mono text-amber-700 mt-2 block">
              {pendingInquiries} awaiting response
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#181512]/[0.08] gap-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-4 text-xs font-mono uppercase tracking-widest relative cursor-pointer ${activeTab === 'listings'
                ? 'text-[#181512] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#9A6B3B]'
                : 'text-[#6E6559] hover:text-[#181512]'
              }`}
          >
            All Residences ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-4 text-xs font-mono uppercase tracking-widest relative cursor-pointer flex items-center gap-2 ${activeTab === 'inquiries'
                ? 'text-[#181512] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#9A6B3B]'
                : 'text-[#6E6559] hover:text-[#181512]'
              }`}
          >
            <span>Inquiries Inbox</span>
            {pendingInquiries > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
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
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#786F63]" />
                <input
                  className="lux-input !pl-10 !py-2.5 !text-xs"
                  placeholder="Search by title, location, developer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-xl border border-[#181512]/10 bg-[#EFEAE1] p-1">
                  {(['all', 'published', 'draft', 'archived'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterState(s)}
                      className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${filterState === s
                          ? 'bg-[#9A6B3B] text-white font-semibold shadow-xs'
                          : 'text-[#5C5346] hover:text-[#181512]'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex rounded-xl border border-[#181512]/10 bg-[#EFEAE1] p-1">
                  {(['all', 'single', 'project'] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setFilterKind(k)}
                      className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${filterKind === k
                          ? 'bg-[#9A6B3B] text-white font-semibold shadow-xs'
                          : 'text-[#5C5346] hover:text-[#181512]'
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
                <Home className="w-10 h-10 text-[#9A6B3B] mx-auto" />
                <h3 className="font-display text-2xl text-[#181512]">No residences matched</h3>
                <p className="text-sm text-[#6E6559] max-w-sm mx-auto">
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
                {orderedRows.map(({ listing, nested }) => {
                  const parent = listing.parent?.id ? byId.get(listing.parent.id) : undefined;
                  const effective = parent ? withParent(listing, parent) : listing;
                  const unit = parent ? linkedUnit(listing, parent) : undefined;
                  const projectChildren = listing.kind === 'project' ? childrenByProject.get(listing.id) ?? [] : [];
                  const { score } = scoreListing(effective);
                  return (
                    <div
                      key={listing.id}
                      className={`panel p-5 md:p-6 transition-all duration-300 hover:border-[#9A6B3B]/45 flex flex-col md:flex-row md:items-center justify-between gap-6 ${nested ? 'ml-6 md:ml-12 border-l-2 border-l-[#9A6B3B] bg-[#FAF6EE]' : ''
                        }`}
                    >
                      {/* Thumbnail & Info */}
                      <div className="flex items-start gap-5 min-w-0">
                        {nested && (
                          <CornerDownRight className="w-4 h-4 text-[#9A6B3B] shrink-0 mt-7 hidden sm:block" />
                        )}
                        <div className="w-24 h-20 rounded-xl overflow-hidden bg-[#E6DFD3] shrink-0 border border-[#181512]/10 relative">
                          {effective.media.hero.url ? (
                            <img
                              src={effective.media.hero.url}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#786F63]">
                              <Building className="w-6 h-6" />
                            </div>
                          )}
                          <span
                            className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold ${listing.kind === 'project'
                                ? 'bg-sky-700 text-white'
                                : unit
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-[#9A6B3B] text-white'
                              }`}
                          >
                            {listing.kind === 'project' ? 'project' : unit ? `unit ${unit.code}` : 'single'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3
                              lang={isPriceAsTitle(listing) ? 'bn' : undefined}
                              className={`${isPriceAsTitle(listing) ? 'font-nakkhatra font-normal' : 'font-display'} text-2xl text-[#181512] truncate`}
                            >
                              {displayTitle(effective)}
                            </h3>
                            {isPriceAsTitle(listing) && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-[#9A6B3B]/35 bg-[#9A6B3B]/10 text-[#684724]">
                                Price as Title{hasCustomName(listing) ? ` · ${listing.title}` : ''}
                              </span>
                            )}
                            {parent && (
                              <Link
                                to={`/manage/edit/${parent.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#9A6B3B]/35 bg-[#9A6B3B]/10 text-[10px] font-mono uppercase tracking-wider text-[#5C3D1E] hover:border-[#9A6B3B]"
                              >
                                <Building2 className="w-3 h-3 text-[#9A6B3B]" />
                                <span>
                                  {displayTitle(parent)}
                                  {unit ? ` · ${unit.code}` : ''}
                                </span>
                              </Link>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#5C5346] mt-2">
                            <span>{effective.location.area || effective.location.city}</span>
                            <span>·</span>
                            <span lang="bn" className="font-nakkhatra text-sm text-gradient-gold font-normal tracking-normal">
                              {priceLabel(effective)}
                            </span>
                            {listing.kind === 'project' && (
                              <>
                                <span>·</span>
                                <span className="text-[#3D362E]">
                                  {(listing.units || []).length} Units ({(listing.units || []).filter((u) => u.status === 'available').length} Avail)
                                </span>
                                {projectChildren.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="text-[#684724]">
                                      {projectChildren.length} Unit {projectChildren.length === 1 ? 'Page' : 'Pages'}
                                    </span>
                                  </>
                                )}
                                <Link
                                  to={`/manage/new?parent=${listing.id}`}
                                  className="text-[#9A6B3B] hover:text-[#684724] underline underline-offset-4"
                                >
                                  + Add Apartment Page
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Status, Score & Action Buttons */}
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-[#181512]/[0.08]">
                        {/* Significance Score Pill */}
                        <div className="text-center" title="Listing Significance Quality Score">
                          <span className="mono-label block text-[9px]">Score</span>
                          <span
                            className={`font-display text-lg font-medium ${score >= 80
                                ? 'text-emerald-700'
                                : score >= 60
                                  ? 'text-[#9A6B3B]'
                                  : 'text-amber-700'
                              }`}
                          >
                            {score}%
                          </span>
                        </div>

                        {/* Publish State Badge */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(listing)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest border transition-all cursor-pointer font-medium ${listing.publish === 'published'
                              ? 'border-emerald-700/40 bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20'
                              : listing.publish === 'archived'
                                ? 'border-[#181512]/25 bg-[#181512]/[0.07] text-[#3D362E] hover:bg-[#181512]/12'
                                : 'border-amber-700/40 bg-amber-500/12 text-amber-800 hover:bg-amber-500/20'
                            }`}
                          title={listing.publish === 'published' ? 'Click to unpublish to draft' : 'Click to publish live'}
                        >
                          {listing.publish}
                        </button>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/manage/edit/${listing.id}`}
                            className="p-2.5 rounded-lg border border-[#181512]/12 bg-[#ffffff] hover:border-[#9A6B3B] text-[#4A433B] hover:text-[#181512] transition-colors"
                            title="Edit Listing"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          <a
                            href={`/property/${listing.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-lg border border-[#181512]/12 bg-[#ffffff] hover:border-[#9A6B3B] text-[#4A433B] hover:text-[#181512] transition-colors"
                            title="View Presentation"
                          >
                            <Eye className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(listing)}
                            className="p-2.5 rounded-lg border border-[#181512]/12 bg-[#ffffff] hover:border-[#9A6B3B] text-[#4A433B] hover:text-[#181512] transition-colors cursor-pointer"
                            title="Duplicate Blueprint"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleArchive(listing)}
                            className="p-2.5 rounded-lg border border-[#181512]/12 bg-[#ffffff] hover:border-[#9A6B3B] text-[#4A433B] hover:text-[#181512] transition-colors cursor-pointer"
                            title={listing.publish === 'archived' ? 'Restore from Archive to Draft' : 'Archive Residence'}
                          >
                            {listing.publish === 'archived' ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteModalListing(listing)}
                            className="p-2.5 rounded-lg border border-[#181512]/12 bg-[#ffffff] hover:border-red-500/50 text-[#6E6559] hover:text-red-600 transition-colors cursor-pointer"
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
                <Inbox className="w-10 h-10 text-[#9A6B3B] mx-auto" />
                <h3 className="font-display text-2xl text-[#181512]">No client tour inquiries yet</h3>
                <p className="text-sm text-[#6E6559] max-w-sm mx-auto">
                  When clients request a private viewing or architectural consultation, their message will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="panel p-6 space-y-4 hover:border-[#9A6B3B]/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-display text-xl text-[#181512]">{inq.fullName}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase border border-sky-700/35 bg-sky-600/10 text-sky-800">
                            {inq.tourType}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#9A6B3B] mt-1">
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
                      <p className="text-sm text-[#3D362E] bg-[#F3EFE7] p-4 rounded-xl border border-[#181512]/[0.07] leading-relaxed">
                        "{inq.message}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-[#5C5346] pt-2 border-t border-[#181512]/[0.07]">
                      {inq.phone && (
                        <a href={`tel:${inq.phone}`} className="flex items-center gap-2 text-[#3D362E] hover:text-[#9A6B3B]">
                          <Phone className="w-3.5 h-3.5 text-[#9A6B3B]" />
                          <span>{inq.phone}</span>
                        </a>
                      )}
                      {inq.email && (
                        <a href={`mailto:${inq.email}`} className="flex items-center gap-2 text-[#3D362E] hover:text-[#9A6B3B]">
                          <Mail className="w-3.5 h-3.5 text-[#9A6B3B]" />
                          <span>{inq.email}</span>
                        </a>
                      )}
                      {inq.preferredDate && (
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#786F63]" />
                          <span>Preferred Date: {inq.preferredDate}</span>
                        </span>
                      )}
                      <span className="ml-auto text-[#786F63] text-[11px]">
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
        <div className="fixed inset-0 z-50 bg-[#181512]/45 backdrop-blur-md flex items-center justify-center p-6">
          <div className="panel panel-glass max-w-md w-full p-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-500/12 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-[#181512]">Delete Residence Blueprint?</h3>
              <p className="text-sm text-[#4A433B] mt-2">
                Are you sure you wish to permanently delete <strong className="text-[#181512]">"{deleteModalListing.title}"</strong>? This action cannot be undone.
              </p>
              {deleteModalListing.kind === 'project' && (childrenByProject.get(deleteModalListing.id)?.length ?? 0) > 0 && (
                <p className="text-xs font-mono text-amber-900 bg-amber-500/12 border border-amber-600/30 rounded-xl p-3 mt-3">
                  Note: {childrenByProject.get(deleteModalListing.id)!.length} apartment page(s) are linked to this project and will become standalone if you delete it.
                </p>
              )}
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

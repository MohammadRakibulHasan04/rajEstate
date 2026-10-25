import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  Eye,
  Sparkles,
  Check,
  Send,
  Building,
  Home,
  Layers,
  MapPin,
  Shield,
  Phone,
  Search,
  BookOpen,
} from 'lucide-react';
import {
  Listing,
  ListingKind,
  ListingCategory,
  PublishState,
  ConstructionState,
  emptyListing,
  CATEGORY_LABELS,
  CONSTRUCTION_LABELS,
  NEARBY_LABELS,
  NearbyType,
  StoryChapter,
} from '../../types/listing';
import { saveListing, useListingById, isSlugTaken } from '../../lib/listings';
import { slugify } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { Link, navigate } from '../../lib/router';
import {
  Field,
  EditorSection,
  TextInput,
  NumberInput,
  TextArea,
  Select,
  Segmented,
  Toggle,
  Repeater,
  useToasts,
  errorText,
} from '../../components/manage/fields';
import { SignificanceBoard } from '../../components/manage/SignificanceBoard';
import { UnitsEditor } from '../../components/manage/UnitsEditor';
import { MediaUrlList } from '../../components/manage/MediaUrlList';
import { ScoreMeter } from '../../components/manage/ScoreMeter';

interface EditorProps {
  id?: string; // If undefined, creating new
}

const SECTION_NAV = [
  { id: 'basics', label: '1. Basics', icon: Home },
  { id: 'location', label: '2. Location & Area', icon: MapPin },
  { id: 'specs', label: '3. Pricing & Specs', icon: Layers },
  { id: 'significance', label: '4. Significance', icon: Sparkles },
  { id: 'media', label: '5. Imagery & Media', icon: Building },
  { id: 'story', label: '6. Narrative Chapters', icon: BookOpen },
  { id: 'trust', label: '7. Trust & Contact', icon: Shield },
  { id: 'seo', label: '8. Publish & SEO', icon: Search },
];

export const ListingEditor: React.FC<EditorProps> = ({ id }) => {
  const { user } = useAuth();
  const { push: toast, view: toastView } = useToasts();
  const { listing: existing, loading } = useListingById(id || null);

  const [form, setForm] = useState<Listing>(() => emptyListing(user?.uid || ''));
  const [autoSlug, setAutoSlug] = useState<boolean>(!id);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('basics');
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Initialize from loaded document or draft
  useEffect(() => {
    if (existing) {
      setForm(existing);
      setAutoSlug(false);
    } else if (!id) {
      // Check localStorage draft
      try {
        const cached = localStorage.getItem('aura_listing_draft_new');
        if (cached) {
          const parsed = JSON.parse(cached);
          setForm(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [existing, id]);

  // Autosave draft to localStorage
  useEffect(() => {
    if (!id && form.title) {
      const handler = setTimeout(() => {
        try {
          localStorage.setItem('aura_listing_draft_new', JSON.stringify(form));
        } catch {
          // ignore
        }
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [form, id]);

  const update = <K extends keyof Listing>(key: K, val: Listing[K]) => {
    setHasChanges(true);
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'title' && autoSlug) {
        next.slug = slugify(val as string);
      }
      return next;
    });
  };

  const updateLocation = (patch: Partial<Listing['location']>) => {
    setHasChanges(true);
    setForm((prev) => ({ ...prev, location: { ...prev.location, ...patch } }));
  };

  const updateCore = (patch: Partial<Listing['core']>) => {
    setHasChanges(true);
    setForm((prev) => ({ ...prev, core: { ...prev.core, ...patch } }));
  };

  const updateTrust = (patch: Partial<Listing['trust']>) => {
    setHasChanges(true);
    setForm((prev) => ({ ...prev, trust: { ...prev.trust, ...patch } }));
  };

  const updateContact = (patch: Partial<Listing['contact']>) => {
    setHasChanges(true);
    setForm((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));
  };

  const updateSeo = (patch: Partial<NonNullable<Listing['seo']>>) => {
    setHasChanges(true);
    setForm((prev) => ({ ...prev, seo: { ...prev.seo, ...patch } }));
  };

  const scrollTo = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSave = async (publishTarget?: PublishState) => {
    if (!form.title.trim()) {
      toast('Title is required to save', 'error');
      scrollTo('basics');
      return;
    }

    if (!form.slug.trim()) {
      form.slug = slugify(form.title);
    }

    setSaving(true);
    try {
      // Check slug uniqueness
      const isTaken = await isSlugTaken(form.slug, form.id);
      if (isTaken) {
        toast(`Slug "${form.slug}" is already in use by another listing`, 'error');
        setSaving(false);
        return;
      }

      const listingToSave: Listing = {
        ...form,
        publish: publishTarget || form.publish,
      };

      const docId = await saveListing(listingToSave, user?.uid || 'admin');
      setHasChanges(false);
      if (!id) {
        try {
          localStorage.removeItem('aura_listing_draft_new');
        } catch {}
      }
      toast(`Listing saved successfully (${listingToSave.publish})`, 'ok');

      // Navigate to editing the newly created listing or back to dashboard
      if (!id) {
        navigate(`/manage/edit/${docId}`, { replace: true });
      }
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && id) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 text-slate-400">
        <div className="skeleton w-64 h-10 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-[#f4efe6] pb-32">
      {toastView}

      {/* Editor Top Bar Header */}
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 md:px-12 py-4">
        <div className="max-w-[90rem] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/manage"
              className="p-2 rounded-full border border-white/10 hover:border-[#d1ad7a] text-slate-300 hover:text-white transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="mono-label block !text-[9.5px]">
                {id ? 'Editing Residence' : 'New Residence Blueprint'}
              </span>
              <h1 className="font-display text-xl text-[#f4efe6] truncate max-w-sm sm:max-w-md">
                {form.title || 'Untitled Residence'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {form.slug && (
              <a
                href={`/property/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-quiet hidden sm:inline-flex"
                title="Preview public presentation"
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </a>
            )}

            <button
              id="editor-save-draft"
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="btn-quiet"
            >
              Save Draft
            </button>

            <button
              id="editor-publish"
              type="button"
              disabled={saving}
              onClick={() => handleSave('published')}
              className="btn-gold !py-2.5 !px-5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{form.publish === 'published' ? 'Update & Publish' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sticky Rail */}
      <div className="max-w-[90rem] mx-auto px-6 md:px-12 py-10 grid lg:grid-cols-12 gap-10">
        {/* Left Sticky Navigation & Score Rail */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="panel p-4 space-y-1">
              <span className="mono-label block px-3 py-1.5 text-slate-500">Form Navigation</span>
              {SECTION_NAV.map((sec) => {
                const Icon = sec.icon;
                const active = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-mono tracking-wider transition-all cursor-pointer ${
                      active
                        ? 'bg-[#d1ad7a]/10 text-[#f1dfbd] border border-[#d1ad7a]/40 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Significance Score Meter */}
            <ScoreMeter listing={form} onNavigateSection={scrollTo} />
          </div>
        </aside>

        {/* Right Editor Form Sections */}
        <main className="lg:col-span-9 space-y-10">
          {/* 1. BASICS */}
          <EditorSection
            id="basics"
            index="01"
            title="Core Identity"
            titleBn="মূল পরিচয়"
            intro="Establish the foundational classification, names in English and Bengali, and URL slug."
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Listing Kind *">
                <Segmented
                  idPrefix="kind"
                  value={form.kind}
                  onChange={(k) => update('kind', k)}
                  options={[
                    { value: 'single', label: 'Single Residence', hint: 'One flat / house' },
                    { value: 'project', label: 'Multi-Unit Project', hint: 'Building of homes' },
                  ]}
                />
              </Field>

              <Field label="Category Typology">
                <Select
                  value={form.category}
                  onChange={(cat) => update('category', cat as ListingCategory)}
                  options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({
                    value: v as ListingCategory,
                    label: l,
                  }))}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Title (English) *">
                <TextInput
                  value={form.title}
                  placeholder="e.g. The Barakah Residence"
                  onChange={(t) => update('title', t)}
                  required
                />
              </Field>

              <Field label="Title (বাংলা) *">
                <TextInput
                  value={form.titleBn}
                  placeholder="যেমন: বারাকাহ রেসিডেন্স"
                  onChange={(t) => update('titleBn', t)}
                />
              </Field>
            </div>

            <Field label="Architectural Tagline (বাংলা)">
              <TextInput
                value={form.taglineBn}
                placeholder="যেমন: যেখানে আকাশ ছোঁয়া স্বপ্ন, মাটিতে রূপ পায়।"
                onChange={(t) => update('taglineBn', t)}
              />
            </Field>

            <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
              <Field
                label="Permanent URL Slug *"
                hint="Used for the clean web address: /property/{slug}"
              >
                <TextInput
                  value={form.slug}
                  placeholder="the-barakah-residence"
                  onChange={(s) => {
                    setAutoSlug(false);
                    update('slug', slugify(s));
                  }}
                />
              </Field>

              <button
                type="button"
                onClick={() => {
                  setAutoSlug(true);
                  update('slug', slugify(form.title));
                }}
                className="btn-quiet !py-2.5 h-11"
              >
                Auto-generate
              </button>
            </div>

            <Field
              label="Editorial Summary Narrative"
              hint="A compelling 2-3 sentence summary explaining what it feels like to live in this residence."
            >
              <TextArea
                rows={3}
                counter={240}
                value={form.summary}
                onChange={(s) => update('summary', s)}
                placeholder="Describe the architectural soul, daylight, and presence of this home..."
              />
            </Field>

            <div className="flex flex-wrap gap-8 pt-2">
              <Toggle
                id="feat-toggle"
                label="Featured Presentation"
                hint="Spotlight this home on the primary portfolio showcase"
                checked={form.featured}
                onChange={(f) => update('featured', f)}
              />
            </div>
          </EditorSection>

          {/* 2. LOCATION & NEIGHBOURHOOD */}
          <EditorSection
            id="location"
            index="02"
            title="Location & Surroundings"
            titleBn="অবস্থান ও এলাকা"
            intro="Location is more than an address. Plot nearby places with minutes of distance so buyers visualize daily convenience."
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Neighbourhood / Sector (English)">
                <TextInput
                  value={form.location.area}
                  placeholder="e.g. Bashundhara R/A"
                  onChange={(a) => updateLocation({ area: a })}
                />
              </Field>
              <Field label="এলাকা (বাংলা)">
                <TextInput
                  value={form.location.areaBn}
                  placeholder="যেমন: বসুন্ধরা আ/এ, ঢাকা"
                  onChange={(a) => updateLocation({ areaBn: a })}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="City">
                <TextInput
                  value={form.location.city}
                  placeholder="Dhaka"
                  onChange={(c) => updateLocation({ city: c })}
                />
              </Field>
              <Field label="Full Street Address">
                <TextInput
                  value={form.location.address}
                  placeholder="Block D, Road 4, Plot 128..."
                  onChange={(addr) => updateLocation({ address: addr })}
                />
              </Field>
            </div>

            <Field
              label="Google Maps Embed URL"
              hint="Paste the embed iframe link (e.g. https://www.google.com/maps?q=...&output=embed)"
            >
              <TextInput
                value={form.location.mapEmbedUrl || ''}
                placeholder="https://www.google.com/maps?q=...&output=embed"
                onChange={(url) => updateLocation({ mapEmbedUrl: url })}
              />
            </Field>

            {/* Proximity Places Repeater */}
            <div className="pt-4 border-t border-white/[0.08]">
              <span className="mono-label block mb-3">Nearby Proximity Landmarks (Minutes Away)</span>
              <p className="text-xs text-slate-500 mb-4">
                Plotted on the 5, 10, and 20-minute concentric proximity rings on the presentation page.
              </p>

              <Repeater
                idPrefix="nearby"
                items={form.nearby}
                onChange={(places) => update('nearby', places)}
                create={() => ({
                  name: '',
                  type: 'school' as NearbyType,
                  minutes: 5,
                  mode: 'drive' as 'walk' | 'drive',
                })}
                addLabel="Add Landmark / School / Mosque"
                empty="No nearby landmarks added. Add 3 or more for a rich proximity ring display."
                render={(place, setPlace) => (
                  <div className="grid sm:grid-cols-[1.5fr_1fr_100px_100px] gap-3 items-center">
                    <TextInput
                      className="!py-2 !text-xs"
                      placeholder="Landmark name (e.g. Evercare Hospital)"
                      value={place.name}
                      onChange={(n) => setPlace({ name: n })}
                    />
                    <select
                      className="lux-select !py-2 !text-xs"
                      value={place.type}
                      onChange={(e) => setPlace({ type: e.target.value as NearbyType })}
                    >
                      {Object.entries(NEARBY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <NumberInput
                        className="!py-2 !text-xs !px-2"
                        value={place.minutes}
                        onChange={(m) => setPlace({ minutes: m || 1 })}
                      />
                      <span className="text-[10px] font-mono text-slate-500">MIN</span>
                    </div>
                    <select
                      className="lux-select !py-2 !text-xs"
                      value={place.mode}
                      onChange={(e) => setPlace({ mode: e.target.value as 'walk' | 'drive' })}
                    >
                      <option value="walk">Walk</option>
                      <option value="drive">Drive</option>
                    </select>
                  </div>
                )}
              />
            </div>
          </EditorSection>

          {/* 3. PRICING & SPECIFICATIONS */}
          <EditorSection
            id="specs"
            index="03"
            title="Valuation & Dimensions"
            titleBn="মূল্য ও বিবরণ"
            intro="For single residences, configure core measurements. For multi-unit projects, configure individual apartments using the units grid below."
          >
            {form.kind === 'single' ? (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Asking Price (BDT ৳) *" hint="e.g. 28500000 = 2.85 Crore">
                    <NumberInput
                      value={form.price.amount}
                      placeholder="28500000"
                      onChange={(p) => update('price', { ...form.price, amount: p || 0 })}
                    />
                  </Field>
                  <Field label="Price Flexibility">
                    <Toggle
                      id="price-negotiable"
                      label="Price is Negotiable (আলোচনা সাপেক্ষে)"
                      checked={form.price.negotiable}
                      onChange={(neg) => update('price', { ...form.price, negotiable: neg })}
                    />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-3 gap-5">
                  <Field label="Living Area (Sq Ft)">
                    <NumberInput
                      value={form.core.sizeSqft}
                      placeholder="1850"
                      onChange={(s) => updateCore({ sizeSqft: s })}
                    />
                  </Field>
                  <Field label="Bedrooms">
                    <NumberInput
                      value={form.core.beds}
                      placeholder="3"
                      onChange={(b) => updateCore({ beds: b })}
                    />
                  </Field>
                  <Field label="Bathrooms">
                    <NumberInput
                      value={form.core.baths}
                      placeholder="3"
                      onChange={(b) => updateCore({ baths: b })}
                    />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <Field label="Balconies">
                    <NumberInput
                      value={form.core.balconies}
                      placeholder="3"
                      onChange={(b) => updateCore({ balconies: b })}
                    />
                  </Field>
                  <Field label="Floor Level">
                    <NumberInput
                      value={form.core.floor}
                      placeholder="7"
                      onChange={(f) => updateCore({ floor: f })}
                    />
                  </Field>
                  <Field label="Total Storeys">
                    <NumberInput
                      value={form.core.totalFloors}
                      placeholder="10"
                      onChange={(tf) => updateCore({ totalFloors: tf })}
                    />
                  </Field>
                  <Field label="Car Parking">
                    <NumberInput
                      value={form.core.parking}
                      placeholder="1"
                      onChange={(p) => updateCore({ parking: p })}
                    />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Orientation / Facing">
                    <TextInput
                      value={form.core.facing || ''}
                      placeholder="e.g. South-East"
                      onChange={(f) => updateCore({ facing: f })}
                    />
                  </Field>
                  <Field label="Handover Timeline (YYYY-MM)">
                    <TextInput
                      type="month"
                      value={form.core.handover || ''}
                      onChange={(h) => updateCore({ handover: h })}
                    />
                  </Field>
                </div>
              </div>
            ) : (
              /* Project Units Editor */
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Total Building Storeys">
                    <NumberInput
                      value={form.core.totalFloors}
                      placeholder="12"
                      onChange={(tf) => updateCore({ totalFloors: tf })}
                    />
                  </Field>
                  <Field label="Handover Date (YYYY-MM)">
                    <TextInput
                      type="month"
                      value={form.core.handover || ''}
                      onChange={(h) => updateCore({ handover: h })}
                    />
                  </Field>
                </div>

                <div className="pt-4 border-t border-white/[0.08]">
                  <UnitsEditor
                    units={form.units}
                    onChange={(units) => {
                      setHasChanges(true);
                      update('units', units);
                    }}
                  />
                </div>
              </div>
            )}
          </EditorSection>

          {/* 4. SIGNIFICANCE BOARD */}
          <EditorSection
            id="significance"
            index="04"
            title="Significance Hierarchy"
            titleBn="গুরুত্বের স্তরবিন্যাস"
            intro="No Naked Numbers. Organize specs into Signature (1-3 reasons to buy), Defining (structural context), and Reference. Explain 'why' every spec matters."
          >
            <SignificanceBoard
              listing={form}
              onChange={(facts) => {
                setHasChanges(true);
                update('facts', facts);
              }}
            />
          </EditorSection>

          {/* 5. MEDIA & BLUEPRINTS */}
          <EditorSection
            id="media"
            index="05"
            title="Visual Architecture"
            titleBn="স্থপতি আলোকচিত্র ও নকশা"
            intro="High resolution photography, curated room categorization, and CAD floor plans."
          >
            <MediaUrlList
              hero={form.media.hero}
              onHeroChange={(h) => {
                setHasChanges(true);
                update('media', { ...form.media, hero: h });
              }}
              gallery={form.media.gallery}
              onGalleryChange={(g) => {
                setHasChanges(true);
                update('media', { ...form.media, gallery: g });
              }}
              floorPlans={form.media.floorPlans}
              onFloorPlansChange={(p) => {
                setHasChanges(true);
                update('media', { ...form.media, floorPlans: p });
              }}
              videoUrl={form.media.videoUrl}
              onVideoUrlChange={(v) => {
                setHasChanges(true);
                update('media', { ...form.media, videoUrl: v });
              }}
            />
          </EditorSection>

          {/* 6. STORY CHAPTERS */}
          <EditorSection
            id="story"
            index="06"
            title="Editorial Narrative Chapters"
            titleBn="গল্পের অধ্যায়"
            intro="Optional visual storytelling chapters with alternating layouts that take buyers on a grand journey through the home."
          >
            <Repeater
              idPrefix="chapters"
              items={form.chapters}
              onChange={(chapters) => update('chapters', chapters)}
              create={() => ({
                kicker: 'The Space',
                titleBn: 'একটি নতুন অধ্যায়',
                titleEn: 'A New Chapter',
                body: 'বর্ণনা লিখুন...',
                imageUrl: form.media.hero.url || '',
                layout: 'right' as 'left' | 'right' | 'full',
              })}
              addLabel="Add Story Chapter"
              empty="No narrative chapters added. Story chapters elevate a standard listing into an architectural editorial."
              render={(ch, setCh) => (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Chapter Kicker">
                      <TextInput
                        className="!py-2 !text-xs"
                        value={ch.kicker}
                        placeholder="e.g. The Arrival"
                        onChange={(k) => setCh({ kicker: k })}
                      />
                    </Field>
                    <Field label="Title (বাংলা)">
                      <TextInput
                        className="!py-2 !text-xs"
                        value={ch.titleBn}
                        placeholder="যেমন: প্রথম দৃষ্টিতেই মুগ্ধতা"
                        onChange={(t) => setCh({ titleBn: t })}
                      />
                    </Field>
                    <Field label="Title (English Subtitle)">
                      <TextInput
                        className="!py-2 !text-xs"
                        value={ch.titleEn}
                        placeholder="e.g. A Grand Welcome"
                        onChange={(t) => setCh({ titleEn: t })}
                      />
                    </Field>
                  </div>

                  <Field label="Chapter Narrative Body">
                    <TextArea
                      className="!py-2 !text-xs"
                      rows={2}
                      value={ch.body}
                      onChange={(b) => setCh({ body: b })}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-[1fr_160px] gap-3">
                    <Field label="Feature Image URL">
                      <TextInput
                        className="!py-2 !text-xs"
                        value={ch.imageUrl}
                        placeholder="https://..."
                        onChange={(img) => setCh({ imageUrl: img })}
                      />
                    </Field>
                    <Field label="Layout Orientation">
                      <select
                        className="lux-select !py-2 !text-xs"
                        value={ch.layout}
                        onChange={(e) =>
                          setCh({ layout: e.target.value as 'left' | 'right' | 'full' })
                        }
                      >
                        <option value="right">Image Right</option>
                        <option value="left">Image Left</option>
                        <option value="full">Full Bleed</option>
                      </select>
                    </Field>
                  </div>
                </div>
              )}
            />
          </EditorSection>

          {/* 7. TRUST & AMENITIES */}
          <EditorSection
            id="trust"
            index="07"
            title="Trust & Certification"
            titleBn="বিশ্বাস ও বৈধতা"
            intro="Peace of mind parameters: RAJUK plan sanctions, developer credentials, and milestone timeline."
          >
            <div className="grid sm:grid-cols-3 gap-5">
              <Field label="Developer / Builder *">
                <TextInput
                  value={form.trust.developer}
                  placeholder="e.g. Total Barakah Housing"
                  onChange={(d) => updateTrust({ developer: d })}
                />
              </Field>
              <Field label="RAJUK Sanction / Approval No.">
                <TextInput
                  value={form.trust.rajukApproval || ''}
                  placeholder="e.g. RAJUK/DP/2022/..."
                  onChange={(r) => updateTrust({ rajukApproval: r })}
                />
              </Field>
              <Field label="Land Ownership / Title">
                <TextInput
                  value={form.trust.landTitle || ''}
                  placeholder="e.g. Freehold / Mutated"
                  onChange={(t) => updateTrust({ landTitle: t })}
                />
              </Field>
            </div>

            {/* Milestones */}
            <div className="pt-4 border-t border-white/[0.08]">
              <span className="mono-label block mb-3">Construction Milestones Progress Rail</span>
              <Repeater
                idPrefix="milestones"
                items={form.trust.milestones}
                onChange={(m) => updateTrust({ milestones: m })}
                create={() => ({ label: '', date: '', done: false })}
                addLabel="Add Milestone Stage"
                empty="No milestones added."
                render={(m, setM) => (
                  <div className="grid sm:grid-cols-[1.5fr_1fr_auto] gap-3 items-center">
                    <TextInput
                      className="!py-2 !text-xs"
                      placeholder="Stage name (e.g. Piling complete)"
                      value={m.label}
                      onChange={(l) => setM({ label: l })}
                    />
                    <TextInput
                      type="month"
                      className="!py-2 !text-xs"
                      value={m.date}
                      onChange={(d) => setM({ date: d })}
                    />
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={m.done}
                        onChange={(e) => setM({ done: e.target.checked })}
                        className="rounded border-white/20 bg-black/40 text-[#d1ad7a] focus:ring-0"
                      />
                      <span className="text-xs text-slate-300">Completed</span>
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Amenities Tagging */}
            <div className="pt-4 border-t border-white/[0.08]">
              <Field
                label="Amenities & Features (Comma separated)"
                hint="e.g. লিফট, ২৪/৭ নিরাপত্তা, জেনারেটর, গ্যাস লাইন, ছাদ বাগান"
              >
                <TextInput
                  value={form.amenities.join(', ')}
                  onChange={(val) =>
                    update(
                      'amenities',
                      val.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              </Field>
            </div>

            {/* Contact direct */}
            <div className="pt-4 border-t border-white/[0.08] grid sm:grid-cols-3 gap-5">
              <Field label="Inquiry Call Phone *">
                <TextInput
                  value={form.contact.phone}
                  placeholder="+880 1XXX-XXXXXX"
                  onChange={(p) => updateContact({ phone: p })}
                />
              </Field>
              <Field label="WhatsApp Direct">
                <TextInput
                  value={form.contact.whatsapp || ''}
                  placeholder="+880 1XXX-XXXXXX"
                  onChange={(w) => updateContact({ whatsapp: w })}
                />
              </Field>
              <Field label="Atelier Email">
                <TextInput
                  value={form.contact.email || ''}
                  placeholder="info@aura.com.bd"
                  onChange={(em) => updateContact({ email: em })}
                />
              </Field>
            </div>
          </EditorSection>

          {/* 8. SEO & PUBLISHING */}
          <EditorSection
            id="seo"
            index="08"
            title="Publication Status & SEO"
            titleBn="প্রকাশনা ও এসইও"
            intro="Configure visibility, search metadata, and final release state."
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Publication State">
                <Select
                  value={form.publish}
                  onChange={(p) => update('publish', p as PublishState)}
                  options={[
                    { value: 'draft', label: 'Draft (Admin Only Preview)' },
                    { value: 'published', label: 'Published (Publicly Visible)' },
                    { value: 'archived', label: 'Archived (Hidden)' },
                  ]}
                />
              </Field>

              <Field label="Construction State">
                <Select
                  value={form.construction}
                  onChange={(c) => update('construction', c as ConstructionState)}
                  options={Object.entries(CONSTRUCTION_LABELS).map(([k, v]) => ({
                    value: k as ConstructionState,
                    label: v,
                  }))}
                />
              </Field>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <Field label="Search Title Tag">
                <TextInput
                  value={form.seo?.title || ''}
                  placeholder={`${form.title} · ${form.location.area || 'Dhaka'} | AURA`}
                  onChange={(t) => updateSeo({ title: t })}
                />
              </Field>

              <Field label="Meta Description Tag">
                <TextArea
                  rows={2}
                  counter={160}
                  value={form.seo?.description || ''}
                  placeholder="Architectural summary displayed in Google search results..."
                  onChange={(d) => updateSeo({ description: d })}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/[0.08]">
              <Link to="/manage" className="btn-ghost">
                Discard Changes
              </Link>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('draft')}
                  className="btn-quiet"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('published')}
                  className="btn-gold !py-3 !px-7"
                >
                  <Send className="w-4 h-4" /> Save & Publish
                </button>
              </div>
            </div>
          </EditorSection>
        </main>
      </div>
    </div>
  );
};

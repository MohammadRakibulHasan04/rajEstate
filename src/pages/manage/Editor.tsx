import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowUpRight, Building2, Eye, EyeOff, Send, Save } from 'lucide-react';
import {
  CATEGORY_LABELS,
  CONSTRUCTION_LABELS,
  ConstructionState,
  emptyListing,
  Fact,
  Listing,
  ListingCategory,
  ListingContact,
  ListingSection,
  NEARBY_LABELS,
  NearbyType,
  PublishState,
  Unit,
} from '../../types/listing';
import { saveListing, useListingById, useAllListings, isSlugTaken, createUnitListing } from '../../lib/listings';
import { draftFromUnit, linkedUnit, unitPageMap, withParent } from '../../lib/hierarchy';
import { formatBdt, formatNumber, slugify } from '../../lib/format';
import { isCoreFact } from '../../lib/significance';
import { extractEmbedSrc } from '../../lib/media';
import { normalizeAmenities } from '../../lib/amenities';
import {
  addCustomSection,
  editorSectionId,
  enableSection,
  moveSection,
  normalizeSections,
  removeSection,
  SECTION_META,
  sectionLabel,
  updateCustomSection,
} from '../../lib/sections';
import { validateListing } from '../../lib/listingValidation';
import { useAuth } from '../../context/AuthContext';
import { Link, navigate } from '../../lib/router';
import { Field, EditorSection, TextInput, NumberInput, TextArea, Select, Segmented, Toggle, Repeater, useToasts, errorText } from '../../components/manage/fields';
import { UnitsEditor } from '../../components/manage/UnitsEditor';
import { ScoreMeter } from '../../components/manage/ScoreMeter';
import { AmenitiesEditor } from '../../components/manage/AmenitiesEditor';
import { PhotosEditor, FloorPlansEditor, VideoEditor } from '../../components/manage/MediaEditors';
import { ContactEditor } from '../../components/manage/ContactEditor';
import { SpecificationsEditor } from '../../components/manage/SpecificationsEditor';
import { AddSectionMenu, SectionControls } from '../../components/manage/SectionControls';

interface EditorProps {
  /** Undefined when creating a new listing. */
  id?: string;
}

const DRAFT_KEY = 'jonopod_listing_draft_new';

const FIXED_SECTIONS = [
  { id: 'basics', label: 'Basic Information' },
  { id: 'location', label: 'Location' },
  { id: 'specs', label: 'Price & Specifications' },
  { id: 'media', label: 'Photos' },
  { id: 'contact', label: 'Contact Information' },
];

/** Restores a locally saved draft, discarding anything malformed. */
function readLocalDraft(uid: string): Listing | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Listing>;
    if (!parsed || typeof parsed !== 'object') return null;
    const base = emptyListing(uid);
    return {
      ...base,
      ...parsed,
      id: '',
      location: { ...base.location, ...parsed.location },
      price: { ...base.price, ...parsed.price },
      media: { ...base.media, ...parsed.media },
      trust: { ...base.trust, ...parsed.trust },
      contact: { ...base.contact, ...parsed.contact },
      amenities: normalizeAmenities(parsed.amenities),
      sections: normalizeSections(parsed.sections ?? base.sections),
    };
  } catch {
    return null;
  }
}

export const ListingEditor: React.FC<EditorProps> = ({ id }) => {
  const { user } = useAuth();
  const uid = user?.uid || '';
  const { push: toast, view: toastView } = useToasts();
  const { listing: existing, loading } = useListingById(id || null);
  const { listings: allListings, loading: allLoading } = useAllListings(true);

  const [form, setForm] = useState<Listing>(() => emptyListing(uid));
  const [autoSlug, setAutoSlug] = useState(!id);
  const [saving, setSaving] = useState(false);
  const [creatingUnitId, setCreatingUnitId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [checkIntent, setCheckIntent] = useState<'draft' | 'publish' | null>(null);
  const [activeSection, setActiveSection] = useState('basics');

  const hasChangesRef = useRef(false);
  hasChangesRef.current = hasChanges;

  /* ── Derived data ─────────────────────────────────────────────── */

  const projects = useMemo(() => allListings.filter((l) => l.kind === 'project' && l.id !== form.id), [allListings, form.id]);
  const parentProject = useMemo(() => (form.parent?.id ? allListings.find((l) => l.id === form.parent?.id) ?? null : null), [allListings, form.parent?.id]);
  const ownUnit = useMemo(() => linkedUnit(form, parentProject), [form, parentProject]);
  const effective = useMemo(() => withParent(form, parentProject), [form, parentProject]);
  const childListings = useMemo(() => (form.id ? allListings.filter((l) => l.parent?.id === form.id) : []), [allListings, form.id]);
  const unitPages = useMemo(() => unitPageMap(childListings), [childListings]);
  const siblingUnitPages = useMemo(
    () => (parentProject ? unitPageMap(allListings.filter((l) => l.parent?.id === parentProject.id && l.id !== form.id)) : {}),
    [allListings, parentProject, form.id]
  );
  const sections = useMemo(() => normalizeSections(form.sections), [form.sections]);
  const enabledSections = useMemo(() => sections.filter((s) => s.enabled), [sections]);
  const issues = useMemo(() => (checkIntent ? validateListing(form, effective, checkIntent) : []), [checkIntent, form, effective]);

  /* ── Initialisation ───────────────────────────────────────────── */

  // Existing listing: load once, then accept remote updates only while there are no local edits.
  const loadedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!existing) return;
    const key = `${existing.id}:${existing.updatedAt}`;
    if (loadedKey.current === key) return;
    if (loadedKey.current && hasChangesRef.current) return;
    loadedKey.current = key;
    setForm(existing);
    setAutoSlug(false);
  }, [existing]);

  // New listing: from ?parent=&unit= query, or a locally saved draft.
  const newInitDone = useRef(false);
  useEffect(() => {
    if (id || newInitDone.current) return;
    const params = new URLSearchParams(window.location.search);
    const qParent = params.get('parent');
    const qUnit = params.get('unit');
    if (qParent) {
      const proj = allListings.find((l) => l.id === qParent);
      if (!proj && allLoading) return; // wait for the project to load
      newInitDone.current = true;
      const unit = proj?.units.find((u) => u.id === qUnit);
      if (proj && unit) {
        setForm(draftFromUnit(proj, unit, uid));
        setAutoSlug(false);
      } else {
        setForm((prev) => ({ ...prev, kind: 'single', parent: { id: qParent, ...(qUnit ? { unitId: qUnit } : {}) } }));
      }
      return;
    }
    newInitDone.current = true;
    const draft = readLocalDraft(uid);
    if (draft) {
      setForm(draft);
      setAutoSlug(!draft.slug);
      toast('Restored your unsaved draft.', 'info');
    }
  }, [id, allListings, allLoading, uid, toast]);

  // Autosave new, unsaved listings locally.
  useEffect(() => {
    if (id || !hasChanges || form.parent) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        /* storage full or disabled */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form, id, hasChanges]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!hasChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasChanges]);

  /* ── Editing helpers ──────────────────────────────────────────── */

  const edit = useCallback((fn: (prev: Listing) => Listing) => {
    setHasChanges(true);
    setForm(fn);
  }, []);

  const update = <K extends keyof Listing>(key: K, val: Listing[K]) =>
    edit((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'title' && autoSlug) next.slug = slugify(val as string);
      return next;
    });

  const updateLocation = (patch: Partial<Listing['location']>) => edit((p) => ({ ...p, location: { ...p.location, ...patch } }));
  const updateCore = (patch: Partial<Listing['core']>) => edit((p) => ({ ...p, core: { ...p.core, ...patch } }));
  const updateTrust = (patch: Partial<Listing['trust']>) => edit((p) => ({ ...p, trust: { ...p.trust, ...patch } }));
  const updateContact = (patch: Partial<ListingContact>) => edit((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const updateMedia = (patch: Partial<Listing['media']>) => edit((p) => ({ ...p, media: { ...p.media, ...patch } }));
  const updateSeo = (patch: Partial<NonNullable<Listing['seo']>>) => edit((p) => ({ ...p, seo: { ...p.seo, ...patch } }));
  const setSections = (fn: (list: ListingSection[]) => ListingSection[]) => edit((p) => ({ ...p, sections: fn(normalizeSections(p.sections)) }));

  const specFacts = form.facts.filter((f) => !isCoreFact(f));
  const setSpecFacts = (facts: Fact[]) => update('facts', facts);

  const scrollTo = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Highlight the section currently in view.
  const navIds = useMemo(() => [...FIXED_SECTIONS.map((s) => s.id), 'page-sections', ...enabledSections.map(editorSectionId), 'publish'], [enabledSections]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveSection(top.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );
    navIds.forEach((nid) => {
      const el = document.getElementById(nid);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [navIds]);

  /* ── Persistence ──────────────────────────────────────────────── */

  const handleSave = async (target?: PublishState) => {
    if (saving) return;
    const publish = target ?? form.publish;
    const candidate: Listing = { ...form, slug: form.slug.trim() || slugify(form.title), publish };
    const intent = publish === 'published' ? 'publish' : 'draft';
    const found = validateListing(candidate, withParent(candidate, parentProject), intent);
    setCheckIntent(intent);
    if (found.length) {
      toast(`Please fix ${found.length} issue${found.length > 1 ? 's' : ''} before saving.`, 'error');
      scrollTo(found[0].target);
      return;
    }

    setSaving(true);
    try {
      if (await isSlugTaken(candidate.slug, candidate.id)) {
        toast(`The URL "${candidate.slug}" is already used by another listing.`, 'error');
        scrollTo('basics');
        return;
      }
      const docId = await saveListing(candidate, uid || 'admin');
      setForm((prev) => ({ ...prev, slug: candidate.slug, publish }));
      setHasChanges(false);
      setCheckIntent(null);
      toast(publish === 'published' ? 'Saved and published.' : `Saved (${publish}).`, 'ok');
      if (!id) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        navigate(`/manage/edit/${docId}`, { replace: true });
      }
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUnitPage = async (unit: Unit) => {
    if (!form.title.trim()) {
      toast('Give the project a title before creating unit pages.', 'error');
      scrollTo('basics');
      return;
    }
    setCreatingUnitId(unit.id);
    try {
      let projectId = form.id;
      const slug = form.slug.trim() || slugify(form.title);
      if (!projectId || projectId.startsWith('seed-') || hasChanges) {
        projectId = await saveListing({ ...form, slug }, uid || 'admin');
        setForm((prev) => ({ ...prev, id: projectId, slug }));
        setHasChanges(false);
        if (!id) navigate(`/manage/edit/${projectId}`, { replace: true });
      }
      await createUnitListing({ ...form, id: projectId, slug }, unit, uid || 'admin');
      toast(`Draft page created for unit ${unit.code}.`, 'ok');
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setCreatingUnitId(null);
    }
  };

  const confirmLeave = (e: React.MouseEvent) => {
    if (hasChanges && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
  };

  if (loading && id) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-6">
        <div className="skeleton w-64 h-10 rounded-lg" />
      </div>
    );
  }
  if (id && !existing && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-6">
        <h1 className="font-display text-3xl">Listing not found</h1>
        <Link to="/manage" className="btn-gold">Back to Dashboard</Link>
      </div>
    );
  }

  const isPublished = form.publish === 'published';
  const inheritsFromProject = !!parentProject;

  /* ── Section content ──────────────────────────────────────────── */

  const renderSectionBody = (s: ListingSection) => {
    switch (s.type) {
      case 'specifications':
        return <SpecificationsEditor facts={specFacts} onChange={setSpecFacts} />;
      case 'floorPlans':
        return (
          <FloorPlansEditor
            plans={form.media.floorPlans}
            onChange={(floorPlans) => updateMedia({ floorPlans })}
            hint={
              form.kind === 'project'
                ? 'Unit-specific plans can also be attached in the units table.'
                : ownUnit?.floorPlanUrl
                  ? `Leave empty to use the plan attached to unit ${ownUnit.code}.`
                  : undefined
            }
          />
        );
      case 'amenities':
        return (
          <>
            {inheritsFromProject && form.amenities.length === 0 && <InheritNote what="amenities" project={parentProject!.title} />}
            <AmenitiesEditor value={form.amenities} onChange={(amenities) => update('amenities', amenities)} />
          </>
        );
      case 'location':
        return (
          <>
            {inheritsFromProject && form.nearby.length === 0 && <InheritNote what="nearby places and map" project={parentProject!.title} />}
            <Field label="Google Maps Embed Link" htmlFor="map-embed" hint="In Google Maps choose Share → Embed a map, and paste the link or the whole <iframe> code.">
              <TextInput id="map-embed" value={form.location.mapEmbedUrl} placeholder="https://www.google.com/maps/embed?pb=…" onChange={(v) => updateLocation({ mapEmbedUrl: extractEmbedSrc(v) })} />
            </Field>
            <div>
              <span className="mono-label block mb-3">Nearby Places</span>
              <Repeater
                idPrefix="nearby"
                items={form.nearby}
                onChange={(nearby) => update('nearby', nearby)}
                create={() => ({ name: '', type: 'school' as NearbyType, minutes: 5, mode: 'drive' as const })}
                addLabel="Add Place"
                empty="No nearby places yet. Add schools, hospitals, mosques, markets or transit."
                max={20}
                render={(place, setPlace) => (
                  <div className="grid sm:grid-cols-[1.6fr_1fr_110px_100px] gap-3 items-center">
                    <TextInput className="!py-2 !text-xs" placeholder="Name (e.g. Evercare Hospital)" value={place.name} onChange={(name) => setPlace({ name })} aria-label="Place name" maxLength={80} />
                    <select className="lux-select !py-2 !text-xs" value={place.type} onChange={(e) => setPlace({ type: e.target.value as NearbyType })} aria-label="Place type">
                      {Object.entries(NEARBY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                      <NumberInput className="!py-2 !text-xs !px-2" min={1} max={120} value={place.minutes} onChange={(m) => setPlace({ minutes: Math.min(120, Math.max(1, m || 1)) })} aria-label="Minutes" />
                      <span className="text-[10px] font-mono text-[#786F63]">MIN</span>
                    </div>
                    <select className="lux-select !py-2 !text-xs" value={place.mode} onChange={(e) => setPlace({ mode: e.target.value as 'walk' | 'drive' })} aria-label="Travel mode">
                      <option value="walk">Walk</option>
                      <option value="drive">Drive</option>
                    </select>
                  </div>
                )}
              />
            </div>
          </>
        );
      case 'legal':
        return (
          <>
            {inheritsFromProject && <InheritNote what="empty fields" project={parentProject!.title} />}
            <div className="grid sm:grid-cols-3 gap-5">
              <Field label="Developer" htmlFor="trust-developer">
                <TextInput id="trust-developer" value={form.trust.developer} placeholder={parentProject?.trust.developer || 'e.g. Total Barakah Housing'} onChange={(developer) => updateTrust({ developer })} maxLength={120} />
              </Field>
              <Field label="RAJUK Approval No." htmlFor="trust-rajuk">
                <TextInput id="trust-rajuk" value={form.trust.rajukApproval} placeholder="e.g. RAJUK/DP/2022/…" onChange={(rajukApproval) => updateTrust({ rajukApproval })} maxLength={120} />
              </Field>
              <Field label="Land Title" htmlFor="trust-title">
                <TextInput id="trust-title" value={form.trust.landTitle} placeholder="e.g. Freehold, mutated" onChange={(landTitle) => updateTrust({ landTitle })} maxLength={120} />
              </Field>
            </div>
          </>
        );
      case 'progress':
        return (
          <>
            {inheritsFromProject && form.trust.milestones.length === 0 && <InheritNote what="milestones" project={parentProject!.title} />}
            <Repeater
              idPrefix="milestones"
              items={form.trust.milestones}
              onChange={(milestones) => updateTrust({ milestones })}
              create={() => ({ label: '', date: '', done: false })}
              addLabel="Add Milestone"
              empty="No milestones yet."
              max={20}
              render={(m, setM) => (
                <div className="grid sm:grid-cols-[1.6fr_1fr_auto] gap-3 items-center">
                  <TextInput className="!py-2 !text-xs" placeholder="Stage (e.g. Piling complete)" value={m.label} onChange={(label) => setM({ label })} aria-label="Milestone" maxLength={80} />
                  <TextInput type="month" className="!py-2 !text-xs" value={m.date} onChange={(date) => setM({ date })} aria-label="Milestone date" />
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#3D362E]">
                    <input type="checkbox" checked={m.done} onChange={(e) => setM({ done: e.target.checked })} className="accent-[#9A6B3B]" /> Completed
                  </label>
                </div>
              )}
            />
          </>
        );
      case 'video':
        return <VideoEditor url={form.media.videoUrl} onChange={(videoUrl) => updateMedia({ videoUrl })} />;
      case 'custom':
        return (
          <>
            <Field label="Heading *" htmlFor={`${s.id}-title`} hint="Shown as the section title, e.g. Payment Plan.">
              <TextInput id={`${s.id}-title`} value={s.title} placeholder="e.g. Payment Plan" onChange={(title) => setSections((l) => updateCustomSection(l, s.id, { title }))} maxLength={80} aria-invalid={!s.title.trim()} />
            </Field>
            <Field label="Content" htmlFor={`${s.id}-body`} hint="Write in Bangla.">
              <TextArea id={`${s.id}-body`} lang="bn" rows={5} counter={2000} value={s.body} placeholder="এখানে বিস্তারিত লিখুন…" onChange={(body) => setSections((l) => updateCustomSection(l, s.id, { body }))} />
            </Field>
            <Field label="Image (optional)" htmlFor={`${s.id}-image`}>
              <TextInput id={`${s.id}-image`} value={s.imageUrl} placeholder="https://…" onChange={(imageUrl) => setSections((l) => updateCustomSection(l, s.id, { imageUrl }))} />
            </Field>
          </>
        );
    }
  };

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#181512] pb-32">
      {toastView}

      <header className="sticky top-0 z-40 bg-[#ffffff]/92 backdrop-blur-xl border-b border-[#181512]/[0.08] px-6 md:px-12 py-4">
        <div className="max-w-[90rem] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/manage" onClick={confirmLeave} className="p-2 rounded-full border border-[#181512]/15 hover:border-[#9A6B3B] text-[#3D362E] transition-colors" title="Back to Dashboard" aria-label="Back to Dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="mono-label !text-[9.5px]">{id ? 'Edit Listing' : 'New Listing'}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${isPublished ? 'bg-emerald-600/12 text-emerald-800' : 'bg-[#181512]/[0.06] text-[#5C5346]'}`}>{form.publish}</span>
                {hasChanges && <span className="text-[10px] font-mono text-amber-700">Unsaved changes</span>}
              </div>
              <h1 className="font-display text-xl text-[#181512] truncate max-w-xs sm:max-w-md">{form.title || 'Untitled Listing'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {form.id && form.slug && (
              <a href={`/property/${form.slug}`} target="_blank" rel="noreferrer" className="btn-quiet hidden md:inline-flex" title="Open the saved version in a new tab">
                <Eye className="w-3.5 h-3.5" /> Preview
              </a>
            )}
            {isPublished && (
              <button id="editor-unpublish" type="button" disabled={saving} onClick={() => handleSave('draft')} className="btn-quiet hidden sm:inline-flex">
                <EyeOff className="w-3.5 h-3.5" /> Unpublish
              </button>
            )}
            <button id="editor-save" type="button" disabled={saving} onClick={() => handleSave()} className={isPublished ? 'btn-gold !py-2.5 !px-5' : 'btn-quiet'}>
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : isPublished ? 'Save Changes' : 'Save Draft'}
            </button>
            {!isPublished && (
              <button id="editor-publish" type="button" disabled={saving} onClick={() => handleSave('published')} className="btn-gold !py-2.5 !px-5">
                <Send className="w-3.5 h-3.5" /> Publish
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[90rem] mx-auto px-6 md:px-12 py-10 grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24 space-y-5">
            <nav className="panel p-3" aria-label="Form sections">
              {FIXED_SECTIONS.map((s, i) => (
                <NavItem key={s.id} label={`${i + 1}. ${s.label}`} active={activeSection === s.id} onClick={() => scrollTo(s.id)} />
              ))}
              <NavItem label="6. Page Sections" active={activeSection === 'page-sections'} onClick={() => scrollTo('page-sections')} />
              {enabledSections.map((s) => (
                <NavItem key={s.id} label={sectionLabel(s)} indent active={activeSection === editorSectionId(s)} onClick={() => scrollTo(editorSectionId(s))} />
              ))}
              <NavItem label="7. Publishing & SEO" active={activeSection === 'publish'} onClick={() => scrollTo('publish')} />
            </nav>
            <ScoreMeter listing={effective} onNavigateSection={scrollTo} />
          </div>
        </aside>

        <main className="lg:col-span-9 space-y-8">
          {issues.length > 0 && (
            <div role="alert" className="rounded-2xl border border-red-500/35 bg-red-50 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                <AlertTriangle className="w-4 h-4" /> {issues.length} issue{issues.length > 1 ? 's' : ''} to fix before saving
              </div>
              <ul className="mt-3 space-y-1.5">
                {issues.map((iss, i) => (
                  <li key={i}>
                    <button type="button" onClick={() => scrollTo(iss.target)} className="text-left text-[13px] text-red-800 underline-offset-2 hover:underline cursor-pointer">
                      {iss.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. BASICS */}
          <EditorSection id="basics" index="01" title="Basic Information">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Listing Type">
                <Segmented
                  idPrefix="kind"
                  value={form.kind}
                  onChange={(k) =>
                    edit((p) => ({ ...p, kind: k, ...(k === 'project' ? { parent: undefined } : {}) }))
                  }
                  options={[
                    { value: 'single', label: 'Single Property', hint: 'One flat, house or plot' },
                    { value: 'project', label: 'Project', hint: 'A building with multiple units' },
                  ]}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category" htmlFor="category">
                  <Select id="category" value={form.category} onChange={(c) => update('category', c as ListingCategory)} options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v as ListingCategory, label: l }))} />
                </Field>
                <Field label="Status" htmlFor="construction" hint={parentProject ? 'Follows the project.' : undefined}>
                  <Select id="construction" value={effective.construction} onChange={(c) => update('construction', c as ConstructionState)} options={Object.entries(CONSTRUCTION_LABELS).map(([k, v]) => ({ value: k as ConstructionState, label: v }))} />
                </Field>
              </div>
            </div>

            {form.kind === 'single' && (
              <div className="rounded-xl border border-[#181512]/10 bg-[#F6F2EA]/60 p-5 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="mono-label flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-[#9A6B3B]" /> Project Link (optional)</span>
                  {parentProject && (
                    <Link to={`/manage/edit/${parentProject.id}`} onClick={confirmLeave} className="inline-flex items-center gap-1 text-xs font-mono text-[#9A6B3B] hover:text-[#684724]">
                      Edit {parentProject.title} <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Project" htmlFor="parent-project-select">
                    <select id="parent-project-select" className="lux-select" value={form.parent?.id || ''} onChange={(e) => update('parent', e.target.value ? { id: e.target.value } : undefined)}>
                      <option value="">Standalone property</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.title} ({p.units.length} units)</option>
                      ))}
                    </select>
                  </Field>
                  {parentProject && (
                    <Field label="Unit" htmlFor="parent-unit-select" hint="Size, rooms, floor, facing, price and availability come from this unit.">
                      <select
                        id="parent-unit-select"
                        className="lux-select"
                        value={form.parent?.unitId || ''}
                        onChange={(e) => {
                          const unitId = e.target.value || undefined;
                          const picked = parentProject.units.find((u) => u.id === unitId);
                          edit((prev) => {
                            const next: Listing = { ...prev, parent: { id: parentProject.id, ...(unitId ? { unitId } : {}) } };
                            if (picked && !prev.title.trim()) {
                              next.title = `${parentProject.title} · Unit ${picked.code}`;
                              if (autoSlug) next.slug = `${parentProject.slug}-${slugify(picked.code)}`.slice(0, 80);
                            }
                            return next;
                          });
                        }}
                      >
                        <option value="">Not linked to a unit</option>
                        {parentProject.units.map((u) => {
                          const takenBy = siblingUnitPages[u.id];
                          return (
                            <option key={u.id} value={u.id} disabled={!!takenBy}>
                              Unit {u.code} · Floor {u.floor} · {formatNumber(u.sizeSqft)} sq ft · {formatBdt(u.price, { short: true })} ({u.status}){takenBy ? ` (page: ${takenBy.title})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </Field>
                  )}
                </div>
                {parentProject && (
                  <p className="text-xs text-[#4A433B] leading-relaxed">
                    Empty fields (location, photos, contact, amenities, legal details) use the values from <strong>{parentProject.title}</strong>.
                  </p>
                )}
              </div>
            )}

            <Field label="Title *" htmlFor="title">
              <TextInput id="title" value={form.title} placeholder="e.g. The Barakah Residence" onChange={(t) => update('title', t)} maxLength={160} required aria-invalid={checkIntent !== null && !form.title.trim()} />
            </Field>

            <Field label="URL Slug *" htmlFor="slug" hint={`Page address: /property/${form.slug || 'your-slug'}`}>
              <div className="flex gap-3">
                <TextInput
                  id="slug"
                  className="flex-1"
                  value={form.slug}
                  placeholder="the-barakah-residence"
                  onChange={(s) => {
                    setAutoSlug(false);
                    update('slug', slugify(s));
                  }}
                />
                <button type="button" onClick={() => { setAutoSlug(true); update('slug', slugify(form.title)); }} className="btn-quiet !py-2.5 shrink-0">
                  Generate
                </button>
              </div>
            </Field>

            <Field label="Description" htmlFor="summary" hint={inheritsFromProject && !form.summary.trim() ? 'Write in Bangla. Required to publish.' : 'Write in Bangla. Shown in the Overview section and used for search results.'}>
              <TextArea id="summary" lang="bn" rows={6} counter={1500} value={form.summary} onChange={(s) => update('summary', s)} placeholder="ফ্ল্যাটের অবস্থান, আয়তন, আলো-বাতাস ও বিশেষ সুবিধাগুলো সংক্ষেপে লিখুন…" />
            </Field>

            <Toggle id="featured-toggle" label="Featured" hint="Show this listing first on the home page." checked={form.featured} onChange={(f) => update('featured', f)} />
          </EditorSection>

          {/* 2. LOCATION */}
          <EditorSection id="location" index="02" title="Location">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Area *" htmlFor="loc-area">
                <TextInput id="loc-area" value={form.location.area} placeholder={parentProject?.location.area || 'e.g. Bashundhara R/A'} onChange={(area) => updateLocation({ area })} maxLength={80} />
              </Field>
              <Field label="City" htmlFor="loc-city">
                <TextInput id="loc-city" value={form.location.city} placeholder={parentProject?.location.city || 'Dhaka'} onChange={(city) => updateLocation({ city })} maxLength={60} />
              </Field>
            </div>
            <Field label="Full Address" htmlFor="loc-address">
              <TextInput id="loc-address" value={form.location.address} placeholder={parentProject?.location.address || 'House, road, block…'} onChange={(address) => updateLocation({ address })} maxLength={200} />
            </Field>
          </EditorSection>

          {/* 3. PRICE & SPECS */}
          <EditorSection id="specs" index="03" title="Price & Specifications">
            {form.kind === 'single' ? (
              <div className="space-y-6">
                {parentProject && ownUnit && (
                  <div className="rounded-xl border border-[#9A6B3B]/30 bg-[#9A6B3B]/[0.04] p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-sm text-[#3D362E]">
                      <span className="mono-label block mb-1">Synced from unit {ownUnit.code}</span>
                      {formatBdt(ownUnit.price)} · {formatNumber(ownUnit.sizeSqft)} sq ft · {ownUnit.beds} bed · {ownUnit.baths} bath · Floor {ownUnit.floor} · {ownUnit.facing} · {ownUnit.status}
                    </div>
                    <Link to={`/manage/edit/${parentProject.id}`} onClick={confirmLeave} className="btn-quiet !py-2 !text-[10.5px]">
                      Edit Unit <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-5 items-end">
                  <Field label="Price (BDT)" htmlFor="price" hint={ownUnit && ownUnit.price > 0 ? 'Set in the project units table.' : form.price.amount > 0 ? formatBdt(form.price.amount) : 'Leave empty to show "Price on request".'}>
                    <NumberInput id="price" min={0} step={10000} value={ownUnit && ownUnit.price > 0 ? ownUnit.price : form.price.amount || undefined} placeholder="28500000" disabled={!!(ownUnit && ownUnit.price > 0)} onChange={(p) => update('price', { ...form.price, amount: Math.max(0, p || 0) })} />
                  </Field>
                  <div className="pb-2">
                    <Toggle id="price-negotiable" label="Price is negotiable" checked={form.price.negotiable} onChange={(negotiable) => update('price', { ...form.price, negotiable })} />
                  </div>
                </div>

                {!ownUnit && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Field label="Area (sq ft)" htmlFor="core-size"><NumberInput id="core-size" min={0} value={form.core.sizeSqft} placeholder="1850" onChange={(sizeSqft) => updateCore({ sizeSqft })} /></Field>
                      <Field label="Bedrooms" htmlFor="core-beds"><NumberInput id="core-beds" min={0} max={20} value={form.core.beds} placeholder="3" onChange={(beds) => updateCore({ beds })} /></Field>
                      <Field label="Bathrooms" htmlFor="core-baths"><NumberInput id="core-baths" min={0} max={20} value={form.core.baths} placeholder="3" onChange={(baths) => updateCore({ baths })} /></Field>
                      <Field label="Balconies" htmlFor="core-balconies"><NumberInput id="core-balconies" min={0} max={20} value={form.core.balconies} placeholder="2" onChange={(balconies) => updateCore({ balconies })} /></Field>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Field label="Floor" htmlFor="core-floor"><NumberInput id="core-floor" min={0} max={200} value={form.core.floor} placeholder="7" onChange={(floor) => updateCore({ floor })} /></Field>
                      <Field label="Total Floors" htmlFor="core-total"><NumberInput id="core-total" min={0} max={200} value={form.core.totalFloors} placeholder={parentProject?.core.totalFloors ? String(parentProject.core.totalFloors) : '10'} onChange={(totalFloors) => updateCore({ totalFloors })} /></Field>
                      <Field label="Car Parking" htmlFor="core-parking"><NumberInput id="core-parking" min={0} max={20} value={form.core.parking} placeholder="1" onChange={(parking) => updateCore({ parking })} /></Field>
                      <Field label="Land (katha)" htmlFor="core-land"><NumberInput id="core-land" min={0} step={0.5} value={form.core.landKatha} placeholder="5" onChange={(landKatha) => updateCore({ landKatha })} /></Field>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field label="Facing" htmlFor="core-facing"><TextInput id="core-facing" value={form.core.facing} placeholder="e.g. South-East" onChange={(facing) => updateCore({ facing })} maxLength={30} /></Field>
                      {effective.construction !== 'ready' && (
                        <Field label="Expected Handover" htmlFor="core-handover"><TextInput id="core-handover" type="month" value={form.core.handover} onChange={(handover) => updateCore({ handover })} /></Field>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Total Floors" htmlFor="proj-floors"><NumberInput id="proj-floors" min={0} max={200} value={form.core.totalFloors} placeholder="12" onChange={(totalFloors) => updateCore({ totalFloors })} /></Field>
                  <Field label="Land (katha)" htmlFor="proj-land"><NumberInput id="proj-land" min={0} step={0.5} value={form.core.landKatha} placeholder="10" onChange={(landKatha) => updateCore({ landKatha })} /></Field>
                  <Field label="Parking per Unit" htmlFor="proj-parking"><NumberInput id="proj-parking" min={0} max={20} value={form.core.parking} placeholder="1" onChange={(parking) => updateCore({ parking })} /></Field>
                  {form.construction !== 'ready' && (
                    <Field label="Expected Handover" htmlFor="proj-handover"><TextInput id="proj-handover" type="month" value={form.core.handover} onChange={(handover) => updateCore({ handover })} /></Field>
                  )}
                </div>
                <Toggle id="price-negotiable" label="Prices are negotiable" checked={form.price.negotiable} onChange={(negotiable) => update('price', { ...form.price, negotiable })} />
                <div className="pt-4 border-t border-[#181512]/[0.08]">
                  <UnitsEditor units={form.units} unitPages={unitPages} onCreateUnitPage={handleCreateUnitPage} creatingUnitId={creatingUnitId} onChange={(units) => update('units', units)} />
                </div>
              </div>
            )}
          </EditorSection>

          {/* 4. PHOTOS */}
          <EditorSection id="media" index="04" title="Photos" intro="The cover photo appears first in the gallery and on listing cards.">
            <PhotosEditor hero={form.media.hero} gallery={form.media.gallery} inheritedHeroUrl={parentProject?.media.hero.url} onChange={({ hero, gallery }) => updateMedia({ hero, gallery })} />
          </EditorSection>

          {/* 5. CONTACT */}
          <EditorSection id="contact" index="05" title="Contact Information" intro="Shown in the contact card next to the listing.">
            <ContactEditor value={form.contact} onChange={updateContact} inherited={parentProject?.contact} />
          </EditorSection>

          {/* 6. PAGE SECTIONS */}
          <div id="page-sections" className="scroll-mt-28 flex flex-wrap items-end justify-between gap-4 pt-4">
            <div>
              <span className="font-mono text-xs text-[#9A6B3B]">06</span>
              <h2 className="font-display text-2xl text-[#181512]">Page Sections</h2>
              <p className="mt-1 text-sm text-[#5C5346] max-w-xl">Choose which sections appear on the property page and in what order. Sections without content are hidden automatically.</p>
            </div>
            <AddSectionMenu
              sections={sections}
              onEnable={(sid) => {
                setSections((l) => enableSection(l, sid));
                setTimeout(() => scrollTo(`section-${sid}`), 50);
              }}
              onAddCustom={() => {
                const created = { id: `custom-${Date.now().toString(36)}`, type: 'custom' as const, enabled: true, title: '', body: '' };
                setSections((l) => addCustomSection(l, created));
                setTimeout(() => scrollTo(editorSectionId(created)), 50);
              }}
            />
          </div>

          {enabledSections.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#181512]/15 p-8 text-center text-sm text-[#6E6559]">
              No optional sections. Use "Add Section" to include floor plans, amenities, location and more.
            </div>
          )}

          {enabledSections.map((s, i) => (
            <EditorSection
              key={s.id}
              id={editorSectionId(s)}
              title={sectionLabel(s)}
              badge={s.type === 'custom' ? 'Custom' : undefined}
              intro={s.type === 'custom' ? undefined : SECTION_META[s.type].description}
              actions={
                <SectionControls
                  label={sectionLabel(s)}
                  isFirst={i === 0}
                  isLast={i === enabledSections.length - 1}
                  isCustom={s.type === 'custom'}
                  onMove={(dir) => setSections((l) => moveSection(l, s.id, dir))}
                  onRemove={() => setSections((l) => removeSection(l, s.id))}
                />
              }
            >
              {renderSectionBody(s)}
            </EditorSection>
          ))}

          {/* 7. PUBLISHING */}
          <EditorSection id="publish" index="07" title="Publishing & SEO">
            <Field label="Visibility" htmlFor="publish-state">
              <Select
                id="publish-state"
                value={form.publish}
                onChange={(p) => update('publish', p as PublishState)}
                options={[
                  { value: 'draft', label: 'Draft (visible to admins only)' },
                  { value: 'published', label: 'Published (visible to everyone)' },
                  { value: 'archived', label: 'Archived (hidden)' },
                ]}
              />
            </Field>
            <Field label="Search Title" htmlFor="seo-title" hint="Leave empty to generate from the title and area.">
              <TextInput id="seo-title" value={form.seo?.title} placeholder={`${form.title || 'Title'} · ${form.location.area || 'Dhaka'} | Jonopod Properties`} onChange={(title) => updateSeo({ title })} maxLength={70} />
            </Field>
            <Field label="Search Description" htmlFor="seo-desc" hint="Leave empty to use the start of the description.">
              <TextArea id="seo-desc" rows={2} counter={160} value={form.seo?.description} onChange={(description) => updateSeo({ description })} />
            </Field>
          </EditorSection>
        </main>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ label: string; active: boolean; onClick: () => void; indent?: boolean }> = ({ label, active, onClick, indent }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'true' : undefined}
    className={`w-full text-left rounded-lg text-xs transition-colors cursor-pointer truncate ${indent ? 'pl-7 pr-3 py-1.5' : 'px-3 py-2 font-medium'} ${
      active ? 'bg-[#9A6B3B]/12 text-[#5C3D1E]' : 'text-[#5C5346] hover:text-[#181512] hover:bg-[#181512]/[0.04]'
    }`}
  >
    {label}
  </button>
);

const InheritNote: React.FC<{ what: string; project: string }> = ({ what, project }) => (
  <p className="text-[12px] text-[#6E6559]">
    Leave empty to use the {what} from <strong>{project}</strong>.
  </p>
);

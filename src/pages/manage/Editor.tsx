import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Archive, ArrowLeft, ArrowUpRight, Building2, Eye, EyeOff, RotateCcw, Send, Save, Trash2 } from 'lucide-react';
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
  TitleMode,
  Unit,
} from '../../types/listing';
import { saveListing, deleteListing, useListingById, useAllListings, isSlugTaken, createUnitListing } from '../../lib/listings';
import { draftFromUnit, linkedUnit, unitPageMap, withParent } from '../../lib/hierarchy';
import { formatBdt, formatBdtRange, formatNumber, fromBnDigits, parseBdtRangeInput, slugify } from '../../lib/format';
import {
  displayTitle,
  effectivePrice,
  fallbackListingName,
  hasCustomName,
  isCoreFact,
  isPriceAsTitle,
  priceLabel,
  suggestSlug,
} from '../../lib/significance';
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
import { PhotosEditor, FloorPlansEditor, SatelliteImageEditor, VideoEditor } from '../../components/manage/MediaEditors';
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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
  const sections = useMemo(() => normalizeSections(form.sections).filter((s) => s.type !== 'video'), [form.sections]);
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
      if ((key === 'title' || key === 'price' || key === 'category' || key === 'titleMode') && autoSlug) {
        const nextSlug = suggestSlug(withParent(next, parentProject));
        if (nextSlug) next.slug = nextSlug;
      }
      return next;
    });

  const updateLocation = (patch: Partial<Listing['location']>) =>
    edit((p) => {
      const next = { ...p, location: { ...p.location, ...patch } };
      if (autoSlug && next.titleMode === 'price' && !hasCustomName(next)) {
        const nextSlug = suggestSlug(withParent(next, parentProject));
        if (nextSlug) next.slug = nextSlug;
      }
      return next;
    });
  const updateCore = (patch: Partial<Listing['core']>) => edit((p) => ({ ...p, core: { ...p.core, ...patch } }));
  const updateTrust = (patch: Partial<Listing['trust']>) => edit((p) => ({ ...p, trust: { ...p.trust, ...patch } }));
  const updateContact = (patch: Partial<ListingContact>) => edit((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const updateMedia = (patch: Partial<Listing['media']>) => edit((p) => ({ ...p, media: { ...p.media, ...patch } }));
  const updateSeo = (patch: Partial<NonNullable<Listing['seo']>>) => edit((p) => ({ ...p, seo: { ...p.seo, ...patch } }));
  const setSections = (fn: (list: ListingSection[]) => ListingSection[]) => edit((p) => ({ ...p, sections: fn(normalizeSections(p.sections)) }));

  const currentPriceAmount = form.price.amount > 0 ? form.price.amount : ownUnit?.price || 0;
  const currentMaxPriceAmount = form.price.maxAmount && form.price.maxAmount > 0 ? form.price.maxAmount : 0;
  const currentPriceLabel =
    form.price.label !== undefined
      ? form.price.label
      : effectivePrice(effective).amount > 0
        ? priceLabel({ ...effective, price: { ...effective.price, label: undefined } }, true)
        : '';

  const buildAutoPriceLabel = (minAmt: number, maxAmt: number) => {
    if (minAmt > 0 && maxAmt > minAmt) {
      return formatBdtRange(minAmt, maxAmt, { bn: true });
    }
    const singleAmt = minAmt > 0 ? minAmt : maxAmt;
    if (singleAmt > 0) {
      const base = formatBdt(singleAmt, { bn: true });
      return form.kind === 'project' && form.units.length > 0 && maxAmt <= 0 ? `${base} থেকে` : base;
    }
    return '';
  };

  const handlePriceAmountInput = (raw: string) => {
    const digits = fromBnDigits(raw).replace(/[^0-9]/g, '');
    const amount = digits ? Math.max(0, Number(digits)) : 0;
    const maxAmount = currentMaxPriceAmount;
    update('price', {
      ...form.price,
      amount,
      ...(maxAmount > 0 ? { maxAmount } : { maxAmount: undefined }),
      label: buildAutoPriceLabel(amount, maxAmount),
    });
  };

  const handleMaxPriceAmountInput = (raw: string) => {
    const digits = fromBnDigits(raw).replace(/[^0-9]/g, '');
    const maxAmount = digits ? Math.max(0, Number(digits)) : 0;
    const amount = currentPriceAmount;
    update('price', {
      ...form.price,
      amount,
      ...(maxAmount > 0 ? { maxAmount } : { maxAmount: undefined }),
      label: buildAutoPriceLabel(amount, maxAmount),
    });
  };

  const handlePriceLabelInput = (rawLabel: string) => {
    const parsed = parseBdtRangeInput(rawLabel);
    update('price', {
      ...form.price,
      label: rawLabel,
      ...(parsed !== null
        ? {
            amount: Math.max(0, parsed.amount),
            ...(parsed.maxAmount && parsed.maxAmount > 0 ? { maxAmount: parsed.maxAmount } : { maxAmount: undefined }),
          }
        : {}),
    });
  };

  const fillRangeFromUnits = () => {
    const priced = form.units.filter((u) => u.price > 0);
    if (!priced.length) return;
    const avail = priced.filter((u) => u.status === 'available');
    const pool = avail.length ? avail : priced;
    const minAmt = Math.min(...pool.map((u) => u.price));
    const maxAmt = Math.max(...pool.map((u) => u.price));
    update('price', {
      ...form.price,
      amount: minAmt,
      ...(maxAmt > minAmt ? { maxAmount: maxAmt } : { maxAmount: undefined }),
      label: buildAutoPriceLabel(minAmt, maxAmt > minAmt ? maxAmt : 0),
    });
  };

  const specFacts = form.facts.filter((f) => !isCoreFact(f));
  const setSpecFacts = (facts: Fact[]) => update('facts', facts);

  const scrollTo = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Highlight the section currently in view.
  const navIds = useMemo(() => ['basics', 'project-video', ...FIXED_SECTIONS.slice(1).map((s) => s.id), 'page-sections', ...enabledSections.map(editorSectionId), 'publish'], [enabledSections]);
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
    if (saving || deleting) return;
    const prevPublish = form.publish;
    const publish = target ?? form.publish;
    const rawCandidate: Listing = { ...form, publish };
    const effectiveCandidate = withParent(rawCandidate, parentProject);
    const resolvedTitle =
      rawCandidate.title.trim() || (rawCandidate.titleMode === 'price' ? fallbackListingName(effectiveCandidate) : '');
    const fallbackSlug =
      suggestSlug({ ...effectiveCandidate, title: resolvedTitle }) ||
      existing?.slug ||
      (resolvedTitle ? `property-${Date.now().toString(36)}` : '');
    const candidate: Listing = {
      ...rawCandidate,
      title: resolvedTitle,
      slug: form.slug.trim() || fallbackSlug,
    };
    const intent = publish === 'published' ? 'publish' : 'draft';
    const found = validateListing(candidate, withParent(candidate, parentProject), intent);
    setCheckIntent(intent);
    if (found.length) {
      toast(`Please fix ${found.length} issue${found.length > 1 ? 's' : ''} before ${publish === 'published' ? 'publishing' : 'saving'}.`, 'error');
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
      setForm((prev) => ({ ...prev, id: docId, slug: candidate.slug, publish }));
      setHasChanges(false);
      setCheckIntent(null);

      if (target === 'published' && prevPublish !== 'published') {
        toast('Property published and live on the showcase.', 'ok');
      } else if (target === 'draft' && prevPublish === 'published') {
        toast('Property unpublished and moved to drafts.', 'ok');
      } else if (target === 'draft' && prevPublish === 'archived') {
        toast('Property restored from archive to drafts.', 'ok');
      } else if (target === 'archived' && prevPublish !== 'archived') {
        toast('Property archived and hidden from public view.', 'ok');
      } else if (publish === 'published') {
        toast('Saved and published.', 'ok');
      } else if (publish === 'archived') {
        toast('Saved in archive.', 'ok');
      } else {
        toast('Draft saved.', 'ok');
      }

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

  const handleDelete = async () => {
    if (deleting || saving) return;
    setDeleting(true);
    try {
      const targetId = form.id || id;
      if (targetId) {
        await deleteListing(targetId);
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      hasChangesRef.current = false;
      setHasChanges(false);
      setShowDeleteModal(false);
      navigate('/manage', { replace: true });
    } catch (err) {
      toast(errorText(err), 'error');
      setDeleting(false);
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
  const isArchived = form.publish === 'archived';
  const isDraft = form.publish === 'draft';
  const isPersisted = Boolean(form.id || id);
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
      case 'satellite':
        return (
          <>
            {inheritsFromProject && !form.media.satelliteImage?.url && (
              <InheritNote what="satellite image" project={parentProject!.title} />
            )}
            <SatelliteImageEditor
              image={form.media.satelliteImage}
              inheritedImage={parentProject?.media.satelliteImage}
              onChange={(satelliteImage) => updateMedia({ satelliteImage })}
            />
          </>
        );
      case 'amenities':
        return (
          <>
            {inheritsFromProject && form.amenities.length === 0 && <InheritNote what="সুযোগ-সুবিধা" project={parentProject!.title} />}
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
        <div className="max-w-[90rem] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/manage" onClick={confirmLeave} className="p-2 rounded-full border border-[#181512]/15 hover:border-[#9A6B3B] text-[#3D362E] transition-colors" title="Back to Dashboard" aria-label="Back to Dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="mono-label !text-[9.5px]">{isPersisted ? 'Edit Listing' : 'New Listing'}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${
                    isPublished
                      ? 'bg-emerald-600/12 text-emerald-800 border-emerald-700/30'
                      : isArchived
                        ? 'bg-[#181512]/[0.08] text-[#3D362E] border-[#181512]/20'
                        : 'bg-amber-500/12 text-amber-800 border-amber-700/30'
                  }`}
                >
                  {form.publish}
                </span>
                {isPriceAsTitle(form) && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border border-[#9A6B3B]/35 bg-[#9A6B3B]/10 text-[#684724]">
                    Price as Title
                  </span>
                )}
                {hasChanges && <span className="text-[10px] font-mono text-amber-700">Unsaved changes</span>}
              </div>
              <h1
                lang={isPriceAsTitle(form) ? 'bn' : undefined}
                className={`${isPriceAsTitle(form) ? 'font-nakkhatra font-normal' : 'font-display'} text-xl text-[#181512] truncate max-w-xs sm:max-w-md`}
              >
                {displayTitle(effective) || form.title || 'Untitled Listing'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Delete (leftmost) */}
            <button
              id="editor-delete-top"
              type="button"
              disabled={saving || deleting}
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-red-500/25 bg-red-500/[0.06] hover:bg-red-500/15 hover:border-red-500/45 text-red-700 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              title={isPersisted ? 'Permanently delete this property' : 'Discard unsaved draft'}
              aria-label={isPersisted ? 'Delete property' : 'Discard draft'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isPersisted ? 'Delete' : 'Discard'}</span>
            </button>

            {/* 2. Archive */}
            {!isArchived && (
              <button
                id="editor-archive"
                type="button"
                disabled={saving || deleting}
                onClick={() => handleSave('archived')}
                className="btn-quiet"
                title="Archive this property and hide from public view"
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
            )}

            {/* 3. Unpublish / Publish */}
            {isPublished && (
              <button
                id="editor-unpublish"
                type="button"
                disabled={saving || deleting}
                onClick={() => handleSave('draft')}
                className="btn-quiet"
                title="Unpublish and move back to Drafts"
              >
                <EyeOff className="w-3.5 h-3.5" /> Unpublish
              </button>
            )}

            {isArchived && (
              <button
                id="editor-unpublish"
                type="button"
                disabled={saving || deleting}
                onClick={() => handleSave('draft')}
                className="btn-quiet"
                title="Restore from Archive to Drafts"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Unpublish
              </button>
            )}

            {!isPublished && (
              <button
                id="editor-publish"
                type="button"
                disabled={saving || deleting}
                onClick={() => handleSave('published')}
                className="btn-quiet"
                title="Validate and publish live on public showcase"
              >
                <Send className="w-3.5 h-3.5" /> Publish
              </button>
            )}

            {/* 4. Preview */}
            {form.id && form.slug && (
              <a
                href={`/property/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn-quiet"
                title="Open the saved version in a new tab"
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </a>
            )}

            {/* 5. Save Changes (rightmost) */}
            <button
              id="editor-save"
              type="button"
              disabled={saving || deleting}
              onClick={() => handleSave()}
              className="btn-gold !py-2.5 !px-5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[90rem] mx-auto px-6 md:px-12 py-10 grid lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24 space-y-5">
            <nav className="panel p-3" aria-label="Form sections">
              <NavItem label="1. Basic Information" active={activeSection === 'basics'} onClick={() => scrollTo('basics')} />
              <NavItem label="Project Overview Video" indent active={activeSection === 'project-video'} onClick={() => scrollTo('project-video')} />
              {FIXED_SECTIONS.slice(1).map((s, i) => (
                <NavItem key={s.id} label={`${i + 2}. ${s.label}`} active={activeSection === s.id} onClick={() => scrollTo(s.id)} />
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
                              Unit {u.code} · Floor {u.floor} · {formatNumber(u.sizeSqft)} sq ft · {u.beds} bed · {u.baths} bath · {u.balconies ?? 0} balcony · {formatBdt(u.price, { short: true })} ({u.status}){takenBy ? ` (page: ${takenBy.title})` : ''}
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

            <Field label="Title Display Mode" hint="Choose whether this property displays its name or its asking price as the main headline.">
              <Segmented<TitleMode>
                idPrefix="title-mode"
                value={form.titleMode || 'name'}
                onChange={(mode) => update('titleMode', mode)}
                options={[
                  {
                    value: 'name',
                    label: 'Name as Title',
                    hint: form.title.trim() && hasCustomName(form) ? `Headline: ${form.title.trim()}` : 'Show property name as the main title (e.g. The Barakah Residence)',
                  },
                  {
                    value: 'price',
                    label: 'Price as Title (Bangla)',
                    hint: effectivePrice(effective).amount > 0 || form.price.label?.trim() ? `Headline: ${priceLabel(effective, true)}` : 'Show asking price in Bangla font as the main title (e.g. ৳ ২.৮৫ কোটি)',
                  },
                ]}
              />
            </Field>

            {isPriceAsTitle(form) ? (
              <div className="rounded-xl border border-[#9A6B3B]/30 bg-[#FAF6EE] p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="mono-label block text-[#684724]">Active Headline Preview (Bangla Font)</span>
                    <div lang="bn" className="font-nakkhatra font-normal text-2xl sm:text-3xl text-gradient-gold mt-1">
                      {displayTitle(effective, true)}
                    </div>
                  </div>
                  {form.price.negotiable && (
                    <span className="px-2.5 py-1 rounded-full border border-[#9A6B3B]/40 bg-[#9A6B3B]/10 text-[10px] font-mono tracking-[0.2em] uppercase text-[#684724]">
                      Negotiable Price
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4 items-start pt-3 border-t border-[#181512]/[0.08]">
                  <Field
                    label="Price / Range Title (Bangla) *"
                    htmlFor="basics-price-label"
                    hint="Edit Bangla price or range directly (e.g. ৳ ২.৮৫ কোটি or ৳ ১.৮ কোটি – ২.৫ কোটি)."
                  >
                    <TextInput
                      id="basics-price-label"
                      lang="bn"
                      className="font-nakkhatra !text-xl !leading-normal"
                      value={currentPriceLabel}
                      placeholder="৳ ১.৮ কোটি – ২.৫ কোটি"
                      onChange={handlePriceLabelInput}
                      maxLength={120}
                    />
                  </Field>

                  <Field
                    label="Price / Min Price (BDT)"
                    htmlFor="basics-price-amount"
                    hint="Single price or starting price of range (e.g. 18000000)."
                  >
                    <TextInput
                      id="basics-price-amount"
                      inputMode="numeric"
                      value={currentPriceAmount > 0 ? String(currentPriceAmount) : ''}
                      placeholder="18000000"
                      onChange={handlePriceAmountInput}
                    />
                  </Field>

                  <Field
                    label="Max Price (BDT — Optional Range)"
                    htmlFor="basics-price-max-amount"
                    hint="Fill to show a price range (e.g. 25000000). Leave empty for single price."
                  >
                    <TextInput
                      id="basics-price-max-amount"
                      inputMode="numeric"
                      value={currentMaxPriceAmount > 0 ? String(currentMaxPriceAmount) : ''}
                      placeholder="25000000 (optional)"
                      onChange={handleMaxPriceAmountInput}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Toggle
                    id="basics-price-negotiable"
                    label="Price is negotiable"
                    checked={form.price.negotiable}
                    onChange={(negotiable) => update('price', { ...form.price, negotiable })}
                  />
                  {form.kind === 'project' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {form.units.some((u) => u.price > 0) && (
                        <button type="button" onClick={fillRangeFromUnits} className="btn-quiet !py-1.5 !px-3 !text-[10.5px]">
                          Use Unit Price Range
                        </button>
                      )}
                      <button type="button" onClick={() => scrollTo('specs')} className="btn-quiet !py-1.5 !px-3 !text-[10.5px]">
                        Manage Unit Table
                      </button>
                    </div>
                  )}
                </div>

                <Field
                  label="Property Name (Optional Subtitle / Reference)"
                  htmlFor="title"
                  hint="Optional when using Price as Title. Shown as a secondary label on cards and used for the URL slug."
                >
                  <TextInput
                    id="title"
                    value={hasCustomName(form) ? form.title : ''}
                    placeholder="e.g. The Barakah Residence (or leave empty)"
                    onChange={(t) => update('title', t)}
                    maxLength={160}
                  />
                </Field>
              </div>
            ) : (
              <Field label="Property Name (Title) *" htmlFor="title">
                <TextInput
                  id="title"
                  value={form.title}
                  placeholder="e.g. The Barakah Residence"
                  onChange={(t) => update('title', t)}
                  maxLength={160}
                  required
                  aria-invalid={checkIntent !== null && !form.title.trim()}
                />
              </Field>
            )}

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
                <button type="button" onClick={() => { setAutoSlug(true); update('slug', suggestSlug(effective)); }} className="btn-quiet !py-2.5 shrink-0">
                  Generate
                </button>
              </div>
            </Field>

            {/* Project Overview Video — Placed after basic identity info and before Overview description for both Single Property and Project types */}
            <VideoEditor
              url={form.media.videoUrl}
              inheritedUrl={parentProject?.media.videoUrl}
              isProject={form.kind === 'project'}
              onChange={(videoUrl) => updateMedia({ videoUrl })}
            />

            <Field label="Overview Description" htmlFor="summary" hint={inheritsFromProject && !form.summary.trim() ? 'Write in Bangla. Required to publish.' : 'Write in Bangla. Shown in the Overview section and used for search results.'}>
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
                      {formatBdt(ownUnit.price)} · {formatNumber(ownUnit.sizeSqft)} sq ft · {ownUnit.beds} bed · {ownUnit.baths} bath · {ownUnit.balconies ?? 0} balcony · Floor {ownUnit.floor} · {ownUnit.facing} · {ownUnit.status}
                    </div>
                    <Link to={`/manage/edit/${parentProject.id}`} onClick={confirmLeave} className="btn-quiet !py-2 !text-[10.5px]">
                      Edit Unit <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-4 items-start">
                  <Field
                    label="Price / Range Text (Bangla)"
                    htmlFor="price-label"
                    hint="Shown in Bangla font on cards and headers (e.g. ৳ ২.৮৫ কোটি or ৳ ১.৮ কোটি – ২.৫ কোটি)."
                  >
                    <TextInput
                      id="price-label"
                      lang="bn"
                      className="font-nakkhatra !text-xl !leading-normal"
                      value={currentPriceLabel}
                      placeholder="৳ ২.৮৫ কোটি"
                      onChange={handlePriceLabelInput}
                      maxLength={120}
                    />
                  </Field>
                  <Field
                    label="Price / Min Price (BDT)"
                    htmlFor="price"
                    hint="Single price or starting price of range (e.g. 28500000)."
                  >
                    <TextInput
                      id="price"
                      inputMode="numeric"
                      value={currentPriceAmount > 0 ? String(currentPriceAmount) : ''}
                      placeholder="28500000"
                      onChange={handlePriceAmountInput}
                    />
                  </Field>
                  <Field
                    label="Max Price (BDT — Optional Range)"
                    htmlFor="price-max"
                    hint="Fill to show a price range (e.g. 32000000). Leave empty for single price."
                  >
                    <TextInput
                      id="price-max"
                      inputMode="numeric"
                      value={currentMaxPriceAmount > 0 ? String(currentMaxPriceAmount) : ''}
                      placeholder="32000000 (optional)"
                      onChange={handleMaxPriceAmountInput}
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <Toggle id="price-negotiable" label="Price is negotiable" checked={form.price.negotiable} onChange={(negotiable) => update('price', { ...form.price, negotiable })} />
                  <Toggle
                    id="specs-price-as-title"
                    label="Use price as property title"
                    hint="Show formatted Bangla price as the main headline instead of property name."
                    checked={isPriceAsTitle(form)}
                    onChange={(usePrice) => update('titleMode', usePrice ? 'price' : 'name')}
                  />
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
                <div className="grid sm:grid-cols-3 gap-4 items-start">
                  <Field
                    label="Project Price / Range Text (Bangla)"
                    htmlFor="proj-price-label"
                    hint="Auto-formatted or custom Bangla price/range (e.g. ৳ ১.৮ কোটি – ২.৫ কোটি)."
                  >
                    <TextInput
                      id="proj-price-label"
                      lang="bn"
                      className="font-nakkhatra !text-xl !leading-normal"
                      value={currentPriceLabel}
                      placeholder="৳ ১.৮ কোটি – ২.৫ কোটি"
                      onChange={handlePriceLabelInput}
                      maxLength={120}
                    />
                  </Field>
                  <Field
                    label="Min / Starting Price (BDT)"
                    htmlFor="proj-price-amount"
                    hint="Starting price in BDT (e.g. 18000000). Leave empty to use lowest unit price."
                  >
                    <TextInput
                      id="proj-price-amount"
                      inputMode="numeric"
                      value={form.price.amount > 0 ? String(form.price.amount) : ''}
                      placeholder={effectivePrice(effective).amount > 0 ? String(effectivePrice(effective).amount) : '18000000'}
                      onChange={handlePriceAmountInput}
                    />
                  </Field>
                  <Field
                    label="Max Price (BDT — Optional Range)"
                    htmlFor="proj-price-max"
                    hint="Fill to display a price range (e.g. 25000000)."
                  >
                    <TextInput
                      id="proj-price-max"
                      inputMode="numeric"
                      value={currentMaxPriceAmount > 0 ? String(currentMaxPriceAmount) : ''}
                      placeholder="25000000 (optional)"
                      onChange={handleMaxPriceAmountInput}
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <Toggle id="price-negotiable" label="Prices are negotiable" checked={form.price.negotiable} onChange={(negotiable) => update('price', { ...form.price, negotiable })} />
                    <Toggle
                      id="proj-price-as-title"
                      label="Use price / range as project title"
                      hint="Display Bangla price or range as the main headline instead of project name."
                      checked={isPriceAsTitle(form)}
                      onChange={(usePrice) => update('titleMode', usePrice ? 'price' : 'name')}
                    />
                  </div>
                  {form.units.some((u) => u.price > 0) && (
                    <button type="button" onClick={fillRangeFromUnits} className="btn-quiet !py-1.5 !px-3.5 !text-[10.5px]">
                      Use Unit Price Range
                    </button>
                  )}
                </div>
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

          {/* 7. PUBLISHING & LIFECYCLE */}
          <EditorSection id="publish" index="07" title="Publishing & SEO" intro="Control visibility on the public showcase, search engine metadata, and lifecycle actions.">
            <Field label="Visibility State">
              <Segmented
                idPrefix="publish-state"
                value={form.publish}
                onChange={(p) => update('publish', p)}
                options={[
                  { value: 'draft', label: 'Draft (Unpublished)', hint: 'Visible to admins only for curation' },
                  { value: 'published', label: 'Published (Live)', hint: 'Publicly listed on the showcase' },
                  { value: 'archived', label: 'Archived', hint: 'Hidden from public view & active drafts' },
                ]}
              />
            </Field>

            {/* Direct Database Lifecycle Actions */}
            <div className="rounded-xl border border-[#181512]/12 bg-[#F6F2EA]/70 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="mono-label block text-[#181512]">Property Lifecycle Actions</span>
                  <p className="text-xs text-[#5C5346] mt-0.5">
                    {isPublished
                      ? 'Currently live on the public site. You can unpublish to revert to a draft or archive to store offline.'
                      : isArchived
                        ? 'Currently archived and hidden from visitors. You can restore it to draft or publish it directly.'
                        : 'Currently saved as an unpublished draft. Publish when ready or archive to store away.'}
                  </p>
                </div>
                <span
                  className={`self-start sm:self-center px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border font-medium shrink-0 ${
                    isPublished
                      ? 'border-emerald-700/40 bg-emerald-600/10 text-emerald-800'
                      : isArchived
                        ? 'border-[#181512]/25 bg-[#181512]/[0.07] text-[#3D362E]'
                        : 'border-amber-700/40 bg-amber-500/12 text-amber-800'
                  }`}
                >
                  Status: {form.publish}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#181512]/[0.08]">
                {/* 1. Delete (leftmost) */}
                <button
                  id="form-delete-inline-btn"
                  type="button"
                  disabled={saving || deleting}
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-danger btn-quiet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isPersisted ? 'Delete' : 'Discard'}</span>
                </button>

                {/* 2. Archive */}
                <button
                  id="form-archive-btn"
                  type="button"
                  disabled={saving || deleting || (isArchived && !hasChanges && isPersisted)}
                  onClick={() => handleSave('archived')}
                  className="btn-quiet"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>

                {/* 3. Unpublish / Publish */}
                <button
                  id="form-unpublish-btn"
                  type="button"
                  disabled={saving || deleting || (isDraft && !hasChanges && isPersisted)}
                  onClick={() => handleSave('draft')}
                  className="btn-quiet"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Unpublish</span>
                </button>

                {!isPublished && (
                  <button
                    id="form-publish-btn"
                    type="button"
                    disabled={saving || deleting}
                    onClick={() => handleSave('published')}
                    className="btn-quiet"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </button>
                )}

                {/* 4. Preview */}
                {form.id && form.slug && (
                  <a
                    href={`/property/${form.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-quiet"
                    title="Open the saved version in a new tab"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </a>
                )}

                {/* 5. Save Changes (rightmost) */}
                <button
                  id="form-save-btn"
                  type="button"
                  disabled={saving || deleting}
                  onClick={() => handleSave()}
                  className="btn-gold !py-2.5 !px-5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving…' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            <Field label="Search Title" htmlFor="seo-title" hint="Leave empty to generate from the title and area.">
              <TextInput id="seo-title" value={form.seo?.title} placeholder={`${displayTitle(effective) || 'Title'} · ${form.location.area || 'Dhaka'} | Jonopod Properties`} onChange={(title) => updateSeo({ title })} maxLength={70} />
            </Field>
            <Field label="Search Description" htmlFor="seo-desc" hint="Leave empty to use the start of the description.">
              <TextArea id="seo-desc" rows={2} counter={160} value={form.seo?.description} onChange={(description) => updateSeo({ description })} />
            </Field>

            {/* Danger Zone: Delete Property */}
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-red-800 font-semibold block">
                  {isPersisted ? 'Delete Property' : 'Discard Draft'}
                </span>
                <p className="text-xs text-[#5C5346] mt-1 max-w-xl leading-relaxed">
                  {isPersisted
                    ? 'Permanently delete this property listing from the database. To temporarily hide it without losing data, use Unpublish or Archive instead.'
                    : 'Discard this unsaved property draft and clear local changes.'}
                </p>
              </div>
              <button
                id="form-delete-btn"
                type="button"
                disabled={saving || deleting}
                onClick={() => setShowDeleteModal(true)}
                className="btn-danger btn-quiet !py-2.5 !px-5 shrink-0 self-start sm:self-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPersisted ? 'Delete Property' : 'Discard Draft'}</span>
              </button>
            </div>
          </EditorSection>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-[#181512]/45 backdrop-blur-md flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="panel panel-glass max-w-md w-full p-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-500/12 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 id="delete-modal-title" className="font-display text-2xl text-[#181512]">
                {isPersisted ? 'Delete Property Permanently?' : 'Discard Unsaved Draft?'}
              </h3>
              <p className="text-sm text-[#4A433B] mt-2">
                {isPersisted ? (
                  <>
                    Are you sure you wish to permanently delete <strong className="text-[#181512]">"{displayTitle(effective) || form.title || 'Untitled Listing'}"</strong>? This will remove the property from the database and cannot be undone.
                  </>
                ) : (
                  'Are you sure you wish to discard this unsaved draft? All entered details will be cleared.'
                )}
              </p>
              {isPersisted && form.kind === 'project' && childListings.length > 0 && (
                <p className="text-xs font-mono text-amber-900 bg-amber-500/12 border border-amber-600/30 rounded-xl p-3 mt-3">
                  Note: {childListings.length} apartment page(s) are linked to this project and will become standalone if you delete it.
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="btn-danger btn-quiet !py-3 !px-6"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting…' : isPersisted ? 'Delete permanently' : 'Discard draft'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
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

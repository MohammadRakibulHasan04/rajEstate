import React from 'react';
import { ListingContact } from '../../types/listing';
import { isValidEmail, isValidPhone } from '../../lib/contact';
import { Field, TextInput } from './fields';

interface Props {
  value: ListingContact;
  onChange: (patch: Partial<ListingContact>) => void;
  /** Contact used when this one is left empty (unit pages inherit from the project). */
  inherited?: ListingContact;
}

/** Contact person and channels shown in the page's contact card. */
export const ContactEditor: React.FC<Props> = ({ value, onChange, inherited }) => {
  const phoneErr = value.phone.trim() && !isValidPhone(value.phone) ? 'Use 10–15 digits, e.g. +880 1712-345678.' : undefined;
  const waErr = value.whatsapp?.trim() && !isValidPhone(value.whatsapp) ? 'Use 10–15 digits.' : undefined;
  const emailErr = value.email?.trim() && !isValidEmail(value.email) ? 'Enter a valid email address.' : undefined;
  const usingInherited = !!inherited && !value.phone.trim() && !value.name?.trim();

  return (
    <div className="space-y-6">
      {usingInherited && (
        <p className="rounded-xl border border-[#9A6B3B]/30 bg-[#9A6B3B]/[0.05] px-4 py-3 text-[13px] text-[#4A433B]">
          Using the project contact{inherited!.name ? ` (${inherited!.name}${inherited!.phone ? `, ${inherited!.phone}` : ''})` : ''}. Fill in the fields below to use a different contact for this unit.
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="Contact Person" htmlFor="contact-name">
          <TextInput id="contact-name" value={value.name} placeholder={inherited?.name || 'e.g. Rafiq Ahmed'} onChange={(name) => onChange({ name })} autoComplete="off" maxLength={80} />
        </Field>
        <Field label="Designation" htmlFor="contact-designation">
          <TextInput id="contact-designation" value={value.designation} placeholder="e.g. Sales Manager" onChange={(designation) => onChange({ designation })} maxLength={80} />
        </Field>
        <Field label="Company" htmlFor="contact-company">
          <TextInput id="contact-company" value={value.company} placeholder="e.g. Jonopod Properties" onChange={(company) => onChange({ company })} maxLength={80} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="Phone *" htmlFor="contact-phone" error={phoneErr} hint="Required to publish.">
          <TextInput id="contact-phone" type="tel" inputMode="tel" value={value.phone} placeholder={inherited?.phone || '+880 1XXX-XXXXXX'} onChange={(phone) => onChange({ phone })} aria-invalid={!!phoneErr} maxLength={20} />
        </Field>
        <Field label="WhatsApp" htmlFor="contact-whatsapp" error={waErr} hint="Leave empty to hide the WhatsApp button.">
          <TextInput id="contact-whatsapp" type="tel" inputMode="tel" value={value.whatsapp} placeholder="+880 1XXX-XXXXXX" onChange={(whatsapp) => onChange({ whatsapp })} aria-invalid={!!waErr} maxLength={20} />
        </Field>
        <Field label="Email" htmlFor="contact-email" error={emailErr}>
          <TextInput id="contact-email" type="email" value={value.email} placeholder="info@jonopodproperties.com" onChange={(email) => onChange({ email })} aria-invalid={!!emailErr} maxLength={120} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Office Hours" htmlFor="contact-hours">
          <TextInput id="contact-hours" value={value.hours} placeholder="Sat–Thu, 10:00 AM – 7:00 PM" onChange={(hours) => onChange({ hours })} maxLength={80} />
        </Field>
        <Field label="Office Address" htmlFor="contact-address">
          <TextInput id="contact-address" value={value.address} placeholder="Sales office or site office address" onChange={(address) => onChange({ address })} maxLength={200} />
        </Field>
      </div>
    </div>
  );
};

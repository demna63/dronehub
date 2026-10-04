import React, { useState } from 'react';
import BackButton from './BackButton';
import PageHeader from './PageHeader';
import { useLanguage } from '../contexts/useLanguage';
import { geminiService } from '../services/geminiService';
import type { User } from '../types';
import {
  REG_CERTIFIED_BODY,
  REG_CERTIFIED_TITLE,
  REG_CLASSES,
  REG_DEFAULT_CLASS_ID,
  REG_GEORGIA,
  REG_GEORGIA_LEAD,
  REG_GEORGIA_TITLE,
  REG_INTRO,
  REG_OPEN_LEAD,
  REG_OPEN_RULES,
  REG_OPEN_TITLE,
  REG_REMOTE_BODY,
  REG_REMOTE_TITLE,
  REG_SOURCES,
  REG_SOURCES_TITLE,
  REG_SPECIFIC_ITEMS,
  REG_SPECIFIC_LEAD,
  REG_SPECIFIC_TITLE,
  REG_STEPS,
  REG_STEPS_TITLE,
  regText,
  type Copy,
} from '../constants/droneRegulations';

interface RegulationsWikiProps {
  onBack: () => void;
  currentUser?: User | null;
}

type ZoneStatus = 'CLEAR' | 'RESTRICTED' | 'IDLE' | 'CAUTION';

const sectionTitle = 'text-lg font-extrabold text-ink';
const prose = 'text-sm leading-relaxed text-ink-2';

const ExternalLink: React.FC<{ href: string; label: string; newTab: string }> = ({ href, label, newTab }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={newTab}
    className="text-[13px] font-bold text-accent hover:underline"
  >
    {label}
    <span className="sr-only"> {newTab}</span>
  </a>
);

const CopyParagraph: React.FC<{ copy: Copy; language: 'ka' | 'en'; className?: string }> = ({ copy, language, className = prose }) => (
  <p className={className}>{regText(copy, language)}</p>
);

const RegulationsWiki: React.FC<RegulationsWikiProps> = ({ onBack, currentUser: _currentUser }) => {
  const [classId, setClassId] = useState(REG_DEFAULT_CLASS_ID);
  const [zoneQuery, setZoneQuery] = useState('');
  const [zoneResult, setZoneResult] = useState<{ status: ZoneStatus; message: string }>({ status: 'IDLE', message: '' });
  const [isChecking, setIsChecking] = useState(false);
  const { t, language } = useLanguage();

  const selected = REG_CLASSES.find((card) => card.id === classId) ?? REG_CLASSES[0];

  const handleZoneCheck = async () => {
    if (!zoneQuery.trim()) {
      setZoneResult({ status: 'IDLE', message: t('waiting_input') });
      return;
    }

    setIsChecking(true);
    setZoneResult({ status: 'IDLE', message: t('processing') });

    try {
      const result = await geminiService.checkRestrictedZone(zoneQuery);
      setZoneResult(result);
    } catch {
      setZoneResult({ status: 'IDLE', message: t('wiki_lookup_failed') });
    } finally {
      setIsChecking(false);
    }
  };

  const zoneMessage = zoneResult.message === 'ai_check_failed'
    ? t('ai_check_failed')
    : (zoneResult.message || t('waiting_input'));

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <BackButton onClick={onBack} className="!border-transparent !bg-transparent !px-0 hover:text-accent" />
      <PageHeader title={t('reg_title')} subtitle={t('reg_subtitle')} />
      <CopyParagraph copy={REG_INTRO} language={language} />

      <section aria-labelledby="reg-steps" className="space-y-3">
        <h2 id="reg-steps" className={sectionTitle}>{regText(REG_STEPS_TITLE, language)}</h2>
        <ol className="space-y-2">
          {REG_STEPS.map((step, index) => (
            <li key={step.id} className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[12px] font-extrabold text-accent">
                {index + 1}
              </span>
              <p className={prose}>{regText(step.body, language)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="reg-georgia" className="space-y-3">
        <h2 id="reg-georgia" className={sectionTitle}>{regText(REG_GEORGIA_TITLE, language)}</h2>
        <CopyParagraph copy={REG_GEORGIA_LEAD} language={language} className="text-[13px] leading-relaxed text-ink-3" />
        <div className="grid gap-3 md:grid-cols-2">
          {REG_GEORGIA.map((fact) => (
            <article key={fact.id} className="rounded-2xl border border-line bg-surface p-4">
              <h3 className="text-sm font-bold text-ink">{regText(fact.title, language)}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{regText(fact.body, language)}</p>
              {fact.links && fact.links.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {fact.links.map((link) => (
                    <ExternalLink key={link.href} href={link.href} label={link.label} newTab={t('link_opens_new_tab')} />
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="reg-open" className="space-y-3">
        <h2 id="reg-open" className={sectionTitle}>{regText(REG_OPEN_TITLE, language)}</h2>
        <CopyParagraph copy={REG_OPEN_LEAD} language={language} />
        <ul className="space-y-2">
          {REG_OPEN_RULES.map((rule) => (
            <li key={rule.en} className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink-2">
              {regText(rule, language)}
            </li>
          ))}
        </ul>

        <div role="tablist" aria-label={regText(REG_OPEN_TITLE, language)} className="flex flex-wrap gap-2 pt-2">
          {REG_CLASSES.map((card) => {
            const active = card.id === selected.id;
            return (
              <button
                key={card.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setClassId(card.id)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${active ? 'border-accent/40 bg-accent-tint text-accent' : 'border-line bg-surface text-ink-2 hover:text-ink'}`}
              >
                {regText(card.chip, language)}
              </button>
            );
          })}
        </div>

        <article role="tabpanel" className="rounded-2xl border border-line bg-surface p-4 md:p-5">
          <h3 className="text-base font-extrabold text-ink">{regText(selected.title, language)}</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {selected.rows.map((item) => (
              <div key={item.id} className={item.id === 'georgia' ? 'rounded-xl bg-accent-tint px-3 py-2 sm:col-span-2' : ''}>
                <dt className="text-[13px] font-bold text-ink-3">{regText(item.label, language)}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink">{regText(item.value, language)}</dd>
              </div>
            ))}
          </dl>
        </article>
      </section>

      <section aria-labelledby="reg-remote" className="space-y-2 rounded-2xl border border-line bg-surface p-4">
        <h2 id="reg-remote" className="text-sm font-bold text-ink">{regText(REG_REMOTE_TITLE, language)}</h2>
        <CopyParagraph copy={REG_REMOTE_BODY} language={language} />
      </section>

      <section aria-labelledby="reg-specific" className="space-y-3">
        <h2 id="reg-specific" className={sectionTitle}>{regText(REG_SPECIFIC_TITLE, language)}</h2>
        <CopyParagraph copy={REG_SPECIFIC_LEAD} language={language} />
        <ul className="grid gap-3 md:grid-cols-2">
          {REG_SPECIFIC_ITEMS.map((item) => (
            <li key={item.en} className="rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink-2">
              {regText(item, language)}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reg-certified" className="space-y-2">
        <h2 id="reg-certified" className={sectionTitle}>{regText(REG_CERTIFIED_TITLE, language)}</h2>
        <CopyParagraph copy={REG_CERTIFIED_BODY} language={language} />
      </section>

      <section aria-labelledby="reg-zone" className="space-y-3 border-t border-line pt-8">
        <h2 id="reg-zone" className={sectionTitle}>{t('restricted_zone_check')}</h2>
        <p className="text-[13px] leading-relaxed text-warn">{t('wiki_ai_disclaimer')}</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="flex w-full flex-1 items-center gap-3">
            <label className="sr-only" htmlFor="reg-zone-query">{t('enter_location')}</label>
            <input
              id="reg-zone-query"
              type="text"
              value={zoneQuery}
              onChange={(event) => setZoneQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleZoneCheck();
              }}
              placeholder={t('enter_location')}
              className="min-w-0 flex-1 border-b border-line bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-accent"
            />
            <button
              type="button"
              onClick={handleZoneCheck}
              disabled={isChecking || !zoneQuery.trim()}
              className="shrink-0 rounded-[10px] bg-accent-fill px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-accent-fill-hover disabled:opacity-50"
            >
              {isChecking ? t('reg_scanning') : t('reg_scan_btn')}
            </button>
          </div>
          <div
            className={`w-full rounded-2xl border p-4 text-sm leading-relaxed md:w-80 ${
              zoneResult.status === 'RESTRICTED' ? 'border-bad/30 bg-bad/10 text-bad'
                : zoneResult.status === 'CLEAR' ? 'border-ok/30 bg-ok/10 text-ok'
                  : zoneResult.status === 'CAUTION' ? 'border-warn/30 bg-warn/10 text-warn'
                    : 'border-line bg-surface text-ink-2'
            }`}
          >
            <p className="text-[12px] font-bold text-ink-3">{t('reg_zone_result')}</p>
            <p className="mt-1 font-bold">{zoneMessage}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="reg-sources" className="space-y-3">
        <h2 id="reg-sources" className={sectionTitle}>{regText(REG_SOURCES_TITLE, language)}</h2>
        <ul className="space-y-2">
          {REG_SOURCES.map((source) => (
            <li key={source.href} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <ExternalLink href={source.href} label={source.label} newTab={t('link_opens_new_tab')} />
              <span className="text-[13px] text-ink-3">{regText(source.note, language)}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[13px] leading-relaxed text-ink-3">{t('reg_footer_notice')}</p>
    </div>
  );
};

export default RegulationsWiki;

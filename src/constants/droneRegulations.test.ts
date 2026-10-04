import { describe, expect, it } from 'vitest';
import {
  REG_CLASSES,
  REG_DEFAULT_CLASS_ID,
  REG_GEORGIA,
  REG_INTRO,
  REG_REMOTE_BODY,
  REG_STEPS,
  type Copy,
} from './droneRegulations';

const collect = (value: unknown, found: Copy[] = []): Copy[] => {
  if (!value || typeof value !== 'object') return found;
  const record = value as Record<string, unknown>;
  if (typeof record.ka === 'string' && typeof record.en === 'string') {
    found.push(record as unknown as Copy);
    return found;
  }
  for (const child of Object.values(record)) collect(child, found);
  return found;
};

const row = (classId: string, rowId: string): Copy => {
  const card = REG_CLASSES.find((item) => item.id === classId);
  const line = card?.rows.find((item) => item.id === rowId);
  if (!line) throw new Error(`missing ${classId}.${rowId}`);
  return line.value;
};

describe('drone regulation copy', () => {
  const copies = collect({ REG_CLASSES, REG_GEORGIA, REG_INTRO, REG_REMOTE_BODY, REG_STEPS });

  it('writes both languages and does not leave them identical', () => {
    expect(copies.length).toBeGreaterThan(40);
    for (const copy of copies) {
      expect(copy.ka.trim()).not.toBe('');
      expect(copy.en.trim()).not.toBe('');
      // A shared proper noun such as "Remote ID (EASA)" may match. A copied
      // sentence would still contain Georgian in the English field.
      if (copy.ka === copy.en) {
        expect(copy.en).not.toMatch(/[\u10A0-\u10FF]/);
      }
    }
  });

  it('does not claim an official GCAA sync', () => {
    const blob = copies.map((copy) => `${copy.ka}\n${copy.en}`).join('\n');
    expect(blob).not.toMatch(/GCAA SYNC/i);
    expect(blob).not.toMatch(/v4\.2/);
    expect(blob).not.toMatch(/OFFICIAL DRONE/i);
  });

  it('keeps the Georgian thresholds that pilots mix up', () => {
    const registration = REG_GEORGIA.find((fact) => fact.id === 'registration');
    const exam = REG_GEORGIA.find((fact) => fact.id === 'exam');
    expect(registration?.body.ka).toContain('250 გრამია ან მეტი');
    expect(registration?.body.en).toContain('250 g or more');
    expect(exam?.body.ka).toContain('250 გრამზე მეტია');
    expect(exam?.body.en).toContain('over 250 g');
    expect(REG_INTRO.ka).toContain('EASA');
    expect(REG_INTRO.en).toContain('not an EASA member');
  });

  it('defaults to the unlabeled heavy card and retires the 50 m band', () => {
    expect(REG_CLASSES.map((card) => card.id)).toContain(REG_DEFAULT_CLASS_ID);
    const legacy = row('unlabeled-heavy', 'sub');
    expect(legacy.en).toContain('A3 only');
    expect(legacy.en).toContain('50 m');
    expect(legacy.en).toContain('until that date');
    expect(row('c2', 'people').en).toContain('30 m');
    expect(row('c2', 'people').en).toContain('5 m');
    expect(row('c2', 'georgia').ka).toContain('ევროპული A2 სერტიფიკატი საქართველოს მოთხოვნა არ არის');
  });

  it('ties Remote ID to C1–C3 and not to a Georgian rule', () => {
    expect(REG_REMOTE_BODY.en).toContain('C1, C2 and C3');
    expect(REG_REMOTE_BODY.ka).toContain('Remote ID-ს არ ახსენებს');
    expect(row('c0', 'remote').en).toContain('does not state direct Remote ID');
    expect(row('c4', 'remote').en).toContain('does not state direct Remote ID');
    for (const id of ['c1', 'c2', 'c3']) {
      expect(row(id, 'remote').en.toLowerCase()).toContain('yes');
    }
  });

  it('gives every class the same fields', () => {
    const ids = ['sub', 'people', 'height', 'registration', 'training', 'age', 'remote', 'georgia'];
    for (const card of REG_CLASSES) {
      expect(card.rows.map((item) => item.id)).toEqual(ids);
    }
  });
});

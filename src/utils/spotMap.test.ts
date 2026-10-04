import { describe, expect, it } from 'vitest';
import { SPOT_TYPES } from '../constants/spots';
import type { Spot } from '../types';
import {
  canManageSpot,
  filterSpots,
  formatCoords,
  spotFieldsFromForm,
  spotImageUrl,
  spotSharePath,
} from './spotMap';

const spot = (patch: Partial<Spot> & Pick<Spot, 'id' | 'name' | 'type'>): Spot => ({
  lat: 41.7,
  lng: 44.8,
  ...patch,
});

describe('filterSpots', () => {
  const spots = [
    spot({ id: '1', name: 'ლილოს ქარხანა', type: 'bando', warnings: 'დაცვა' }),
    spot({ id: '2', name: 'მთაწმინდა', type: 'freestyle', author: 'გიორგი' }),
    spot({ id: '3', name: 'სარბენი', type: 'racing' }),
    spot({ id: '4', name: 'ველი', type: 'open', description: 'ხალხი ცოტაა' }),
  ];

  it('keeps every type the map can colour', () => {
    expect(SPOT_TYPES.map((type) => type.id)).toEqual(['bando', 'cinematic', 'freestyle', 'racing', 'open']);
  });

  it('filters by one type and by a word in the name, author or warning', () => {
    expect(filterSpots(spots, 'racing', '').map((item) => item.id)).toEqual(['3']);
    expect(filterSpots(spots, 'all', 'დაცვა').map((item) => item.id)).toEqual(['1']);
    expect(filterSpots(spots, 'freestyle', 'გიორგი').map((item) => item.id)).toEqual(['2']);
    expect(filterSpots(spots, 'bando', 'გიორგი')).toEqual([]);
  });

  it('searches the description as well as the legacy desc field', () => {
    expect(filterSpots(spots, 'all', 'ხალხი').map((item) => item.id)).toEqual(['4']);
    const legacy = spot({ id: '5', name: 'ძველი', type: 'cinematic', desc: 'მდინარე' });
    expect(filterSpots([legacy], 'all', 'მდინარე')).toHaveLength(1);
  });

  it('matches every type on a pin, and still matches a spot that only has the old field', () => {
    const both = spot({ id: '6', name: 'ორი', type: 'bando', types: ['bando', 'freestyle'] });
    expect(filterSpots([both], 'freestyle', '').map((item) => item.id)).toEqual(['6']);
    expect(filterSpots([both], 'racing', '')).toEqual([]);
    expect(filterSpots(spots, 'racing', '').map((item) => item.id)).toEqual(['3']);
  });
});

describe('spot writes', () => {
  it('stores types in catalogue order and keeps the primary inside that list', () => {
    expect(spotFieldsFromForm({
      name: '  ველი  ',
      types: ['open', 'bando'],
      desc: '  სივრცე ',
      warnings: ' ძაღლები ',
      status: 'closed',
      parking: true,
      power: false,
    }, { lat: 41.7, lng: 44.8 }, 'https://example.com/a.webp')).toEqual({
      name: 'ველი',
      type: 'bando',
      types: ['bando', 'open'],
      description: 'სივრცე',
      warnings: 'ძაღლები',
      status: 'closed',
      parking: true,
      power: false,
      lat: 41.7,
      lng: 44.8,
      image: 'https://example.com/a.webp',
    });
  });

  it('renders only https photos and lets the author or an admin manage the pin', () => {
    expect(spotImageUrl('https://cdn.example/a.webp')).toBe('https://cdn.example/a.webp');
    expect(spotImageUrl('http://cdn.example/a.webp')).toBe('');
    expect(spotImageUrl('javascript:alert(1)')).toBe('');
    expect(canManageSpot({ authorId: 'a' }, { id: 'a' })).toBe(true);
    expect(canManageSpot({ authorId: 'a' }, { id: 'b' })).toBe(false);
    expect(canManageSpot({ authorId: 'a' }, { id: 'b', isAdmin: true })).toBe(true);
    expect(canManageSpot({}, { id: 'b' })).toBe(false);
    expect(canManageSpot({ authorId: 'a' }, null)).toBe(false);
  });
});

describe('spot links and coordinates', () => {
  it('formats about a metre and builds a share path', () => {
    expect(formatCoords(41.715137, 44.827096)).toBe('41.71514, 44.82710');
    expect(spotSharePath('abc/1')).toBe('/map?spot=abc%2F1');
  });
});

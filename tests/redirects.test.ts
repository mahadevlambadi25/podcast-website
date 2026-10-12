import { describe, it, expect } from 'vitest';
import { collapseRedirectMap } from '../src/utils/redirects';

describe('collapseRedirectMap', () => {
  it('collapses single linear chain A -> B -> C to A -> C, B -> C', () => {
    const input = [
      { from: '/episodes/old-ep', to: '/episodes/interim-ep' },
      { from: '/episodes/interim-ep', to: '/episodes/final-ep' },
    ];
    const result = collapseRedirectMap(input);
    expect(result).toEqual([
      { from: '/episodes/old-ep', to: '/episodes/final-ep' },
      { from: '/episodes/interim-ep', to: '/episodes/final-ep' },
    ]);
  });

  it('collapses multi-hop chain A -> B -> C -> D directly to D', () => {
    const input = [
      { from: '/guests/v1', to: '/guests/v2' },
      { from: '/guests/v2', to: '/guests/v3' },
      { from: '/guests/v3', to: '/guests/v4' },
    ];
    const result = collapseRedirectMap(input);
    expect(result).toEqual([
      { from: '/guests/v1', to: '/guests/v4' },
      { from: '/guests/v2', to: '/guests/v4' },
      { from: '/guests/v3', to: '/guests/v4' },
    ]);
  });

  it('safely breaks redirect loops (A -> B -> A) without infinite recursion', () => {
    const input = [
      { from: '/episodes/a', to: '/episodes/b' },
      { from: '/episodes/b', to: '/episodes/a' },
    ];
    const result = collapseRedirectMap(input);
    // Neither should loop indefinitely
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('ignores self-referential redirects (A -> A)', () => {
    const input = [
      { from: '/episodes/same', to: '/episodes/same' },
      { from: '/episodes/other', to: '/episodes/target' },
    ];
    const result = collapseRedirectMap(input);
    expect(result).toEqual([
      { from: '/episodes/other', to: '/episodes/target' },
    ]);
  });

  it('preserves unrelated direct redirects', () => {
    const input = [
      { from: '/a', to: '/b' },
      { from: '/x', to: '/y' },
    ];
    const result = collapseRedirectMap(input);
    expect(result).toEqual([
      { from: '/a', to: '/b' },
      { from: '/x', to: '/y' },
    ]);
  });
});

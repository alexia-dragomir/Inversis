import { describe, expect, expectTypeOf, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { candidates, initialDecision } from '../src/data/foundation';
import { ContextPage } from '../src/pages/ContextPage';
import { PendingPage } from '../src/pages/PendingPage';
import { stepFromHash } from '../src/App';
import type { DecisionResult, QualityValue } from '../src/domain/contracts';

describe('Stage 0 scientific refusal boundary', () => {
  it('starts without a fabricated preference, scenario, weight, or computation', () => {
    expect(initialDecision.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(initialDecision.preferredSet).toEqual([]);
    expect(initialDecision.validScenarioIds).toEqual([]);
    expect(initialDecision.weights).toEqual([]);
    expect(initialDecision.computation).toBeUndefined();
    expect(initialDecision.confirmedCandidateIds).toEqual([]);
    expect(candidates.every(c => c.agronomicScreening === 'CONDITIONAL')).toBe(true);
  });
  it('keeps missing data distinct from a physical zero', () => {
    const missing: QualityValue<'mm'> = { status: 'missing', reason: 'No observation' };
    const zero: QualityValue<'mm'> = { status: 'valid', quantity: { value: 0, unit: 'mm' }, flags: [] };
    expect('quantity' in missing).toBe(false);
    expect(zero.quantity.value).toBe(0);
    expectTypeOf<Extract<DecisionResult, { status: 'TIED_PREFERENCE' }>['preferredSet']>().toEqualTypeOf<readonly [string, string, ...string[]]>();
  });
  it('preserves the specified order and equal A/B composition', () => {
    expect(candidates.map(c => c.fiveYearOrderedCrops)).toEqual([
      ['wheat', 'maize', 'sunflower', 'wheat', 'maize'],
      ['wheat', 'soybean', 'maize', 'sunflower', 'maize'],
      ['wheat', 'sunflower', 'maize', 'soybean', 'maize'],
    ]);
    expect([...(candidates[1]?.fiveYearOrderedCrops ?? [])].sort()).toEqual([...(candidates[2]?.fiveYearOrderedCrops ?? [])].sort());
  });
});

describe('shell content and navigation', () => {
  it.each(['context', 'decision', 'stability', 'certificate'] as const)('resolves #%s', step => {
    expect(stepFromHash(`#${step}`)).toBe(step);
  });
  it('falls back to context for an unknown location', () => {
    expect(stepFromHash('#unrecognized')).toBe('context');
  });
  it('renders context with explicit unknowns', () => {
    const html = renderToStaticMarkup(<ContextPage />);
    expect(html).toContain('No established preference');
    expect(html).toContain('Unknown field facts');
  });
  it.each(['decision', 'stability', 'certificate'] as const)('renders an honest %s screen', stage => {
    const html = renderToStaticMarkup(<PendingPage stage={stage} />);
    expect(html).toContain('Insufficient evidence');
    expect(html).toContain('No computed findings');
    expect(html).not.toContain('Lowest regret');
  });
});

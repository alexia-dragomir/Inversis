import type { DecisionResult, QualityValue } from '../src/domain/contracts';

// Compile-time safety checks, executed by npm run typecheck.
// @ts-expect-error A missing observation cannot carry a usable physical quantity.
const missingWithValue: QualityValue<'mm'> = { status: 'missing', reason: 'absent', quantity: { value: 0, unit: 'mm' } };
type TiedSet = Extract<DecisionResult, { status: 'TIED_PREFERENCE' }>['preferredSet'];
// @ts-expect-error A tie requires at least two candidates.
const singletonTie: TiedSet = ['a'];
type Refusal = Extract<DecisionResult, { status: 'INSUFFICIENT_EVIDENCE' | 'NO_ELIGIBLE_ROTATION' }>;
// @ts-expect-error A refusal cannot contain a winning candidate.
const refusalWinner: Refusal['preferredSet'] = ['a'];
void missingWithValue;
void singletonTie;
void refusalWinner;

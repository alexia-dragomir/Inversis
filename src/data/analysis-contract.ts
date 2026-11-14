import type { CropYearExposure, NormalizationReference, ProvenanceRecord } from '../domain/contracts';
export interface AnalysisEvidence {
  readonly schemaVersion: 'inversis-evidence-v1';
  readonly source: 'NASA POWER T2M_MAX';
  readonly period: { readonly startYear: 2015; readonly endYear: 2024 };
  readonly dailyCoverage: { readonly expected: number; readonly valid: number; readonly missing: number };
  readonly sourceManifest: readonly ProvenanceRecord[];
  readonly cropYearExposures: readonly CropYearExposure[];
  readonly references: readonly NormalizationReference[];
  readonly processingHashes: Readonly<Record<string, string>>;
  readonly limitations: readonly string[];
}

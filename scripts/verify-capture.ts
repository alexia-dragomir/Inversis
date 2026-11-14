import { createHash } from 'node:crypto';
import { finite, record, requireCondition, text, utcTimestamp } from '../src/data/ingestion/validation.ts';
import type { VerifiedCapture } from '../src/data/ingestion/power.ts';

export function sha256(raw: Uint8Array | string): string { return createHash('sha256').update(raw).digest('hex'); }

/** Browser/import receipts cannot assert an unobserved HTTP status or retrieval time. */
export function verifyImportedNetcdf(input: unknown, sample: { sha256: string; bytes: number; sourceMetadata: { transformUrl: string } }) {
  const receipt = record(input, 'NetCDF import receipt');
  requireCondition(receipt.sha256 === sample.sha256 && receipt.bytes === sample.bytes && receipt.sourceUrl === sample.sourceMetadata.transformUrl, 'IMERG import receipt mismatch');
  utcTimestamp(receipt.registeredAtUTC, 'registration time');
  requireCondition(receipt.retrievalTimeUTC === null, 'Unknown retrieval completion time must remain null');
  text(receipt.retrievalTimeNote, 'retrieval time limitation');
  text(receipt.acquisitionMode, 'acquisition mode');
  return receipt;
}

export function verifyCapture(raw: Uint8Array, input: unknown, expectedUrl: string): VerifiedCapture {
  const receipt = record(input, 'capture receipt');
  requireCondition(receipt.url === expectedUrl, 'Capture request URL mismatch');
  requireCondition(receipt.status === 200, 'Capture was not HTTP 200');
  requireCondition(text(receipt.contentType, 'content type').includes('json'), 'Expected JSON content type');
  requireCondition(finite(receipt.bytes, 'byte count') === raw.byteLength, 'Raw byte count mismatch');
  const hash = text(receipt.sha256, 'SHA-256');
  requireCondition(/^[a-f0-9]{64}$/.test(hash) && sha256(raw) === hash, 'Raw SHA-256 mismatch');
  return { url: expectedUrl, retrievedAt: utcTimestamp(receipt.retrievedAt, 'retrieval time'), sha256: hash };
}

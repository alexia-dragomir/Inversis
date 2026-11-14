import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FieldEvidence, FieldEvidenceConnection } from '../src/components/FieldEvidence';
import { emptyFieldNotes, exportFieldNotes, fieldDefinitions, fieldError, reviewQuestions, sourceLabels, suppliedCount, suppliedLabel } from '../src/components/fieldNotes';
const timestamp='2026-11-14T00:00:00.000Z';
it('starts with eight unknown values and exports null rather than fabricated zeros',()=>{
  const notes=emptyFieldNotes();expect(suppliedCount(notes)).toBe(0);
  const record=exportFieldNotes(notes,timestamp);expect(record.fields).toHaveLength(8);
  expect(record.fields.every(f=>f.status==='unknown'&&f.value===null)).toBe(true);
  expect(record.schema).toBe('inversis-field-notes-v1');expect(record.designation).toBe('unverified_user_supplied_information');
  expect(record.exportedAtUTC).toBe(timestamp);expect(record).not.toHaveProperty('fingerprint');
});
it.each([['ph','0',true],['ph','14',true],['ph','14.1',false],['ph','-1',false],['ph','NaN',false],['ph','abc',false],['organicMatter','0',true],['organicMatter','100',true],['organicMatter','100.1',false],['organicMatter','-0.1',false]])('validates %s %s without suitability inference',(id,value,valid)=>{
  expect(fieldError(id as 'ph'|'organicMatter',{value,source:sourceLabels[0],reference:'',note:''})===null).toBe(valid);
});
it('requires provenance and bounds text, notes, classifications and references',()=>{
  const notes=emptyFieldNotes();notes.ph.value='7';expect(fieldError('ph',notes.ph)).toContain('Choose');expect(()=>exportFieldNotes(notes,timestamp)).toThrow();
  for(const id of ['texture','timing'] as const){notes[id]={value:'x'.repeat(id==='texture'?121:201),source:sourceLabels[0],reference:'',note:''};expect(fieldError(id,notes[id])).not.toBeNull();}
  notes.drainage={value:'Excellent health',source:sourceLabels[0],reference:'',note:''};expect(fieldError('drainage',notes.drainage)).not.toBeNull();
  notes.disease={value:'Uncertain',source:sourceLabels[0],reference:'x'.repeat(201),note:''};expect(fieldError('disease',notes.disease)).not.toBeNull();
  notes.disease.reference='';notes.disease.note='x'.repeat(201);expect(fieldError('disease',notes.disease)).not.toBeNull();
});
it.each(sourceLabels)('keeps %s explicitly unverified',source=>{
  const notes=emptyFieldNotes();notes.ph={value:'0',source,reference:'Example reference supplied in a test',note:''};
  const entry=exportFieldNotes(notes,timestamp).fields[0]!;expect(entry).toMatchObject({value:0,verification:suppliedLabel,sourceClassification:source});
  expect(suppliedCount(notes)).toBe(1);
});
it('changes review questions only as supplied information is recorded',()=>{
  const notes=emptyFieldNotes();expect(reviewQuestions(notes)[0]!.text).toContain('Obtain');
  for(const d of fieldDefinitions){notes[d.id]={value:d.kind==='number'?'7':d.kind==='select'?d.choices[0]:'Test supplied note',source:sourceLabels[0],reference:'',note:''};}
  expect(suppliedCount(notes)).toBe(8);expect(reviewQuestions(notes).every(q=>q.text.includes('recorded'))).toBe(true);
  expect(reviewQuestions(emptyFieldNotes())[0]!.text).toContain('Obtain');
});
it('renders privacy, source limits and non-computational readiness without analysis controls',()=>{
  const html=renderToStaticMarkup(<FieldEvidence notes={emptyFieldNotes()} onChange={()=>{}} powerDays={3653} rainDays={3653} onFocusHandled={()=>{}}/>);
  for(const text of ['not validation or agricultural readiness','not independently verified','not part of the canonical','specific Romanian field','May 1','June 30'])expect(html).toContain(text);
  expect(html).not.toContain('type="file"');expect(html).not.toContain('Apply to analysis');expect(html).not.toContain('localStorage');
  expect(renderToStaticMarkup(<FieldEvidenceConnection notes={emptyFieldNotes()} onReview={()=>{}}/>)).toContain('0 of 8');
});

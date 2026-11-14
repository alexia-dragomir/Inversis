/** Presentation-only intake. Never passed to the scientific engine or certificate. */
export const fieldDefinitions = [
  {id:'ph',label:'Soil pH',kind:'number',max:14,hint:'Supplied pH, 0–14. No crop suitability is inferred.'},
  {id:'texture',label:'Soil texture',kind:'text',max:120,hint:'Supplied classification, up to 120 characters.'},
  {id:'organicMatter',label:'Soil organic matter (%)',kind:'number',max:100,hint:'Supplied percentage, 0–100. No soil-health or fertility inference.'},
  {id:'drainage',label:'Drainage',kind:'select',choices:['Well drained','Moderately drained','Poorly drained','Other or uncertain'],hint:'No automatic crop exclusion.'},
  {id:'irrigation',label:'Irrigation',kind:'select',choices:['Irrigated','Rain-fed','Mixed or uncertain'],hint:'NASA rainfall is not a measured field water balance.'},
  {id:'previousCrop',label:'Previous crop',kind:'select',choices:['Wheat','Maize','Sunflower','Soybean','Other'],hint:'Reported preceding crop; not independently verified rotation history.'},
  {id:'disease',label:'Disease history',kind:'select',choices:['Reported history','No history reported','Uncertain'],hint:'No history reported is not proof of absence.'},
  {id:'timing',label:'Local crop timing',kind:'text',max:200,hint:'Observed sowing, flowering or harvest notes, up to 200 characters. Existing calendar windows and ±7/14-day tests stay unchanged.'},
] as const;
export type FieldId = typeof fieldDefinitions[number]['id'];
export const sourceLabels = ['Farmer-reported','On-site observation, reported by user','Laboratory report, reported by user','Regional mapped estimate, reported by user'] as const;
export interface FieldEntry { value:string; source:string; reference:string; note:string }
export type FieldNotes = Record<FieldId,FieldEntry>;
export const suppliedLabel = 'Supplied — not independently verified';
export function emptyFieldNotes():FieldNotes {
  return Object.fromEntries(fieldDefinitions.map(d=>[d.id,{value:'',source:'',reference:'',note:''}])) as FieldNotes;
}
export function fieldError(id:FieldId, entry:FieldEntry):string|null {
  const d=fieldDefinitions.find(d=>d.id===id)!;
  if(!entry.value.trim())return entry.note.trim()||entry.source||entry.reference.trim()?'Enter a value or clear this category to keep it unknown.':null;
  if(d.kind==='number'&&(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(entry.value.trim())||!Number.isFinite(Number(entry.value))||Number(entry.value)<0||Number(entry.value)>d.max))return `Enter a number from 0 to ${d.max}.`;
  if(d.kind==='text'&&entry.value.length>d.max)return `Use at most ${d.max} characters.`;
  if(d.kind==='select'&&!(d.choices as readonly string[]).includes(entry.value))return 'Choose one of the listed classifications.';
  if(!(sourceLabels as readonly string[]).includes(entry.source))return 'Choose how this information was supplied.';
  if(entry.reference.length>200||entry.note.length>200)return 'Source references and notes must be at most 200 characters.';
  if(id!=='disease'&&entry.note)return 'Explanatory notes are supported only for disease history.';
  return null;
}
export function suppliedCount(notes:FieldNotes) { return fieldDefinitions.filter(d=>notes[d.id].value.trim()&&!fieldError(d.id,notes[d.id])).length; }
export function reviewQuestions(notes:FieldNotes) {
  const has=(id:FieldId)=>!!notes[id].value.trim()&&!fieldError(id,notes[id]);
  return [
    {id:'soil',text:['ph','texture','organicMatter'].every(id=>has(id as FieldId))?'Soil information is recorded, not verified. Review the methods, sampling and local applicability with a qualified adviser.':'Obtain an applicable soil test or documented local soil assessment.'},
    {id:'water',text:has('drainage')&&has('irrigation')?'Water-management descriptions are recorded. Confirm their applicability to the field; no water balance is established.':'Confirm field water-management conditions.'},
    {id:'history',text:has('previousCrop')&&has('disease')?'Crop and disease reports are recorded. Check locally relevant disease constraints; no history reported does not establish absence.':'Review crop history and locally relevant disease constraints.'},
    {id:'timing',text:has('timing')?'Local timing notes are recorded. Verify observed stages before interpreting the unchanged provisional windows.':'Confirm locally observed crop stages before interpreting provisional exposure windows.'},
  ];
}
export function exportFieldNotes(notes:FieldNotes, exportedAtUTC:string) {
  if(fieldDefinitions.some(d=>fieldError(d.id,notes[d.id])))throw new Error('Correct incomplete or invalid field entries before export.');
  if(!Number.isFinite(Date.parse(exportedAtUTC)))throw new Error('Invalid export timestamp');
  return {schema:'inversis-field-notes-v1',designation:'unverified_user_supplied_information',exportedAtUTC,
    statement:'These field notes are separate from the scientific decision certificate. They do not alter eligibility, minimax results or certificate fingerprints and have not been validated for agronomic suitability.',
    fields:fieldDefinitions.map(d=>{const e=notes[d.id];return e.value.trim()?{category:d.id,label:d.label,status:'supplied',verification:suppliedLabel,value:d.kind==='number'?Number(e.value):e.value.trim(),sourceClassification:e.source,sourceReference:e.reference.trim()||null,explanatoryNote:e.note.trim()||null}:{category:d.id,label:d.label,status:'unknown',value:null};})};
}

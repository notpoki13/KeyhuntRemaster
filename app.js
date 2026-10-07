'use strict';

const DEFAULT = {
  version: 3,
  config: {
    thisName: 'This update',
    thisDesc: 'Current Halloween/update window',
    nextName: 'Next update',
    nextDesc: 'If current window passes',
    base: 50,
    modelBoost: 0.55,
    targetDate: '',
    manualEnabled: false,
    manualScore: 50
  },
  evidence: [
    {id:'official-halloween',title:'Official Halloween update wording',description:'The update page has indicated Halloween as the next major update window, making this a natural remaster candidate.',type:'confirmed',status:'confirmed',weight:20},
    {id:'prog-accurate',title:'CC response: “prog accurate”',description:'A community creator response described the shared prediction as program-accurate. Useful signal, not a release announcement.',type:'clue',status:'confirmed',weight:16},
    {id:'levi-reaction',title:'Levi reaction: “Oh dang”',description:'Levi reacted to the prediction shared through an NSAP CC. Treat as a signal rather than direct confirmation.',type:'clue',status:'confirmed',weight:7},
    {id:'backstage',title:'Backstage / John WIP footage',description:'Reported footage includes a backstage area and John-related WIP material. WIP does not guarantee final inclusion.',type:'leak',status:'unconfirmed',weight:10},
    {id:'bowling',title:'Bowling alley / expanded locations',description:'Reported remaster footage and WIP clues include a bowling alley and expanded environments.',type:'leak',status:'unconfirmed',weight:10},
    {id:'animatronics',title:'Tree-stage / animatronic clues',description:'Reported WIP material includes a tree stage and animatronic-related content.',type:'leak',status:'unconfirmed',weight:10},
    {id:'pharaoh',title:'Pharaoh Betty Beaks',description:'Reported WIP material points to a Pharaoh skin for Betty Beaks.',type:'leak',status:'unconfirmed',weight:10},
    {id:'kitchen',title:'Kitchen reveal',description:'Reported remaster footage includes a kitchen-related reveal, suggesting substantial environment work.',type:'leak',status:'unconfirmed',weight:10}
  ],
  additions:['Expanded / remastered Keyhunt environment','Bowling alley area','Tree-stage / animatronic content','Expanded office / backstage-style areas','Kitchen reveal','New or customized character / skin content','John-related material — still WIP, not guaranteed'],
  leaks:['Donny Halloween skin','Paulie red rat chef hat','Doughy/Dougly purple sweater star','Red bunny with hollow-looking eyes','John WIP black Paulie polo','John peeking / stalking-style WIP','Pharaoh Betty Beaks','Backstage footage'],
  easter:['Rat / animatronic connections','Backstage references','Character costume details','Environmental details visible in WIP footage','Possible visual callbacks to earlier NSAP material'],
  questions:['Will the remaster release in the Halloween update?','Which leaked/WIP assets survive into the final build?','How much does the map/objective flow change?','Will John have a direct gameplay role?','Are any cutscene-like ideas actually planned?'],
  timeline:[
    ['2026-10-03','Weekly Update','Lobby Play UI, matchmaking improvements, optimization and other systems land; Halloween is announced as next week.'],
    ['2026-10-06','Prediction shared','The prediction summary is shared with an NSAP CC who has talked to LB and Levia. LB replies “prog accurate”; Levi replies “Oh dang.”'],
    ['2026-10-07','Forecast tracker','The red forecast dashboard is created to separate evidence from theories and score the release window.']
  ]
};

const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
function load(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : clone(fallback); } catch { return clone(fallback); } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error('Save failed', e); } }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function uid(prefix='id') { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }
function clamp(n,min,max) { return Math.max(min,Math.min(max,n)); }
function normalize(raw) {
  const d = clone(DEFAULT);
  if (!raw || typeof raw !== 'object') return d;
  d.config = {...d.config, ...(raw.config || {})};
  d.evidence = Array.isArray(raw.evidence) ? raw.evidence.map(e => ({id:e.id||uid('ev'),title:String(e.title||'Untitled'),description:String(e.description||''),type:['confirmed','leak','clue','theory'].includes(e.type)?e.type:'clue',status:e.status==='confirmed'?'confirmed':'unconfirmed',weight:clamp(Number(e.weight)||0,0,100)})) : d.evidence;
  for (const key of ['additions','leaks','easter','questions']) if (Array.isArray(raw[key])) d[key] = raw[key].map(String);
  d.timeline = Array.isArray(raw.timeline) ? raw.timeline.filter(x=>Array.isArray(x)&&x.length>=3).map(x=>[String(x[0]),String(x[1]),String(x[2])]) : d.timeline;
  d.version = 3;
  d.config.base = clamp(Number(d.config.base)||50,0,100);
  d.config.modelBoost = clamp(Number(d.config.modelBoost)||0.55,0,2);
  d.config.manualScore = clamp(Number(d.config.manualScore)||50,0,100);
  return d;
}

let data = normalize(load('khData', DEFAULT));
let history = load('khHistory', []);
if (!Array.isArray(history)) history = [];
save('khData', data);

function calculate() {
  if (data.config.manualEnabled) {
    return {score: clamp(Math.round(Number(data.config.manualScore)||50),0,100), raw: Number(data.config.manualScore)||50, manual:true};
  }
  const confirmed = data.evidence.filter(e => e.status === 'confirmed');
  const unconfirmed = data.evidence.filter(e => e.status !== 'confirmed');
  const positive = data.evidence.reduce((sum,e) => sum + Number(e.weight||0), 0);
  const confirmedBoost = confirmed.reduce((sum,e) => sum + Number(e.weight||0), 0) * 0.75;
  const leakBoost = unconfirmed.reduce((sum,e) => sum + Number(e.weight||0), 0) * 0.32;
  const theoryPenalty = data.evidence.filter(e => e.type === 'theory' && e.status !== 'confirmed').reduce((sum,e) => sum + Number(e.weight||0), 0) * 0.35;
  const raw = Number(data.config.base||50) + (confirmedBoost + leakBoost - theoryPenalty) * Number(data.config.modelBoost||0.55);
  return {score: clamp(Math.round(raw),5,95), raw, manual:false, positive, confirmedWeight:confirmedBoost, leakWeight:leakBoost};
}
function callFor(score) { return score >= 60 ? data.config.thisName.toUpperCase() : score <= 39 ? 'LATER' : data.config.nextName.toUpperCase(); }
function reasonFor(score) {
  if (score >= 60) return 'The evidence stack currently favors the current update window.';
  if (score <= 39) return 'The current evidence favors waiting beyond the next update window.';
  return 'The model is close to the middle; more evidence is needed for a stronger call.';
}
function render() {
  const result = calculate(), s = result.score, next = 100-s;
  const ids = ['score','thisPct','scenarioThis']; ids.forEach(id=>{if($(id)) $(id).textContent=s+'%';});
  if ($('nextPct')) $('nextPct').textContent=next+'%';
  if ($('scenarioNext')) $('scenarioNext').textContent=next+'%';
  if ($('score')) $('score').textContent=s+'%';
  if ($('call')) $('call').textContent=callFor(s);
  if ($('reason')) $('reason').textContent=reasonFor(s);
  if ($('bar')) $('bar').style.width=s+'%';
  if ($('ring')) $('ring').style.background=`radial-gradient(circle,#14090a 58%,transparent 59%),conic-gradient(var(--red) ${s}%,#341417 0)`;
  if ($('updated')) $('updated').textContent='UPDATED '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const set=(id,v)=>{if($(id)) $(id).textContent=v;};
  set('count',data.evidence.length); set('confirmed',data.evidence.filter(e=>e.status==='confirmed').length); set('leaks',data.evidence.filter(e=>e.type==='leak').length); set('weight',data.evidence.reduce((n,e)=>n+Number(e.weight||0),0));
  const previous=history.length?Number(history[history.length-1].score):null;
  set('trend',previous===null?'—':s>previous?'↑':s<previous?'↓':'→'); set('trendText',previous===null?'waiting':s>previous?'confidence rising':s<previous?'confidence falling':'no change');
  set('thisName',data.config.thisName); set('thisDesc',data.config.thisDesc); set('nextName',data.config.nextName); set('nextDesc',data.config.nextDesc); set('later',s<40?'HIGH':s<60?'MED':'LOW');
  const top=[...data.evidence].sort((a,b)=>Number(b.weight)-Number(a.weight)).slice(0,5);
  if($('signals')) $('signals').innerHTML=top.length?top.map(e=>`<div class="signal"><b>${esc(e.title)}</b><small>${esc(e.type)} • +${e.weight} weight • ${esc(e.status)}</small></div>`).join(''):'<p class="muted">No evidence yet.</p>';
  const q=($('search')?.value||'').toLowerCase(), t=$('type')?.value||'all', st=$('status')?.value||'all';
  const list=data.evidence.filter(e=>(t==='all'||e.type===t)&&(st==='all'||e.status===st)&&`${e.title} ${e.description}`.toLowerCase().includes(q));
  if($('cards')) $('cards').innerHTML=list.length?list.map(e=>`<article class="evidence-card"><span class="badge ${esc(e.type)}">${esc(e.type.toUpperCase())}</span><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p><div class="card-foot"><span>${esc(e.status)}</span><b>+${e.weight}</b></div><div class="card-actions"><button class="mini" data-edit="${esc(e.id)}">Edit</button><button class="mini danger" data-delete="${esc(e.id)}">Delete</button></div></article>`).join(''):'<article class="panel"><p>No matching evidence.</p></article>';
  const renderList=(id,arr,key)=>{if($(id)) $(id).innerHTML=arr.length?arr.map((x,i)=>`<li>${esc(x)} <button class="mini" data-list-edit="${key}" data-index="${i}">Edit</button><button class="mini danger" data-list-delete="${key}" data-index="${i}">×</button></li>`).join(''):'<li class="muted">Empty.</li>';};
  renderList('additions',data.additions,'additions'); renderList('leakList',data.leaks,'leaks'); renderList('easter',data.easter,'easter'); renderList('questions',data.questions,'questions');
  if($('timelineList')) $('timelineList').innerHTML=data.timeline.length?data.timeline.map((x,i)=>`<article class="timeline-item"><time>${esc(x[0])}</time><h3>${esc(x[1])}</h3><p>${esc(x[2])}</p><div class="card-actions"><button class="mini" data-timeline-edit="${i}">Edit</button><button class="mini danger" data-timeline-delete="${i}">Delete</button></div></article>`).join(''):'<article class="panel"><p>No timeline events.</p></article>';
  if($('history')) $('history').innerHTML=history.length?history.slice().reverse().map((h,i)=>`<div class="history-row"><span>${esc(h.date)}</span><b>${esc(h.call)} • ${h.score}%</b></div>`).join(''):'<article class="panel"><p>No snapshots yet.</p></article>';
  syncControls();
}
function syncControls(){
  const map={cfgThis:data.config.thisName,cfgThisDesc:data.config.thisDesc,cfgNext:data.config.nextName,cfgNextDesc:data.config.nextDesc,cfgBase:data.config.base,modelBoost:data.config.modelBoost,manualEnabled:data.config.manualEnabled,manualScore:data.config.manualScore,targetDate:data.config.targetDate||'',adminNotes:localStorage.getItem('khAdminNotes')||''};
  Object.entries(map).forEach(([id,v])=>{if($(id)) {if($(id).type==='checkbox') $(id).checked=!!v; else $(id).value=v;}});
  if($('manualScoreWrap')) $('manualScoreWrap').style.display=data.config.manualEnabled?'block':'none';
}
function persist(){data=normalize(data);save('khData',data);render();}
function snapshot(){const s=calculate().score;history.push({date:new Date().toLocaleString(),score:s,call:callFor(s)});save('khHistory',history);render();}
function openEvidence(item){
  const editing=!!item;
  $('evId').value=item?.id||''; $('evTitle').value=item?.title||''; $('evDesc').value=item?.description||''; $('evType').value=item?.type||'clue'; $('evStatus').value=item?.status||'unconfirmed'; $('evWeight').value=item?.weight??7;
  $('dialogTitle').textContent=editing?'Edit evidence':'Add a clue'; $('evSubmit').textContent=editing?'Save changes':'Save evidence'; $('dialog').showModal();
}
function openTimeline(item,index=-1){$('tlIndex').value=index; $('tlDate').value=item?.[0]||new Date().toISOString().slice(0,10); $('tlTitle').value=item?.[1]||''; $('tlDesc').value=item?.[2]||''; $('timelineDialogTitle').textContent=index>=0?'Edit event':'Add event'; $('tlSubmit').textContent=index>=0?'Save changes':'Save event'; $('timelineDialog').showModal();}

$('add')?.addEventListener('click',()=>openEvidence());
$('close')?.addEventListener('click',()=>$('dialog').close());
$('form')?.addEventListener('submit',e=>{e.preventDefault();const item={id:$('evId').value||uid('ev'),title:$('evTitle').value.trim(),description:$('evDesc').value.trim(),type:$('evType').value,status:$('evStatus').value,weight:clamp(Number($('evWeight').value)||0,0,100)};const idx=data.evidence.findIndex(x=>x.id===item.id);if(idx>=0)data.evidence[idx]=item;else data.evidence.push(item);$('dialog').close();persist();snapshot();});
$('addTimeline')?.addEventListener('click',()=>openTimeline()); $('timelineClose')?.addEventListener('click',()=>$('timelineDialog').close());
$('timelineForm')?.addEventListener('submit',e=>{e.preventDefault();const idx=Number($('tlIndex').value);const item=[$('tlDate').value,$('tlTitle').value.trim(),$('tlDesc').value.trim()];if(idx>=0)data.timeline[idx]=item;else data.timeline.push(item);data.timeline.sort((a,b)=>a[0].localeCompare(b[0]));$('timelineDialog').close();persist();});
['search','type','status'].forEach(id=>$(id)?.addEventListener('input',render));
$('cards')?.addEventListener('click',e=>{const edit=e.target.closest('[data-edit]');const del=e.target.closest('[data-delete]');if(edit){const item=data.evidence.find(x=>x.id===edit.dataset.edit);if(item)openEvidence(item);}if(del){data.evidence=data.evidence.filter(x=>x.id!==del.dataset.delete);persist();}});
$('timelineList')?.addEventListener('click',e=>{const edit=e.target.closest('[data-timeline-edit]'),del=e.target.closest('[data-timeline-delete]');if(edit)openTimeline(data.timeline[Number(edit.dataset.timelineEdit)],Number(edit.dataset.timelineEdit));if(del){data.timeline.splice(Number(del.dataset.timelineDelete),1);persist();}});
['additions','leaks','easter','questions'].forEach(key=>{$(key==='leaks'?'leakList':key)?.addEventListener('click',e=>{const ed=e.target.closest('[data-list-edit]'),del=e.target.closest('[data-list-delete]');const k=ed?.dataset.listEdit||del?.dataset.listDelete;if(!k)return;const i=Number(ed?.dataset.index??del?.dataset.index);if(ed){const value=prompt('Edit item:',data[k][i]);if(value!==null&&value.trim()){data[k][i]=value.trim();persist();}}else{data[k].splice(i,1);persist();}});});
$('saveConfig')?.addEventListener('click',()=>{data.config={...data.config,thisName:$('cfgThis').value.trim()||'This update',thisDesc:$('cfgThisDesc').value.trim()||'Current update window',nextName:$('cfgNext').value.trim()||'Next update',nextDesc:$('cfgNextDesc').value.trim()||'If current window passes',base:clamp(Number($('cfgBase').value)||50,0,100),modelBoost:clamp(Number($('modelBoost').value)||0.55,0,2),manualEnabled:!!$('manualEnabled')?.checked,manualScore:clamp(Number($('manualScore').value)||50,0,100),targetDate:$('targetDate')?.value||''};persist();snapshot();});
$('manualEnabled')?.addEventListener('change',()=>{data.config.manualEnabled=$('manualEnabled').checked;syncControls();render();});
$('manualScore')?.addEventListener('input',()=>{data.config.manualScore=clamp(Number($('manualScore').value)||50,0,100);render();});
$('snapshot')?.addEventListener('click',snapshot);
$('clear')?.addEventListener('click',()=>{if(confirm('Clear all forecast snapshots?')){history=[];save('khHistory',history);render();}});
$('reset')?.addEventListener('click',()=>{if(confirm('Reset ALL saved dashboard data to the built-in defaults?')){data=clone(DEFAULT);history=[];save('khData',data);save('khHistory',history);localStorage.removeItem('khAdminNotes');render();}});
$('export')?.addEventListener('click',()=>{const payload={schema:3,exportedAt:new Date().toISOString(),data,history,adminNotes:localStorage.getItem('khAdminNotes')||''};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kh-remaster-forecast-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('import')?.addEventListener('click',()=>$('importFile')?.click());
$('importFile')?.addEventListener('change',()=>{const file=$('importFile').files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const x=JSON.parse(reader.result);if(!x.data||!x.data.config||!Array.isArray(x.data.evidence))throw new Error('Invalid forecast backup');data=normalize(x.data);history=Array.isArray(x.history)?x.history:[];if(typeof x.adminNotes==='string')localStorage.setItem('khAdminNotes',x.adminNotes);save('khData',data);save('khHistory',history);render();alert('Backup imported successfully.');}catch(err){alert('Import failed: '+err.message);}};reader.readAsText(file);});
$('saveNotes')?.addEventListener('click',()=>{localStorage.setItem('khAdminNotes',$('adminNotes').value);alert('Admin notes saved locally.');});
$('theme')?.addEventListener('click',()=>{document.body.classList.toggle('light');$('theme').textContent=document.body.classList.contains('light')?'☀':'☾';});
$('share')?.addEventListener('click',async()=>{const s=calculate().score,text=`KH Remaster Forecast: ${s}% — ${callFor(s)}`;try{if(navigator.share)await navigator.share({title:'KH Remaster Forecast',text});else if(navigator.clipboard)await navigator.clipboard.writeText(text);else alert(text);}catch(err){if(err.name!=='AbortError')console.error('Share failed',err);}});
$('year') && ($('year').textContent='© '+new Date().getFullYear());
render();

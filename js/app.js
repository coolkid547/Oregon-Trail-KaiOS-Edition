/* Lightweight Oregon Trail style prototype for KaiOS
   Title: Oregon Trail:KaiOS Edition
   Developer: ChingaApps

   Notes: Keep code simple and keypad-friendly. Avoid em-dashes in code.
*/

const app = document.getElementById('app');
const main = document.getElementById('main');
const leftSoft = document.getElementById('left-soft');
const rightSoft = document.getElementById('right-soft');

const GAME = {
  state: 'start',
  day: 0,
  milesLeft: 2040,
  food: 200,
  party: 4,
  health: 100,
  wounded: 0
};

// softkey callbacks
let leftAction = null;
let rightAction = null;

// audio context for simple sounds
let audioCtx = null;
function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type){
  try{
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if(type === 'click'){ o.frequency.value = 880; g.gain.value = 0.02; }
    else if(type === 'event'){ o.frequency.value = 440; g.gain.value = 0.04; }
    else if(type === 'win'){ o.frequency.value = 660; g.gain.value = 0.06; }
    else if(type === 'gameover'){ o.frequency.value = 120; g.gain.value = 0.06; }
    else { o.frequency.value = 520; g.gain.value = 0.03; }
    o.start();
    setTimeout(()=>{ o.stop(); }, 120);
  }catch(e){ /* audio may be blocked in some environments */ }
}

// save keys and slots
const SAVE_KEY = 'otkai_save_v1';
const SAVE_SLOTS = 3;
function _slotKey(i){ return `otkai_slot_${i}`; }
  const form = el('div',{class:'card secret-form'}, '');
  const inputs = [
    {k:'milesLeft', label:'Miles to Oregon', value: GAME.milesLeft},
    {k:'food', label:'Starting food', value: GAME.food},
    {k:'party', label:'Party size', value: GAME.party},
    {k:'health', label:'Health', value: GAME.health}
  ];
  inputs.forEach(i=>{
    const row = el('div',{class:'form-row'}, '');
    const label = el('label',{}, html(i.label));
    const input = document.createElement('input');
    input.type = 'number'; input.value = i.value; input.id = `secret_${i.k}`;
    row.appendChild(label); row.appendChild(input); form.appendChild(row);
  });

  // custom events editor
  const eventsTitle = el('div',{class:'card'}, html('Custom events (optional)'));
  const eventsList = el('div',{id:'secret_events_list', class:'card'}, '');
  function refreshEventsList(profile){
    eventsList.innerHTML = '';
    const arr = (profile && profile.events) ? profile.events : [];
    arr.forEach((ev, idx)=>{
      const evNode = el('div',{class:'card event-row'}, html(`<strong>${idx+1}.</strong> ${ev.message || ''}`));
      const edit = el('button',{}, html('Edit'));
      edit.addEventListener('click', ()=>{ openEditEventModal(ev, idx, profile); });
      const del = el('button',{}, html('Delete'));
      del.addEventListener('click', ()=>{ profile.events.splice(idx,1); refreshEventsList(profile); });
      evNode.appendChild(edit); evNode.appendChild(del); eventsList.appendChild(evNode);
    });
  }

  function openEditEventModal(ev, idx, profile){
    // create a simple inline modal editor instead of prompts
    const modal = el('div',{class:'card modal'}, '');
    const title = el('div',{class:'card'}, html(ev ? 'Edit event' : 'New event'));
    const msgRow = el('div',{class:'form-row'}, '');
    const msgLabel = el('label',{}, html('Message'));
    const msgInput = document.createElement('input'); msgInput.type='text'; msgInput.value = ev ? (ev.message||'') : '';
    msgRow.appendChild(msgLabel); msgRow.appendChild(msgInput);

    const choiceRow = el('div',{class:'form-row'}, '');
    const choiceLabel = el('label',{}, html('Is choice event'));
    const choiceCheckbox = document.createElement('input'); choiceCheckbox.type='checkbox'; choiceCheckbox.checked = ev && ev.choice ? true : false;
    choiceRow.appendChild(choiceLabel); choiceRow.appendChild(choiceCheckbox);

    const opt1Row = el('div',{class:'form-row'}, '');
    const opt1Label = el('label',{}, html('Option 1 label')); const opt1Input = document.createElement('input'); opt1Input.type='text'; opt1Input.value = (ev && ev.choice && ev.choice.opt1) ? (ev.choice.opt1.label||'') : '';
    const opt1Food = document.createElement('input'); opt1Food.type='number'; opt1Food.value = (ev && ev.choice && ev.choice.opt1 && ev.choice.opt1.effects) ? (ev.choice.opt1.effects.food||0) : 0; opt1Food.style.width='80px';
    const opt1Result = document.createElement('input'); opt1Result.type='text'; opt1Result.value = (ev && ev.choice && ev.choice.opt1) ? (ev.choice.opt1.result||'') : '';
    opt1Row.appendChild(opt1Label); opt1Row.appendChild(opt1Input); opt1Row.appendChild(opt1Food); opt1Row.appendChild(opt1Result);

    const opt2Row = el('div',{class:'form-row'}, '');
    const opt2Label = el('label',{}, html('Option 2 label')); const opt2Input = document.createElement('input'); opt2Input.type='text'; opt2Input.value = (ev && ev.choice && ev.choice.opt2) ? (ev.choice.opt2.label||'') : '';
    const opt2Food = document.createElement('input'); opt2Food.type='number'; opt2Food.value = (ev && ev.choice && ev.choice.opt2 && ev.choice.opt2.effects) ? (ev.choice.opt2.effects.food||0) : 0; opt2Food.style.width='80px';
    const opt2Result = document.createElement('input'); opt2Result.type='text'; opt2Result.value = (ev && ev.choice && ev.choice.opt2) ? (ev.choice.opt2.result||'') : '';
    opt2Row.appendChild(opt2Label); opt2Row.appendChild(opt2Input); opt2Row.appendChild(opt2Food); opt2Row.appendChild(opt2Result);

    const simpleRow = el('div',{class:'form-row'}, '');
    const simpleLabel = el('label',{}, html('Immediate food delta')); const simpleInput = document.createElement('input'); simpleInput.type='number'; simpleInput.value = (ev && ev.effects) ? (ev.effects.food||0) : 0; simpleInput.style.width='80px';
    simpleRow.appendChild(simpleLabel); simpleRow.appendChild(simpleInput);

    const buttons = el('div',{class:'form-row'}, '');
    const saveBtn = el('button',{}, html('Save'));
    const cancelBtn = el('button',{}, html('Cancel'));

    saveBtn.addEventListener('click', ()=>{
      const newEv = { message: msgInput.value };
      if(choiceCheckbox.checked){
        newEv.choice = {
          opt1: { label: opt1Input.value || 'Option 1', effects: { food: parseInt(opt1Food.value||'0',10) }, result: opt1Result.value || '' },
          opt2: { label: opt2Input.value || 'Option 2', effects: { food: parseInt(opt2Food.value||'0',10) }, result: opt2Result.value || '' }
        };
      } else {
        newEv.effects = { food: parseInt(simpleInput.value||'0',10) };
      }
      if(typeof idx === 'number') profile.events[idx] = newEv; else profile.events.push(newEv);
      document.body.removeChild(modalOuter);
      refreshEventsList(profile);
    });

    cancelBtn.addEventListener('click', ()=>{ document.body.removeChild(modalOuter); });

    buttons.appendChild(saveBtn); buttons.appendChild(cancelBtn);
    modal.appendChild(title); modal.appendChild(msgRow); modal.appendChild(choiceRow); modal.appendChild(opt1Row); modal.appendChild(opt2Row); modal.appendChild(simpleRow); modal.appendChild(buttons);

    const modalOuter = el('div',{class:'modal-outer'}, '');
    modalOuter.style.position='fixed'; modalOuter.style.left='0'; modalOuter.style.top='0'; modalOuter.style.right='0'; modalOuter.style.bottom='0'; modalOuter.style.display='flex'; modalOuter.style.alignItems='center'; modalOuter.style.justifyContent='center'; modalOuter.style.background='rgba(0,0,0,0.25)';
    modalOuter.appendChild(modal);
    document.body.appendChild(modalOuter);
  }

  // load existing profile if present
  let currentProfile = loadCustomProfile() || { events: [] };
  refreshEventsList(currentProfile);

  const addEvBtn = el('button',{}, html('Add event'));
  addEvBtn.addEventListener('click', ()=>{ openEditEventModal(null, null, currentProfile); });

  const saveBtn = el('button',{}, html('Save profile'));
  const startBtn = el('button',{}, html('Start custom'));
  const loadBtn = el('button',{}, html('Load saved profile'));
  const exportBtn = el('button',{}, html('Export profile'));
  const importInput = document.createElement('input'); importInput.type='file'; importInput.accept='application/json'; importInput.style.display='inline-block';
  saveBtn.addEventListener('click', ()=>{
    // assemble profile
    const profile = {};
    inputs.forEach(i=>{ profile[i.k] = parseInt(document.getElementById(`secret_${i.k}`).value,10) || i.value; });
    profile.events = currentProfile.events || [];
    saveCustomProfile(profile);
    alert('Profile saved');
  });
  loadBtn.addEventListener('click', ()=>{
    const p = loadCustomProfile(); if(!p) { alert('No saved profile'); return; }
    inputs.forEach(i=>{ document.getElementById(`secret_${i.k}`).value = p[i.k]; });
    currentProfile = p; refreshEventsList(currentProfile);
  });
  exportBtn.addEventListener('click', ()=>{
    const profile = {};
    inputs.forEach(i=>{ profile[i.k] = parseInt(document.getElementById(`secret_${i.k}`).value,10) || i.value; });
    profile.events = currentProfile.events || [];
    const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const a = document.createElement('a'); a.href = dataStr; a.download = 'otkai_profile.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  });
  importInput.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0]; if(!f) return; const reader = new FileReader();
    reader.onload = function(ev){ try{ const obj = JSON.parse(ev.target.result); if(obj){ saveCustomProfile(obj); currentProfile = obj; refreshEventsList(currentProfile); inputs.forEach(i=>{ document.getElementById(`secret_${i.k}`).value = obj[i.k] || i.value; }); alert('Profile imported'); } }catch(err){ alert('Invalid JSON file'); } };
    reader.readAsText(f);
  });
  startBtn.addEventListener('click', ()=>{
    const profile = {};
    inputs.forEach(i=>{ profile[i.k] = parseInt(document.getElementById(`secret_${i.k}`).value,10) || i.value; });
    profile.events = currentProfile.events || [];
    GAME.milesLeft = profile.milesLeft; GAME.food = profile.food; GAME.party = profile.party; GAME.health = profile.health; GAME.day = 1; GAME.customEvents = profile.events || []; GAME.state='travel'; saveGame(); render();
  });
  form.appendChild(saveBtn); form.appendChild(loadBtn); form.appendChild(exportBtn); form.appendChild(importInput); form.appendChild(startBtn); form.appendChild(addEvBtn);
  main.appendChild(title); main.appendChild(form); main.appendChild(eventsTitle); main.appendChild(eventsList);
  setSoftkeys('','3:Back', null, ()=>{ GAME.state='start'; render(); });
  
  // Slots screen will be rendered when state is 'slots'
  if(GAME.state === 'slots'){
    const list = el('div',{}, '');
    for(let i=1;i<=SAVE_SLOTS;i++){
      const meta = getSlotMeta(i);
      const label = meta && meta.name ? `${meta.name} (${new Date(meta.ts).toLocaleString()})` : (meta ? `Saved ${new Date(meta.ts).toLocaleString()}` : 'Empty');
      const row = el('div',{}, html(`<strong>Slot ${i}:</strong> ${label}`));
      const b1 = el('button',{}, html('Load'));
      b1.addEventListener('click', ()=>{ if(loadGame(i)){ GAME.state='travel'; render(); } else alert('No saved data in this slot.'); });
      const b2 = el('button',{}, html('Save'));
      b2.addEventListener('click', ()=>{ const name = prompt('Save slot name (optional):',''); saveGame(i, name || null); render(); });
      const b3 = el('button',{}, html('Clear'));
      b3.addEventListener('click', ()=>{ if(confirm('Clear this slot?')){ clearSave(i); render(); } });
      const b4 = el('button',{}, html('Rename'));
      b4.addEventListener('click', ()=>{
        const newName = prompt('Enter new slot name:','');
        if(newName!==null){
          const data = localStorage.getItem(_slotKey(i));
          if(data){
            const parsed = JSON.parse(data);
            parsed.meta = parsed.meta || {};
            parsed.meta.name = newName;
            localStorage.setItem(_slotKey(i), JSON.stringify(parsed));
            render();
          } else { alert('No saved data in this slot to rename'); }
        }
      });
      const container = el('div',{class:'card slot-row'}, '');
      container.appendChild(row); container.appendChild(b1); container.appendChild(b2); container.appendChild(b3); container.appendChild(b4);
      list.appendChild(container);
    }
    main.appendChild(el('div',{class:'card'}, html('Save slots')));
    main.appendChild(list);
    setSoftkeys('1:Back','','', ()=>{ GAME.state='start'; render(); });
    return;
  }

  if(GAME.state === 'travel'){
    main.appendChild(el('div',{class:'card'}, html(`Day ${GAME.day}`)));
    main.appendChild(statusCard());
    main.appendChild(el('div',{class:'card'}, html(`Miles to go: ${GAME.milesLeft}`)));

    const choices = el('div',{class:'choices'}, '');
    choices.appendChild(choice(1,'Travel'));
    choices.appendChild(choice(2,'Hunt for food'));
    choices.appendChild(choice(3,'Rest'));
    main.appendChild(choices);
    setSoftkeys('1:Select','3:Menu', ()=>onChoice(1), ()=>{ GAME.state='start'; saveGame(); render(); });
    return;
  }

  if(GAME.state === 'event'){
    main.appendChild(el('div',{class:'card'}, html(GAME.message || 'An event occurred.')));
    main.appendChild(statusCard());
    const choices = el('div',{class:'choices'}, '');
    if(GAME.eventChoice){
      choices.appendChild(choice(1, GAME.eventChoice.opt1.label));
      choices.appendChild(choice(2, GAME.eventChoice.opt2.label));
    } else {
      choices.appendChild(choice(1,'Continue'));
    }
    main.appendChild(choices);
    setSoftkeys('1:Select','3:Back', ()=>onChoice(1), ()=>{ GAME.state='travel'; GAME.eventChoice = null; render(); });
    return;
  }

  if(GAME.state === 'gameover'){
    main.appendChild(el('div',{class:'card'}, html(`<span class="danger">Game Over</span>`)));
    main.appendChild(el('div',{class:'card'}, html(`You lasted ${GAME.day} days.`)));
    main.appendChild(el('div',{class:'choices'}, ''));
    setSoftkeys('','3:Reset', null, ()=>{ resetGame(); clearSave(); render(); });
    return;
  }

  if(GAME.state === 'win'){
    main.appendChild(el('div',{class:'card'}, html(`<strong>You reached Oregon!</strong>`)));
    main.appendChild(el('div',{class:'card'}, html(`Days: ${GAME.day} Food left: ${GAME.food}`)));
    setSoftkeys('','3:Restart', null, ()=>{ resetGame(); clearSave(); render(); });
    return;
  }
}

function statusCard(){
  return el('div',{class:'card status'}, html(`Food: ${GAME.food} | Party: ${GAME.party} | Health: ${GAME.health}`));
}

function el(tag, attrs, content){
  const d = document.createElement(tag);
  if(attrs){
    Object.keys(attrs).forEach(k=>d.setAttribute(k, attrs[k]));
  }
  if(typeof content === 'string') d.innerHTML = content;
  else if(content instanceof Node) d.appendChild(content);
  return d;
}

function html(str){return str}

function choice(n, text){
  const c = el('button',{class:'choice','data-choice':n}, html(`<b>${n}</b> ${text}`));
  c.addEventListener('click', ()=>{ playSound('click'); onChoice(n); });
  return c;
}

function onChoice(n){
  if(GAME.state === 'start'){
    if(n===1){ /* start or continue */
      if(loadGame() && GAME.state !== 'start'){
        // loaded into GAME from save, continue
      } else {
        // fresh start
        GAME.milesLeft = 2040; GAME.food = 200; GAME.party = 4; GAME.health = 100; GAME.day = 1;
      }
      GAME.state='travel'; saveGame(); render();
    }
    if(n===2){ GAME.state='event'; GAME.message='Use 1,2,3 keys to pick options. Travel consumes food and moves you toward Oregon.'; render(); }
    if(n===3){
      // if manage slots option
      GAME.state = 'slots'; render();
    }
    return;
  }

  if(GAME.state === 'travel'){
    if(n===1) doTravel();
    if(n===2) doHunt();
    if(n===3) doRest();
    saveGame();
    return;
  }

  if(GAME.state === 'event'){
    // if there is a choice attached to this event, handle options
    if(GAME.eventChoice){
      if(n === 1 && GAME.eventChoice.opt1 && typeof GAME.eventChoice.opt1.exec === 'function'){
        GAME.eventChoice.opt1.exec();
      }
      if(n === 2 && GAME.eventChoice.opt2 && typeof GAME.eventChoice.opt2.exec === 'function'){
        GAME.eventChoice.opt2.exec();
      }
      GAME.eventChoice = null;
      checkProgress();
      return;
    }
    GAME.state = 'travel'; render(); return;
  }

  if(GAME.state === 'gameover' || GAME.state === 'win'){
    resetGame(); clearSave(); render(); return;
  }
}

function doTravel(){
  const miles = rand(20,60);
  GAME.milesLeft = Math.max(0, GAME.milesLeft - miles);
  const foodUsed = rand(8,18);
  GAME.food = Math.max(0, GAME.food - foodUsed);
  GAME.day += rand(3,7);
  // random event with more varied outcomes
  if(Math.random() < 0.35) triggerRandomEvent();
  else if(Math.random() < 0.15){
    // found a landmark, small bonus
    const bonus = rand(5,20); GAME.food += bonus; GAME.message = `You passed a trading post and gained ${bonus} food.`; GAME.state='event'; playSound('event'); render(); return;
  } else checkProgress();
}

function doHunt(){
  const gain = rand(10,60);
  const risk = Math.random();
  GAME.food += gain;
  GAME.day += rand(1,3);
  if(risk < 0.15){
    GAME.health -= rand(10,30);
    GAME.message = `Hunt went wrong. You gained ${gain} food but someone was injured.`;
    GAME.state = 'event'; playSound('event'); render(); return;
  }
  GAME.message = `You hunted and gained ${gain} food.`;
  GAME.state = 'event'; playSound('event'); render();
}

function doRest(){
  GAME.day += rand(1,2);
  GAME.health = Math.min(100, GAME.health + rand(5,15));
  GAME.message = 'You rested and recovered some health.';
  GAME.state = 'event'; playSound('event'); render();
}

function triggerRandomEvent(){
  const r = Math.random();
  // allow custom events from secret profile to be used
  const custom = GAME.customEvents && GAME.customEvents.length ? GAME.customEvents : (loadCustomProfile() && loadCustomProfile().events ? loadCustomProfile().events : null);
  if(custom && Math.random() < 0.25){
    // pick custom event
    const ev = custom[rand(0, custom.length-1)];
    if(ev){
      GAME.message = ev.message || 'A custom event occurred.';
      if(ev.choice){
        GAME.eventChoice = {
          opt1: { label: ev.choice.opt1.label || 'Option 1', exec: function(){ applyEffects(ev.choice.opt1.effects); GAME.message = ev.choice.opt1.result || 'You chose option 1'; } },
          opt2: { label: ev.choice.opt2.label || 'Option 2', exec: function(){ applyEffects(ev.choice.opt2.effects); GAME.message = ev.choice.opt2.result || 'You chose option 2'; } }
        };
      } else {
        applyEffects(ev.effects);
      }
      GAME.state = 'event'; playSound('event'); render(); return;
    }
  }
  if(r<0.25){
    const lost = rand(10,50); GAME.food = Math.max(0, GAME.food - lost);
    GAME.message = `Supplies spoiled. Lost ${lost} food.`;
  } else if(r<0.45){
    const inj = rand(5,30); GAME.health = Math.max(0, GAME.health - inj);
    GAME.message = `One of your party fell ill. Health down ${inj}.`;
  } else if(r<0.6){
    const help = rand(10,40); GAME.food += help;
    GAME.message = `You met friendly travelers and got ${help} food.`;
  } else if(r<0.8){
    // river crossing decision: make this a choice event
    GAME.message = `You come to a fast river. How do you want to cross?`;
    GAME.eventChoice = {
      opt1: { label: 'Ford the river', exec: function(){ const loss = rand(10,40); GAME.food = Math.max(0, GAME.food - loss); GAME.health = Math.max(0, GAME.health - rand(0,15)); GAME.message = `You forded the river and lost ${loss} food.`; } },
      opt2: { label: 'Find ferry', exec: function(){ const delay = rand(1,3); GAME.day += delay; const cost = rand(5,20); GAME.food = Math.max(0, GAME.food - cost); GAME.message = `You waited and paid ${cost} food for a ferry, lost ${delay} days.`; } }
    };
  } else {
    // good luck
    const bonus = rand(15,45); GAME.food += bonus; GAME.message = `Good day on the trail. You gained ${bonus} food.`;
  }
  GAME.state = 'event'; playSound('event'); render();
}

function checkProgress(){
  if(GAME.food <= 0){ GAME.state='gameover'; render(); return; }
  if(GAME.health <= 0){ GAME.state='gameover'; render(); return; }
  if(GAME.milesLeft <= 0){ GAME.state='win'; render(); return; }
  // continue traveling
  saveGame();
  render();
}

// apply an effects object to GAME
function applyEffects(effects){
  if(!effects) return;
  if(typeof effects.food === 'number') GAME.food = Math.max(0, GAME.food + effects.food);
  if(typeof effects.health === 'number') GAME.health = Math.max(0, GAME.health + effects.health);
  if(typeof effects.miles === 'number') GAME.milesLeft = Math.max(0, GAME.milesLeft + effects.miles);
  if(typeof effects.day === 'number') GAME.day = Math.max(0, GAME.day + effects.day);
}

// simple melody player for richer music simulation
function playMelody(){
  try{
    ensureAudio();
    const now = audioCtx.currentTime;
    const notes = [440, 494, 523, 587, 659];
    notes.forEach((n,i)=>{
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.frequency.value = n; o.connect(g); g.connect(audioCtx.destination); g.gain.value = 0.02;
      o.start(now + i*0.15); o.stop(now + i*0.15 + 0.12);
    });
  }catch(e){}
}

function resetGame(){
  GAME.state='start'; GAME.day=0; GAME.milesLeft=2040; GAME.food=200; GAME.party=4; GAME.health=100; GAME.message='';
}

// render secret menu for custom game creation
function renderSecretMenu(){
  main.innerHTML = '';
  const title = el('div',{class:'card'}, html('Secret Game Builder'));
  const form = el('div',{class:'card'}, '');
  const inputs = [
    {k:'milesLeft', label:'Miles to Oregon', value: GAME.milesLeft},
    {k:'food', label:'Starting food', value: GAME.food},
    {k:'party', label:'Party size', value: GAME.party},
    {k:'health', label:'Health', value: GAME.health}
  ];
  inputs.forEach(i=>{
    const row = el('div',{}, '');
    const label = el('div',{}, html(i.label));
    const input = document.createElement('input');
    input.type = 'number'; input.value = i.value; input.id = `secret_${i.k}`;
    row.appendChild(label); row.appendChild(input); form.appendChild(row);
  });
  const saveBtn = el('button',{}, html('Save profile'));
  const startBtn = el('button',{}, html('Start custom'));
  const loadBtn = el('button',{}, html('Load saved profile'));
  saveBtn.addEventListener('click', ()=>{
    const profile = {};
    inputs.forEach(i=>{ profile[i.k] = parseInt(document.getElementById(`secret_${i.k}`).value,10) || i.value; });
    saveCustomProfile(profile);
    alert('Profile saved');
  });
  loadBtn.addEventListener('click', ()=>{
    const p = loadCustomProfile(); if(!p) { alert('No saved profile'); return; }
    inputs.forEach(i=>{ document.getElementById(`secret_${i.k}`).value = p[i.k]; });
  });
  startBtn.addEventListener('click', ()=>{
    const profile = {};
    inputs.forEach(i=>{ profile[i.k] = parseInt(document.getElementById(`secret_${i.k}`).value,10) || i.value; });
    GAME.milesLeft = profile.milesLeft; GAME.food = profile.food; GAME.party = profile.party; GAME.health = profile.health; GAME.day = 1; GAME.state='travel'; saveGame(); render();
  });
  form.appendChild(saveBtn); form.appendChild(loadBtn); form.appendChild(startBtn);
  main.appendChild(title); main.appendChild(form);
  setSoftkeys('','3:Back', null, ()=>{ GAME.state='start'; render(); });
}

// keypad handling
// secret sequence detection
const SECRET_SEQUENCE = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','5','3','4'];
let keyBuffer = [];
window.addEventListener('keydown', (e)=>{
  const k = e.key;
  // maintain buffer
  keyBuffer.push(k);
  if(keyBuffer.length > SECRET_SEQUENCE.length) keyBuffer.shift();
  if(keyBuffer.length === SECRET_SEQUENCE.length && keyBuffer.join(',') === SECRET_SEQUENCE.join(',')){
    // unlock secret menu
    GAME.state = 'secret';
    GAME.eventChoice = null;
    playSound('event');
    // show brief unlock animation overlay
    const overlay = document.createElement('div'); overlay.className = 'secret-unlock';
    overlay.innerHTML = '<img src="/assets/sprite.svg" alt="secret" style="height:48px;vertical-align:middle;margin-right:6px"/> Secret menu unlocked';
    document.body.appendChild(overlay);
    setTimeout(()=>{ document.body.removeChild(overlay); renderSecretMenu(); }, 700);
    keyBuffer = [];
    return;
  }

  if(k === '1' || k === '2' || k === '3'){
    onChoice(parseInt(k,10));
    e.preventDefault();
  }
  if(k === 'SoftLeft' || k === '1'){
    if(typeof leftAction === 'function') { playSound('click'); leftAction(); }
  }
  if(k === 'SoftRight' || k === '3'){
    if(typeof rightAction === 'function') { playSound('click'); rightAction(); }
  }
});

// softkey click handlers for browsers
leftSoft.addEventListener('click', ()=>{ if(typeof leftAction === 'function'){ playSound('click'); leftAction(); } });
rightSoft.addEventListener('click', ()=>{ if(typeof rightAction === 'function'){ playSound('click'); rightAction(); } });

// initial render
resetGame();
render();

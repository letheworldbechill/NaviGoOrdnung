(() => {
  // ---------- Storage helpers (namespaced) ----------
  const NS = 'navigo';
  const k = (s) => `${NS}:${s}`;
  const getJSON = (key, fallback) => {
    try { const v = localStorage.getItem(k(key)); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const setJSON = (key, val) => localStorage.setItem(k(key), JSON.stringify(val));

  // ---------- State ----------
  let ROWS = parseInt(localStorage.getItem(k('rows'))) || 20;
  let COLS = parseInt(localStorage.getItem(k('cols'))) || 20;

  // layout[r][c] = true => aktiv; false => inaktiv
  let layout = getJSON('layout', Array.from({length: ROWS}, () => Array(COLS).fill(true)));
  // states[r][c] = true => clean; false => dirty
  let states = getJSON('states', Array.from({length: ROWS}, () => Array(COLS).fill(false)));

  // Normalize dimensions if persisted arrays differ
  function resize2D(arr, r, c, fill=false){
    const out = Array.from({length:r}, (_, i) =>
      Array.from({length:c}, (_, j) => (arr[i]?.[j] ?? fill))
    );
    return out;
  }
  function normalize(){
    layout = resize2D(layout, ROWS, COLS, true);
    states = resize2D(states, ROWS, COLS, false);
  }
  normalize();

  // ---------- Elements ----------
  const grid = document.getElementById('grid');
  const modal = document.getElementById('modal');
  const settingsBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('close-btn');
  const rowsInput = document.getElementById('rows');
  const colsInput = document.getElementById('cols');
  const applySizeBtn = document.getElementById('apply-size');
  const settingsGrid = document.getElementById('settings-grid');
  const saveBtn = document.getElementById('save');
  const exportBtn = document.getElementById('export');
  const importBtn = document.getElementById('import-btn');
  const importInput = document.getElementById('import');
  const resetNowBtn = document.getElementById('reset-now');

  // ---------- Rendering ----------
  function renderMain(){
    grid.style.gridTemplateColumns = `repeat(${COLS}, var(--cell))`;
    grid.style.gridTemplateRows = `repeat(${ROWS}, var(--cell))`;
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();

    for(let r=0; r<ROWS; r++){
      for(let c=0; c<COLS; c++){
        const div = document.createElement('div');
        div.className = 'cell';
        div.dataset.r = r; div.dataset.c = c;
        if (layout[r][c]) {
          div.classList.add('active');
          if (states[r][c]) div.classList.add('clean');
          div.setAttribute('role','gridcell');
          div.setAttribute('aria-label', `Zelle ${r+1},${c+1} (${states[r][c]?'sauber':'schmutzig'})`);
          div.tabIndex = 0;
        } else {
          div.classList.add('inactive');
          div.setAttribute('aria-hidden','true');
        }
        frag.appendChild(div);
      }
    }
    grid.appendChild(frag);
  }

  function renderSettings(){
    rowsInput.value = ROWS; colsInput.value = COLS;
    settingsGrid.style.gridTemplateColumns = `repeat(${COLS}, var(--cell-settings))`;
    settingsGrid.style.gridTemplateRows = `repeat(${ROWS}, var(--cell-settings))`;
    settingsGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    for(let r=0; r<ROWS; r++){
      for(let c=0; c<COLS; c++){
        const d = document.createElement('div');
        d.className = 's-cell' + (layout[r][c] ? ' active' : '');
        d.dataset.r = r; d.dataset.c = c;
        frag.appendChild(d);
      }
    }
    settingsGrid.appendChild(frag);
  }

  // ---------- Event delegation (perf) ----------
  grid.addEventListener('click', (e) => {
    const t = e.target;
    if (!t.classList.contains('cell') || !t.classList.contains('active')) return;
    const r = +t.dataset.r, c = +t.dataset.c;
    states[r][c] = !states[r][c];
    t.classList.toggle('clean', states[r][c]);
    persistStates();
  });
  grid.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      const t = e.target;
      if (t.classList?.contains('cell') && t.classList.contains('active')) {
        e.preventDefault();
        t.click();
      }
    }
  });

  settingsGrid.addEventListener('click', (e) => {
    const t = e.target;
    if (!t.classList.contains('s-cell')) return;
    const r = +t.dataset.r, c = +t.dataset.c;
    layout[r][c] = !layout[r][c];
    t.classList.toggle('active', layout[r][c]);
  });

  // ---------- Modal (focus trap + ESC) ----------
  let lastFocus = null;
  function openModal(){
    lastFocus = document.activeElement;
    modal.setAttribute('open','');
    modal.ariaHidden = 'false';
    renderSettings();
    // Focus first control
    setTimeout(()=> rowsInput.focus(), 0);
    document.addEventListener('keydown', escClose);
    document.addEventListener('keydown', trapTab);
  }
  function closeModal(){
    modal.removeAttribute('open');
    modal.ariaHidden = 'true';
    document.removeEventListener('keydown', escClose);
    document.removeEventListener('keydown', trapTab);
    lastFocus?.focus();
  }
  function escClose(e){ if (e.key === 'Escape') closeModal(); }
  function trapTab(e){
    if (e.key !== 'Tab') return;
    const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  settingsBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // ---------- Controls ----------
  applySizeBtn.addEventListener('click', () => {
    const nr = clamp(+rowsInput.value, 1, 50);
    const nc = clamp(+colsInput.value, 1, 50);
    if (nr === ROWS && nc === COLS) return;
    ROWS = nr; COLS = nc;
    layout = resize2D(layout, ROWS, COLS, true);
    states = resize2D(states, ROWS, COLS, false);
    persistGridMeta();
    renderSettings();
    renderMain();
  });

  saveBtn.addEventListener('click', () => {
    persistAll();
    closeModal();
  });

  resetNowBtn.addEventListener('click', () => {
    resetCells();
  });

  exportBtn.addEventListener('click', () => {
    const payload = {
      rows: ROWS, cols: COLS,
      layout, states,
      version: 1, exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href:url, download:'navigo-settings.json' });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0]; if (!file) return;
    const text = await file.text();
    try{
      const data = JSON.parse(text);
      if (!Array.isArray(data.layout) || !Array.isArray(data.states)) throw new Error('Ungültiges Format');
      ROWS = data.rows|0 || data.layout.length;
      COLS = data.cols|0 || data.layout[0].length;
      layout = resize2D(data.layout, ROWS, COLS, true);
      states = resize2D(data.states, ROWS, COLS, false);
      persistAll();
      normalize();
      renderSettings();
      renderMain();
      closeModal();
    }catch(err){
      alert('Konnte nicht importieren: ' + err.message);
    } finally { importInput.value = ''; }
  });

  // ---------- Persistence ----------
  function persistGridMeta(){
    localStorage.setItem(k('rows'), ROWS);
    localStorage.setItem(k('cols'), COLS);
  }
  function persistStates(){ setJSON('states', states); }
  function persistLayout(){ setJSON('layout', layout); }
  function persistAll(){ persistGridMeta(); persistLayout(); persistStates(); }

  // ---------- Daily reset at 02:00 ----------
  function scheduleDailyReset(){
    const now = new Date();
    const reset = new Date();
    reset.setHours(2,0,0,0);
    if (now > reset) reset.setDate(reset.getDate()+1);
    const ms = reset - now;
    setTimeout(() => { resetCells(); scheduleDailyReset(); }, ms);
  }
  function resetCells(){
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        if (layout[r][c]) states[r][c] = false; // dirty
      }
    }
    persistStates();
    // Update UI ohne komplettes Re-Render
    grid.querySelectorAll('.cell.active').forEach((el) => el.classList.remove('clean'));
  }

  // ---------- Utils ----------
  const clamp = (n,min,max) => Math.min(max, Math.max(min, isNaN(n)?min:n));

  // ---------- Init ----------
  function init(){
    renderMain();
    scheduleDailyReset();
  }
  init();
})();

// ─── Coda rapportini ───
let coda = [];

// ─── Allegati ───
const allegati = { ricambi: [], impianti: [] };

function addFiles(tipo, input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      allegati[tipo].push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result // base64 data URI
      });
      renderAllegati(tipo);
    };
    reader.readAsDataURL(file);
  });
  input.value = ''; // reset per poter ri-selezionare lo stesso file
}

function removeFile(tipo, idx) {
  allegati[tipo].splice(idx, 1);
  renderAllegati(tipo);
}

function renderAllegati(tipo) {
  const grid = document.getElementById('grid-' + tipo);
  const countEl = document.getElementById('count-' + tipo);
  const arr = allegati[tipo];

  if (!arr.length) {
    grid.innerHTML = '';
    countEl.textContent = '';
    return;
  }

  countEl.textContent = arr.length + ' allegat' + (arr.length === 1 ? 'o' : 'i');

  grid.innerHTML = arr.map((f, i) => {
    const isImage = f.type && f.type.startsWith('image/');
    const inner = isImage
      ? '<img src="' + f.data + '" alt="' + f.name + '">'
      : '<div style="display:flex;flex-direction:column;align-items:center;padding:6px"><div class="file-icon">📄</div><div class="file-name">' + f.name + '</div></div>';
    return '<div class="attach-thumb">' + inner + '<button class="attach-remove" onclick="removeFile(\'' + tipo + '\',' + i + ')" title="Rimuovi">✕</button></div>';
  }).join('');
}

function resetAllegati() {
  allegati.ricambi = [];
  allegati.impianti = [];
  renderAllegati('ricambi');
  renderAllegati('impianti');
}

function toast(msg, ok=true) {
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t = document.createElement('div');
  t.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err');
  t.textContent = msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(), 4000);
}

function fmtDate(d) { return d ? new Date(d+'T00:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}) : ''; }

function populateSelect(sel, items, placeholder) {
  sel.innerHTML = '<option value="">' + placeholder + '</option>';
  items.forEach(i => { const o = document.createElement('option'); o.value = i; o.textContent = i; sel.appendChild(o); });
}

function generateId() {
  return 'RAP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
}

function loadStorico() { try { return JSON.parse(localStorage.getItem('rapportini_op_test') || '[]'); } catch { return []; } }
function saveStorico(a) { try { localStorage.setItem('rapportini_op_test', JSON.stringify(a)); } catch {} }

function renderCoda() {
  const list = document.getElementById('queueList');
  const count = document.getElementById('queueCount');
  const actions = document.getElementById('queueActions');
  count.textContent = coda.length;

  if (!coda.length) {
    list.innerHTML = '<div class="queue-empty">Nessun rapportino in coda. Compila il form e clicca "Aggiungi".</div>';
    actions.hidden = true;
    return;
  }

  actions.hidden = false;
  list.innerHTML = coda.map((r, i) => `
    <div class="queue-item">
      <div class="queue-info">
        <div class="qi-title">${r.unita} — ${r.impianto}</div>
        <div class="qi-detail">${r.statoLavoro} · ${r.oreLavorate}h · ${r.responsabileNome}</div>
        <div class="qi-id">${r.id}</div>
        ${(r.allegatiRicambi && r.allegatiRicambi.length) || (r.allegatiImpianti && r.allegatiImpianti.length) ? '<div class="queue-attach-info">' + (r.allegatiRicambi && r.allegatiRicambi.length ? '<span>📷 Ricambi: ' + r.allegatiRicambi.length + '</span>' : '') + (r.allegatiImpianti && r.allegatiImpianti.length ? '<span>📷 Impianti: ' + r.allegatiImpianti.length + '</span>' : '') + '</div>' : ''}
      </div>
      <button class="btn-remove" onclick="rimuoviDaCoda(${i})" title="Rimuovi">✕</button>
    </div>`).join('');
}

function rimuoviDaCoda(idx) {
  coda.splice(idx, 1);
  renderCoda();
  toast('Rapportino rimosso dalla coda');
}

function svuotaCoda() {
  coda = [];
  renderCoda();
  toast('Coda svuotata');
}

// Aggiungi rapportino alla coda
document.getElementById('rapForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const sel = document.getElementById('responsabile');
  const respNome = sel.options[sel.selectedIndex].dataset.nome || '';

  const rap = {
    id: generateId(),
    operatore: document.getElementById('operatore').value.trim(),
    data: document.getElementById('data').value,
    unita: document.getElementById('unita').value,
    impianto: document.getElementById('impianto').value,
    statoLavoro: document.getElementById('statoLavoro').value,
    oreLavorate: document.getElementById('oreLavorate').value,
    descrizione: document.getElementById('descrizione').value.trim(),
    materialiUsati: document.getElementById('materialiUsati').value.trim(),
    note: document.getElementById('note').value.trim(),
    approvato: false,
    approvatoDa: '',
    dataApprovazione: '',
    responsabileNome: respNome,
    emailResponsabile: sel.value,
    dataInvio: new Date().toISOString(),
    allegatiRicambi: allegati.ricambi.map(a => ({name:a.name, type:a.type, size:a.size, data:a.data})),
    allegatiImpianti: allegati.impianti.map(a => ({name:a.name, type:a.type, size:a.size, data:a.data}))
  };

  coda.push(rap);
  renderCoda();
  toast('Rapportino aggiunto alla coda (' + coda.length + ')');

  // Reset solo campi lavoro, mantieni operatore/data/responsabile
  const keepOp = document.getElementById('operatore').value;
  const keepData = document.getElementById('data').value;
  const keepResp = document.getElementById('responsabile').value;

  document.getElementById('unita').value = '';
  document.getElementById('impianto').value = '';
  document.getElementById('statoLavoro').value = '';
  document.getElementById('oreLavorate').value = '';
  document.getElementById('descrizione').value = '';
  document.getElementById('materialiUsati').value = '';
  document.getElementById('note').value = '';

  document.getElementById('operatore').value = keepOp;
  document.getElementById('data').value = keepData;
  document.getElementById('responsabile').value = keepResp;
  resetAllegati();

  document.getElementById('queueCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Scarica file .json e apri email
function scaricaEInviaFallback(jsonData, filename, operatore, dataFmt, count) {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const subject = encodeURIComponent('Rapportini "' + operatore + '" del "' + dataFmt + '" (' + count + ' rapportin' + (count === 1 ? 'o' : 'i') + ')');
  const body = encodeURIComponent('In allegato quanto in oggetto.\n\n⚠️ RICORDA: allega il file .json scaricato a questa email prima di inviarla.');
  setTimeout(() => {
    window.location.href = 'mailto:' + TEST_EMAIL + '?subject=' + subject + '&body=' + body;
  }, 600);
  toast(count + ' rapportin' + (count === 1 ? 'o' : 'i') + ' — file scaricato, allegalo alla mail!');
}

function inviaRapportini() {
  if (!coda.length) return;

  const operatore = coda[0].operatore;
  const dataRap = coda[0].data;
  const dataFmt = fmtDate(dataRap);

  // Genera file JSON
  const jsonData = JSON.stringify(coda, null, 2);
  const count = coda.length;
  const filename = 'Rapportini_' + operatore.replace(/\s+/g, '_') + '_' + dataFmt.replace(/\//g, '.') + '.json';
  const file = new File([jsonData], filename, { type: 'application/json' });

  // Raccogli tutti gli allegati come File separati per Web Share
  const allFiles = [file];
  coda.forEach((r, ri) => {
    (r.allegatiRicambi || []).forEach((a, ai) => {
      try {
        const byteStr = atob(a.data.split(',')[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let j = 0; j < byteStr.length; j++) arr[j] = byteStr.charCodeAt(j);
        allFiles.push(new File([arr], 'R' + (ri+1) + '_ricambi_' + (ai+1) + '_' + a.name, { type: a.type || 'application/octet-stream' }));
      } catch(e) {}
    });
    (r.allegatiImpianti || []).forEach((a, ai) => {
      try {
        const byteStr = atob(a.data.split(',')[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let j = 0; j < byteStr.length; j++) arr[j] = byteStr.charCodeAt(j);
        allFiles.push(new File([arr], 'R' + (ri+1) + '_impianti_' + (ai+1) + '_' + a.name, { type: a.type || 'application/octet-stream' }));
      } catch(e) {}
    });
  });

  // Salva nello storico e svuota coda
  const storico = loadStorico();
  coda.forEach(r => storico.unshift(r));
  saveStorico(storico);
  coda = [];
  renderCoda();
  renderStorico();

  // Web Share API (Android con HTTPS) — allega il file direttamente
  if (window.isSecureContext && navigator.canShare && navigator.canShare({ files: allFiles })) {
    navigator.share({
      title: 'Rapportini ' + operatore + ' del ' + dataFmt,
      text: 'In allegato ' + count + ' rapportin' + (count === 1 ? 'o' : 'i') + ' tecnic' + (count === 1 ? 'o' : 'i') + (allFiles.length > 1 ? ' + ' + (allFiles.length - 1) + ' allegat' + (allFiles.length - 1 === 1 ? 'o' : 'i') : '') + '.\n\nDestinatario: ' + TEST_EMAIL,
      files: allFiles
    }).then(() => {
      toast(count + ' rapportin' + (count === 1 ? 'o' : 'i') + ' inviati!');
    }).catch(() => {
      // Se l'utente annulla o fallisce, fallback a download + mailto
      scaricaEInviaFallback(jsonData, filename, operatore, dataFmt, count);
    });
  } else {
    // Fallback: scarica file + apri mailto
    scaricaEInviaFallback(jsonData, filename, operatore, dataFmt, count);
  }
}

function renderStorico() {
  const all = loadStorico();
  const c = document.getElementById('storico');
  if (!all.length) { c.innerHTML = '<div class="empty">Nessun rapportino inviato ancora.</div>'; return; }
  c.innerHTML = all.map(r => `
    <div class="storico-item">
      <div>
        <div class="storico-info"><strong>${r.unita}</strong> — ${r.impianto}</div>
        <div class="storico-id">${r.id} · ${fmtDate(r.data)} · ${r.responsabileNome}</div>
      </div>
      <span class="storico-badge">Inviato</span>
    </div>`).join('');
}

// Init
populateSelect(document.getElementById('unita'), UNITA, 'Seleziona unità...');
populateSelect(document.getElementById('impianto'), IMPIANTI, 'Seleziona impianto...');
document.getElementById('data').value = new Date().toISOString().split('T')[0];
renderCoda();
renderStorico();

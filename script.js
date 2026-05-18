

const GITHUB_USER   = 'jailsonrbneto-droid';
const GITHUB_REPO   = 'Hv';
const GITHUB_BRANCH = 'main';
const ADMIN_PASSWORD = '2103';

const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/images/`;
const API_CONTENTS = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

// Token guardado na sessão (nunca vai para o código público)
let _ghToken = sessionStorage.getItem('gh_token') || '';

/* ── Categorias ────────────────────────────────────────────── */
function catLabel(cat) {
  return { banho: 'Casa de Banho', cozinha: 'Cozinha', sala: 'Sala', exterior: 'Exterior', outros: 'Outros' }[cat] || 'Outros';
}

/* ── Carrega projetos do GitHub ────────────────────────────── */
async function loadProjects() {
  const grid = document.getElementById('pgrid');
  try {
    const res = await fetch(`${API_CONTENTS}/images`);
    if (!res.ok) throw new Error('GitHub API error');
    const files = await res.json();

    // Carrega config de projetos se existir
    let config = {};
    try {
      const cfgRes = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/projetos.json`);
      if (cfgRes.ok) {
        const cfgContent = await cfgRes.json();
        cfgContent.forEach(p => { config[p.id] = p; });
      }
    } catch(e) {}

    // Filtra imagens
    const imgs = files.filter(f =>
      /\.(jpe?g|png|webp|gif)$/i.test(f.name) &&
      !/logo/i.test(f.name) &&
      !/^proj2/i.test(f.name)
    );

    // Agrupa por prefixo
    const groups = {};
    imgs.forEach(f => {
      const match = f.name.match(/^(projeto\d+)[-_](antes|depois|extra\d*)/i);
      if (!match) return;
      const prefix = match[1].toLowerCase();
      if (!groups[prefix]) groups[prefix] = { antes: null, depois: null, extras: [] };
      const tipo = match[2].toLowerCase();
      if (tipo === 'antes')        groups[prefix].antes = f.name;
      else if (tipo === 'depois')  groups[prefix].depois = f.name;
      else                         groups[prefix].extras.push(f.name);
    });

    // Ordena extras numericamente
    Object.values(groups).forEach(g => {
      g.extras.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });

    // Remove cards dinâmicos anteriores
    grid.querySelectorAll('.proj-card[data-dynamic]').forEach(c => c.remove());

    const addCard = document.getElementById('add-card');
    let idx = 100;

    // Ordena projetos numericamente
    const sorted = Object.entries(groups).sort(([a],[b]) => {
      return parseInt(a.replace('projeto','')) - parseInt(b.replace('projeto',''));
    });

    sorted.forEach(([prefix, data]) => {
      if (!data.antes && !data.depois) return;
      const cfg = config[prefix] || {};
      const cat = cfg.categoria || 'outros';
      const card = buildCard(prefix, data, cat, cfg, idx);
      grid.insertBefore(card, addCard);
      initBADrag(idx);
      idx++;
    });

    filterP('todos', document.querySelector('.filter-btn.active'));
    initFU();

  } catch(e) {
    console.warn('Erro ao carregar projetos:', e);
  }
}

/* ── Constrói card ─────────────────────────────────────────── */
function buildCard(prefix, data, cat, cfg, idx) {
  const card = document.createElement('div');
  card.className = 'proj-card';
  card.dataset.cat = cat;
  card.dataset.dynamic = '1';
  card.dataset.prefix = prefix;

  const num   = prefix.replace('projeto','');
  const title = cfg.nome     || `Projeto ${num}`;
  const local = cfg.local    || '';
  const dur   = cfg.duracao  || '';

  const afterSrc  = data.depois ? RAW_BASE + encodeURIComponent(data.depois) : '';
  const beforeSrc = data.antes  ? RAW_BASE + encodeURIComponent(data.antes)  : '';

  card.innerHTML = `
    <div class="proj-head">
      <span class="proj-title">${title}</span>
      <span class="proj-badge">${catLabel(cat)}</span>
    </div>
    <div class="ba-wrap" id="ba${idx}">
      <div class="ba-after-layer">
        ${afterSrc
          ? `<img src="${afterSrc}" class="ba-img-el" alt="Depois" onclick="openLightbox(this.src)">`
          : `<div class="ph-box ph-a"><div class="ph-ico">✨</div><div class="ph-txt">Depois</div></div>`}
      </div>
      <div class="ba-before-layer" id="bbl${idx}" style="width:50%">
        <div class="ba-before-inner">
          ${beforeSrc
            ? `<img src="${beforeSrc}" class="ba-img-el" alt="Antes" onclick="openLightbox(this.src)">`
            : `<div class="ph-box ph-b"><div class="ph-ico">🏗️</div><div class="ph-txt">Antes</div></div>`}
        </div>
      </div>
      <div class="ba-lbl lbl-before">Antes</div>
      <div class="ba-lbl lbl-after">Depois</div>
      <div class="ba-line" id="bal${idx}"></div>
      <div class="ba-knob" id="bak${idx}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M8 12H16M8 12L5 9M8 12L5 15M16 12L19 9M16 12L19 15"/>
        </svg>
      </div>
    </div>
    ${data.extras.length > 0 ? buildCarouselHTML(idx, data.extras) : ''}
    <div class="proj-foot">
      ${dur   ? `<div class="proj-foot-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${dur}</div>` : ''}
      ${local ? `<div class="proj-foot-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${local}</div>` : ''}
    </div>
    <div class="admin-btns">
      <button class="btn-edit-proj" onclick="editProj('${prefix}')">✏ Editar</button>
      <button class="btn-remove-proj" onclick="confirmRemove(this)">✕ Remover</button>
    </div>
  `;
  return card;
}

/* ── Carrossel HTML ────────────────────────────────────────── */
function buildCarouselHTML(idx, extras) {
  const slides = extras.map((f, i) =>
    `<div class="cr-slide${i===0?' active':''}">
      <img src="${RAW_BASE}${encodeURIComponent(f)}" alt="Extra ${i+1}" onclick="openLightbox(this.src)">
    </div>`
  ).join('');
  const dots = extras.map((_, i) =>
    `<div class="cr-dot${i===0?' active':''}" onclick="crGoto(${idx},${i})"></div>`
  ).join('');
  return `
    <div class="cr-wrap" id="cr${idx}">
      <div class="cr-label">Galeria do projeto</div>
      <div class="cr-track">
        ${slides}
        <button class="cr-btn cr-prev" onclick="crStep(${idx},-1)">&#8249;</button>
        <button class="cr-btn cr-next" onclick="crStep(${idx},1)">&#8250;</button>
      </div>
      <div class="cr-dots">${dots}</div>
    </div>`;
}

/* ── Drag slider Antes/Depois ──────────────────────────────── */
function initBADrag(idx) {
  const wrap = document.getElementById(`ba${idx}`);
  const bbl  = document.getElementById(`bbl${idx}`);
  const bal  = document.getElementById(`bal${idx}`);
  const bak  = document.getElementById(`bak${idx}`);
  if (!wrap || !bbl) return;

  function setPos(pct) {
    pct = Math.max(2, Math.min(98, pct));
    bbl.style.width = pct + '%';
    if (bal) bal.style.left = pct + '%';
    if (bak) bak.style.left = pct + '%';
  }
  function onMove(clientX) {
    setPos(((clientX - wrap.getBoundingClientRect().left) / wrap.offsetWidth) * 100);
  }
  wrap.addEventListener('mousedown', e => {
    if (e.target.classList.contains('ba-img-el')) return;
    const mm = e2 => onMove(e2.clientX);
    const mu = () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
    document.addEventListener('mousemove', mm);
    document.addEventListener('mouseup', mu);
    onMove(e.clientX);
  });
  wrap.addEventListener('touchstart', e => {
    const tm = e2 => onMove(e2.touches[0].clientX);
    const te = () => { wrap.removeEventListener('touchmove', tm); wrap.removeEventListener('touchend', te); };
    wrap.addEventListener('touchmove', tm, { passive: true });
    wrap.addEventListener('touchend', te);
    onMove(e.touches[0].clientX);
  }, { passive: true });
}

/* ── Remove cards estáticos vazios do HTML ─────────────────── */
function initStaticBA() {
  document.querySelectorAll('#pgrid .proj-card:not([data-dynamic])').forEach(c => c.remove());
}

/* ── Carrossel controls ────────────────────────────────────── */
function crStep(idx, dir) {
  const cr = document.getElementById(`cr${idx}`);
  if (!cr) return;
  const slides = cr.querySelectorAll('.cr-slide');
  const dots   = cr.querySelectorAll('.cr-dot');
  let cur = [...slides].findIndex(s => s.classList.contains('active'));
  slides[cur].classList.remove('active');
  dots[cur]?.classList.remove('active');
  cur = (cur + dir + slides.length) % slides.length;
  slides[cur].classList.add('active');
  dots[cur]?.classList.add('active');
}
function crGoto(idx, i) {
  const cr = document.getElementById(`cr${idx}`);
  if (!cr) return;
  cr.querySelectorAll('.cr-slide').forEach((s,n) => s.classList.toggle('active', n===i));
  cr.querySelectorAll('.cr-dot').forEach((d,n)   => d.classList.toggle('active', n===i));
}

/* ── Filtro ────────────────────────────────────────────────── */
function filterP(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('#pgrid .proj-card').forEach(c => {
    c.style.display = (cat === 'todos' || c.dataset.cat === cat) ? '' : 'none';
  });
}

/* ── Lightbox ──────────────────────────────────────────────── */
function openLightbox(src) {
  const ov  = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!ov || !img || !src) return;
  img.src = src;
  ov.classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
}

/* ── Modal Admin ───────────────────────────────────────────── */
function openModal() {
  if (!document.body.classList.contains('admin-mode')) {
    const pw = prompt('Senha de administrador:');
    if (pw !== ADMIN_PASSWORD) { alert('Senha incorreta.'); return; }
    document.body.classList.add('admin-mode');
  }
  if (!_ghToken) {
    const t = prompt('Introduz o teu GitHub Token (começa com ghp_):');
    if (!t) return;
    _ghToken = t.trim();
    sessionStorage.setItem('gh_token', _ghToken);
  }
  // Reset form
  _extraFiles = [];
  document.getElementById('extra-thumbs').innerHTML = '';
  document.getElementById('pname').value = '';
  document.getElementById('ploc').value = '';
  document.getElementById('pdur').value = '';
  document.getElementById('pcat').value = 'banho';
  document.getElementById('uz-b').innerHTML = `<input type="file" accept="image/*" onchange="prevImg(this,'b','uz-b')"/><div class="uz-ico">📷</div><div class="uz-lbl">Foto ANTES</div><div class="uz-sub">JPG, PNG, WEBP</div>`;
  document.getElementById('uz-a').innerHTML = `<input type="file" accept="image/*" onchange="prevImg(this,'a','uz-a')"/><div class="uz-ico">✨</div><div class="uz-lbl">Foto DEPOIS</div><div class="uz-sub">JPG, PNG, WEBP</div>`;
  window._beforeFile = null;
  window._afterFile  = null;
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal')?.classList.remove('open');
}

/* ── Preview imagem no modal ───────────────────────────────── */
function prevImg(input, slot, uzId) {
  const file = input.files[0];
  if (!file) return;
  if (slot === 'b') window._beforeFile = file;
  if (slot === 'a') window._afterFile  = file;
  const reader = new FileReader();
  reader.onload = e => {
    const uz = document.getElementById(uzId);
    uz.classList.add('done');
    uz.style.padding = '0';
    uz.style.overflow = 'hidden';
    uz.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;display:block;"/>`;
  };
  reader.readAsDataURL(file);
}

/* ── Fotos extra ───────────────────────────────────────────── */
let _extraFiles = [];
function addExtraImgs(input) {
  const thumbs = document.getElementById('extra-thumbs');
  Array.from(input.files).forEach(file => {
    if (_extraFiles.length >= 7) return;
    const idx = _extraFiles.length;
    _extraFiles.push(file);
    const reader = new FileReader();
    reader.onload = e => {
      const div = document.createElement('div');
      div.className = 'extra-thumb';
      div.innerHTML = `<img src="${e.target.result}"><button class="extra-thumb-rm" onclick="removeExtra(${idx},this)">✕</button>`;
      thumbs.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}
function removeExtra(idx, btn) {
  _extraFiles.splice(idx, 1);
  btn.closest('.extra-thumb').remove();
}

/* ── Upload ficheiro para GitHub ───────────────────────────── */
async function uploadToGitHub(path, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const base64 = e.target.result.split(',')[1];
      let sha = undefined;
      try {
        const check = await fetch(`${API_CONTENTS}/${path}`, {
          headers: { 'Authorization': `token ${_ghToken}` }
        });
        if (check.ok) { const d = await check.json(); sha = d.sha; }
      } catch(e) {}

      const body = { message: `Upload: ${path}`, content: base64, branch: GITHUB_BRANCH };
      if (sha) body.sha = sha;

      const res = await fetch(`${API_CONTENTS}/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${_ghToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (res.ok) resolve();
      else reject(await res.text());
    };
    reader.readAsDataURL(file);
  });
}

/* ── Guarda config do projeto ──────────────────────────────── */
async function saveConfig(prefix, cat, nome, local, duracao) {
  let configs = [];
  let sha = undefined;
  try {
    const res = await fetch(`${API_CONTENTS}/projetos.json`, {
      headers: { 'Authorization': `token ${_ghToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      sha = data.sha;
      configs = JSON.parse(atob(data.content.replace(/\n/g,'')));
    }
  } catch(e) {}

  const existing = configs.findIndex(c => c.id === prefix);
  const entry = { id: prefix, nome, categoria: cat, local, duracao };
  if (existing >= 0) configs[existing] = entry;
  else configs.push(entry);

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(configs, null, 2))));
  const body = { message: 'Atualiza projetos.json', content, branch: GITHUB_BRANCH };
  if (sha) body.sha = sha;

  await fetch(`${API_CONTENTS}/projetos.json`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${_ghToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/* ── Guarda projeto completo ───────────────────────────────── */
async function saveProj() {
  const nome    = document.getElementById('pname').value.trim();
  const local   = document.getElementById('ploc').value.trim();
  const duracao = document.getElementById('pdur').value.trim();
  const cat     = document.getElementById('pcat').value;

  if (!window._beforeFile && !window._afterFile) {
    alert('Adiciona pelo menos uma foto (antes ou depois).');
    return;
  }

  const btn = document.getElementById('mbtn-save');
  btn.textContent = 'A guardar...';
  btn.disabled = true;

  try {
    // Determina próximo número
    const res = await fetch(`${API_CONTENTS}/images`);
    const files = await res.json();
    const nums = files
      .map(f => { const m = f.name.match(/^projeto(\d+)/i); return m ? parseInt(m[1]) : 0; })
      .filter(n => n > 0);
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const prefix = `projeto${nextNum}`;

    if (window._beforeFile) await uploadToGitHub(`images/${prefix}-antes.JPG`, window._beforeFile);
    if (window._afterFile)  await uploadToGitHub(`images/${prefix}-depois.JPG`, window._afterFile);
    for (let i = 0; i < _extraFiles.length; i++) {
      await uploadToGitHub(`images/${prefix}-extra${i+1}.JPG`, _extraFiles[i]);
    }

    await saveConfig(prefix, cat, nome || `Projeto ${nextNum}`, local, duracao);

    btn.textContent = '✅ Guardado!';
    setTimeout(() => {
      closeModal();
      btn.textContent = 'Adicionar ao Site';
      btn.disabled = false;
      alert('Projeto guardado! O site atualiza em 1-2 minutos.');
      loadProjects();
    }, 1500);

  } catch(e) {
    alert('Erro ao guardar. Verifica o token e tenta novamente.\n' + e);
    btn.textContent = 'Adicionar ao Site';
    btn.disabled = false;
  }
}

/* ── Editar / Remover ──────────────────────────────────────── */
function editProj(prefix) {
  alert(`Para editar "${prefix}", substitui as fotos na pasta images/ do GitHub com os mesmos nomes.`);
}
function confirmRemove(btn) {
  if (!confirm('Remover este projeto da vista?')) return;
  btn.closest('.proj-card').remove();
}

/* ── Formulário contacto ───────────────────────────────────── */
function submitForm(e) {
  e.preventDefault();
  const form    = document.getElementById('cform');
  const success = document.getElementById('fsuccess');
  fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  }).then(r => {
    if (r.ok) { form.style.display = 'none'; success.style.display = 'block'; }
    else alert('Erro ao enviar. Tente novamente.');
  }).catch(() => alert('Erro de rede. Tente novamente.'));
}

/* ── Fade-in ao scroll ─────────────────────────────────────── */
function initFU() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fu').forEach(el => obs.observe(el));
}

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initStaticBA();
  loadProjects();
  initFU();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
});

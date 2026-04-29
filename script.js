
  /* =====================================================
     SUPABASE CONFIG
  ===================================================== */
  const SUPA_URL = 'https://zrmotbpzachazbcydudn.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpybW90YnB6YWNoYXpiY3lkdWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDYyMDAsImV4cCI6MjA5MjE4MjIwMH0.F43vpxE3igqbVuzYHHfp5fGUIZfmkMoqgtRpumhALkE';

  async function supaFetch(method, path, body){
    const res = await fetch(SUPA_URL + path, {
      method,
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : ''
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if(!res.ok){ const t=await res.text(); console.error('Supabase error:',t); return null; }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /* =====================================================
     FADE IN
  ===================================================== */
  const obs = new IntersectionObserver(e=>e.forEach(x=>{ if(x.isIntersecting) x.target.classList.add('vis'); }),{threshold:0.08});
  document.querySelectorAll('.fu').forEach(el=>obs.observe(el));

  /* =====================================================
     BA SLIDER
  ===================================================== */
  function initBA(idx){
    const wrap = document.getElementById('ba'+idx);
    const bbl  = document.getElementById('bbl'+idx);
    const line = document.getElementById('bal'+idx);
    const knob = document.getElementById('bak'+idx);
    if(!wrap) return;
    let drag = false;
    function pos(x){
      const r = wrap.getBoundingClientRect();
      let p = Math.min(Math.max((x-r.left)/r.width, 0.02), 0.98);
      bbl.style.width = (p*100)+'%';
      line.style.left = knob.style.left = (p*100)+'%';
    }
    knob.addEventListener('mousedown', e=>{ drag=true; e.preventDefault(); });
    knob.addEventListener('touchstart', ()=>drag=true, {passive:true});
    window.addEventListener('mousemove', e=>{ if(drag) pos(e.clientX); });
    window.addEventListener('touchmove', e=>{ if(drag) pos(e.touches[0].clientX); },{passive:true});
    window.addEventListener('mouseup',  ()=>drag=false);
    window.addEventListener('touchend', ()=>drag=false);
    wrap.addEventListener('click', e=>pos(e.clientX));
  }
  initBA(0); initBA(1);

  /* =====================================================
     ACESSO RESTRITO — SÓ NO MEU APARELHO
  ===================================================== */
  const DEVICE_TOKEN_KEY   = 'hv_device_token';
  const DEVICE_TOKEN_VALUE = 'hv_a7f3k9x2p1q8w5m4';
  const SETUP_PARAM        = 'hvnt21291906';

  (function checkSetup(){
    const params = new URLSearchParams(window.location.search);
    if(params.get('setup') === SETUP_PARAM){
      localStorage.setItem(DEVICE_TOKEN_KEY, DEVICE_TOKEN_VALUE);
      const url = new URL(window.location.href);
      url.searchParams.delete('setup');
      window.history.replaceState({}, '', url.toString());
      alert('Aparelho autorizado com sucesso! O modo admin está disponível neste browser.');
    }
  })();

  function isDeviceAuthorized(){
    return localStorage.getItem(DEVICE_TOKEN_KEY) === DEVICE_TOKEN_VALUE;
  }

  let cliquesLogo = 0;
  const logoHV = document.querySelector('.nav-logo');
  logoHV.addEventListener('click', (e)=>{
    e.preventDefault();
    if(!isDeviceAuthorized()) return;
    cliquesLogo++;
    if(cliquesLogo === 5){
      const acesso = prompt("Área Administrativa. Introduza a senha:");
      if(acesso === "2103"){
        document.body.classList.add('admin-mode');
        alert("Modo Admin Ativo!");
      } else {
        alert("Senha incorreta.");
      }
      cliquesLogo = 0;
    }
    setTimeout(()=>{ cliquesLogo = 0; }, 3000);
  });

  /* =====================================================
     FILTER
  ===================================================== */
  function filterP(cat, btn){
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.proj-card[data-cat]').forEach(c=>{
      c.style.display = (cat==='todos' || c.dataset.cat===cat) ? 'block' : 'none';
    });
  }

  /* =====================================================
     MODAL
  ===================================================== */
  let imgB=null, imgA=null, extraImgs=[];

  function openModal(){ document.getElementById('modal').classList.add('open'); }

  function closeModal(){
    document.getElementById('modal').classList.remove('open');
    imgB=imgA=null; extraImgs=[];
    resetUZ('uz-b','📷','Foto ANTES');
    resetUZ('uz-a','✨','Foto DEPOIS');
    ['pname','ploc','pdur'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('extra-thumbs').innerHTML='';
    document.getElementById('peditid').value='';
    document.getElementById('modal-title').textContent='Adicionar Projeto';
    document.getElementById('modal-sub').textContent='Carregue a foto antes/depois e, se quiser, adicione fotos extra do projeto.';
    document.getElementById('mbtn-save').textContent='Adicionar ao Site';
    const addBtn=document.getElementById('uz-extra-add');
    if(addBtn) addBtn.style.display='';
  }

  function resetUZ(id,ico,lbl){
    const z=document.getElementById(id);
    z.classList.remove('done');
    z.querySelector('.uz-ico').textContent=ico;
    z.querySelector('.uz-lbl').textContent=lbl;
  }

  function prevImg(inp, side, zid){
    const f=inp.files[0]; if(!f) return;
    const z=document.getElementById(zid);
    z.classList.add('done');
    z.querySelector('.uz-ico').textContent='✅';
    z.querySelector('.uz-lbl').textContent=f.name.length>18?f.name.substring(0,18)+'…':f.name;
    const r=new FileReader();
    r.onload=e=>{ if(side==='b') imgB=e.target.result; else imgA=e.target.result; };
    r.readAsDataURL(f);
  }

  function addExtraImgs(inp){
    const files=Array.from(inp.files);
    const thumbsEl=document.getElementById('extra-thumbs');
    files.forEach(f=>{
      if(extraImgs.length>=6) return;
      const r=new FileReader();
      r.onload=e=>{
        extraImgs.push(e.target.result);
        const i=extraImgs.length-1;
        const th=document.createElement('div');
        th.className='extra-thumb'; th.dataset.idx=i;
        th.innerHTML='<img src="'+e.target.result+'" alt="foto extra"/><button class="extra-thumb-rm" onclick="removeExtra('+i+')">✕</button>';
        thumbsEl.appendChild(th);
        if(extraImgs.length>=6){ const a=document.getElementById('uz-extra-add'); if(a) a.style.display='none'; }
      };
      r.readAsDataURL(f);
    });
    inp.value='';
  }

  function removeExtra(idx){
    extraImgs.splice(idx,1);
    const thumbsEl=document.getElementById('extra-thumbs');
    thumbsEl.innerHTML='';
    extraImgs.forEach((src,i)=>{
      const th=document.createElement('div');
      th.className='extra-thumb'; th.dataset.idx=i;
      th.innerHTML='<img src="'+src+'" alt="foto extra"/><button class="extra-thumb-rm" onclick="removeExtra('+i+')">✕</button>';
      thumbsEl.appendChild(th);
    });
    const addBtn=document.getElementById('uz-extra-add');
    if(addBtn) addBtn.style.display='';
  }

  /* =====================================================
     ABRIR MODAL DE EDIÇÃO
  ===================================================== */
  function openEditModal(proj, cardEl){
    // Preencher campos com dados atuais
    document.getElementById('pname').value = proj.name || '';
    document.getElementById('ploc').value  = proj.loc  || '';
    document.getElementById('pdur').value  = proj.dur  || '';
    document.getElementById('pcat').value  = proj.cat  || 'outros';
    document.getElementById('peditid').value = proj.id;

    // Carregar fotos atuais
    imgB = proj.img_before || null;
    imgA = proj.img_after  || null;
    extraImgs = proj.extra_imgs ? JSON.parse(proj.extra_imgs) : [];

    // Mostrar estado das fotos nos botões
    if(imgB){ const z=document.getElementById('uz-b'); z.classList.add('done'); z.querySelector('.uz-ico').textContent='✅'; z.querySelector('.uz-lbl').textContent='Foto carregada'; }
    if(imgA){ const z=document.getElementById('uz-a'); z.classList.add('done'); z.querySelector('.uz-ico').textContent='✅'; z.querySelector('.uz-lbl').textContent='Foto carregada'; }

    // Mostrar miniaturas das fotos extra
    const thumbsEl=document.getElementById('extra-thumbs');
    thumbsEl.innerHTML='';
    extraImgs.forEach((src,i)=>{
      const th=document.createElement('div');
      th.className='extra-thumb'; th.dataset.idx=i;
      th.innerHTML='<img src="'+src+'" alt="foto extra"/><button class="extra-thumb-rm" onclick="removeExtra('+i+')">✕</button>';
      thumbsEl.appendChild(th);
    });
    if(extraImgs.length>=6){ const a=document.getElementById('uz-extra-add'); if(a) a.style.display='none'; }

    // Atualizar título e botão do modal
    document.getElementById('modal-title').textContent = 'Editar Projeto';
    document.getElementById('modal-sub').textContent   = 'Altere os dados ou fotos e clique em Guardar.';
    document.getElementById('mbtn-save').textContent   = 'Guardar Alterações';

    // Guardar referência ao card para atualizar depois
    document.getElementById('modal').dataset.editCard = cardEl ? cardEl.dataset.dbid : '';

    document.getElementById('modal').classList.add('open');
  }

  /* =====================================================
     GUARDAR PROJETO — SUPABASE (ADICIONAR OU EDITAR)
  ===================================================== */
  async function saveProj(){
    const btn = document.getElementById('mbtn-save');
    const editId = document.getElementById('peditid').value;
    btn.textContent = editId ? 'A guardar...' : 'A adicionar...';
    btn.disabled = true;

    const name = document.getElementById('pname').value || 'Novo Projeto';
    const loc  = document.getElementById('ploc').value  || 'Portugal';
    const dur  = document.getElementById('pdur').value  || '—';
    const cat  = document.getElementById('pcat').value;

    const data = {
      name, loc, dur, cat,
      img_before: imgB || null,
      img_after:  imgA || null,
      extra_imgs: JSON.stringify(extraImgs)
    };

    if(editId){
      // EDITAR — PATCH
      const result = await supaFetch('PATCH', '/rest/v1/projetos?id=eq.'+editId, data);
      btn.textContent = 'Guardar Alterações';
      btn.disabled = false;

      // Remover o card antigo e re-renderizar com dados novos
      const oldCard = document.querySelector('.proj-card[data-dbid="'+editId+'"]');
      if(oldCard){
        const placeholder = document.createElement('div');
        oldCard.parentNode.insertBefore(placeholder, oldCard);
        oldCard.remove();
        const updatedProj = Object.assign({ id: parseInt(editId) }, data);
        renderCardAt(updatedProj, placeholder);
        placeholder.remove();
      }
      closeModal();
    } else {
      // ADICIONAR — POST
      const result = await supaFetch('POST', '/rest/v1/projetos', data);
      btn.textContent = 'Adicionar ao Site';
      btn.disabled = false;
      if(!result){ alert('Erro ao guardar. Tente novamente.'); return; }
      const proj = Array.isArray(result) ? result[0] : result;
      renderCard(proj);
      closeModal();
    }
  }

  /* =====================================================
     REMOVER PROJETO — SUPABASE
  ===================================================== */
  async function deleteProj(id, cardEl){
    if(!confirm('Remover este projeto permanentemente?')) return;
    await supaFetch('DELETE', '/rest/v1/projetos?id=eq.'+id, null);
    cardEl.remove();
  }

  /* =====================================================
     RENDERIZAR CARD
  ===================================================== */
  let pc = 100;

  function buildCardHTML(proj, idx){
    const extras = proj.extra_imgs ? JSON.parse(proj.extra_imgs) : [];
    const labels = {sala:'Sala',cozinha:'Cozinha',banho:'Casa de Banho',exterior:'Exterior',outros:'Outros'};

    const bHTML = proj.img_before
      ? '<img class="ba-img-el" src="'+proj.img_before+'" alt="antes"/>'
      : '<div class="ph-box ph-b"><div class="ph-ico">🏗️</div><div class="ph-txt">Antes</div></div>';
    const aHTML = proj.img_after
      ? '<img class="ba-img-el" src="'+proj.img_after+'" alt="depois"/>'
      : '<div class="ph-box ph-a"><div class="ph-ico">✨</div><div class="ph-txt">Depois</div></div>';

    let carouselHTML = '';
    if(extras.length > 0){
      const slidesHTML = extras.map((src,i)=>'<div class="cr-slide'+(i===0?' active':'')+'" data-si="'+i+'"><img src="'+src+'" alt="foto '+(i+1)+'"/></div>').join('');
      const dotsHTML   = extras.length>1 ? '<div class="cr-dots">'+extras.map((_,i)=>'<span class="cr-dot'+(i===0?' active':'')+'" onclick="crGo(\'cr'+idx+'\','+i+')"></span>').join('')+'</div>' : '';
      carouselHTML = '<div class="cr-wrap" id="cr'+idx+'"><div class="cr-label">Galeria de fotos</div><div class="cr-track">'+slidesHTML+'</div>'+(extras.length>1?'<button class="cr-btn cr-prev" onclick="crStep(\'cr'+idx+'\',-1)">&#8249;</button><button class="cr-btn cr-next" onclick="crStep(\'cr'+idx+'\',1)">&#8250;</button>':'')+dotsHTML+'</div>';
    }

    const adminBtns =
      '<div class="admin-btns admin-only">'+
        '<button class="btn-edit-proj" onclick="openEditModal('+JSON.stringify(proj).replace(/"/g,'&quot;')+', this.closest(\'.proj-card\'))">✏️ Editar</button>'+
        '<button class="btn-remove-proj" onclick="deleteProj('+proj.id+', this.closest(\'.proj-card\'))">🗑 Remover</button>'+
      '</div>';

    return '<div class="proj-head"><span class="proj-title">'+proj.name+'</span><span class="proj-badge">'+(labels[proj.cat]||proj.cat)+'</span></div>'+
      '<div class="ba-wrap" id="ba'+idx+'">'+
        '<div class="ba-after-layer">'+aHTML+'</div>'+
        '<div class="ba-before-layer" id="bbl'+idx+'" style="width:50%"><div class="ba-before-inner">'+bHTML+'</div></div>'+
        '<div class="ba-lbl lbl-before">Antes</div><div class="ba-lbl lbl-after">Depois</div>'+
        '<div class="ba-line" id="bal'+idx+'"></div>'+
        '<div class="ba-knob" id="bak'+idx+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 12H16M8 12L5 9M8 12L5 15M16 12L19 9M16 12L19 15"/></svg></div>'+
      '</div>'+
      carouselHTML+
      '<div class="proj-foot">'+
        '<div class="proj-foot-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'+proj.dur+'</div>'+
        '<div class="proj-foot-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'+proj.loc+'</div>'+
      '</div>'+
      adminBtns;
  }

  function renderCard(proj){
    const idx = pc++;
    const card = document.createElement('div');
    card.className = 'proj-card';
    card.dataset.cat = proj.cat;
    card.dataset.dbid = proj.id;
    card.innerHTML = buildCardHTML(proj, idx);
    document.getElementById('pgrid').insertBefore(card, document.getElementById('add-card'));
    initBA(idx);
  }

  function renderCardAt(proj, refEl){
    const idx = pc++;
    const card = document.createElement('div');
    card.className = 'proj-card';
    card.dataset.cat = proj.cat;
    card.dataset.dbid = proj.id;
    card.innerHTML = buildCardHTML(proj, idx);
    refEl.parentNode.insertBefore(card, refEl);
    initBA(idx);
  }

  /* =====================================================
     CARREGAR PROJETOS AO ABRIR O SITE
  ===================================================== */
  async function loadProjects(){
    const data = await supaFetch('GET', '/rest/v1/projetos?select=*&order=id.asc', null);
    if(!data) return;
    data.forEach(proj => renderCard(proj));
  }

  document.addEventListener('DOMContentLoaded', loadProjects);
  document.getElementById('modal').addEventListener('click',function(e){ if(e.target===this) closeModal(); });

  /* =====================================================
     CAROUSEL
  ===================================================== */
  function crGo(crid, toIdx){
    const wrap=document.getElementById(crid); if(!wrap) return;
    wrap.querySelectorAll('.cr-slide').forEach((s,i)=>s.classList.toggle('active',i===toIdx));
    wrap.querySelectorAll('.cr-dot').forEach((d,i)=>d.classList.toggle('active',i===toIdx));
  }
  function crStep(crid, dir){
    const wrap=document.getElementById(crid); if(!wrap) return;
    const slides=wrap.querySelectorAll('.cr-slide');
    let cur=0; slides.forEach((s,i)=>{ if(s.classList.contains('active')) cur=i; });
    crGo(crid,(cur+dir+slides.length)%slides.length);
  }

  /* =====================================================
     LIGHTBOX
  ===================================================== */
  function openLightbox(src){
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    document.getElementById('lightbox').classList.remove('open');
    document.getElementById('lightbox-img').src = '';
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLightbox(); });

  // Delegar cliques nas fotos dos cards para abrir lightbox
  document.addEventListener('click', e=>{
    const img = e.target.closest('.ba-img-el, .cr-slide img');
    if(img && img.src) openLightbox(img.src);
  });

  /* =====================================================
     FORM CONTACTO
  ===================================================== */
  function submitForm(e){
    e.preventDefault();
    const form=e.target;
    const successMsg=document.getElementById('fsuccess');
    fetch(form.action,{
      method:"POST",
      body:new FormData(form),
      headers:{'Accept':'application/json'}
    })
    .then(r=>{ if(r.ok){ form.style.display='none'; successMsg.style.display='block'; } else alert("Houve um erro ao enviar."); })
    .catch(()=>alert("Erro de ligação."));
  }

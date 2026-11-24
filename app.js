'use strict';
/* AturDana v1 — modul: DB, helper, hitung, view, form, aksi */
const $=s=>document.querySelector(s),L=(a,f)=>a.map(f).join('');
const INC=['Gaji','Bonus','Bisnis','Investasi','Hadiah','Pendapatan lainnya'];
const EXP=['Makanan & minuman','Transportasi','Belanja','Tagihan','Pendidikan','Kesehatan','Hiburan','Internet & pulsa','Kebutuhan rumah','Lainnya'];
const WT=['Uang tunai','Rekening bank','E-wallet','Tabungan'],PM=['Tunai','Transfer bank','QRIS','Debit','E-wallet'];
const KEYS=['tx','wallets','budgets','transfers'],COL=['#22c55e','#38bdf8','#a78bfa','#fbbf24','#f87171','#2dd4bf','#fb923c','#e879f9','#94a3b8','#84cc16'];
const S={tx:[],wallets:[],budgets:[],transfers:[]};
/* ---- IndexedDB ---- */
let db;
const openDB=()=>new Promise((ok,no)=>{const r=indexedDB.open('aturdana',1);r.onupgradeneeded=()=>KEYS.forEach(k=>r.result.createObjectStore(k,{keyPath:'id'}));r.onsuccess=()=>{db=r.result;ok()};r.onerror=no});
const all=s=>new Promise(ok=>{const q=db.transaction(s).objectStore(s).getAll();q.onsuccess=()=>ok(q.result)});
const run=(s,f)=>new Promise((ok,no)=>{const t=db.transaction(s,'readwrite');f(t.objectStore(s));t.oncomplete=ok;t.onerror=no});
const put=(s,v)=>run(s,o=>o.put(v)),del=(s,k)=>run(s,o=>o.delete(k)),clr=s=>run(s,o=>o.clear());
async function load(){for(const k of KEYS)S[k]=await all(k);if(!S.wallets.length){const w={id:uid(),name:'Tunai',type:'Uang tunai',initial:0};await put('wallets',w);S.wallets.push(w)}}
/* ---- helper ---- */
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const rp=n=>(n<0?'-':'')+'Rp'+Math.abs(Math.round(n)).toLocaleString('id-ID');
const num=v=>Number(String(v||'').replace(/\D/g,''));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const opts=(a,sel)=>L(a,x=>`<option ${x===sel?'selected':''}>${x}</option>`);
const off=new Date().getTimezoneOffset()*6e4,iso=k=>new Date(Date.now()-k*864e5-off).toISOString();
const today=()=>iso(0).slice(0,10),jam=()=>iso(0).slice(11,16),dAgo=k=>iso(k).slice(0,10);
const toast=(m,w)=>{document.querySelectorAll('.toast').forEach(x=>x.remove());const t=document.createElement('div');t.className='toast'+(w?' w':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3200)};
const dl=(n,txt,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=n;a.click()};
let hide=localStorage.hide==='1',view='home',charts=[],pend=[];
const F={q:'',fc:'',fm:'',sort:'new',rf:today().slice(0,8)+'01',rt:today()};
/* ---- perhitungan ---- */
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0),money=n=>hide?'Rp •••••':rp(n);
const wn=id=>(S.wallets.find(w=>w.id===id)||{name:'-'}).name;
const tot=(m,ty)=>sum(S.tx.filter(t=>t.date.startsWith(m)&&t.type===ty),t=>t.amount);
const bal=w=>w.initial+sum(S.tx.filter(t=>t.wallet===w.id),t=>t.type==='in'?t.amount:-t.amount)+sum(S.transfers.filter(t=>t.to===w.id),t=>t.amount)-sum(S.transfers.filter(t=>t.from===w.id),t=>t.amount);
const prevM=m=>{const[y,n]=m.split('-').map(Number),d=new Date(y,n-2,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const byCat=m=>{const o={};S.tx.filter(t=>t.date.startsWith(m)&&t.type==='out').forEach(t=>o[t.cat]=(o[t.cat]||0)+t.amount);return o};
const rangeTx=()=>S.tx.filter(t=>t.date>=F.rf&&t.date<=F.rt);
const chk=t=>{const b=S.budgets.find(x=>x.id===t.cat);if(!b)return;const p=(byCat(t.date.slice(0,7))[t.cat]||0)/b.limit*100;if(p>=100)toast(`Anggaran ${t.cat} sudah ${p.toFixed(0)}% — batas terlewati`,1);else if(p>=80)toast(`Anggaran ${t.cat} mencapai ${p.toFixed(0)}%`,1)};
/* ---- tampilan ---- */
const cv=n=>getComputedStyle(document.body).getPropertyValue(n).trim();
const IC={'Makanan & minuman':'<path d="M7 3v7a2 2 0 004 0V3M9 10v11M17 3c-2 2-3 5-3 8h3v10"/>',Transportasi:'<path d="M5 16V9l2-4h10l2 4v7M3 16h18M7 19v-3M17 19v-3"/>',Belanja:'<path d="M5 8h14l-1 13H6zM9 8a3 3 0 016 0"/>',Tagihan:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>',Pendidikan:'<path d="M4 5h6a2 2 0 012 2v13a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v13a2 2 0 012-2h6z"/>',Kesehatan:'<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',Hiburan:'<path d="M6 4v16l13-8z"/>','Internet & pulsa':'<path d="M3 9a14 14 0 0118 0M6 12.5a9 9 0 0112 0M9 16a4 4 0 016 0"/>','Kebutuhan rumah':'<path d="M4 11l8-7 8 7v9H4zM10 20v-6h4v6"/>',Gaji:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',Bonus:'<path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.3 2.8 1.1-6.1L3.3 9.4l6.1-.8z"/>',Bisnis:'<path d="M4 8h16v11H4zM9 8V5h6v3"/>',Investasi:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',Hadiah:'<path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/>',t:'<path d="M4 8h14l-3-3M20 16H6l3 3"/>',x:'<path d="M5 12h.01M12 12h.01M19 12h.01"/>'};
const ico=c=>`<svg class="ic" viewBox="0 0 24 24">${IC[c]||IC.x}</svg>`;
let lastBal=0;
const count=el=>{if(!el)return;const to=+el.dataset.n,from=lastBal,t0=performance.now();lastBal=to;if(hide||from===to)return;const s=t=>{const p=Math.min((t-t0)/600,1);el.textContent=rp(from+(to-from)*(1-(1-p)**3));if(p<1)requestAnimationFrame(s)};requestAnimationFrame(s)};
const chart=(id,cfg)=>{const c=$('#'+id);if(c&&window.Chart)charts.push(new Chart(c,cfg))};
const dlabel=d=>d===today()?'Hari ini':d===dAgo(1)?'Kemarin':new Date(d+'T00:00').toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
const txRow=(t,fl)=>`<div class="row" data-act="edit" data-id="${t.id}"><span class="ci ${t.type}">${ico(t.cat)}</span><div><b>${esc(t.cat)}</b><small>${fl?t.date+' ':''}${t.time||''} · ${esc(wn(t.wallet))}${t.note?' · '+esc(t.note):''}</small></div><span class="amt ${t.type}">${t.type==='in'?'+':'−'}${money(t.amount)}</span></div>`;
const ledger=a=>{const g={};a.forEach(t=>(g[t.date]=g[t.date]||[]).push(t));return L(Object.keys(g),d=>`<div class="day"><span>${dlabel(d)}</span><span>${money(sum(g[d],t=>t.type==='in'?t.amount:-t.amount))}</span></div>${L(g[d],t=>txRow(t))}`)};
const bars=d=>({type:'bar',data:{labels:d.l,datasets:[{label:'Masuk',data:d.i,backgroundColor:cv('--in'),borderRadius:2},{label:'Keluar',data:d.o,backgroundColor:cv('--out'),borderRadius:2}]},options:{plugins:{legend:{position:'bottom',labels:{boxWidth:8,boxHeight:8}}},scales:{x:{grid:{display:false}},y:{ticks:{maxTicksLimit:4,callback:v=>v>=1e6?v/1e6+' jt':v>=1e3?v/1e3+' rb':v}}}}});
const catRows=(e,o)=>e.length?L(e,([k,v])=>`<div class="cat">${ico(k)}<div><div class="between"><span>${esc(k)}</span><b>${money(v)}</b></div><div class="bar"><i style="width:${v/o*100}%"></i></div></div></div>`):'<p class="empty">Belum ada pengeluaran.</p>';
const V={};
V.home=()=>{const cm=today().slice(0,7),pm=prevM(cm),i=tot(cm,'in'),o=tot(cm,'out'),pi=tot(pm,'in'),po=tot(pm,'out'),pct=i?o/i*100:0,ec=Object.entries(byCat(cm)).sort((a,b)=>b[1]-a[1]).slice(0,5),bl=S.wallets.reduce((s,w)=>s+bal(w),0);
const cmp=(a,b)=>b?`${a>=b?'naik':'turun'} ${Math.abs((a-b)/b*100).toFixed(0)}% dari bulan lalu`:'bulan lalu belum ada data';
const sm=!i&&!o?'Belum ada transaksi bulan ini. Tekan + untuk mulai mencatat.':o>i?'Pengeluaran melebihi pemasukan bulan ini.':`Kamu menyisihkan ${(100-pct).toFixed(0)}% dari pemasukan bulan ini.`;
const ds=[6,5,4,3,2,1,0].map(dAgo),f=(d,ty)=>sum(S.tx.filter(t=>t.date===d&&t.type===ty),t=>t.amount);
pend.push(()=>{count($('.big'));chart('c1',bars({l:ds.map(d=>d.slice(8)),i:ds.map(d=>f(d,'in')),o:ds.map(d=>f(d,'out'))}))});
const rec=[...S.tx].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,5);
return `<header class="top"><span class="brand">AturDana</span><button class="ghost" data-act="hide">${hide?'Tampilkan saldo':'Sembunyikan saldo'}</button></header>
<section class="bal"><small>Total saldo</small><h1 class="big" data-n="${bl}">${money(bl)}</h1><p>${sm}</p></section>
<section class="duo"><div><small>Pemasukan</small><b class="in">${money(i)}</b><small>${cmp(i,pi)}</small></div><div><small>Pengeluaran</small><b class="out">${money(o)}</b><small>${cmp(o,po)}</small></div></section>
<section class="sec"><div class="hd"><h3>Arus kas 7 hari</h3><span>Selisih bulan ini ${money(i-o)}</span></div><canvas id="c1" height="170"></canvas></section>
<section class="sec"><div class="hd"><h3>Pengeluaran terbesar</h3><span>${pct.toFixed(0)}% dari pemasukan</span></div>${catRows(ec,o)}</section>
<section class="sec"><div class="hd"><h3>Transaksi terbaru</h3><button class="lnk" data-act="nav" data-id="tx">Lihat semua</button></div>${rec.length?L(rec,t=>txRow(t,1)):'<p class="empty">Belum ada transaksi.</p>'}</section>`};
const listHTML=()=>{const a=S.tx.filter(t=>(!F.fm||t.date.startsWith(F.fm))&&(!F.fc||t.cat===F.fc)&&(!F.q||(t.note+' '+t.cat+' '+t.method+' '+wn(t.wallet)).toLowerCase().includes(F.q)));
a.sort(F.sort==='big'?(x,y)=>y.amount-x.amount:F.sort==='old'?(x,y)=>(x.date+x.time).localeCompare(y.date+y.time):(x,y)=>(y.date+y.time).localeCompare(x.date+x.time));
return a.length?(F.sort==='big'?L(a,t=>txRow(t,1)):ledger(a)):'<p class="empty">Tidak ada transaksi yang cocok.</p>'};
V.tx=()=>`<header class="top"><h2>Transaksi</h2><small>${S.tx.length} catatan</small></header><input data-f="q" placeholder="Cari catatan atau kategori" value="${esc(F.q)}"><div class="flt"><select data-f="fc"><option value="">Semua kategori</option>${opts([...INC,...EXP],F.fc)}</select><input type="month" data-f="fm" value="${F.fm}"><select data-f="sort">${L([['new','Terbaru'],['old','Terlama'],['big','Nominal terbesar']],([v,n])=>`<option value="${v}" ${v===F.sort?'selected':''}>${n}</option>`)}</select></div><div id="list">${listHTML()}</div>`;
V.budget=()=>{const u=byCat(today().slice(0,7)),bs=S.budgets,lim=sum(bs,b=>b.limit),us=sum(bs,b=>u[b.id]||0),w=bs.filter(b=>(u[b.id]||0)>=b.limit*.8);
return `<header class="top"><h2>Anggaran</h2><small>${new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'})}</small></header>
<section class="stat"><small>Sisa anggaran bulan ini</small><h1 class="big">${lim?money(lim-us):'—'}</h1><p>${lim?`Terpakai ${money(us)} dari ${money(lim)}`:'Ketuk kategori di bawah untuk menetapkan batas.'}</p></section>
${L(w,b=>{const p=u[b.id]/b.limit*100;return `<div class="alert">${esc(b.id)} sudah ${p.toFixed(0)}% dari anggaran${p>=100?' — batas terlewati':''}</div>`})}
<section class="sec">${L(EXP,c=>{const b=S.budgets.find(x=>x.id===c),s=u[c]||0,p=b?s/b.limit*100:0;return `<div class="cat" data-act="budget" data-id="${esc(c)}">${ico(c)}<div><div class="between"><span>${esc(c)}</span><b>${b?money(Math.max(b.limit-s,0)):'Atur'}</b></div>${b?`<div class="bar"><i class="${p>=100?'bad':p>=80?'warn':''}" style="width:${Math.min(p,100)}%"></i></div><small>${money(s)} dari ${money(b.limit)} · ${p.toFixed(0)}%</small>`:`<small>Terpakai ${money(s)} · belum ada batas</small>`}</div></div>`})}</section>`};
V.report=()=>{const a=rangeTx(),n=(new Date(F.rt)-new Date(F.rf))/864e5,g={},c={};
a.forEach(t=>{const k=n>62?t.date.slice(0,7):t.date;(g[k]=g[k]||[0,0])[t.type==='in'?0:1]+=t.amount;if(t.type==='out')c[t.cat]=(c[t.cat]||0)+t.amount});
const i=sum(a.filter(t=>t.type==='in'),t=>t.amount),o=sum(a.filter(t=>t.type==='out'),t=>t.amount),top=Object.entries(c).sort((x,y)=>y[1]-x[1]).slice(0,5);
pend.push(()=>{const ks=Object.keys(g).sort();chart('c1',bars({l:ks.map(k=>k.slice(n>62?2:5)),i:ks.map(k=>g[k][0]),o:ks.map(k=>g[k][1])}))});
return `<header class="top"><h2>Laporan</h2><small>${a.length} transaksi</small></header><div class="two"><input type="date" data-f="rf" value="${F.rf}"><input type="date" data-f="rt" value="${F.rt}"></div><div class="chips">${L([['1','Hari ini'],['7','7 hari'],['m','Bulan ini'],['y','Tahun ini']],([k,l])=>`<button data-act="preset" data-id="${k}">${l}</button>`)}</div>
<section class="stat"><small>Selisih periode (ditabung)</small><h1 class="big ${i>=o?'in':'out'}">${money(i-o)}</h1><p>${top[0]?'Pengeluaran terbesar: '+esc(top[0][0]):'Belum ada pengeluaran pada periode ini.'}</p></section>
<section class="duo"><div><small>Pemasukan</small><b class="in">${money(i)}</b></div><div><small>Pengeluaran</small><b class="out">${money(o)}</b></div></section>
<section class="sec"><div class="hd"><h3>Arus kas</h3></div><canvas id="c1" height="190"></canvas></section>
<section class="sec"><div class="hd"><h3>Kategori terbesar</h3></div>${catRows(top,o)}</section><button class="btn alt" data-act="export">Ekspor CSV</button>`};
V.profile=()=>{const dark=localStorage.t==='dark';return `<header class="top"><h2>Profil</h2><small>Data tersimpan di perangkat ini</small></header>
<section class="sec"><div class="hd"><h3>Dompet</h3><button class="lnk" data-act="wnew">+ Tambah</button></div>${L(S.wallets,w=>`<div class="row" data-act="wedit" data-id="${w.id}"><span class="ci">${ico('Gaji')}</span><div><b>${esc(w.name)}</b><small>${esc(w.type)}</small></div><span class="amt">${money(bal(w))}</span></div>`)}<button class="btn alt" data-act="trf">Transfer antar-dompet</button></section>
<section class="sec"><div class="hd"><h3>Riwayat transfer</h3></div>${S.transfers.length?L([...S.transfers].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10),t=>`<div class="row"><span class="ci">${ico('t')}</span><div><b>${esc(wn(t.from))} → ${esc(wn(t.to))}</b><small>${t.date}</small></div><span class="amt">${money(t.amount)}</span></div>`):'<p class="empty">Belum ada transfer.</p>'}</section>
<section class="sec"><div class="hd"><h3>Pengaturan</h3></div><button class="set" data-act="theme"><span>Tampilan</span><small>${dark?'Gelap':'Terang'}</small></button><button class="set" data-act="backup"><span>Backup data (JSON)</span></button><label class="set"><span>Restore data (JSON)</span><input type="file" accept=".json,application/json" hidden id="rs"></label><button class="set out" data-act="wipe"><span>Hapus semua data</span></button></section>`};
const NAV=[['home','Beranda','<path d="M3 11l9-8 9 8v10H3z"/>'],['tx','Transaksi','<path d="M4 6h16M4 12h16M4 18h10"/>'],['budget','Anggaran','<circle cx="12" cy="12" r="9"/><path d="M12 3v9h9"/>'],['report','Laporan','<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],['profile','Profil','<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>']];
function render(){charts.forEach(c=>c.destroy());charts=[];pend=[];document.body.dataset.t=localStorage.t||'light';if(window.Chart){Chart.defaults.color=cv('--mut');Chart.defaults.borderColor=cv('--ln');Chart.defaults.font.family='Manrope,system-ui,sans-serif'}
$('#app').innerHTML=V[view]();$('#nav').innerHTML=L(NAV,([k,n,p])=>`<button data-act="nav" data-id="${k}" class="${view===k?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>${n}</button>`);pend.forEach(f=>f())}
/* ---- form ---- */
const modal=h=>{$('#modal').innerHTML=`<div class="back" data-act="close"><div class="sheet"><div class="grab"></div>${h}</div></div>`},shut=()=>{$('#modal').innerHTML=''};
const cancel='<button type="button" class="btn del" data-act="close">Batal</button>';
function txForm(t){t=t||{type:'out',amount:'',cat:'',date:today(),time:jam(),wallet:S.wallets[0].id,method:'Tunai',note:''};
modal(`<form data-form="tx" data-id="${t.id||''}"><h3>${t.id?'Edit':'Tambah'} transaksi</h3><div class="seg"><label><input type="radio" name="type" value="out" ${t.type==='out'?'checked':''}><span>Pengeluaran</span></label><label><input type="radio" name="type" value="in" ${t.type==='in'?'checked':''}><span>Pemasukan</span></label></div><input class="amt-in" name="amount" inputmode="numeric" placeholder="Nominal (Rp)" value="${t.amount}" required><select name="cat">${opts(t.type==='in'?INC:EXP,t.cat)}</select><div class="two"><input type="date" name="date" value="${t.date}" required><input type="time" name="time" value="${t.time||''}"></div><div class="two"><select name="wallet">${L(S.wallets,w=>`<option value="${w.id}" ${w.id===t.wallet?'selected':''}>${esc(w.name)}</option>`)}</select><select name="method">${opts(PM,t.method)}</select></div><input name="note" placeholder="Catatan" value="${esc(t.note)}"><button class="btn">Simpan</button>${t.id?`<button type="button" class="btn del" data-act="del" data-id="${t.id}">Hapus transaksi</button>`:''}${cancel}</form>`)}
function wForm(w){w=w||{name:'',type:'Uang tunai',initial:''};modal(`<form data-form="wallet" data-id="${w.id||''}"><h3>${w.id?'Edit':'Tambah'} dompet</h3><input name="name" placeholder="Nama dompet" value="${esc(w.name)}" required><select name="type">${opts(WT,w.type)}</select><input name="initial" inputmode="numeric" placeholder="Saldo awal (Rp)" value="${w.initial||''}"><button class="btn">Simpan</button>${cancel}</form>`)}
function trfForm(){const o=(x)=>L(S.wallets,(w,i)=>`<option value="${w.id}" ${i===x?'selected':''}>${esc(w.name)} (${rp(bal(w))})</option>`);modal(`<form data-form="trf"><h3>Transfer antar-dompet</h3><small>Dari</small><select name="from">${o(0)}</select><small>Ke</small><select name="to">${o(1)}</select><input name="amount" inputmode="numeric" placeholder="Nominal (Rp)" required><input type="date" name="date" value="${today()}" required><button class="btn">Transfer</button>${cancel}</form>`)}
const FORMS={
async tx(d,id){const a=num(d.amount);if(!a||a>1e13)throw Error('Nominal tidak valid');const t={id:id||uid(),type:d.type,amount:a,cat:d.cat,date:d.date,time:d.time,wallet:d.wallet,method:d.method,note:d.note.trim()},o=S.tx.find(x=>x.id===id);await put('tx',t);o?Object.assign(o,t):S.tx.push(t);shut();render();toast('✓ Transaksi tersimpan');if(t.type==='out')chk(t)},
async wallet(d,id){const n=d.name.trim();if(!n)throw Error('Nama wajib diisi');const w={id:id||uid(),name:n,type:d.type,initial:num(d.initial)},o=S.wallets.find(x=>x.id===id);await put('wallets',w);o?Object.assign(o,w):S.wallets.push(w);shut();render()},
async trf(d){const a=num(d.amount),f=S.wallets.find(w=>w.id===d.from);if(d.from===d.to)throw Error('Pilih dompet yang berbeda');if(!a)throw Error('Nominal tidak valid');if(bal(f)<a)throw Error('Saldo dompet asal tidak cukup');const t={id:uid(),from:d.from,to:d.to,amount:a,date:d.date};await put('transfers',t);S.transfers.push(t);shut();render()},
async budget(d,id){const l=num(d.limit);if(l>0){const b={id,limit:l},o=S.budgets.find(x=>x.id===id);await put('budgets',b);o?o.limit=l:S.budgets.push(b)}else{await del('budgets',id);S.budgets=S.budgets.filter(x=>x.id!==id)}shut();render()}};
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;if(f.busy)return;f.busy=true;try{await FORMS[f.dataset.form](Object.fromEntries(new FormData(f)),f.dataset.id)}catch(x){toast(x.message)}f.busy=false});
/* ---- aksi ---- */
const ACT={
close:(e,el)=>{if(e.target===el)shut()},
nav:(e,el,id)=>{view=id;render();scrollTo(0,0)},
fab:()=>txForm(),
hide:()=>{hide=!hide;localStorage.hide=hide?'1':'';render()},
edit:(e,el,id)=>txForm(S.tx.find(t=>t.id===id)),
del:async(e,el,id)=>{if(!confirm('Hapus transaksi ini?'))return;await del('tx',id);S.tx=S.tx.filter(t=>t.id!==id);shut();render()},
wnew:()=>wForm(),wedit:(e,el,id)=>wForm(S.wallets.find(w=>w.id===id)),
trf:()=>S.wallets.length<2?toast('Buat minimal 2 dompet dulu'):trfForm(),
budget:(e,el,id)=>{const b=S.budgets.find(x=>x.id===id);modal(`<form data-form="budget" data-id="${esc(id)}"><h3>Anggaran ${esc(id)}</h3><input name="limit" inputmode="numeric" placeholder="Batas per bulan (Rp) — kosongkan untuk hapus" value="${b?b.limit:''}"><button class="btn">Simpan</button>${cancel}</form>`)},
preset:(e,el,id)=>{const t=today();F.rt=t;F.rf=id==='m'?t.slice(0,8)+'01':id==='y'?t.slice(0,5)+'01-01':dAgo(+id-1);render()},
export:()=>{const a=rangeTx();dl(`aturdana_${F.rf}_${F.rt}.csv`,'\ufeff'+['Tanggal,Jam,Jenis,Kategori,Nominal,Dompet,Metode,Catatan',...a.map(t=>[t.date,t.time,t.type==='in'?'Pemasukan':'Pengeluaran',t.cat,t.amount,wn(t.wallet),t.method,t.note].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(','))].join('\n'),'text/csv')},
theme:()=>{localStorage.t=localStorage.t==='dark'?'light':'dark';render()},
backup:()=>dl(`aturdana_backup_${today()}.json`,JSON.stringify({app:'aturdana',v:1,...S}),'application/json'),
wipe:async()=>{if(!confirm('Hapus SEMUA data? Tindakan ini tidak bisa dibatalkan. Sebaiknya backup dulu.'))return;for(const k of KEYS)await clr(k);await load();render();toast('Semua data dihapus')}};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el&&ACT[el.dataset.act])ACT[el.dataset.act](e,el,el.dataset.id)});
document.addEventListener('input',e=>{const t=e.target;if(t.name==='type'){t.form.cat.innerHTML=opts(t.value==='in'?INC:EXP);return}const f=t.dataset.f;if(!f)return;F[f]=f==='q'?t.value.toLowerCase():t.value;view==='tx'?$('#list').innerHTML=listHTML():render()});
document.addEventListener('change',async e=>{if(e.target.id!=='rs')return;try{const j=JSON.parse(await e.target.files[0].text());if(!KEYS.every(k=>Array.isArray(j[k])))throw 0;if(!confirm('Data saat ini akan diganti dengan isi backup. Lanjutkan?'))return;for(const k of KEYS){await clr(k);for(const v of j[k])await put(k,v)}await load();render();toast('Data berhasil dipulihkan')}catch(x){toast('File backup tidak valid')}e.target.value=''});
(async()=>{await openDB();await load();render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})})();

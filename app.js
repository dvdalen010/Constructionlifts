// Liftmaat: eenvoudige gereedschapskist voor bouwliftmonteurs.
// Alle gegevens worden lokaal in de browser bewaard.

// Standaardgegevens De Jong AT50.
// "bevestigd" betekent: gevonden in documentatie van fabrikant/verhuurder.
// Alles met bevestigd:false MOET nog uit de handleiding worden gecontroleerd.
const AT50_STANDAARD = {
  naam: 'De Jong AT50',
  velden: {
    vrijstaand:   { label: 'Vrijstaande hoogte (m)', waarde: 10.5, bevestigd: true,
                    bron: 'De Jong folder / verhuurspecificatie' },
    ankerafstand: { label: 'Max. ankerafstand (m)', waarde: 6, bevestigd: true,
                    bron: 'De Jong vergelijkingstabel (enkele mast)' },
    maxHoogte:    { label: 'Max. masthoogte verankerd (m)', waarde: 75, bevestigd: true,
                    bron: 'De Jong folder' },
    eersteAnker:  { label: 'Max. hoogte eerste anker (m)', waarde: 6, bevestigd: false,
                    bron: 'Aanname, opzoeken in handleiding' },
    vrijBoven:    { label: 'Max. vrije mast boven laatste anker (m)', waarde: 3, bevestigd: false,
                    bron: 'Aanname, opzoeken in handleiding' },
    sectie:       { label: 'Lengte mastsectie (m)', waarde: 1.5, bevestigd: false,
                    bron: 'Aanname, opmeten of opzoeken in handleiding' },
  },
};

const STANDAARD_CHECKS = [
  'Ondergrond en onderframe stabiel, geen verzakking',
  'Mastsecties en boutverbindingen vast',
  'Muurankers aanwezig en vast',
  'Tandheugel schoon en gesmeerd',
  'Hekwerk en deuren bodemafscherming dicht en werkend',
  'Deur- en eindschakelaars werken',
  'Noodstop werkt',
  'Voedingskabel onbeschadigd',
  'Windsnelheid binnen de toegestane grens',
  'Laadvermogen en gebruiksinstructie zichtbaar op de lift',
];

// ---------- opslag (veilig, werkt ook als localStorage geblokkeerd is) ----------
function laad(sleutel, standaard) {
  try {
    const v = localStorage.getItem(sleutel);
    return v ? JSON.parse(v) : structuredClone(standaard);
  } catch { return structuredClone(standaard); }
}
function bewaar(sleutel, waarde) {
  try { localStorage.setItem(sleutel, JSON.stringify(waarde)); } catch { /* negeren */ }
}

let model = laad('lm-model', AT50_STANDAARD);
let checks = laad('lm-checks', STANDAARD_CHECKS.map(t => ({ tekst: t, gedaan: false })));

// ---------- tabs ----------
document.querySelectorAll('nav button').forEach(knop => {
  knop.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    knop.classList.add('active');
    document.getElementById(knop.dataset.tab).classList.add('active');
  });
});

// ---------- ankerplan ----------
const fmt = n => n.toLocaleString('nl-NL', { maximumFractionDigits: 2 });

/**
 * Berekent een ankerplan.
 * Ankers worden op sectienaden gezet (veelvoud van de sectielengte),
 * zo hoog mogelijk binnen de toegestane afstanden, zodat er zo min mogelijk ankers nodig zijn.
 */
function berekenAnkerplan(gewenst, p) {
  const sectie = p.sectie;
  const secties = Math.ceil(gewenst / sectie - 1e-9);
  const hoogte = secties * sectie;
  const opNaad = h => Math.floor(h / sectie + 1e-9) * sectie;

  if (hoogte > p.maxHoogte) {
    return { fout: `Masthoogte ${fmt(hoogte)} m is hoger dan het maximum van ${fmt(p.maxHoogte)} m.` };
  }
  if (hoogte <= p.vrijstaand) {
    return { hoogte, secties, ankers: [] };
  }

  const eerste = opNaad(p.eersteAnker);
  const stap = opNaad(p.ankerafstand);
  if (eerste <= 0 || stap <= 0) {
    return { fout: 'Ankerhoogte of ankerafstand is kleiner dan één mastsectie. Controleer de modelgegevens.' };
  }

  const ankers = [eerste];
  while (hoogte - ankers[ankers.length - 1] > p.vrijBoven + 1e-9) {
    ankers.push(ankers[ankers.length - 1] + stap);
  }
  // Laatste anker mag niet boven de mast uitkomen.
  if (ankers[ankers.length - 1] > hoogte) ankers[ankers.length - 1] = hoogte;
  return { hoogte, secties, ankers };
}

function waarden() {
  const p = {};
  for (const [k, v] of Object.entries(model.velden)) p[k] = Number(v.waarde);
  return p;
}

function toonAnkerplan() {
  document.getElementById('modelNaam').textContent = model.naam;
  const gewenst = parseFloat(document.getElementById('hoogte').value);
  const uit = document.getElementById('resultaat');
  if (!(gewenst > 0)) { uit.innerHTML = ''; return; }

  const r = berekenAnkerplan(gewenst, waarden());
  if (r.fout) {
    uit.innerHTML = `<div class="kaart fout">${r.fout}</div>`;
    return;
  }

  const onbevestigd = Object.values(model.velden).filter(v => !v.bevestigd).map(v => v.label);
  const waarschuwing = onbevestigd.length && r.ankers.length
    ? `<div class="kaart fout"><strong>Let op:</strong> deze berekening gebruikt nog niet bevestigde
       waarden: ${onbevestigd.join(', ')}. Vul ze in vanuit de handleiding (tab Liftmodel).</div>`
    : '';

  const ankerRijen = r.ankers.map((h, i) =>
    `<tr><td>Anker ${i + 1}</td><td>${fmt(h)} m</td><td>na sectie ${Math.round(h / waarden().sectie)}</td></tr>`
  ).join('');

  uit.innerHTML = `
    <div class="kaart ok">
      <div class="muted">Werkelijke masthoogte</div>
      <div class="getal">${fmt(r.hoogte)} m</div>
      <div>${r.secties} mastsecties</div>
    </div>
    <div class="kaart">
      <div class="muted">Aantal ankers</div>
      <div class="getal">${r.ankers.length}</div>
      ${r.ankers.length === 0
        ? `<p>Binnen de vrijstaande hoogte (${fmt(waarden().vrijstaand)} m), geen ankers nodig.</p>`
        : `<table><tr><th></th><th>Hoogte</th><th>Positie</th></tr>${ankerRijen}</table>
           <p class="muted">Vrije mast boven laatste anker: ${fmt(r.hoogte - r.ankers[r.ankers.length - 1])} m</p>`}
    </div>
    ${waarschuwing}`;
}
document.getElementById('hoogte').addEventListener('input', toonAnkerplan);

// ---------- liftmodel ----------
function toonModel() {
  const form = document.getElementById('modelForm');
  form.innerHTML = '';
  for (const [k, v] of Object.entries(model.velden)) {
    const div = document.createElement('div');
    div.className = 'veld';
    div.innerHTML = `
      <label>
        <span class="veldkop">${v.label}
          <span class="badge ${v.bevestigd ? 'bevestigd' : 'controleren'}">
            ${v.bevestigd ? 'bevestigd' : 'controleren'}</span>
        </span>
        <input type="number" step="0.1" min="0" inputmode="decimal" value="${v.waarde}">
        <span class="bron">Bron: ${v.bron}</span>
      </label>
      <label class="bron"><input type="checkbox" ${v.bevestigd ? 'checked' : ''}>
        Gecontroleerd in handleiding</label>`;
    div.querySelector('input[type=number]').addEventListener('change', e => {
      v.waarde = parseFloat(e.target.value) || 0;
      bewaar('lm-model', model); toonAnkerplan();
    });
    div.querySelector('input[type=checkbox]').addEventListener('change', e => {
      v.bevestigd = e.target.checked;
      if (v.bevestigd && v.bron.startsWith('Aanname')) v.bron = 'Handleiding (zelf gecontroleerd)';
      bewaar('lm-model', model); toonModel(); toonAnkerplan();
    });
    form.appendChild(div);
  }
}
document.getElementById('resetModel').addEventListener('click', () => {
  if (!confirm('Alle modelgegevens terugzetten naar de AT50-standaard?')) return;
  model = structuredClone(AT50_STANDAARD);
  bewaar('lm-model', model); toonModel(); toonAnkerplan();
});

// ---------- dagcontrole ----------
function toonChecks() {
  const lijst = document.getElementById('checklijst');
  lijst.innerHTML = '';
  checks.forEach((c, i) => {
    const li = document.createElement('li');
    if (c.gedaan) li.classList.add('gedaan');
    li.innerHTML = `<input type="checkbox" ${c.gedaan ? 'checked' : ''}><span></span>`;
    li.querySelector('span').textContent = c.tekst;
    li.querySelector('input').addEventListener('change', e => {
      checks[i].gedaan = e.target.checked;
      bewaar('lm-checks', checks); toonChecks();
    });
    lijst.appendChild(li);
  });
  const klaar = checks.filter(c => c.gedaan).length;
  document.getElementById('checkStatus').textContent =
    klaar === checks.length ? 'Alle punten gecontroleerd.' : `${klaar} van ${checks.length} gecontroleerd.`;
}
document.getElementById('voegToe').addEventListener('click', () => {
  const inp = document.getElementById('nieuwPunt');
  if (!inp.value.trim()) return;
  checks.push({ tekst: inp.value.trim(), gedaan: false });
  inp.value = '';
  bewaar('lm-checks', checks); toonChecks();
});
document.getElementById('resetCheck').addEventListener('click', () => {
  checks.forEach(c => { c.gedaan = false; });
  bewaar('lm-checks', checks); toonChecks();
});

// ---------- start ----------
toonModel();
toonChecks();
toonAnkerplan();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Voor tests in Node.
if (typeof module !== 'undefined') module.exports = { berekenAnkerplan };

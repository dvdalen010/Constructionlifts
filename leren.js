// Leren en toetsen. Geslaagd = 0 fouten. In dit werk telt elke fout.

const lerenEl = document.getElementById('lerenInhoud');
let leerstof = null;
let voortgang = laad('lm-voortgang', {}); // { moduleId: { geslaagdOp: ISO-datum, pogingen: n } }

// Een geslaagd onderdeel blijft GELDIG_DAGEN geldig, daarna is "herkeuring" nodig (net als bij een lift).
const GELDIG_DAGEN = 90;
const WAARSCHUW_DAGEN = 14;
const DAG = 24 * 60 * 60 * 1000;

// Oude opslag (geslaagd: 'dd-mm-jjjj') omzetten: geldig vanaf vandaag.
for (const v of Object.values(voortgang)) {
  if (v.geslaagd && !v.geslaagdOp) v.geslaagdOp = new Date().toISOString();
  delete v.geslaagd;
}
bewaar('lm-voortgang', voortgang);

const datum = d => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

/** Status van een onderdeel: open, geldig, bijna (verloopt binnenkort) of verlopen. */
function keuring(m) {
  const v = voortgang[m.id];
  if (!v?.geslaagdOp) return { status: 'open', pogingen: v?.pogingen || 0 };
  const tot = new Date(new Date(v.geslaagdOp).getTime() + GELDIG_DAGEN * DAG);
  const dagen = Math.ceil((tot - Date.now()) / DAG);
  if (dagen <= 0) return { status: 'verlopen', tot, dagen };
  return { status: dagen <= WAARSCHUW_DAGEN ? 'bijna' : 'geldig', tot, dagen };
}

function keuringBadge(k) {
  if (k.status === 'geldig') return el('span', { class: 'badge bevestigd' }, 'geldig');
  if (k.status === 'bijna') return el('span', { class: 'badge controleren' }, `nog ${k.dagen} ${k.dagen === 1 ? 'dag' : 'dagen'}`);
  if (k.status === 'verlopen') return el('span', { class: 'badge verlopen' }, 'herkeuring nodig');
  return el('span', { class: 'badge open' }, k.pogingen ? `${k.pogingen}x geprobeerd` : 'nog doen');
}

function keuringTekst(k) {
  if (k.status === 'geldig') return `Geldig tot ${datum(k.tot)}.`;
  if (k.status === 'bijna') return `Verloopt op ${datum(k.tot)}. Doe het examen opnieuw om het te verlengen.`;
  if (k.status === 'verlopen') return `Verlopen op ${datum(k.tot)}. Herkeuring nodig: doe het examen opnieuw.`;
  return 'Nog niet geslaagd.';
}

const schud = lijst => {
  const a = [...lijst];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function el(tag, attrs = {}, ...kinderen) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'onclick') e.addEventListener('click', v);
    else if (k === 'class') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const k of kinderen) e.append(k);
  return e;
}

// ---------- de mast: voortgang als bouwlift ----------
// Elk onderdeel = 2 mastsecties. Geldig = geel, herkeuring nodig = oranje, nog niet = stippellijn.
// Om de 2 gebouwde secties een anker naar de gevel. De lift staat bovenop het gebouwde deel.
const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function tekenMast(statussen) {
  const PER = 2, H = 22, B = 22;
  const secties = statussen.flatMap(st => Array(PER).fill(st));
  const n = secties.length;
  const breedte = 120, hoogte = (n + 1) * H + 34;
  const mastX = 54, gevelX = 100;
  const s = svg('svg', { viewBox: `0 0 ${breedte} ${hoogte}`, class: 'mast-svg', role: 'img',
    'aria-label': 'Bouwlift die groeit met je voortgang' });

  const grond = hoogte - 8;
  s.append(svg('rect', { x: gevelX, y: 8, width: 14, height: grond - 8, class: 'm-gevel' }));
  s.append(svg('line', { x1: 4, y1: grond, x2: breedte - 4, y2: grond, class: 'm-grond' }));
  s.append(svg('rect', { x: mastX - 10, y: grond - 8, width: B + 20, height: 8, class: 'm-voet' }));

  let gebouwd = 0;
  secties.forEach((st, i) => {
    const y = grond - 8 - (i + 1) * H;
    const klasse = st === 'open' ? 'm-leeg' : (st === 'verlopen' ? 'm-verlopen' : 'm-sectie');
    s.append(svg('rect', { x: mastX, y, width: B, height: H, class: klasse }));
    if (st !== 'open') {
      s.append(svg('line', { x1: mastX, y1: y + H, x2: mastX + B, y2: y, class: 'm-schoor' }));
      gebouwd = i + 1;
      if ((i + 1) % 2 === 0 && i + 1 < n) {
        s.append(svg('line', { x1: mastX + B, y1: y + 3, x2: gevelX, y2: y + 3, class: 'm-anker' }));
      }
    }
  });

  // Lift bovenop het gebouwde deel (of onderaan als er nog niets staat).
  const liftY = grond - 8 - Math.max(gebouwd, 1) * H;
  s.append(svg('rect', { x: mastX - 30, y: liftY, width: 28, height: 20, rx: 2, class: 'm-lift' }));
  s.append(svg('rect', { x: mastX - 26, y: liftY + 4, width: 20, height: 8, class: 'm-raam' }));

  if (gebouwd === n && n > 0) {
    const top = grond - 8 - n * H;
    s.append(svg('line', { x1: mastX + B / 2, y1: top, x2: mastX + B / 2, y2: top - 22, class: 'm-paal' }));
    s.append(svg('path', { d: `M${mastX + B / 2} ${top - 22} l16 5 l-16 5 z`, class: 'm-vlag' }));
  }
  return s;
}

// ---------- overzicht ----------
function toonOverzicht() {
  lerenEl.innerHTML = '';
  const keuringen = leerstof.modules.map(keuring);
  const aantal = keuringen.length;
  const geldig = keuringen.filter(k => k.status === 'geldig' || k.status === 'bijna').length;
  const herkeuring = keuringen.filter(k => k.status === 'verlopen').length;
  const top = geldig === aantal;

  let kop = 'Start met bouwen: slaag voor je eerste onderdeel.';
  if (top) kop = 'Top bereikt! Alle onderdelen zijn geldig.';
  else if (geldig + herkeuring > 0) kop = `Nog ${aantal - geldig} ${aantal - geldig === 1 ? 'onderdeel' : 'onderdelen'} tot de top.`;

  lerenEl.append(
    el('h2', {}, 'Leren'),
    el('div', { class: `kaart mast-kaart${top ? ' ok' : ''}` },
      tekenMast(keuringen.map(k => k.status === 'bijna' ? 'geldig' : k.status)
        .sort((a, b) => ['geldig', 'verlopen', 'open'].indexOf(a) - ['geldig', 'verlopen', 'open'].indexOf(b))),
      el('div', {},
        el('div', { class: 'muted' }, 'Jouw bouwlift'),
        el('div', { class: 'getal' }, `${geldig} / ${aantal}`),
        el('div', {}, 'onderdelen geldig'),
        herkeuring ? el('p', { class: 'herkeuring' }, `${herkeuring} herkeuring nodig`) : '',
        el('p', { class: 'muted' }, kop))),
    el('p', { class: 'muted' }, `Geslaagd ben je alleen met 0 fouten. Net als een lift moet je kennis periodiek gekeurd worden: een geslaagd onderdeel is ${GELDIG_DAGEN} dagen geldig.`));

  leerstof.modules.forEach((m, i) => {
    lerenEl.append(el('button', { class: 'module', onclick: () => toonModule(m) },
      el('span', { class: 'veldkop' }, el('strong', {}, m.titel), keuringBadge(keuringen[i])),
      el('span', { class: 'muted' }, `${m.vragen.length} vragen`)));
  });
}

// ---------- lesstof ----------
function toonModule(m) {
  lerenEl.innerHTML = '';
  lerenEl.append(
    el('button', { class: 'terug', onclick: toonOverzicht }, '‹ Alle onderdelen'),
    el('h2', {}, m.titel),
    el('p', {}, m.intro));
  const k = keuring(m);
  if (k.status !== 'open') {
    lerenEl.append(el('div', { class: `kaart ${k.status === 'geldig' ? 'ok' : 'let-op'}` },
      el('span', { class: 'veldkop' }, el('strong', {}, 'Keuring'), keuringBadge(k)),
      el('p', {}, keuringTekst(k))));
  }
  if (m.status === 'concept') {
    lerenEl.append(el('p', { class: 'waarschuwing' },
      'Conceptversie: deze leerstof moet nog door een ervaren monteur worden nagekeken.'));
  }
  for (const blok of m.les) {
    const kaart = el('div', { class: 'kaart' }, el('h3', {}, blok.kop), el('p', {}, blok.tekst));
    if (blok.tab) {
      kaart.append(el('button', { class: 'secundair', onclick: () =>
        document.querySelector(`nav button[data-tab="${blok.tab}"]`).click() }, blok.linktekst || 'Openen'));
    }
    lerenEl.append(kaart);
  }
  lerenEl.append(
    el('div', { class: 'knoppen' },
      el('button', { class: 'secundair', onclick: () => startToets(m, 'oefenen') }, 'Oefenen'),
      el('button', { class: 'primair', onclick: () => startToets(m, 'examen') }, 'Examen')),
    el('p', { class: 'muted' }, 'Oefenen: na elke vraag zie je direct het antwoord met uitleg. Examen: uitslag pas aan het einde, geslaagd met 0 fouten.'));
}

// ---------- toets ----------
// Vraagtypes: meerkeuze (standaard) en "volgorde" (stappen in de juiste volgorde zetten).
function startToets(m, modus) {
  const vragen = schud(m.vragen).map(v => v.type === 'volgorde'
    ? { ...v, geschud: schud(v.stappen) }
    : { ...v, opties: schud(v.opties.map((tekst, i) => ({ tekst, goed: i === v.goed }))) });
  toonVraag({ m, modus, vragen, nr: 0, antwoorden: [] });
}

function toonVraag(t) {
  const v = t.vragen[t.nr];
  lerenEl.innerHTML = '';
  lerenEl.append(
    el('button', { class: 'terug', onclick: () => { if (confirm('Toets stoppen?')) toonModule(t.m); } }, '‹ Stoppen'),
    el('div', { class: 'muted' }, `${t.modus === 'examen' ? 'Examen' : 'Oefenen'} · vraag ${t.nr + 1} van ${t.vragen.length}`),
    el('div', { class: 'balk' }, el('div', { style: `width:${(t.nr / t.vragen.length) * 100}%` })),
    el('h3', { class: 'vraag' }, v.vraag));

  const verder = el('button', { class: 'primair', disabled: '' },
    t.nr + 1 < t.vragen.length ? 'Volgende vraag' : 'Uitslag bekijken');
  const feedback = el('div');
  let antwoord = null; // { goed, jouw, juist }

  const toonFeedback = () => {
    if (t.modus !== 'oefenen') return;
    feedback.replaceChildren(el('div', { class: `kaart ${antwoord.goed ? 'ok' : 'fout'}` },
      el('strong', {}, antwoord.goed ? 'Goed. ' : 'Fout. '), v.uitleg));
  };

  if (v.type === 'volgorde') {
    const gekozen = [];
    lerenEl.append(el('p', { class: 'muted' }, 'Tik de stappen aan in de juiste volgorde.'));
    const volgordeEl = el('ol', { class: 'volgorde' });
    const lijst = el('div', { class: 'opties' });
    const wis = el('button', { class: 'secundair' }, 'Opnieuw kiezen');
    const teken = () => {
      volgordeEl.replaceChildren(...gekozen.map((st, i) => {
        const li = el('li', {}, st);
        if (antwoord && t.modus === 'oefenen') li.className = st === v.stappen[i] ? 'juist' : 'onjuist';
        return li;
      }));
      lijst.querySelectorAll('.optie').forEach(k => {
        k.hidden = gekozen.includes(k.dataset.stap);
      });
      wis.hidden = gekozen.length === 0 || (antwoord && t.modus === 'oefenen');
    };
    v.geschud.forEach(st => {
      const knop = el('button', { class: 'optie', 'data-stap': st }, st);
      knop.addEventListener('click', () => {
        gekozen.push(st);
        if (gekozen.length === v.stappen.length) {
          const goed = gekozen.every((x, i) => x === v.stappen[i]);
          antwoord = { goed, jouw: gekozen.join(' → '), juist: v.stappen.join(' → ') };
          verder.removeAttribute('disabled');
          toonFeedback();
          if (t.modus === 'oefenen' && !goed) {
            feedback.firstChild.append(el('ol', { class: 'volgorde' }, ...v.stappen.map(x => el('li', {}, x))));
          }
        }
        teken();
      });
      lijst.append(knop);
    });
    wis.addEventListener('click', () => {
      gekozen.length = 0; antwoord = null;
      verder.setAttribute('disabled', ''); feedback.replaceChildren(); teken();
    });
    teken();
    lerenEl.append(volgordeEl, lijst, wis);
  } else {
    const lijst = el('div', { class: 'opties' });
    v.opties.forEach((o, i) => {
      const knop = el('button', { class: 'optie' }, o.tekst);
      knop.addEventListener('click', () => {
        if (t.modus === 'oefenen' && antwoord) return; // antwoord staat vast
        antwoord = { goed: o.goed, jouw: o.tekst, juist: v.opties.find(x => x.goed).tekst };
        lijst.querySelectorAll('.optie').forEach(k => k.classList.remove('gekozen'));
        knop.classList.add('gekozen');
        verder.removeAttribute('disabled');
        if (t.modus === 'oefenen') {
          lijst.querySelectorAll('.optie').forEach((k, j) => {
            if (v.opties[j].goed) k.classList.add('juist');
            else if (j === i) k.classList.add('onjuist');
          });
        }
        toonFeedback();
      });
      lijst.append(knop);
    });
    lerenEl.append(lijst);
  }

  verder.addEventListener('click', () => {
    t.antwoorden.push({ vraag: v, ...antwoord });
    if (t.nr + 1 < t.vragen.length) toonVraag({ ...t, nr: t.nr + 1 });
    else toonUitslag(t);
  });

  lerenEl.append(feedback, verder);
}

function toonUitslag(t) {
  const fouten = t.antwoorden.filter(a => !a.goed);
  const geslaagd = fouten.length === 0;

  if (t.modus === 'examen') {
    const v = voortgang[t.m.id] || { pogingen: 0 };
    v.pogingen += 1;
    if (geslaagd) v.geslaagdOp = new Date().toISOString();
    voortgang[t.m.id] = v;
    bewaar('lm-voortgang', voortgang);
  }

  lerenEl.innerHTML = '';
  lerenEl.append(
    el('h2', {}, t.m.titel),
    el('div', { class: `kaart ${geslaagd ? 'ok' : 'fout'}` },
      el('div', { class: 'getal' }, geslaagd ? 'Geslaagd' : 'Niet geslaagd'),
      el('div', {}, `${t.antwoorden.length - fouten.length} van ${t.antwoorden.length} goed, ${fouten.length} fout${fouten.length === 1 ? '' : 'en'}.`),
      el('p', { class: 'muted' }, geslaagd
        ? (t.modus === 'examen'
          ? `Foutloos. Er komt een stuk mast bij je bouwlift. ${keuringTekst(keuring(t.m))}`
          : 'Foutloos geoefend. Klaar voor het examen.')
        : 'Bij dit werk telt elke fout. Lees de uitleg hieronder en probeer het opnieuw.')));

  for (const a of fouten) {
    lerenEl.append(el('div', { class: 'kaart fout' },
      el('strong', {}, a.vraag.vraag),
      el('p', {}, `Jouw antwoord: ${a.jouw}`),
      el('p', {}, `Juiste antwoord: ${a.juist}`),
      el('p', { class: 'muted' }, a.vraag.uitleg)));
  }

  lerenEl.append(el('div', { class: 'knoppen' },
    el('button', { class: 'secundair', onclick: () => toonModule(t.m) }, 'Terug naar leerstof'),
    el('button', { class: 'primair', onclick: () => startToets(t.m, t.modus) }, 'Opnieuw')));
}

// ---------- laden ----------
fetch('leerstof.json')
  .then(r => r.json())
  .then(data => { leerstof = data; toonOverzicht(); })
  .catch(() => { lerenEl.textContent = 'Leerstof kon niet geladen worden.'; });

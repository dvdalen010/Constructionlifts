// Leren en toetsen. Geslaagd = 0 fouten. In dit werk telt elke fout.

const lerenEl = document.getElementById('lerenInhoud');
let leerstof = null;
let voortgang = laad('lm-voortgang', {}); // { moduleId: { geslaagd: 'datum', pogingen: n } }

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

// ---------- overzicht ----------
function toonOverzicht() {
  lerenEl.innerHTML = '';
  const aantal = leerstof.modules.length;
  const geslaagd = leerstof.modules.filter(m => voortgang[m.id]?.geslaagd).length;

  lerenEl.append(
    el('h2', {}, 'Leren'),
    el('div', { class: 'kaart' },
      el('div', { class: 'muted' }, 'Voortgang'),
      el('div', { class: 'getal' }, `${geslaagd} / ${aantal}`),
      el('div', {}, 'onderdelen geslaagd'),
      el('div', { class: 'balk' }, el('div', { style: `width:${(geslaagd / aantal) * 100}%` }))),
    el('p', { class: 'muted' }, 'Geslaagd voor een onderdeel ben je alleen met 0 fouten. In dit werk kun je geen fouten maken.'));

  for (const m of leerstof.modules) {
    const v = voortgang[m.id];
    const status = v?.geslaagd
      ? el('span', { class: 'badge bevestigd' }, 'geslaagd')
      : el('span', { class: 'badge open' }, v?.pogingen ? `${v.pogingen}x geprobeerd` : 'nog doen');
    lerenEl.append(el('button', { class: 'module', onclick: () => toonModule(m) },
      el('span', { class: 'veldkop' }, el('strong', {}, m.titel), status),
      el('span', { class: 'muted' }, `${m.vragen.length} vragen`)));
  }
}

// ---------- lesstof ----------
function toonModule(m) {
  lerenEl.innerHTML = '';
  lerenEl.append(
    el('button', { class: 'terug', onclick: toonOverzicht }, '‹ Alle onderdelen'),
    el('h2', {}, m.titel),
    el('p', {}, m.intro));
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
    if (geslaagd && !v.geslaagd) v.geslaagd = new Date().toLocaleDateString('nl-NL');
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
        ? (t.modus === 'examen' ? 'Foutloos. Dit onderdeel staat op geslaagd.' : 'Foutloos geoefend. Klaar voor het examen.')
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

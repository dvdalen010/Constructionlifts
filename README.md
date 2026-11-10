# Liftmaat

Een app (PWA) om te **leren** en te **werken** als bouwliftmonteur. Werkt op telefoon, ook offline.

## Wat zit erin

- **Leren** (hoofdonderdeel): leerstof per onderwerp met oefentoetsen.
  - *Oefenen*: na elke vraag direct het antwoord met uitleg.
  - *Examen*: uitslag aan het einde. **Geslaagd alleen met 0 fouten**, want in dit werk kun je geen fouten maken.
  - Vragen en antwoorden staan elke keer in een andere volgorde.
- **Ankerplan**: vul de gewenste masthoogte in en zie hoeveel mastsecties en ankers nodig zijn, en op welke hoogte.
- **Dagcontrole**: afvinklijst voor de controle vóór gebruik, uit te breiden met eigen punten.
- **Liftmodel**: de gegevens waarmee gerekend wordt. Elke waarde heeft een bron en de status *bevestigd* of *controleren*.

## Zelf leerstof en vragen toevoegen

Alle leerstof staat in `leerstof.json`. Een vraag ziet er zo uit:

```json
{
  "vraag": "Wat is de vrijstaande hoogte van de De Jong AT50?",
  "opties": ["10,5 m", "6 m", "9 m", "15 m"],
  "goed": 0,
  "uitleg": "De AT50 heeft een vrijstaande hoogte van 10,5 m."
}
```

`goed` is het nummer van het juiste antwoord, tellend vanaf 0. De app schudt de volgorde zelf.
Een onderdeel met `"status": "concept"` toont een waarschuwing dat de leerstof nog nagekeken moet worden.
Zet dat op `"nagekeken"` zodra een ervaren monteur het heeft gecontroleerd.

## Gegevens De Jong AT50

| Gegeven | Waarde | Status |
|---|---|---|
| Vrijstaande hoogte | 10,5 m | bevestigd (fabrikantfolder) |
| Max. ankerafstand (enkele mast) | 6 m | bevestigd (fabrikanttabel) |
| Max. masthoogte verankerd | 75 m | bevestigd (fabrikantfolder) |
| Max. hoogte eerste anker | 6 m | **controleren in handleiding** |
| Max. vrije mast boven laatste anker | 3 m | **controleren in handleiding** |
| Lengte mastsectie | 1,5 m | **controleren in handleiding** |

> Deze app is een hulpmiddel en vervangt nooit de montagehandleiding van de fabrikant of een keuring.

## Online

De app staat op **https://dvdalen010.github.io/Constructionlifts/**

Op de telefoon: open de link en kies "Zet op beginscherm" (iPhone: deelknop, Android: menu met drie puntjes).
Daarna werkt de app als een gewone app, ook zonder bereik.

## Lokaal starten

```bash
python3 -m http.server 8000
```

Open daarna http://localhost:8000 in de browser.

## Ideeën voor later

- Meerdere liftmodellen (AT75, AT95, PT500)
- Foto's en PDF-export bij de dagcontrole
- Projectlogboek per bouwplaats
- Storingsboom en eigen kennisbank
- Montagestappen als leerstof, gekoppeld aan het ankerplan
- Toetsresultaten delen met een leermeester

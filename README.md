# Liftmaat

Een eenvoudige app (PWA) voor de bouwliftmonteur. Werkt op telefoon, ook offline.

## Wat zit erin

- **Ankerplan**: vul de gewenste masthoogte in en zie hoeveel mastsecties en ankers nodig zijn, en op welke hoogte.
- **Dagcontrole**: afvinklijst voor de controle vóór gebruik, uit te breiden met eigen punten.
- **Liftmodel**: de gegevens waarmee gerekend wordt. Elke waarde heeft een bron en de status *bevestigd* of *controleren*.
- **Begrippen**: uitleg van vrijstaande hoogte, ankerhoogte, ankerafstand en meer.

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

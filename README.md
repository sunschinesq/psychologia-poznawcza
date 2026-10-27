# Psychologia poznawcza – aplikacja do nauki

Prosta aplikacja webowa do nauki na egzamin warunkowy (czw 17.12.2026). Działa w Safari na iPadzie, a po pierwszym otwarciu także offline.

## Co jest w środku

- **Dziś**: zadania z planu na bieżący dzień (3 bloki po 25 min), odhaczanie, minutnik 25 + 5 min, zaległości i postęp.
- **Plan**: wszystkie 45 dni nauki (26.10–17.12) w podziale na 3 etapy.
- **Notatki**: 72 zagadnienia w 8 działach, z kolorami jak w PDF (czerwone = definicje, żółte = przykłady i badania, zielone = porównania, szare = dopiski). Do tego wyszukiwarka, gwiazdka „słabe pytanie”, przycisk „zasłoń” do odpytywania się, ściąga, pytania kontrolne i tabele do odtwarzania z pamięci.
- **Fiszki**: 106 fiszek „termin → definicja” z pogrubionych pojęć, quiz ABCD i 72 pytania egzaminacyjne. Fiszki układają się w pudełka Leitnera.
- **Egzamin**: losowanie 3 pytań z wybranego zakresu, 15 min na pytanie, pisanie odpowiedzi, a potem porównanie z notatką i lista kluczowych terminów, których zabrakło. Pytania ocenione na „średnio” albo „słabo” trafiają na listę słabych pytań.
- **Na dziś do powtórki**: codzienna porcja – fiszki wracają po 1, 2, 4, 7 i 14 dniach, a pytania wybierane są spośród słabych, nisko ocenionych na egzaminie i dawno niewidzianych.
- **Przeliczanie planu**: zaległe bloki jednym przyciskiem trafiają na kolejne dni (+1 lub +2 dziennie) i na dzień zapasu 12.12; można to cofnąć.
- **Moje dopiski**: przy każdym pytaniu własny tekst i kartka do rysowania rysikiem (Apple Pencil, z naciskiem). Rysunek zapisuje się sam.
- **Gry**: uzupełnij lukę, kto to powiedział, ułóż w kolejności, puzzle z tabeli, dopasuj pary na czas, prawda czy fałsz (60 s) losownik pytań na próbny egzamin, uzupełnianie schematów (13 modeli, kafelki albo pisanie rysikiem) i „Porównaj X i Y” (12 zestawień teorii). Do tego seria dni nauki (niedziele jej nie przerywają) i odznaki. Treść gier „Ułóż w kolejności” i „Prawda czy fałsz” jest w `games-data.js`, a schematów i porównań – w `extras-data.js`. Pozostałe gry biorą materiał z notatki.

## Jak otworzyć na iPadzie

1. Repozytorium na GitHubie → **Settings → Pages**.
2. W „Build and deployment” wybierz **Deploy from a branch**, potem gałąź z aplikacją i folder **/ (root)**, a na koniec **Save**.
3. Po 1–2 minutach na górze tej strony pojawi się adres, np. `https://<login>.github.io/psychologia-poznawcza/`.
4. Otwórz go w Safari i stuknij **Udostępnij → Do ekranu początkowego**. Aplikacja otworzy się wtedy na pełnym ekranie, z własną ikoną.

> GitHub Pages dla repozytorium **prywatnego** wymaga konta GitHub Pro. Studenci dostają je za darmo w GitHub Student Developer Pack. Drugie wyjście: ustawić repozytorium jako publiczne.

## Gdzie zapisuje się postęp

Postęp zapisuje się **tylko na tym urządzeniu**, w pamięci przeglądarki: odhaczone bloki, fiszki, słabe pytania i historia egzaminów.

- Ikona na ekranie początkowym i zwykła karta Safari mają **osobną** pamięć, więc najlepiej używać zawsze tej samej (ikony).
- W zakładce **Plan → Kopia postępu** możesz zapisać kopię do aplikacji Pliki i potem ją wczytać, np. na innym urządzeniu.

## Aktualizacja danych z PDF

Pliki `data.js` są generowane z PDF-ów (notatka + plan nauki) skryptami z folderu `tools/`. Wymagają Pythona i biblioteki `pdfplumber`:

```sh
pdftotext -layout Plan_nauki_psychologia_poznawcza.pdf plan.txt
python3 tools/parse.py Psychologia_poznawcza_notatka.pdf notes.json
python3 tools/build.py notes.json plan.txt data.js
```

Po zmianie plików podbij `VERSION` w `sw.js`, żeby iPad pobrał nową wersję.

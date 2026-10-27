// Schematy do uzupełniania i porównania teorii – napisane ręcznie na podstawie notatki.
// Schemat: węzły w procentach szerokości/wysokości (x, y, w, h); ratio = wysokość / szerokość.
// given: true – podpis widoczny od początku; nest: true – ramka zawierająca inne (podpis u góry).
window.EXTRAS_DATA = {
  diagrams: [
    {
      id: 'baddeley', q: 46, title: 'Pamięć operacyjna – model Baddeleya i Hitcha', ratio: 0.62,
      nodes: [
        { id: 'csw', x: 33, y: 5, w: 34, h: 20, label: 'Centralny system wykonawczy', sub: 'kieruje uwagą, kontroluje, rozumuje' },
        { id: 'petla', x: 1, y: 48, w: 31, h: 20, label: 'Pętla fonologiczna', sub: '„głos wewnętrzny”' },
        { id: 'bufor', x: 34.5, y: 48, w: 31, h: 20, label: 'Bufor epizodyczny', sub: 'dodany później (2000)' },
        { id: 'notes', x: 68, y: 48, w: 31, h: 20, label: 'Notes wzrokowo-przestrzenny', alt: ['notes wzrokowy', 'szkicownik wzrokowo-przestrzenny'], sub: '„oko wewnętrzne”' },
        { id: 'ltm', x: 20, y: 82, w: 60, h: 15, label: 'Pamięć trwała' }
      ],
      edges: [['csw', 'petla'], ['csw', 'bufor'], ['csw', 'notes'], ['petla', 'ltm', 'both'], ['bufor', 'ltm', 'both'], ['notes', 'ltm', 'both']]
    },
    {
      id: 'kahneman', q: 27, title: 'Teoria zasobów uwagi Kahnemana', ratio: 0.72,
      nodes: [
        { id: 'det', x: 1, y: 4, w: 25, h: 20, label: 'Determinanty pobudzenia', sub: 'trudność zadania, poziom pobudzenia' },
        { id: 'dysp', x: 50, y: 4, w: 23, h: 18, label: 'Trwałe dyspozycje', sub: 'np. zainteresowania' },
        { id: 'int', x: 76, y: 4, w: 23, h: 18, label: 'Chwilowe intencje' },
        { id: 'pob', x: 1, y: 40, w: 25, h: 16, label: 'Pobudzenie' },
        { id: 'ocena', x: 30, y: 39, w: 23, h: 18, label: 'Ocena zapotrzebowania', sub: 'metapoziom' },
        { id: 'zas', x: 1, y: 76, w: 25, h: 16, label: 'Dostępne zasoby' },
        { id: 'pol', x: 38, y: 76, w: 28, h: 16, label: 'Polityka alokacji' },
        { id: 'dzi', x: 74, y: 76, w: 25, h: 16, label: 'Działania', alt: ['reakcja', 'działanie'] }
      ],
      edges: [['det', 'pob'], ['pob', 'zas'], ['zas', 'pol'], ['pol', 'dzi'], ['dysp', 'pol'], ['int', 'pol'], ['ocena', 'pol'], ['ocena', 'pob', 'dash']]
    },
    {
      id: 'sperling', q: 44, title: 'Model pamięci krótkotrwałej Sperlinga', ratio: 0.42,
      nodes: [
        { id: 'sens', x: 0.5, y: 32, w: 18, h: 36, label: 'Pamięć ikoniczna / echoiczna', alt: ['pamięć sensoryczna', 'pamięć ikoniczna', 'pamięć echoiczna'] },
        { id: 'skan', x: 20.5, y: 32, w: 18, h: 36, label: 'Skaner', sub: 'selekcja, procesy uwagi' },
        { id: 'otw', x: 40.5, y: 32, w: 18, h: 36, label: 'Otwory wrzutowe' },
        { id: 'stm', x: 60.5, y: 32, w: 18, h: 36, label: 'Magazyn STM', alt: ['pamięć krótkotrwała', 'magazyn pamięci krótkotrwałej'], sub: '7 mniejszych magazynów' },
        { id: 'ltm', x: 80.5, y: 32, w: 19, h: 36, label: 'Magazyn pamięci trwałej', alt: ['pamięć trwała'] }
      ],
      edges: [['sens', 'skan'], ['skan', 'otw'], ['otw', 'stm'], ['stm', 'ltm']]
    },
    {
      id: 'cowan', q: 47, title: 'Model aktywacyjny Cowana', ratio: 0.6,
      nodes: [
        { id: 'ltm', x: 1, y: 2, w: 98, h: 96, nest: true, label: 'Pamięć trwała', sub: 'ślady nieaktywne, tylko przechowywane' },
        { id: 'stm', x: 14, y: 26, w: 72, h: 68, nest: true, label: 'Pamięć krótkotrwała', alt: ['poziom pamięci krótkotrwałej', 'STM'], sub: 'aktywna część pamięci trwałej – wpływa na przetwarzanie, ale nie jest świadoma' },
        { id: 'foc', x: 32, y: 56, w: 36, h: 32, nest: true, label: 'Ognisko uwagi', sub: 'najbardziej aktywne, dostępne świadomości' }
      ],
      edges: []
    },
    {
      id: 'collins', q: 50, title: 'Sieć semantyczna Collinsa i Quilliana', ratio: 0.72,
      nodes: [
        { id: 't3', x: 1, y: 6, w: 18, h: 14, label: '1460 ms', alt: ['1460'], sub: 'czas weryfikacji' },
        { id: 'zw', x: 30, y: 4, w: 30, h: 18, label: 'Zwierzę' },
        { id: 'p3', x: 72, y: 6, w: 27, h: 14, label: 'je', sub: 'cecha zapisana tu' },
        { id: 't2', x: 1, y: 43, w: 18, h: 14, label: '1385 ms', alt: ['1385'], sub: 'czas weryfikacji' },
        { id: 'pt', x: 30, y: 41, w: 30, h: 18, label: 'Ptak' },
        { id: 'p2', x: 72, y: 43, w: 27, h: 14, label: 'lata', sub: 'cecha zapisana tu' },
        { id: 't1', x: 1, y: 80, w: 18, h: 14, label: '1310 ms', alt: ['1310'], sub: 'czas weryfikacji' },
        { id: 'ka', x: 30, y: 78, w: 30, h: 18, label: 'Kanarek' },
        { id: 'p1', x: 72, y: 80, w: 27, h: 14, label: 'jest żółty', sub: 'cecha zapisana tu' }
      ],
      edges: [['ka', 'pt'], ['pt', 'zw'], ['zw', 'p3', 'dash'], ['pt', 'p2', 'dash'], ['ka', 'p1', 'dash']]
    },
    {
      id: 'dinuovo', q: 28, title: 'Koncentryczne pole uwagi Di Nuovo', ratio: 0.62,
      nodes: [
        { id: 'z4', x: 1, y: 2, w: 98, h: 96, nest: true, label: 'Zachowanie pozauwagowe', sub: 'odruchy (kichanie, mruganie)' },
        { id: 'z3', x: 11, y: 18, w: 78, h: 78, nest: true, label: 'Uwaga mimowolna', sub: 'mało kontroli, bez udziału świadomości' },
        { id: 'z2', x: 22, y: 36, w: 56, h: 58, nest: true, label: 'Struktury poznawcze', sub: 'wiedza i doświadczenie' },
        { id: 'z1', x: 34, y: 56, w: 32, h: 34, nest: true, label: 'Centrum', alt: ['treści świadome'], sub: 'treści świadome tu i teraz' }
      ],
      edges: []
    },
    {
      id: 'spostrz', q: 4, title: 'Przebieg procesu spostrzegania', ratio: 0.5,
      nodes: [
        { id: 'd', x: 0.5, y: 14, w: 22, h: 28, label: 'Bodziec dystalny', sub: 'obiekt w otoczeniu' },
        { id: 'p', x: 25.5, y: 14, w: 22, h: 28, label: 'Bodziec proksymalny', sub: 'obraz na siatkówce' },
        { id: 'w', x: 50.5, y: 14, w: 22, h: 28, label: 'Wrażenie', sub: 'zakodowane impulsy nerwowe' },
        { id: 's', x: 75.5, y: 14, w: 24, h: 28, label: 'Spostrzeżenie', sub: 'impulsy odkodowane' },
        { id: 'e', x: 44, y: 66, w: 36, h: 28, label: 'Kodowanie emocjonalne', alt: ['ocena emocjonalna'], sub: 'podwzgórze i hipokamp: bezpieczny / zagrażający' }
      ],
      edges: [['d', 'p'], ['p', 'w'], ['w', 's'], ['w', 'e', 'dash']]
    },
    {
      id: 'neisser', q: 10, title: 'Cykl percepcyjny Neissera', ratio: 0.6,
      nodes: [
        { id: 'sch', x: 34, y: 4, w: 32, h: 22, label: 'Schemat', alt: ['schematy pamięciowe', 'schemat poznawczy'] },
        { id: 'eks', x: 66, y: 68, w: 33, h: 22, label: 'Eksploracja' },
        { id: 'inf', x: 1, y: 68, w: 33, h: 22, label: 'Informacja', alt: ['obiekt', 'dostępne dane', 'pobrana informacja'], sub: 'z otoczenia (obiekt)' }
      ],
      edges: [['sch', 'eks', 'line', 'kieruje'], ['eks', 'inf', 'line', 'pobiera'], ['inf', 'sch', 'line', 'modyfikuje']]
    },
    {
      id: 'tulving', q: 54, title: 'Hierarchia systemów pamięci Tulvinga', ratio: 0.55,
      nodes: [
        { id: 'epi', x: 22, y: 4, w: 56, h: 24, label: 'Pamięć epizodyczna', alt: ['epizodyczna'] },
        { id: 'sem', x: 14, y: 38, w: 72, h: 24, label: 'Pamięć semantyczna', alt: ['semantyczna'] },
        { id: 'proc', x: 6, y: 72, w: 88, h: 24, label: 'Pamięć proceduralna', alt: ['proceduralna'], sub: 'może działać niezależnie' }
      ],
      edges: [['proc', 'sem', 'line', 'nadbudowuje się'], ['sem', 'epi', 'line', 'nadbudowuje się']]
    },
    {
      id: 'hayes', q: 67, title: 'Przestrzeń problemu wg Hayesa', ratio: 0.45,
      nodes: [
        { id: 'start', x: 0.5, y: 36, w: 22, h: 28, label: 'Stan początkowy' },
        { id: 'mid', x: 30, y: 36, w: 40, h: 28, label: 'Stany pośrednie', alt: ['X1, X2 … Xn'], sub: 'X1, X2 … Xn' },
        { id: 'goal', x: 77.5, y: 36, w: 22, h: 28, label: 'Cel', alt: ['stan końcowy'] },
        { id: 'ops', x: 30, y: 2, w: 40, h: 22, label: 'Operatory', sub: 'kroki, operacje umysłowe' },
        { id: 'ogr', x: 30, y: 76, w: 40, h: 22, label: 'Ograniczenia', sub: 'reguły, normy' }
      ],
      edges: [['start', 'mid'], ['mid', 'goal'], ['ops', 'mid', 'dash'], ['ogr', 'mid', 'dash']]
    },
    {
      id: 'craik', q: 53, title: 'Poziomy przetwarzania – Craik i Lockhart', ratio: 0.55,
      nodes: [
        { id: 'l1', x: 2, y: 4, w: 60, h: 24, label: 'Analiza sensoryczna', alt: ['cechy fizyczne'], sub: 'poziom płytki' },
        { id: 'l2', x: 2, y: 38, w: 60, h: 24, label: 'Analiza semantyczna', alt: ['znaczenie', 'interpretacja znaczenia'], sub: 'poziom głębszy' },
        { id: 'l3', x: 2, y: 72, w: 60, h: 24, label: 'Aktywizacja dodatkowych treści', alt: ['skojarzenia', 'wzbogacanie wiedzy'], sub: 'poziom najgłębszy' },
        { id: 'ob', x: 70, y: 30, w: 29, h: 40, label: 'Wtórny obieg informacji', sub: 'typ 1: ten sam poziom · typ 2: głębszy' }
      ],
      edges: [['l1', 'l2'], ['l2', 'l3'], ['ob', 'l2', 'dash']]
    },
    {
      id: 'treisman', q: 26, title: 'Integracja cech – Treisman i Gelade', ratio: 0.42,
      nodes: [
        { id: 'b', x: 0.5, y: 30, w: 16, h: 40, label: 'Bodźce', given: true },
        { id: 'pre', x: 21, y: 18, w: 30, h: 64, label: 'Etap przeduwagowy', sub: 'automatycznie, równolegle: rejestracja cech fizycznych' },
        { id: 'att', x: 55, y: 18, w: 28, h: 64, label: 'Etap uwagowy', sub: 'kontrolowane scalanie cech' },
        { id: 's', x: 86.5, y: 30, w: 13, h: 40, label: 'Spostrzeżenie', alt: ['obiekt'] }
      ],
      edges: [['b', 'pre'], ['pre', 'att'], ['att', 's']]
    },
    {
      id: 'myslenie', q: 63, title: 'Rodzaje myślenia', ratio: 0.55,
      nodes: [
        { id: 'root', x: 35, y: 3, w: 30, h: 17, label: 'Myślenie', given: true },
        { id: 'aut', x: 4, y: 36, w: 32, h: 17, label: 'Autystyczne', sub: 'bez celu, np. fantazjowanie' },
        { id: 'real', x: 60, y: 36, w: 32, h: 17, label: 'Realistyczne', sub: 'służy celowi' },
        { id: 'repro', x: 38, y: 74, w: 20, h: 22, label: 'Reproduktywne', alt: ['odtwórcze'], sub: 'jedno rozwiązanie' },
        { id: 'prod', x: 60, y: 74, w: 20, h: 22, label: 'Produktywne', sub: 'twórcze / odtwórcze' },
        { id: 'kryt', x: 82, y: 74, w: 17, h: 22, label: 'Krytyczne' }
      ],
      edges: [['root', 'aut'], ['root', 'real'], ['real', 'repro'], ['real', 'prod'], ['real', 'kryt']]
    }
  ],

  // Porównania: kolumny + aspekty (wartości w kolejności kolumn)
  comparisons: [
    {
      id: 'filtry', qs: [24, 25], title: 'Teorie selekcji: Broadbent, Treisman, Deutsch i Deutsch',
      cols: ['Broadbent', 'Treisman', 'Deutsch i Deutsch'],
      aspects: [
        ['Nazwa modelu', 'filtr („zwrotnica”), wczesna selekcja', 'model osłabiania (lejka)', 'późna selekcja'],
        ['Co z informacją nieważną', 'blokowana – „wszystko albo nic”', 'osłabiana; jeśli ważna – przejdzie dalej', 'analizowana jak wszystko; odrzucana dopiero przy reakcji'],
        ['Kryterium selekcji', 'cechy fizyczne', 'także znaczenie (zasada semantyczna)', 'funkcjonalne – co potrzebne do działania'],
        ['Kiedy zachodzi selekcja', 'wcześnie – na poziomie percepcji', 'etapami: cechy fizyczne → wzorce → znaczenie', 'późno – przy organizowaniu reakcji'],
        ['Badanie', 'technika cienia (shadowing) w słuchaniu dwuusznym', 'zamiana treści między kanałami, efekt synonimu', 'Gray i Wedderburn („droga ciocia Janka”)']
      ]
    },
    {
      id: 'robocza', qs: [46, 47], title: 'Pamięć robocza: Baddeley i Hitch vs Cowan',
      cols: ['Baddeley i Hitch', 'Cowan'],
      aspects: [
        ['Czym jest pamięć robocza', 'osobny system styku pamięci i procesów poznawczych', 'aktywna (uaktywniona uwagą) część pamięci trwałej'],
        ['Budowa', 'CSW + pętla fonologiczna + notes wzrokowo-przestrzenny + bufor epizodyczny', 'poziomy aktywacji: ognisko uwagi, poziom STM, pamięć trwała'],
        ['Podsystemy', 'są – „niewolnicze”, odciążają centralę', 'brak osobnych podsystemów – system jednolity'],
        ['Rola centralnego systemu wykonawczego', 'kieruje uwagą, kontroluje, rozumuje; sekwencyjny', 'steruje poziomem aktywacji (kieruje uwagę)'],
        ['Przykład / dowód', 'przy obciążeniu 6 cyframi rozumowanie zwalnia', 'bodźce nowe trafiają do ogniska uwagi, znane – tylko do STM']
      ]
    },
    {
      id: 'semepi', qs: [49], title: 'Pamięć semantyczna vs epizodyczna (Tulving)',
      cols: ['Semantyczna', 'Epizodyczna'],
      aspects: [
        ['Jednostki', 'fakty, idee, pojęcia', 'zdarzenia, epizody'],
        ['Organizacja', 'pojęciowa (hierarchiczna)', 'czasowa (oś czasu)'],
        ['Odniesienie', 'świat', 'Ja'],
        ['Typ wiedzy', '„wiem”', '„pamiętam”'],
        ['Dostęp', 'automatyczny', 'dowolny, kontrolowany'],
        ['Skutek wydobycia', 'brak – system bez zmian', 'system się zmienia'],
        ['Podatność na amnezję', 'odporna', 'wrażliwa'],
        ['Pytanie wydobywcze', 'Co?', 'Kiedy? Gdzie?']
      ]
    },
    {
      id: 'autokontr', qs: [31], title: 'Procesy automatyczne vs kontrolowane',
      cols: ['Automatyczne', 'Kontrolowane'],
      aspects: [
        ['Świadomość', 'niewymagana', 'wymagana'],
        ['Zasoby uwagi', 'małe zapotrzebowanie', 'duże zapotrzebowanie'],
        ['Przetwarzanie', 'równoległe', 'sekwencyjne'],
        ['Typ zadania', 'znane i łatwe', 'nowe i trudne'],
        ['Szybkość', 'duża', 'mała'],
        ['Wysiłek', 'mały lub żaden', 'duży'],
        ['Modyfikacja', 'trudna (np. efekt Stroopa)', 'łatwa']
      ]
    },
    {
      id: 'deklproc', qs: [55], title: 'Pamięć deklaratywna vs proceduralna (Winograd)',
      cols: ['Deklaratywna', 'Proceduralna'],
      aspects: [
        ['Typ wiedzy', '„wiem, że”', '„wiem, jak”'],
        ['Posiadanie', '0–1: wiem albo nie', 'w dowolnym stopniu'],
        ['Nabywanie', 'dyskretnie (skokowo)', 'stopniowo, przez wykonywanie'],
        ['Przekazywanie', 'werbalnie', 'najlepiej zademonstrować'],
        ['Reprezentacja', 'sieć twierdzeń', 'sieć produkcji'],
        ['Świadomość', 'świadoma', 'nieświadoma, ale możliwa do uświadomienia']
      ]
    },
    {
      id: 'pojecia', qs: [57, 58, 61, 62], title: 'Trzy poglądy na strukturę pojęć (Cohen)',
      cols: ['Klasyczny', 'Probabilistyczny', 'Egzemplarzowy'],
      aspects: [
        ['Struktura', 'cechy definicyjne', 'cechy definicyjne i charakterystyczne, prototyp', 'ważny egzemplarz lub zbiór egzemplarzy'],
        ['Granice pojęcia', 'ostre (zero-jedynkowe)', 'nieostre – szara strefa', 'podobieństwo do znanego egzemplarza'],
        ['Nabywanie', 'abstrahowanie właściwości', 'abstrahowanie cech typowych (budowa prototypu)', 'doświadczanie egzemplarzy'],
        ['Kategoryzacja', 'porównanie cech definicyjnych', 'porównanie z prototypem, dystans semantyczny', 'porównanie z ważnym egzemplarzem'],
        ['Zakres', 'pojęcia abstrakcyjne, matrycowe', 'pojęcia naturalne, konkretne', 'pojęcia naturalne, konkretne']
      ]
    },
    {
      id: 'obraz', qs: [15], title: 'Stanowisko obrazowe vs abstrakcyjne',
      cols: ['Obrazowe', 'Abstrakcyjne'],
      aspects: [
        ['Autor', 'Kosslyn', 'Pylyshyn'],
        ['Jak zapisane są wyobrażenia', 'pierwotny kod obrazowy, analogowy obraz umysłowy', 'zespół sądów (twierdzeń)'],
        ['Status obrazów w wyobraźni', 'quasi-obrazy (reprezentacje płytkie), mają wielkość i położenie', 'epifenomeny – realnie nie istnieją'],
        ['Od czego zależy czas tworzenia', 'od operacji analogowych (kąt, odległość)', 'od liczby sądów do rozważenia'],
        ['Dowody', 'rotacje, skaning, izomorfizm funkcjonalny', '—']
      ]
    },
    {
      id: 'zapominanie', qs: [45], title: 'Zapominanie w STM: zanikanie vs interferencja',
      cols: ['Teoria zanikania', 'Teoria interferencji'],
      aspects: [
        ['Przyczyna zapominania', 'sam upływ czasu', 'zakłócenie śladu przez inne informacje'],
        ['Rodzaje', '—', 'retroaktywna (nowe wypiera stare) i proaktywna (stare hamuje nowe)'],
        ['Przykład', 'ślad z czasem coraz mniej wyrazisty', 'nowy PIN wypiera stary / stary PIN przeszkadza w nowym'],
        ['Badanie', 'Peterson i Peterson – po ok. 18 s prawie nic', 'Keppel i Underwood – w pierwszej próbie prawie brak zapominania']
      ]
    },
    {
      id: 'przyprozp', qs: [41, 42], title: 'Przypominanie vs rozpoznawanie',
      cols: ['Przypominanie', 'Rozpoznawanie'],
      aspects: [
        ['Na czym polega', 'samodzielne przywołanie odpowiedzi', 'wybór spośród podanych'],
        ['Wymagania', 'więcej operacji, pełniejsza informacja', 'informacja odróżniająca bodziec „stary” od nowych'],
        ['Słowa częste', 'łatwiej przypomnieć', 'trudniej rozpoznać'],
        ['Uczenie zamierzone', 'lepsze niż mimowolne', 'bez różnicy'],
        ['Występowanie osobno', 'nieświadomy plagiat (bez rozpoznania)', 'paramnezja, déjà vu (bez przypomnienia)'],
        ['Związek wg Loftusów', 'proces dwufazowy: przeszukiwanie + rozpoznawanie', 'jedna z faz przypominania']
      ]
    },
    {
      id: 'algheur', qs: [69], title: 'Algorytm vs heurystyka',
      cols: ['Algorytm', 'Heurystyka'],
      aspects: [
        ['Skuteczność', 'zawsze prowadzi do rozwiązania', 'nie gwarantuje sukcesu'],
        ['Określoność', 'ściśle określony, bez interpretacji', 'niedookreślona, dopuszcza interpretację'],
        ['Czym jest', 'skończony ciąg operacji dla wszystkich problemów danego typu', 'zestaw reguł: intuicje, triki, wskazówki'],
        ['Wada / zaleta', 'najskuteczniejszy, ale bywa czasochłonny', 'pozwala osiągać nowe cele'],
        ['Związek', '—', 'można ją zamienić w algorytm, spisując dokładnie kroki']
      ]
    },
    {
      id: 'ikoecho', qs: [5, 43], title: 'Pamięć ikoniczna vs echoiczna',
      cols: ['Ikoniczna', 'Echoiczna'],
      aspects: [
        ['Modalność', 'wzrokowa', 'słuchowa'],
        ['Czas przechowywania', 'krótszy – poniżej 1 s', 'dłuższy – ok. 2–4 s'],
        ['Pojemność', 'większa – ok. 8–9 elementów (ok. 3/4)', 'mniejsza – ok. 4–5 elementów'],
        ['Badanie', 'Sperling – raport częściowy (tony)', 'Moray, Bates i Barnett – dźwięki z 4 miejsc'],
        ['Skrót do zapamiętania', 'duża i krótka', 'mniejsza i dłuższa']
      ]
    },
    {
      id: 'strukturglebia', qs: [43, 53], title: 'Modele strukturalne vs głębokość przetwarzania',
      cols: ['Modele strukturalne', 'Craik i Lockhart'],
      aspects: [
        ['Budowa pamięci', 'osobne magazyny: sensoryczna, STM, LTM', 'jednolity proces pamięciowy'],
        ['O trwałości decyduje', 'magazyn, w którym jest informacja', 'głębokość przetwarzania'],
        ['Ślad pamięciowy', 'kopia informacji w magazynie', 'produkt uboczny analizy – zapis wykonanych operacji'],
        ['Badanie', 'Sperling, Glanzer i Cunitz (krzywe pozycyjne)', 'Craik i Tulving: 18% → 78% → 91% → 96%'],
        ['Krytyka', '—', 'brak niezależnej miary głębokości (błędne koło)']
      ]
    }
  ]
};

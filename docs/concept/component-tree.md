```
App (Wurzelkomponente, verwaltet grundlegendes Layout)
 ├── Header (Logo, Titel)
 │
 ├── EntryList (Verantwortlich für das Rendern der bisherigen Einträge)
 │    ├── EntryCard (Dumme UI-Komponente: Zeigt nur Titel, Tags, Datum eines Eintrags)
 │    └── LoadingSpinner (Wird angezeigt, während die KI den neuen Input analysiert)
 │
 └── InputSection (Unten am Bildschirm fixiert, bündelt die Eingabemöglichkeiten)
      ├── TextInput (Das klassische Eingabefeld als Fallback)
      └── VoiceRecordButton (Der dominante primäre Button mit Pulsier-Animation)
```
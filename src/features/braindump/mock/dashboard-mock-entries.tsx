import type { BrainDumpEntry } from "../types";

export const DASHBOARD_MOCK_ENTRIES: BrainDumpEntry[] = [
    {
        id: '1',
        created_at: new Date().toISOString(),
        title: 'Morgen Meeting mit KI-Team', // Optionaler Titel, hier als Beispiel gesetzt
        original_text: 'Morgen um 14 Uhr Meeting mit dem neuen KI-Team.',
        category: 'EVENT',
        payload: { date: '2026-05-24', time: '14:00' },
    },
    {
        id: '2',
        created_at: new Date(Date.now() - 3600000).toISOString(), // vor 1 Stunde
        title: 'Architektur-Doku abschließen', // Optionaler Titel, hier als Beispiel gesetzt
        original_text: 'Ich muss unbedingt noch die Architektur-Doku abschließen.',
        category: 'TASK',
        payload: { tags: ['Wichtig', 'Arbeit'] },
    },
    {
        id: '3',
        created_at: new Date(Date.now() - 7200000).toISOString(), // vor 2 Stunden
        title: 'Clean Code Prinzipien', // Optionaler Titel, hier als Beispiel gesetzt
        original_text: 'Clean Code bedeutet, Dateien nach ihrer Verantwortung zu trennen.',
        category: 'NOTE',
        payload: { tags: ['Prinzipien'] },
    },
    {
        id: '4',
        created_at: new Date(Date.now() - 10800000).toISOString(), // vor 3 Stunden
        title: 'Zahnarzt-Termin', // Optionaler Titel, hier als Beispiel gesetzt
        original_text: 'Zahnarzt-Termin nächsten Dienstag um 10:30 Uhr nicht vergessen.',
        category: 'EVENT',
        payload: { date: '2026-05-27', time: '10:30' },
    },
    {
        id: '5',
        created_at: new Date(Date.now() - 18000000).toISOString(), // vor 5 Stunden
        title: 'Einkaufsliste erstellen', // Optionaler Titel, hier als Beispiel gesetzt
        original_text: 'Einkaufsliste für das Wochenende erstellen: Reis, Gemüse, Olivenöl.',
        category: 'TASK',
        payload: { tags: ['Privat'] },
    },
    {
        id: '6',
        created_at: new Date(Date.now() - 86400000).toISOString(), // vor 1 Tag
        title: 'Braindump Widget Idee', // Optionaler Titel, hier als Beispiel gesetzt
        original_text: 'Idee: Braindump als Widget auf dem Homescreen anbieten – direkt diktieren ohne App zu öffnen.',
        category: 'NOTE',
        payload: { tags: ['Idee', 'PWA'] },
    },
    {
        id: '7',
        created_at: new Date(Date.now() - 12600000).toISOString(), // vor 3,5 Stunden
        title: 'Buchempfehlung von Max',
        original_text: 'Max hat "Atomic Habits" empfohlen – unbedingt lesen.',
        category: 'NOTE',
        payload: { tags: ['Lesen', 'Empfehlung'] },
    },
    {
        id: '8',
        created_at: new Date(Date.now() - 19800000).toISOString(), // vor 5,5 Stunden
        title: 'Sporteinheit planen',
        original_text: 'Dreimal die Woche laufen gehen, mindestens 30 Minuten.',
        category: 'TASK',
        payload: { tags: ['Gesundheit', 'Privat'] },
    },
    {
        id: '9',
        created_at: new Date(Date.now() - 57600000).toISOString(), // vor 16 Stunden
        title: 'Team-Retrospektive',
        original_text: 'Retro am Freitag um 16 Uhr – Raum B12 reservieren.',
        category: 'EVENT',
        payload: { date: '2026-05-31', time: '16:00' },
    },
    {
        id: '10',
        created_at: new Date(Date.now() - 64800000).toISOString(), // vor 18 Stunden
        title: 'API-Rate-Limiting Idee',
        original_text: 'Idee: Rate-Limiting pro User-Tier einführen statt global, damit Premium-Nutzer nicht leiden.',
        category: 'NOTE',
        payload: { tags: ['Idee', 'Backend', 'Arbeit'] },
    },
    {
        id: '11',
        created_at: new Date(Date.now() - 77400000).toISOString(), // vor 21,5 Stunden
        title: 'Rechnung an Kunden schicken',
        original_text: 'Rechnung für April noch nicht rausgeschickt – dringend nachholen.',
        category: 'TASK',
        payload: { tags: ['Arbeit', 'Wichtig'] },
    },
    {
        id: '12',
        created_at: new Date(Date.now() - 93600000).toISOString(), // vor 26 Stunden
        title: 'Geburtstag Jonas',
        original_text: 'Jonas hat am 12. Juni Geburtstag – Geschenk besorgen.',
        category: 'EVENT',
        payload: { date: '2026-06-12' },
    },
    {
        id: '13',
        created_at: new Date(Date.now() - 165000000).toISOString(), // vor ~46 Stunden
        title: 'Offline-Modus Gedanke',
        original_text: 'Die App sollte auch ohne Internet funktionieren – IndexedDB als lokaler Cache?',
        category: 'NOTE',
        payload: { tags: ['Idee', 'PWA', 'Technik'] },
    },
    {
        id: '14',
        created_at: new Date(Date.now() - 180000000).toISOString(), // vor 50 Stunden
        title: 'Kühlschrank abtauen',
        original_text: 'Kühlschrank ist vereist – Wochenende abtauen.',
        category: 'TASK',
        payload: { tags: ['Haushalt', 'Privat'] },
    },
    {
        id: '15',
        created_at: new Date(Date.now() - 198000000).toISOString(), // vor 55 Stunden
        title: 'Standup verschoben',
        original_text: 'Daily Standup morgen um 9:30 statt 9:00 – Teams-Link bleibt gleich.',
        category: 'EVENT',
        payload: { date: '2026-05-29', time: '09:30' },
    },
    {
        id: '16',
        created_at: new Date(Date.now() - 223200000).toISOString(), // vor ~62 Stunden
        title: 'Dark Mode Feedback',
        original_text: 'Mehrere Nutzer wünschen sich einen Dark Mode – in Backlog aufnehmen.',
        category: 'NOTE',
        payload: { tags: ['Feedback', 'PWA', 'Idee'] },
    },
]
# Ollama Power-Interface

Professionelle Benutzeroberfläche für die Interaktion mit lokal gehosteten großen Sprachmodellen (LLMs) über die Ollama-API. Diese Anwendung dient als Kommandozentrale für Power-User und überwindet die Limitierungen von Standard-Chat-Interfaces.

## Funktionen

- **Multi-Chat-Ansicht**: Gleichzeitige Anzeige von mindestens fünf Chat-Fenstern in einem mehrspaltigen Layout
- **Unabhängige Konversationen**: Jedes Chat-Fenster verwaltet eine eigene, unabhängige Konversation
- **Modell-Management**: Individuelle Modellauswahl pro Chat-Fenster mit automatischer Erkennung verfügbarer Ollama-Modelle
- **System-Prompt-Bibliothek**: Verwaltung und Wiederverwendung von System-Prompts zur Steuerung des LLM-Verhaltens
- **Token-Management**: Echtzeit-Token-Zählung mit konfigurierbaren Warnschwellen
- **Automatische Zusammenfassung**: Geführter Workflow zur Konversationsfortsetzung bei Token-Limit-Erreichen
- **Docker-Integration**: Vollständige Containerisierung für einfache Bereitstellung

## Technische Anforderungen

- Docker und Docker Compose
- Ollama-Installation (wird automatisch über Docker bereitgestellt)
- Moderne Webbrowser (Chrome, Firefox, Safari, Edge)

## Installation und Start

1. Repository klonen:
```bash
git clone https://github.com/ladisch-business/multichat.git
cd multichat
```

2. Anwendung starten:
```bash
docker-compose up
```

3. Browser öffnen und zu `http://localhost:3000` navigieren

Die Anwendung lädt automatisch die verfügbaren Ollama-Modelle und ist sofort einsatzbereit.

## Verwendung

### Erste Schritte

1. **Modelle laden**: Beim ersten Start werden automatisch die verfügbaren Ollama-Modelle geladen
2. **Chat-Fenster konfigurieren**: Wählen Sie für jedes Chat-Fenster ein Modell und optional einen System-Prompt
3. **Konversation beginnen**: Geben Sie Ihre Nachricht ein und drücken Sie Enter oder klicken Sie auf Senden

### System-Prompt-Bibliothek

- Klicken Sie auf "Prompt-Bibliothek" um System-Prompts zu verwalten
- Erstellen Sie neue Prompts mit Namen, Kategorie und Inhalt
- Weisen Sie Prompts schnell einzelnen Chat-Fenstern zu

### Token-Management

- Die Token-Anzahl wird in Echtzeit für jede Konversation angezeigt
- Bei Erreichen des konfigurierbaren Schwellenwerts (Standard: 90%) erscheint eine Warnung
- Nutzen Sie die automatische Zusammenfassung um Konversationen fortzusetzen

### Einstellungen

- **Token-Warnschwelle**: Anpassung des Prozentsatzes für Token-Warnungen (50-95%)
- **Maximale Chat-Fenster**: Anzahl der gleichzeitig angezeigten Chat-Fenster (3-10)

## API-Endpunkte

Die Anwendung nutzt folgende Ollama-API-Endpunkte:

- `GET /api/tags` - Liste verfügbarer Modelle
- `GET /api/show` - Modelldetails und Kontextlänge
- `POST /api/chat` - Chat-Nachrichten senden
- `POST /api/generate` - Antworten generieren

## Architektur

```
[Browser] <--> [Power-Interface Web-App (Docker)] <--> [Ollama-API (Docker)]
```

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js mit Express (API-Proxy)
- **Containerisierung**: Docker + Docker Compose
- **Netzwerk**: Privates Docker-Netzwerk für sichere Kommunikation

## Sicherheit

- Alle Kommunikation erfolgt im privaten Docker-Netzwerk
- Keine Daten verlassen das lokale System
- System-Prompts und Einstellungen werden lokal gespeichert

## Entwicklung

### Lokale Entwicklung

```bash
# Backend starten
npm install
npm run dev

# Frontend ist statisch und wird über Express bereitgestellt
```

### Projektstruktur

```
multichat/
├── docker-compose.yml          # Hauptkonfiguration
├── Dockerfile                  # Container-Definition
├── package.json               # Node.js-Abhängigkeiten
├── server.js                  # Express-Server
├── public/                    # Frontend-Dateien
│   ├── index.html            # Hauptanwendung
│   ├── css/                  # Stylesheets
│   └── js/                   # JavaScript-Module
└── data/                     # Persistente Daten
    ├── system-prompts.json   # Gespeicherte System-Prompts
    └── settings.json         # Benutzereinstellungen
```

## Fehlerbehebung

### Ollama-Verbindung

Wenn keine Modelle geladen werden:
1. Prüfen Sie, ob der Ollama-Container läuft: `docker-compose ps`
2. Überprüfen Sie die Logs: `docker-compose logs ollama`
3. Stellen Sie sicher, dass Modelle in Ollama verfügbar sind

### Performance

Bei langsamer Performance:
- Reduzieren Sie die Anzahl der Chat-Fenster in den Einstellungen
- Verwenden Sie kleinere Modelle für bessere Antwortzeiten
- Nutzen Sie die Zusammenfassungsfunktion bei langen Konversationen

## Abnahmekriterien

Das Projekt erfüllt alle spezifizierten Anforderungen:

✅ **FR-01**: Multi-Chat-Ansicht mit 5+ gleichzeitigen Chat-Fenstern  
✅ **FR-02**: Unabhängige Konversationsverwaltung pro Fenster  
✅ **FR-03**: Individuelles Modell-Management mit automatischer Erkennung  
✅ **FR-04**: System-Prompt-Bibliothek mit CRUD-Operationen  
✅ **FR-05**: Token-Zählung mit konfigurierbaren Warnschwellen  
✅ **FR-06**: Automatische Konversations-Zusammenfassung  

✅ **NFR-01**: Benutzerfreundliche, reaktionsschnelle Oberfläche  
✅ **NFR-02**: Performante Token-Zählung ohne UI-Blockierung  
✅ **NFR-03**: Sichere Kommunikation im privaten Docker-Netzwerk  
✅ **NFR-04**: Einfache Bereitstellung mit `docker-compose up`  

## Lizenz

MIT License

## Autor

Entwickelt von Devin AI für ladisch-business

---

**Link zur Devin-Sitzung**: https://app.devin.ai/sessions/d180d8e8c44b46c292888d6e8729ab69  
**Angefordert von**: @ladisch-business

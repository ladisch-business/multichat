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

## Server-Deployment (Produktion)

### Voraussetzungen für Server-Deployment

- Linux-Server (Ubuntu 20.04+ empfohlen)
- Docker und Docker Compose installiert
- nginx installiert
- Portainer (optional, für Container-Management)
- Domain oder Subdomain für die Anwendung

### 1. Server-Vorbereitung

```bash
# Docker und Docker Compose installieren (falls nicht vorhanden)
sudo apt update
sudo apt install docker.io docker-compose nginx

# Benutzer zur Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER

# nginx starten und aktivieren
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Anwendung auf Server bereitstellen

```bash
# Repository auf Server klonen
git clone https://github.com/ladisch-business/multichat.git
cd multichat

# Produktions-Docker-Compose-Datei erstellen
cp docker-compose.yml docker-compose.prod.yml
```

### 3. Produktions-Konfiguration

Erstellen Sie eine `docker-compose.prod.yml` für die Produktionsumgebung:

```yaml
version: '3.8'

services:
  ollama-power-interface:
    build: .
    container_name: multichat-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"  # Nur lokal erreichbar
    volumes:
      - ./data:/app/data
    depends_on:
      - ollama
    networks:
      - multichat-network
    environment:
      - NODE_ENV=production
      - OLLAMA_API_URL=http://ollama:11434

  ollama:
    image: ollama/ollama:latest
    container_name: multichat-ollama
    restart: unless-stopped
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - multichat-network
    # GPU-Unterstützung (optional)
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

volumes:
  ollama_data:

networks:
  multichat-network:
    driver: bridge
```

### 4. nginx Reverse Proxy Konfiguration

Erstellen Sie eine nginx-Konfiguration für Ihre Domain:

```bash
sudo nano /etc/nginx/sites-available/multichat
```

```nginx
server {
    listen 80;
    server_name ihre-domain.de;  # Ersetzen Sie durch Ihre Domain
    
    # Weiterleitung zu HTTPS (nach SSL-Setup)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ihre-domain.de;  # Ersetzen Sie durch Ihre Domain
    
    # SSL-Zertifikate (Let's Encrypt empfohlen)
    ssl_certificate /etc/letsencrypt/live/ihre-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ihre-domain.de/privkey.pem;
    
    # SSL-Sicherheitseinstellungen
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Sicherheits-Header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip-Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts für lange LLM-Antworten
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }
    
    # Statische Dateien cachen
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Site aktivieren:
```bash
sudo ln -s /etc/nginx/sites-available/multichat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL-Zertifikat mit Let's Encrypt

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d ihre-domain.de

# Automatische Erneuerung testen
sudo certbot renew --dry-run
```

### 6. Portainer für Container-Management

```bash
# Portainer installieren
docker volume create portainer_data

docker run -d -p 8000:8000 -p 9443:9443 \
    --name portainer --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest
```

Portainer ist dann unter `https://ihre-domain.de:9443` erreichbar.

### 7. Anwendung starten

```bash
# Produktionsumgebung starten
docker-compose -f docker-compose.prod.yml up -d

# Status prüfen
docker-compose -f docker-compose.prod.yml ps

# Logs anzeigen
docker-compose -f docker-compose.prod.yml logs -f
```

### 8. Systemd-Service (optional)

Für automatischen Start beim Systemstart:

```bash
sudo nano /etc/systemd/system/multichat.service
```

```ini
[Unit]
Description=Multichat Ollama Power Interface
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/multichat
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable multichat.service
sudo systemctl start multichat.service
```

### 9. Monitoring und Wartung

```bash
# Container-Status überwachen
docker-compose -f docker-compose.prod.yml ps

# Logs überwachen
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Updates durchführen
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Backup der Daten
tar -czf multichat-backup-$(date +%Y%m%d).tar.gz data/
```

### 10. Firewall-Konfiguration

```bash
# UFW Firewall konfigurieren
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 9443  # Portainer (optional)
sudo ufw enable
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

### Server-spezifische Probleme

**nginx-Fehler:**
```bash
# nginx-Konfiguration testen
sudo nginx -t

# nginx-Logs prüfen
sudo tail -f /var/log/nginx/error.log
```

**SSL-Probleme:**
```bash
# Zertifikat-Status prüfen
sudo certbot certificates

# Zertifikat erneuern
sudo certbot renew
```

**Docker-Container-Probleme:**
```bash
# Container neu starten
docker-compose -f docker-compose.prod.yml restart

# Container-Logs prüfen
docker-compose -f docker-compose.prod.yml logs ollama-power-interface
```

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

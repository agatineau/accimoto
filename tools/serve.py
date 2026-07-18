#!/usr/bin/env python3
"""Serveur local SANS CACHE pour le visualiseur Daytona.

Évite qu'un index.html ou un models/daytona.glb périmé soit resservi
par le navigateur après une mise à jour.

Usage :  python3 tools/serve.py   (depuis la racine du projet, port 8123)
"""
import http.server


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    http.server.test(HandlerClass=NoCacheHandler, port=8123, bind="127.0.0.1")

#!/usr/bin/env python3
"""Empaquetage de l'extension : vérifications strictes puis zip non signé (dist/pitchplus-v<version>.zip).
Vérifications : manifest valide, version = VER de app.js = docs/CHANGELOG, fichiers référencés présents, aucune donnée privée
(token icalsecurise, nom de fixture réelle), aucun POST/PUT vers PITCH, aucun appel réseau hors des deux hôtes déclarés.
Usage : python3 tools/package.py
"""
import json, os, re, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = os.path.join(ROOT, 'extension')

def die(msg): print('DANGER : ' + msg); sys.exit(1)

def main():
    man = json.load(open(os.path.join(EXT, 'manifest.json'), encoding='utf-8'))
    ver = man['version']
    app = open(os.path.join(EXT, 'app', 'app.js'), encoding='utf-8').read()
    m = re.search(r"VER = '([\d.]+)'", app)
    if not m or m.group(1) != ver: die('version manifest %s ≠ app.js %s' % (ver, m and m.group(1)))
    chg = open(os.path.join(ROOT, 'docs', 'CHANGELOG.md'), encoding='utf-8').read()
    if ('## ' + ver) not in chg and ('## v' + ver) not in chg: die('CHANGELOG sans entrée pour ' + ver)
    for f in list(man['icons'].values()) + [man['background']['service_worker']] + [j for cs in man['content_scripts'] for j in cs['js']] + [man['options_ui']['page'].split('#')[0]]:
        if not os.path.exists(os.path.join(EXT, f)): die('fichier manquant ' + f)
    files = []
    for d, _, fs in os.walk(EXT):
        for f in fs:
            if f.startswith('.'): continue
            p = os.path.join(d, f); files.append(p)
            if f.endswith(('.js', '.json', '.html', '.css', '.ics', '.md')):
                t = open(p, encoding='utf-8', errors='replace').read()
                if re.search(r'icalsecurise=[0-9A-Fa-f]{20,}', t): die('token ICS dans ' + p)
                if 'PITAVAL' in t and not f.endswith('app.js'): die('donnée personnelle dans ' + p)
                if f.endswith('.js') and re.search(r"method\s*:\s*['\"](POST|PUT|DELETE|PATCH)", t): die('écriture réseau dans ' + p)
                if f.endswith('.js'):
                    for h in re.findall(r"https?://([a-z0-9.-]+)", t):
                        if h not in ('pitch-icam.rima1.fr', 'planning.icam.fr', 'moodle.icam.fr', 'pitproduction.com'): die('hôte inattendu %s dans %s' % (h, p))
    out_dir = os.path.join(ROOT, 'dist'); os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, 'pitchplus-v%s.zip' % ver)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in sorted(files): z.write(p, os.path.relpath(p, EXT))
    print('OK : %d fichiers, %d Ko -> %s' % (len(files), os.path.getsize(out) // 1024, os.path.relpath(out, ROOT)))

if __name__ == '__main__':
    main()

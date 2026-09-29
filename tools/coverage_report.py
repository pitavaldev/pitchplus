#!/usr/bin/env python3
"""Rapport de couverture : événements Hyperplanning (ICS) -> unités du dataset syllabus.
ATTENTION : ce script reporte en Python la normalisation de extension/lib/units.js (normUnit,
resolveUnit, isIgnored, yearFromCalname) parce que la machine cible n'a pas de Node. Toute
modification de units.js doit être répercutée ici ; tests/units.test.js fixe les cas de référence.
Usage : python3 tools/coverage_report.py --ics fixtures/private/Edt_PITAVAL.ics --data extension/data/syllabus.BI.json [--md docs/reports/coverage-ics.md]
Aucune donnée personnelle n'est écrite dans le rapport (pas de nom, pas d'URL, pas de X-WR-CALNAME).
"""
import argparse, json, re, collections, os, datetime, unicodedata

def unfold(t):
    t = t.replace('\r\n', '\n')
    return re.sub(r'\n[ \t]', '', t)

def prop(ev, name):
    m = re.search(r'^' + name + r'(?:;[^:]*)?:(.*)$', ev, re.M)
    return m.group(1) if m else ''

def unescape(s):
    return s.replace('\\,', ',').replace('\;', ';').replace('\\n', '\n').replace('\\\\', '\\')

def parse_desc(desc):
    f = {}
    for p in re.split(r'\n', unescape(desc)):
        m = re.match(r'\s*([^:]+?)\s*:\s*(.*)$', p)
        if m: f[m.group(1)] = m.group(2).strip()
    return f

def norm_unit(mat):
    seg = mat.split(' - ')[0].strip()
    seg = ''.join(c for c in unicodedata.normalize('NFD', seg) if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', '_', seg.upper())


def is_ignored(code, prefixes):
    for p in prefixes:
        q = ''.join(c for c in unicodedata.normalize('NFD', p) if unicodedata.category(c) != 'Mn').upper()
        if code == q or code.startswith(q + '_'):
            return True
    return False

def load_aliases(path):
    a = json.load(open(path, encoding='utf-8'))
    return a['aliases'], a['ignore']['prefixes']

def sem_of_date(d, year_code):
    # d = datetime, year_code = 'B2' -> B2.3 (août-janv) / B2.4 (févr-juil)
    n = {'BP': ('Bp.1', 'Bp.2'), 'B1': ('B1.1', 'B1.2'), 'B2': ('B2.3', 'B2.4'), 'B3': ('B3.5', 'B3.6')}.get(year_code.upper())
    if not n: return ''
    return n[0] if d.month >= 8 or d.month == 1 else n[1]

def resolve(code, sem, aliases, units_upper):
    al = aliases.get(code)
    if isinstance(al, dict): al = al.get(sem)
    if al: code = al
    return units_upper.get(code.upper())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ics', required=True); ap.add_argument('--data', required=True); ap.add_argument('--aliases', default='extension/data/aliases.json')
    ap.add_argument('--md'); ap.add_argument('--year', default='')
    a = ap.parse_args()
    data = json.load(open(a.data, encoding='utf-8'))
    units_upper = {k.upper(): k for k in data['units']}
    aliases, ignore = load_aliases(a.aliases)
    t = unfold(open(a.ics, encoding='utf-8').read())
    cal = prop(t, 'X-WR-CALNAME')
    m = re.search(r'\b([A-Za-z]{2,10})-(B[P123])\b', cal)
    year = a.year or (m.group(2).upper() if m else '')
    evs = re.findall(r'BEGIN:VEVENT(.*?)END:VEVENT', t, re.S)
    rows = collections.OrderedDict()
    n_ign = n_match = n_un = n_tot = 0
    for e in evs:
        n_tot += 1
        f = parse_desc(prop(e, 'DESCRIPTION'))
        mat = f.get('Matière', '')
        ds = prop(e, 'DTSTART'); d = datetime.datetime.strptime(ds[:8], '%Y%m%d')
        sem = sem_of_date(d, year)
        code = norm_unit(mat) if mat else norm_unit(unescape(prop(e, 'SUMMARY')))
        if is_ignored(code, ignore):
            n_ign += 1; key = ('ignore', code); rows.setdefault(key, {'n': 0, 'label': mat or prop(e, 'SUMMARY')[:50], 'unit': ''}); rows[key]['n'] += 1; continue
        unit = resolve(code, sem, aliases, units_upper)
        if unit:
            n_match += 1; key = ('ok', code)
            rows.setdefault(key, {'n': 0, 'label': mat, 'unit': unit, 'title': data['units'][unit].get('title_en') or data['units'][unit].get('title_fr'), 'sems': data['units'][unit].get('sems')})
        else:
            n_un += 1; key = ('miss', code); rows.setdefault(key, {'n': 0, 'label': mat, 'unit': ''})
        rows[key]['n'] += 1
    acad = n_tot - n_ign
    out = []
    out.append('# Couverture agenda Hyperplanning → syllabus')
    out.append('')
    out.append('Généré le %s. Année déduite du calendrier : `%s`. Dataset : `%s` (mapping %s, syllabus %s).' % (datetime.date.today().isoformat(), year or '?', os.path.basename(a.data), data['mappingYear'], data['syllabusYear']))
    out.append('')
    out.append('| | Événements |\n|---|---|')
    out.append('| Total | %d |\n| Hors compétences (ignorés) | %d |\n| Académiques | %d |\n| Appariés | %d (%.0f %% des académiques) |\n| Non appariés | %d |' % (n_tot, n_ign, acad, n_match, 100.0 * n_match / acad if acad else 0, n_un))
    out.append('')
    out.append('## Appariés\n\n| Hyperplanning | Unité | Titre syllabus | Semestre | Séances |\n|---|---|---|---|---|')
    for (k, c), r in rows.items():
        if k == 'ok': out.append('| `%s` | `%s` | %s | %s | %d |' % (r['label'], r['unit'], r.get('title', ''), ','.join(r.get('sems') or []), r['n']))
    out.append('\n## Non appariés\n\n| Hyperplanning | Code normalisé | Séances |\n|---|---|---|')
    for (k, c), r in rows.items():
        if k == 'miss': out.append('| `%s` | `%s` | %d |' % (r['label'], c, r['n']))
    out.append('\n## Hors compétences\n\n| Hyperplanning | Séances |\n|---|---|')
    for (k, c), r in rows.items():
        if k == 'ignore': out.append('| `%s` | %d |' % (r['label'], r['n']))
    txt = '\n'.join(out)
    print(txt)
    if a.md:
        os.makedirs(os.path.dirname(a.md), exist_ok=True)
        open(a.md, 'w', encoding='utf-8').write(txt + '\n')

if __name__ == '__main__':
    main()

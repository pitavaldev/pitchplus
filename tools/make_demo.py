#!/usr/bin/env python3
"""Jeu de démonstration : un ICS synthétique (étudiant fictif B2, Lille) + des réponses PITCH fictives.
Aucune donnée réelle : les dates, groupes, statuts sont générés (graine fixe). Sert au mode démo et aux tests.
Usage : python3 tools/make_demo.py --data extension/data/syllabus.BI.json --out fixtures/public
"""
import argparse, json, os, random, datetime, re

SEMS = ["Bp.1", "Bp.2", "B1.1", "B1.2", "B2.3", "B2.4", "B3.5", "B3.6"]
YEAR_OF = {"Bp.1": "2024-2025", "Bp.2": "2024-2025", "B1.1": "2025-2026", "B1.2": "2025-2026", "B2.3": "2026-2027", "B2.4": "2026-2027", "B3.5": "2027-2028", "B3.6": "2027-2028"}
SEMNO = {"Bp.1": 1, "Bp.2": 2, "B1.1": 1, "B1.2": 2, "B2.3": 1, "B2.4": 2, "B3.5": 1, "B3.6": 2}
CUR = "B2.3"  # semestre courant du démo ; « aujourd'hui » du mode démo = 2026-10-15
PAST = SEMS[:SEMS.index(CUR)]

def load_reverse_aliases(path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'extension', 'data', 'aliases.json')):
    """Inverse extension/data/aliases.json : code syllabus -> libellé Hyperplanning.
    Ainsi tout alias ajouté à la table est automatiquement exercé par la démo et les tests."""
    a = json.load(open(path, encoding='utf-8'))['aliases']
    rev = {}
    for hp, target in a.items():
        if isinstance(target, dict):
            for sem, unit in target.items():
                rev.setdefault(unit, hp)
        else:
            rev.setdefault(target, hp)
    return {u: hp.replace('_', ' ') for u, hp in rev.items()}


REV_ALIASES = load_reverse_aliases()


def hp_code(unit):
    # code syllabus -> libellé Hyperplanning (inverse de normUnit, alias compris)
    return REV_ALIASES.get(unit, unit.replace('_', ' '))

def ics_escape(s): return s.replace('\\', '\\\\').replace(',', '\\,').replace(';', '\;')

def fold(line):
    out = []; b = line.encode('utf-8')
    while len(b) > 74:
        cut = 74
        while cut > 0 and (b[cut] & 0xC0) == 0x80: cut -= 1
        out.append(b[:cut].decode('utf-8')); b = b' ' + b[cut:]
    out.append(b.decode('utf-8')); return '\r\n'.join(out)

def vevent(uid, start, end, typ, mat, teacher, room, promo, memo):
    desc = []
    if typ: desc.append('Type : ' + typ)
    desc.append('Matière : ' + mat); desc.append('Enseignant : ' + teacher); desc.append('Salle : ' + room); desc.append('Promotion : ' + promo)
    if memo: desc.append('Mémo : ' + memo)
    summ = ' - '.join([x for x in [typ, mat, teacher, promo, memo] if x])
    d = '\\n'.join(ics_escape(x) for x in desc) + '\\n'
    lines = ['BEGIN:VEVENT', 'CATEGORIES:HYPERPLANNING', 'DTSTAMP:20260904T120000Z', 'LAST-MODIFIED:20260801T080000Z', 'UID:' + uid,
             'DTSTART:' + start.strftime('%Y%m%dT%H%M%SZ'), 'DTEND:' + end.strftime('%Y%m%dT%H%M%SZ'),
             'SUMMARY;LANGUAGE=fr:' + ics_escape(summ), 'LOCATION;LANGUAGE=fr:' + ics_escape(room), 'DESCRIPTION;LANGUAGE=fr:' + d, 'END:VEVENT']
    return '\r\n'.join(fold(l) for l in lines)

def make_ics(data, rnd):
    U = data['units']
    b23 = [u for u, v in U.items() if v['sem'] == 'B2.3' and v['eval']]
    pbls = [u for u in b23 if v_type(U[u]) == 'PBL'][:7]
    exps = [u for u in b23 if v_type(U[u]) == 'Lecture'][:6]
    labs = [u for u in b23 if v_type(U[u]) == 'Labs'][:2]
    evs = []; n = 1000
    base = datetime.datetime(2026, 9, 7, 6, 0)  # lundi 7 sept 2026, 08:00 Paris (UTC+2)
    PH = ['Phase aller', 'Autonomie', 'Temps expert', 'Phase retour - discussion', 'Feedback', 'Evaluation', 'Capitalisation']
    for k, u in enumerate(pbls):
        for i, ph in enumerate(PH):
            day = base + datetime.timedelta(weeks=k // 2 + i * 1, days=(k * 2 + i) % 5, hours=(k % 3) * 2)
            if ph == 'Autonomie': typ = ''
            else: typ = 'PBL'
            evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, day, day + datetime.timedelta(hours=2), typ, hp_code(u) + ' - ' + (U[u]['title_en'] or u), 'DUPONT', 'LIL-LAC3.0%d (60) (BP)' % (k % 4 + 1), 'LIL-B2', ph)); n += 1
    for k, u in enumerate(exps):
        for i in range(4):
            day = base + datetime.timedelta(weeks=i * 2 + k // 3, days=(k + i) % 5, hours=8 + (k % 2) * 2)
            evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, day, day + datetime.timedelta(hours=2), 'Temps expert', hp_code(u) + ' - ' + (U[u]['title_en'] or u), 'MARTIN', 'LIL-LES2.02 (60) (B2)', 'LIL-B2', '')); n += 1
        day = base + datetime.timedelta(weeks=10 + k // 3, days=k % 5, hours=6)
        evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, day, day + datetime.timedelta(hours=2), 'Evaluation', hp_code(u) + ' - ' + (U[u]['title_en'] or u), 'MARTIN', 'LIL-LES2.02 (60) (B2) SALLE DE DS', 'LIL-B2', '')); n += 1
    for k, u in enumerate(labs):
        for i in range(3):
            day = base + datetime.timedelta(weeks=3 + i * 2, days=(k + 3) % 5, hours=2)
            evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, day, day + datetime.timedelta(hours=4), 'TP', hp_code(u) + ' - ' + (U[u]['title_en'] or u), 'BERNARD', 'LIL-LAB1 (24)', 'LIL-B2', 'TP1')); n += 1
    for i in range(12):
        day = base + datetime.timedelta(weeks=i, days=4, hours=6)
        evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, day, day + datetime.timedelta(hours=3), 'Projets', 'CROSSDISCIP BOAT - Transversal Project', 'ESCARE', 'LIL-FABLAB (40)', 'LIL-B2', '')); n += 1
    for i in range(10):
        day = base + datetime.timedelta(weeks=i, days=2, hours=10)
        evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, day, day + datetime.timedelta(hours=2), '', 'Sport', 'ROGEZ', 'LIL-SC 1 (120)', 'LIL-B2', '')); n += 1
    evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, base + datetime.timedelta(weeks=5, days=0, hours=8), base + datetime.timedelta(weeks=5, days=0, hours=10), '', 'RIM - Rencontres Icam Métier', 'CASTRO', 'LIL-SC 1 (120)', 'B3-LILLE, LIL-B2', '')); n += 1
    evs.append(vevent('Cours-%d-1-DEMO_Etudiant-Index-Education' % n, base + datetime.timedelta(weeks=6, days=1, hours=6), base + datetime.timedelta(weeks=6, days=1, hours=8), 'PBL', 'EEE LAB5 - EEE Labs skills', 'MARTIN', 'LIL-LAB2 (24)', 'LIL-B2', 'Phase aller')); n += 1
    head = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID;LANGUAGE=fr:Copyright Index-Education - HYPERPLANNING 2026', 'METHOD:PUBLISH',
            'X-CALSTART:20260817T000000Z', 'X-CALEND:20270815T000000Z', 'X-WR-CALNAME;LANGUAGE=fr:HYP - DEMO Etudiant 01/01/2006 (LIL-B2 - LIL-B2\\, <TD> TD1)', 'X-WR-TIMEZONE:Europe/Paris']
    return '\r\n'.join(fold(l) for l in head) + '\r\n' + '\r\n'.join(evs) + '\r\nEND:VCALENDAR\r\n', pbls + exps + labs

def v_type(u): return u.get('type') or ''

def make_pitch(data, rnd, agenda_units):
    U, A, C, R, K = data['units'], data['aas'], data['crits'], data['ras'], data['comps']
    subs = [{'Code': 'BI-' + s.replace('.', ''), 'Title': s, 'Serie': str(i + 1)} for i, s in enumerate(SEMS)]
    code_of = {s: 'BI-' + s.replace('.', '') for s in SEMS}
    fx = {}
    fx['/api/Program?culture=fr-fr'] = [{'ProgramCode': 'BI', 'VersionCode': 'BI-2024', 'Title': 'Bachelor International', 'SousPrograms': subs}]
    base = '&ProgramCode=BI&VersionCode=BI-2024&culture=fr-fr'
    # Les intitulés français des compétences n'existent que dans PITCH ; le syllabus PDF est en anglais.
    # Plutôt que d'afficher de l'anglais dans une démo française, on ne donne que le code.
    fx['/api/SkillBlock?ProgramCode=BI&VersionCode=BI-2024&culture=fr-fr&simpleversion=false'] = [{'Code': c, 'Title': c} for c in K]
    # AA du périmètre : celles du PDF (semestre connu)
    aas = {a: v for a, v in A.items() if v['sem'] and v['ra']}
    by_ra = {}
    for a, v in aas.items(): by_ra.setdefault(v['ra'], []).append(a)
    for cc in K:
        ras = sorted(r for r in by_ra if R.get(r, {}).get('comp') == cc)
        fx['/api/LearningGoal?BlockCode=%s&Graph=Bar%s' % (cc, base)] = [{'LGCode': r, 'Title': R[r].get('title_fr') or R[r].get('title_en')} for r in ras]
        for r in ras:
            los = []
            for a in by_ra[r]:
                v = aas[a]
                # sessions par critère
                traits = []
                nok = 0
                for c in v['crits']:
                    units = C[c]['eval']
                    cl = []
                    for u in units:
                        us = U[u]['sem']
                        if us not in SEMS: continue
                        if us in PAST:
                            ok = rnd.random() < 0.62
                            cl.append({'CourseStatus': 1 if ok else 2, 'CourseCode': u, 'Title': U[u].get('title_fr') or U[u].get('title_en') or u, 'ProgramTitle': us, 'ProgramSerie': str(SEMS.index(us) + 1),
                                       'GroupCode': "Semestre %d de l'année %s" % (SEMNO[us], YEAR_OF[us])})
                        elif us == CUR and u in agenda_units and rnd.random() < 0.5:
                            cl.append({'CourseStatus': 4, 'CourseCode': u, 'Title': U[u].get('title_fr') or U[u].get('title_en') or u, 'ProgramTitle': us, 'ProgramSerie': str(SEMS.index(us) + 1), 'GroupCode': ''})
                    if any(x['CourseStatus'] == 1 for x in cl): nok += 1
                    traits.append({'TraitCode': '%s-%s-%s' % (r, a, c), 'TraitTitle': C[c].get('label_fr') or C[c].get('label_en') or c, 'CourseList': cl})
                sems = sorted({U[u]['sem'] for c in v['crits'] for u in C[c]['eval'] if U[u]['sem'] in SEMS} | {v['sem']}, key=SEMS.index)
                prog = round(100.0 * nok / len(v['crits']), 1) if v['crits'] else None
                los.append({'Code': a, 'Title': v.get('title_fr') or v.get('title_en'), 'Progress': prog, 'ProgramList': [{'ProgramCode': code_of[s]} for s in sems], 'MinPrgPct': 50, 'MinAcqPct': 100})
                fx['/api/locdetail?ParentProgramCode=BI&LGCode=%s&LOCode=%s&culture=fr-fr' % (r, a)] = traits
            fx['/api/LearningGoal?BlockCode=%s&LGCode=%s&Graph=Bar%s' % (cc, r, base)] = los
    return fx

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--data', required=True); ap.add_argument('--out', required=True); a = ap.parse_args()
    data = json.load(open(a.data, encoding='utf-8'))
    rnd = random.Random(2030)
    ics, agenda_units = make_ics(data, rnd)
    os.makedirs(a.out, exist_ok=True)
    open(os.path.join(a.out, 'demo.ics'), 'w', encoding='utf-8', newline='').write(ics)
    fx = make_pitch(data, rnd, set(agenda_units))
    json.dump(fx, open(os.path.join(a.out, 'pitch-demo.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    n_ev = ics.count('BEGIN:VEVENT'); n_aa = sum(1 for k in fx if k.startswith('/api/locdetail'))
    print('demo.ics : %d événements ; pitch-demo.json : %d réponses (%d AA)' % (n_ev, len(fx), n_aa))

if __name__ == '__main__':
    main()

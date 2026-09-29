#!/usr/bin/env python3
"""build-data : Excel (Mapping_LG_Course) + PDF (Syllabus) -> extension/data/syllabus.<PROG>.json

Stdlib uniquement. Le texte du PDF est extrait par PDFKit (macOS) via osascript ; sur une autre
plateforme, fournir un fichier texte déjà extrait avec --pdf-text (pdftotext -layout convient,
à condition de séparer les pages par une ligne "=== PAGE n ===").

Usage :
  python3 tools/build_data.py --xlsx "data/sources/Mapping_LG_Course BACHELOR 2025-2026.xlsx" \
      --pdf data/sources/Syllabus_BI_2026-2027.pdf --program BI --out extension/data/syllabus.BI.json
"""
import argparse, json, os, re, subprocess, sys, zipfile, datetime, collections
import xml.etree.ElementTree as ET

SEMS = ["Bp.1", "Bp.2", "B1.1", "B1.2", "B2.3", "B2.4", "B3.5", "B3.6"]
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'


# ----------------------------------------------------------------------------- Excel
def col2idx(c):
    n = 0
    for ch in c:
        n = n * 26 + ord(ch) - 64
    return n - 1


def read_xlsx(path):
    z = zipfile.ZipFile(path)
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    rmap = {r.get('Id'): r.get('Target') for r in rels}
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
    sheets = {}
    for s in wb.find('m:sheets', NS):
        target = rmap[s.get(RID)]
        p = 'xl/' + target if not target.startswith('/') else target[1:]
        root = ET.fromstring(z.read(p))
        rows = []
        for row in root.iter('{%s}row' % NS['m']):
            vals = {}
            for c in row.findall('m:c', NS):
                idx = col2idx(re.match(r'([A-Z]+)', c.get('r')).group(1))
                t = c.get('t'); v = c.find('m:v', NS); isel = c.find('m:is', NS)
                if t == 's' and v is not None: val = ss[int(v.text)]
                elif t == 'inlineStr' and isel is not None: val = ''.join(x.text or '' for x in isel.iter('{%s}t' % NS['m']))
                elif v is not None: val = v.text
                else: val = ''
                vals[idx] = (val or '').strip()
            rows.append(vals)
        sheets[s.get('name')] = rows
    return sheets


def parse_excel(path, log):
    sh = read_xlsx(path)
    det = sh.get('Detailed view') or []
    main = sh.get('Main view') or []
    aas, crits, units, ras = {}, {}, {}, {}
    year = ''
    n_def = n_map = n_eval = n_contrib = n_contrib_crit = 0
    for r in det:
        g = lambda i: r.get(i, '')
        if not g(0) or not g(2): continue
        year = year or g(1)
        ra, comp, aa, unit, utitle, contrib, crit, clabel, flag = g(2), g(4), g(5) or g(6), g(8), g(10), g(11), g(12), g(14), g(15)
        if not re.match(r'^AA-', aa): continue
        dom = aa.split('-')[1] if aa.count('-') >= 2 else ''
        ras.setdefault(ra, {'code': ra, 'comp': comp, 'title_fr': '', 'title_en': ''})
        a = aas.setdefault(aa, {'code': aa, 'ra': ra, 'comp': comp, 'domain': dom, 'sem': '', 'title_fr': '', 'title_en': '', 'crits': []})
        if crit:
            c = crits.setdefault(crit, {'code': crit, 'label_fr': '', 'label_en': '', 'modality': '', 'aas': [], 'eval': [], 'contrib': []})
            if clabel and not c['label_fr']: c['label_fr'] = clabel
            if aa not in c['aas']: c['aas'].append(aa)
            if crit not in a['crits']: a['crits'].append(crit)
        if not unit:
            n_def += 1
            continue
        n_map += 1
        u = units.setdefault(unit, {'code': unit, 'title_fr': '', 'title_en': '', 'type': '', 'sem_excel': '', 'sems': [], 'domains': [], 'lang': '',
                                    'ftf': None, 'std': None, 'tlh': None, 'moodle': '', 'description': '', 'teachers': [], 'sessions': [],
                                    'aas': [], 'contrib_aas': [], 'eval': [], 'contrib': [], 'sources': []})
        if utitle and not u['title_fr']: u['title_fr'] = utitle
        if 'excel' not in u['sources']: u['sources'].append('excel')
        if aa not in u['aas'] and aa not in u['contrib_aas'] and not contrib: u['aas'].append(aa)
        if contrib:
            n_contrib += 1
            if aa not in u['contrib_aas']: u['contrib_aas'].append(aa)
            if crit:
                n_contrib_crit += 1
                if crit not in u['contrib']: u['contrib'].append(crit)
                if unit not in crits[crit]['contrib']: crits[crit]['contrib'].append(unit)
        elif crit and flag == '1':
            n_eval += 1
            if crit not in u['eval']: u['eval'].append(crit)
            if unit not in crits[crit]['eval']: crits[crit]['eval'].append(unit)
        elif crit:
            log('excel: ligne inattendue (crit sans flag 1 ni Contribue) %s %s' % (unit, crit))
    # Main view : titres FR des RA / AA, semestre des unités
    if main:
        for rowi in (1, 2):
            for v in main[rowi].values():
                m = re.match(r'^(RA-[A-Z]+-C\d+-\d+|AA-[A-Z]+-C\d+-\d+-\d+) - (.+)$', v)
                if not m: continue
                code, title = m.group(1), m.group(2).strip()
                if code in ras and not ras[code]['title_fr']: ras[code]['title_fr'] = title
                if code in aas and not aas[code]['title_fr']: aas[code]['title_fr'] = title
        sem = ''
        for r in main[4:]:
            first = r.get(0, '')
            ms = re.match(r'^B[p0-9], (B[p0-9]\.\d)$', first)
            if ms: sem = ms.group(1); continue
            mu = re.match(r'^([A-Za-z0-9_.-]+) - (.+)$', first)
            if mu and mu.group(1) in units:
                u = units[mu.group(1)]
                u['sem_excel'] = sem
                if not u['title_fr']: u['title_fr'] = mu.group(2).strip()
    stats = {'year': year, 'rows_definition': n_def, 'rows_mapping': n_map, 'rows_eval': n_eval, 'rows_contrib': n_contrib,
             'rows_contrib_with_crit': n_contrib_crit, 'units': len(units), 'aas': len(aas), 'crits': len(crits), 'ras': len(ras)}
    return aas, crits, units, ras, stats


# ----------------------------------------------------------------------------- PDF
JXA = r'''
ObjC.import("Quartz"); ObjC.import("Foundation");
var u=$.NSURL.fileURLWithPath("%s"); var d=$.PDFDocument.alloc.initWithURL(u); var n=d.pageCount; var out=[];
for (var i=0;i<n;i++){ out.push("=== PAGE "+(i+1)+" ===\n"+ObjC.unwrap(d.pageAtIndex(i).string)); }
var s=$.NSString.alloc.initWithUTF8String(out.join("\n"));
s.writeToFileAtomicallyEncodingError("%s", true, $.NSUTF8StringEncoding, null); "" + n
'''


def pdf_text(pdf, cache):
    if cache and os.path.exists(cache) and os.path.getmtime(cache) >= os.path.getmtime(pdf):
        return open(cache, encoding='utf-8').read()
    out = cache or (pdf + '.txt')
    r = subprocess.run(['osascript', '-l', 'JavaScript', '-e', JXA % (pdf, out)], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit('extraction PDF impossible (osascript) : ' + r.stderr)
    return open(out, encoding='utf-8').read()


FOOTER = re.compile(r'^(Icam \d\d/\d\d/\d{4} \S+|\d*Page \d+ of\s*\d*|\d{3}|=== PAGE \d+ ===|Icam International Bachelor\'s|-)$')
RE_HEAD = re.compile(r'^SYLLABUS - COURSE UNIT DESIGN - (\d{4}-\d{4})$')
RE_CRIT = re.compile(r'^(CRIT[A-Za-z0-9_-]*) - (.*)$')
RE_MOD = re.compile(r'\(([A-Z][^(),]*), ([A-Z][^(),]*)\)$')
RE_AA_SK = re.compile(r'^(AA-[A-Z]+-C\d+-\d+-\d+) / (.*)$')
RE_RA_SK = re.compile(r'^(RA-[A-Z]+-C\d+-\d+) / (.*)$')
RE_AA_CR = re.compile(r'^(AA-[A-Z]+-C\d+-\d+-\d+) - (.*)$')
RE_TEACH = re.compile(r'^(.+?), (Icam.*) - (\S+@[\w.-]+\.[a-z]{2,})$')
RE_MAIL_END = re.compile(r'\S+@[\w.-]+\.[a-z]{2,}$')
RE_SESS = re.compile(r'^(\d{1,2}) (.+?)(?: (\d+\.\d\d))?$')


def fix_sessions(sess):
    out = []
    for s in sess:
        topic = re.sub(r'\s*(ASSIGNMENTS & ASSESSMENTS|PEDAGOGICAL METHODS.*)$', '', s['topic']).strip()
        parts = re.split(r' (\d{1,2}) (?=[A-Z])', topic)
        if len(parts) > 1:
            out.append({'n': s['n'], 'topic': parts[0].strip(), 'hours': None})
            for k in range(1, len(parts) - 1, 2):
                out.append({'n': int(parts[k]), 'topic': parts[k + 1].strip(), 'hours': None})
        else:
            out.append({'n': s['n'], 'topic': topic, 'hours': s['hours']})
    return out


def parse_pdf(text, log):
    lines = [l.rstrip() for l in text.split('\n')]
    lines = [l for l in lines if not FOOTER.match(l.strip())]
    # découpage en blocs d'unités
    idx = [i for i, l in enumerate(lines) if RE_HEAD.match(l)]
    year = RE_HEAD.match(lines[idx[0]]).group(1) if idx else ''
    units, aas, ras, comps, crits = {}, {}, {}, {}, {}
    aa_sem_conflicts = []
    for k, i in enumerate(idx):
        blk = lines[i + 1: idx[k + 1] if k + 1 < len(idx) else len(lines)]
        m = re.match(r'^([A-Za-z0-9_.-]+) - (.+)$', blk[0])
        if not m: log('pdf: en-tête d\'unité illisible : ' + blk[0]); continue
        code, title = m.group(1), m.group(2).strip()
        u = {'code': code, 'title_en': title, 'type': '', 'sems': [], 'domains': [], 'lang': '', 'ftf': None, 'std': None, 'tlh': None,
             'moodle': '', 'description': '', 'teachers': [], 'sessions': [], 'aas': [], 'eval': [], 'pedagogy': ''}
        section, role, desc, cur = 'head', '', [], None
        j = 0
        while j < len(blk):
            l = blk[j].strip(); j += 1
            if not l: continue
            if l.startswith('SKILLS (LEARNING'): section = 'skills'; continue
            if l.startswith('PEDAGOGICAL METHODS'): section = 'ped'; continue
            if l.startswith('ASSIGNMENTS & ASSESSMENTS'): section = 'assess'; continue
            if l == 'CRITERIAS': section = 'crit'; cur = None; continue
            if l == 'DESCRIPTION': section = 'desc'; continue
            if section == 'head':
                if l.startswith('Type:'): u['type'] = l[5:].strip(); continue
                if l.startswith('Periods:'): u['sems'] = [s.strip() for s in l[8:].split(',') if s.strip()]; continue
                if l in ('English', 'Home country', 'French', 'Spanish'): u['lang'] = l; continue
                mh = re.match(r'^(FTF|STD|TLH) [A-Za-z ]+: (\d+)$', l)
                if mh: u[mh.group(1).lower()] = int(mh.group(2)); continue
                md = re.match(r'^([A-Z]{2,6}) / ', l)
                if md and not u['domains'] and 'Campus' not in l:
                    u['domains'] = [d.split(' / ')[0].strip() for d in l.split(', ') if ' / ' in d]
                    continue
                if l in ('Conceptor:', 'Pedagogical Coordinator:', 'Teacher/Animator:'): role = l[:-1]; continue
                if role and (RE_MAIL_END.search(l) or not l.startswith(('Programs:', 'Campuses', 'Icam', 'Paris', 'Language', 'Domains'))):
                    acc = l
                    while not RE_MAIL_END.search(acc) and j < len(blk) and blk[j].strip() and not blk[j].startswith('DESCRIPTION'):
                        acc += ' ' + blk[j].strip(); j += 1
                    mt = RE_TEACH.match(acc)
                    if mt: u['teachers'].append({'name': mt.group(1).strip(), 'campus': mt.group(2).strip(), 'email': mt.group(3).strip(), 'role': role})
                    continue
            elif section == 'desc':
                mm = re.search(r'(https?://moodle\.icam\.fr/\S+)', l)
                if mm: u['moodle'] = mm.group(1); continue
                if l.startswith('Course website') or l.startswith('(Moodle)'): continue
                desc.append(l)
            elif section == 'skills':
                mr = RE_RA_SK.match(l)
                if mr:
                    acc = mr.group(2)
                    while '(C' not in acc or not acc.endswith(')'):
                        if j >= len(blk) or RE_AA_SK.match(blk[j].strip()) or RE_RA_SK.match(blk[j].strip()): break
                        acc += ' ' + blk[j].strip(); j += 1
                    mc = re.match(r'^(.*?) \((C\d\d): (.*)\)$', acc)
                    ra = ras.setdefault(mr.group(1), {'code': mr.group(1), 'comp': '', 'title_en': ''})
                    if mc:
                        ra['title_en'] = ra['title_en'] or mc.group(1).strip(); ra['comp'] = ra['comp'] or mc.group(2)
                        comps.setdefault(mc.group(2), {'code': mc.group(2), 'title_en': mc.group(3).strip()})
                    else:
                        ra['title_en'] = ra['title_en'] or acc
                    continue
                ma = RE_AA_SK.match(l)
                if ma:
                    acc = ma.group(2)
                    while not re.search(r'\([A-Za-z0-9.]+\)$', acc):
                        if j >= len(blk) or RE_AA_SK.match(blk[j].strip()) or RE_RA_SK.match(blk[j].strip()) or blk[j].startswith('PEDAGOGICAL'): break
                        acc += ' ' + blk[j].strip(); j += 1
                    ms = re.match(r'^(.*?) \(([A-Za-z0-9.]+)\)$', acc)
                    a = aas.setdefault(ma.group(1), {'code': ma.group(1), 'title_en': '', 'sem': ''})
                    if ms:
                        a['title_en'] = a['title_en'] or ms.group(1).strip()
                        if a['sem'] and a['sem'] != ms.group(2): aa_sem_conflicts.append((ma.group(1), a['sem'], ms.group(2), code))
                        a['sem'] = a['sem'] or ms.group(2)
                    else:
                        a['title_en'] = a['title_en'] or acc
                    if ma.group(1) not in u['aas']: u['aas'].append(ma.group(1))
                    continue
            elif section == 'ped':
                if l.startswith('Session Topic'):
                    rest = l[len('Session Topic'):].strip()
                    if rest and rest != 'Duration':
                        for n, topic in re.findall(r'(\d+) ([A-Za-z\' ]+?)(?= \d+ [A-Z]|$)', rest):
                            u['sessions'].append({'n': int(n), 'topic': topic.strip(), 'hours': None})
                    continue
                msn = RE_SESS.match(l)
                if msn and (u['sessions'] or l[0].isdigit()) and not re.match(r'^\d+ (hours|h)\b', l):
                    u['sessions'].append({'n': int(msn.group(1)), 'topic': msn.group(2).strip(), 'hours': float(msn.group(3)) if msn.group(3) else None})
                    continue
                if not u['pedagogy'] and not l.startswith('Session'): u['pedagogy'] = l
            elif section == 'crit':
                mac = RE_AA_CR.match(l)
                if mac: cur = mac.group(1); continue
                mcr = RE_CRIT.match(l)
                if mcr:
                    ccode, acc = mcr.group(1), mcr.group(2)
                    while not RE_MOD.search(acc):
                        if j >= len(blk): break
                        nx = blk[j].strip()
                        if not nx or RE_CRIT.match(nx) or RE_AA_CR.match(nx) or nx.startswith(('PEDAGOGICAL', 'ASSIGNMENTS', 'SYLLABUS')): break
                        acc += ' ' + nx; j += 1
                    mm = RE_MOD.search(acc)
                    label = acc[:mm.start()].strip() if mm else acc.strip()
                    mod = (mm.group(1) + ', ' + mm.group(2)) if mm else ''
                    c = crits.setdefault(ccode, {'code': ccode, 'label_en': label, 'modality': mod, 'aas': []})
                    if cur and cur not in c['aas']: c['aas'].append(cur)
                    if ccode not in u['eval']: u['eval'].append(ccode)
                    continue
        u['sessions'] = fix_sessions(u['sessions'])
        u['description'] = ' '.join(desc)[:700]
        if code in units: log('pdf: unité en double ' + code)
        units[code] = u
    if aa_sem_conflicts: log('pdf: %d AA avec semestre divergent selon la fiche : %s' % (len(aa_sem_conflicts), aa_sem_conflicts[:5]))
    return units, aas, ras, comps, crits, year


# ----------------------------------------------------------------------------- fusion
def merge(ex, pdf, program, log):
    aas, crits, units, ras, exstats = ex
    p_units, p_aas, p_ras, p_comps, p_crits, p_year = pdf
    # unités
    for code, pu in p_units.items():
        u = units.get(code)
        if not u:
            u = units[code] = {'code': code, 'title_fr': '', 'title_en': '', 'type': '', 'sem_excel': '', 'sems': [], 'domains': [], 'lang': '',
                               'ftf': None, 'std': None, 'tlh': None, 'moodle': '', 'description': '', 'teachers': [], 'sessions': [],
                               'aas': [], 'contrib_aas': [], 'eval': [], 'contrib': [], 'sources': []}
        u['sources'].append('pdf')
        for k in ('title_en', 'type', 'sems', 'domains', 'lang', 'ftf', 'std', 'tlh', 'moodle', 'description', 'teachers', 'sessions'):
            u[k] = pu[k]
        u['pedagogy'] = pu.get('pedagogy', '')
        for a in pu['aas']:
            if a not in u['aas']: u['aas'].append(a)
        u['eval_pdf'] = list(pu['eval'])
        for c in pu['eval']:
            if c not in u['eval']: u['eval'].append(c)
            cc = crits.setdefault(c, {'code': c, 'label_fr': '', 'label_en': '', 'modality': '', 'aas': [], 'eval': [], 'contrib': []})
            if code not in cc['eval']: cc['eval'].append(code)
    for u in units.values():
        if not u['sems'] and u['sem_excel']: u['sems'] = [u['sem_excel']]
        u['sem'] = u['sems'][0] if u['sems'] else ''
        u['eval_excel'] = sorted(set(u['eval']) - set(u.get('eval_pdf', []))) if 'pdf' in u['sources'] else list(u['eval'])
    # AA / RA / comp / crit : libellés EN et semestres
    for code, pa in p_aas.items():
        a = aas.setdefault(code, {'code': code, 'ra': '', 'comp': '', 'domain': code.split('-')[1] if code.count('-') > 2 else '', 'sem': '', 'title_fr': '', 'title_en': '', 'crits': []})
        a['title_en'] = pa['title_en']; a['sem'] = pa['sem']
        if not a['comp']:
            mc = re.search(r'-(C\d\d)-', code); a['comp'] = mc.group(1) if mc else ''
    for code, pr in p_ras.items():
        r = ras.setdefault(code, {'code': code, 'comp': pr['comp'], 'title_fr': '', 'title_en': ''})
        r['title_en'] = pr['title_en']; r['comp'] = r['comp'] or pr['comp']
    for code, pc in p_crits.items():
        c = crits.setdefault(code, {'code': code, 'label_fr': '', 'label_en': '', 'modality': '', 'aas': [], 'eval': [], 'contrib': []})
        c['label_en'] = pc['label_en']; c['modality'] = pc['modality']
        for a in pc['aas']:
            if a not in c['aas']: c['aas'].append(a)
            if a in aas and code not in aas[a]['crits']: aas[a]['crits'].append(code)
    # AA sans RA connu (venues du PDF) : retrouver le RA par les fiches ? On garde vide et on logue.
    orphans = {'aa_without_ra': [a for a, v in aas.items() if not v['ra']],
               'crit_without_unit': sorted(c for c, v in crits.items() if not v['eval'] and not v['contrib']),
               'crit_without_aa': sorted(c for c, v in crits.items() if not v['aas']),
               'units_excel_only': sorted(c for c, u in units.items() if u['sources'] == ['excel']),
               'units_pdf_only': sorted(c for c, u in units.items() if u['sources'] == ['pdf']),
               'units_without_sem': sorted(c for c, u in units.items() if not u['sem'])}
    # AA ra manquant : déduire le RA depuis le code RA-<dom>-Cxx-n ? impossible sans table ; chercher dans les fiches PDF où l'AA suit un RA
    both = [c for c, u in units.items() if set(u['sources']) == {'excel', 'pdf'}]
    comps = {c: {'code': c, 'title_fr': '', 'title_en': v['title_en']} for c, v in sorted(p_comps.items())}
    stats = {'excel': exstats, 'pdf': {'year': p_year, 'units': len(p_units), 'aas': len(p_aas), 'ras': len(p_ras), 'comps': len(p_comps), 'crits': len(p_crits)},
             'merged': {'units': len(units), 'aas': len(aas), 'ras': len(ras), 'crits': len(crits),
                        'units_both': len(both), 'units_excel_only': len(orphans['units_excel_only']), 'units_pdf_only': len(orphans['units_pdf_only']),
                        'crits_without_unit': len(orphans['crit_without_unit']), 'crits_without_aa': len(orphans['crit_without_aa']),
                        'aa_without_ra': len(orphans['aa_without_ra']), 'units_without_sem': len(orphans['units_without_sem']),
                        'units_with_moodle': sum(1 for u in units.values() if u['moodle']),
                        'units_with_sessions': sum(1 for u in units.values() if u['sessions']),
                        'eval_pairs': sum(len(u['eval']) for u in units.values()),
                        'contrib_pairs': sum(len(u['contrib_aas']) for u in units.values()),
                        'crits_multi_unit': sum(1 for c in crits.values() if len(c['eval']) > 1)},
             'orphans': orphans}
    data = {'program': program, 'mappingYear': exstats['year'], 'syllabusYear': p_year, 'generatedAt': datetime.date.today().isoformat(),
            'semesters': SEMS, 'comps': comps, 'ras': dict(sorted(ras.items())), 'aas': dict(sorted(aas.items())),
            'crits': dict(sorted(crits.items())), 'units': dict(sorted(units.items())), 'stats': stats}
    return data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--xlsx', required=True); ap.add_argument('--pdf'); ap.add_argument('--pdf-text')
    ap.add_argument('--program', default='BI'); ap.add_argument('--out', required=True)
    args = ap.parse_args()
    logs = []
    log = lambda m: logs.append(m)
    ex = parse_excel(args.xlsx, log)
    if args.pdf_text: text = open(args.pdf_text, encoding='utf-8').read()
    elif args.pdf: text = pdf_text(args.pdf, os.path.join(os.path.dirname(args.out), '.cache.' + os.path.basename(args.pdf) + '.txt'))
    else: sys.exit('--pdf ou --pdf-text requis')
    pdf = parse_pdf(text, log)
    data = merge(ex, pdf, args.program, log)
    data['stats']['log'] = logs
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    s = data['stats']
    print('Excel   %(year)s : %(units)d unités, %(aas)d AA, %(crits)d critères, %(ras)d RA ; lignes def %(rows_definition)d / mapping %(rows_mapping)d (eval %(rows_eval)d, contribue %(rows_contrib)d dont avec critère %(rows_contrib_with_crit)d)' % s['excel'])
    print('PDF     %(year)s : %(units)d unités, %(aas)d AA, %(ras)d RA, %(comps)d compétences, %(crits)d critères' % s['pdf'])
    m = s['merged']
    print('Fusion  : %(units)d unités (%(units_both)d dans les deux, %(units_excel_only)d Excel seul, %(units_pdf_only)d PDF seul), %(aas)d AA, %(crits)d critères' % m)
    print('          %(eval_pairs)d paires unité×critère évaluées, %(contrib_pairs)d paires unité×AA « contribue », %(crits_multi_unit)d critères évalués par plusieurs unités' % m)
    print('          orphelins : %(crits_without_unit)d critères sans unité, %(crits_without_aa)d critères sans AA, %(aa_without_ra)d AA sans RA, %(units_without_sem)d unités sans semestre' % m)
    print('          %(units_with_moodle)d unités avec Moodle, %(units_with_sessions)d avec tableau de séances' % m)
    for l in logs[:20]: print('  ! ' + l)
    print('-> %s (%d Ko)' % (args.out, os.path.getsize(args.out) // 1024))


if __name__ == '__main__':
    main()

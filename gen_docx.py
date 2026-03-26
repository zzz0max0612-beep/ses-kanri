import zipfile
import os

output_path = r"c:\Users\khama\OneDrive\デスクトップ\hiscoイベント資料\hisco_meta_plan.docx"

content_types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'

rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'

word_rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'

styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Yu Mincho" w:hAnsi="Yu Mincho" w:eastAsia="Yu Mincho"/>
      <w:sz w:val="24"/><w:szCs w:val="24"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="280" w:after="120"/></w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Yu Mincho" w:hAnsi="Yu Mincho" w:eastAsia="Yu Mincho"/>
      <w:b/><w:sz w:val="36"/><w:szCs w:val="36"/>
      <w:color w:val="1F3864"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Yu Mincho" w:hAnsi="Yu Mincho" w:eastAsia="Yu Mincho"/>
      <w:b/><w:sz w:val="28"/><w:szCs w:val="28"/>
      <w:color w:val="2E74B5"/>
    </w:rPr>
  </w:style>
</w:styles>"""

NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

def p(text, bold=False, size=None, color=None, align=None, sb=None, sa=None, style=None):
    pPr_parts = []
    if style:
        pPr_parts.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        pPr_parts.append(f'<w:jc w:val="{align}"/>')
    sp = ""
    if sb is not None:
        sp += f' w:before="{sb}"'
    if sa is not None:
        sp += f' w:after="{sa}"'
    if sp:
        pPr_parts.append(f'<w:spacing{sp}/>')
    pPr = f'<w:pPr>{"".join(pPr_parts)}</w:pPr>' if pPr_parts else ""
    rPr_parts = []
    if bold:
        rPr_parts.append('<w:b/>')
    if size:
        rPr_parts.append(f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>')
    if color:
        rPr_parts.append(f'<w:color w:val="{color}"/>')
    rPr = f'<w:rPr>{"".join(rPr_parts)}</w:rPr>' if rPr_parts else ""
    escaped = text.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    return f'<w:p>{pPr}<w:r>{rPr}<w:t xml:space="preserve">{escaped}</w:t></w:r></w:p>'

def h1(text):
    return p(text, style="Heading1")

def h2(text):
    return p(text, style="Heading2")

def bullet(text, bold=False, color=None, level=0):
    indent = 720 * (level + 1)
    rPr_parts = []
    if bold:
        rPr_parts.append('<w:b/>')
    if color:
        rPr_parts.append(f'<w:color w:val="{color}"/>')
    rPr = f'<w:rPr>{"".join(rPr_parts)}</w:rPr>' if rPr_parts else ""
    escaped = text.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    return f'''<w:p>
      <w:pPr><w:ind w:left="{indent}" w:hanging="360"/><w:spacing w:before="80" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr><w:t>&#x25CF;</w:t></w:r>
      <w:r><w:tab/></w:r>
      <w:r>{rPr}<w:t xml:space="preserve">{escaped}</w:t></w:r>
    </w:p>'''

def row(col1, col2):
    c1 = col1.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    c2 = col2.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
    return f'''<w:p>
      <w:pPr><w:spacing w:before="80" w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:color w:val="1F3864"/></w:rPr><w:t xml:space="preserve">{c1}　</w:t></w:r>
      <w:r><w:t>{c2}</w:t></w:r>
    </w:p>'''

def sep():
    return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="2E74B5"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>'

def empty():
    return '<w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr></w:p>'

parts = []

# Title block
parts.append(p("Hisco メタバース交流会 企画書", bold=True, size=52, color="1F3864", align="center", sb="0", sa="160"))
parts.append(p("〜 AIダンジョンで繋がる、新しい交流体験 〜", bold=False, size=24, color="2E74B5", align="center", sb="0", sa="360"))
parts.append(sep())
parts.append(empty())

# Section 1
parts.append(h1("1. 企画概要"))
parts.append(p("本交流会は、従来の懇親会・セミナー形式を大きく刷新します。メタバース空間（cluster）上にHiscoオリジナルの「AIダンジョン」を構築し、参加者はアバターとして空間に集まり、AIが仕掛ける謎解きミッションに挑みます。", sb="60", sa="100"))
parts.append(p("オフライン会場とオンラインのメタバースをリアルタイムで繋ぐハイブリッド開催により、遠方からの参加者も対等に交流できる設計です。", sb="60", sa="200"))

# Section 2
parts.append(h1("2. コンセプト"))
parts.append(bullet("「体験型」交流：謎解きを通じて自然なコミュニケーションを促進", bold=True))
parts.append(bullet("「バリアフリー参加」：オンライン・オフラインの垣根をなくすハイブリッド設計"))
parts.append(bullet("「AI × メタバース」：最新技術を活用した先進的なイベント体験"))
parts.append(bullet("「Hiscoらしさ」：オリジナルダンジョンによるブランド体験の提供"))
parts.append(empty())

# Section 3
parts.append(h1("3. 開催形式"))
parts.append(p("ハイブリッド開催（オフライン会場 ＋ メタバース同時接続）", bold=True, size=26, sb="60", sa="100"))
parts.append(h2("【オフライン会場】"))
parts.append(bullet("会場にてスクリーン・PCを設置"))
parts.append(bullet("参加者はアバターを操作、またはスクリーン越しにメタバースを体験"))
parts.append(bullet("会場内でのリアルな交流も並行して実施"))
parts.append(empty())
parts.append(h2("【オンライン（メタバース）】"))
parts.append(bullet("clusterにアクセスし、アバターとして参加"))
parts.append(bullet("AIダンジョン内のミッションをリアルタイムで体験"))
parts.append(bullet("チャット・ボイスチャットで他参加者と交流"))
parts.append(empty())

# Section 4
parts.append(h1("4. AIダンジョン 詳細設計"))
parts.append(h2("4-1. ダンジョン構成"))
parts.append(bullet("エリア1「エントランスホール」：参加者受付・チュートリアル", bold=True))
parts.append(bullet("エリア2「謎解きの間」：AIが生成する謎解きミッション", bold=True))
parts.append(bullet("エリア3「交流広場」：ミッションクリア後の自由交流スペース", bold=True))
parts.append(bullet("エリア4「ボスルーム」：最終ミッション・グランドフィナーレ", bold=True))
parts.append(empty())
parts.append(h2("4-2. AIミッション内容"))
parts.append(bullet("AIが参加者の職種・興味関心に応じたパーソナライズ謎解きを生成"))
parts.append(bullet("チーム制ミッション：異なる背景を持つ参加者同士が協力して解答"))
parts.append(bullet("リアルタイム難易度調整：参加者の回答状況に応じてAIがヒント提供"))
parts.append(bullet("最終ミッション：全参加者が一体となって挑む大型謎解き"))
parts.append(empty())

# Section 5
parts.append(h1("5. タイムライン（当日スケジュール）"))
schedule = [
    ("18:00", "開場・受付　／　cluster接続サポート"),
    ("18:30", "開会挨拶・企画説明"),
    ("18:45", "AIダンジョン体験スタート（エリア1〜3）"),
    ("19:30", "チーム交流タイム・中間発表"),
    ("20:00", "最終ミッション「ボスルーム」挑戦"),
    ("20:30", "表彰式・懇親フリータイム"),
    ("21:00", "閉会"),
]
for t, e in schedule:
    parts.append(row(t, e))
parts.append(empty())

# Section 6
parts.append(h1("6. 必要環境・準備物"))
parts.append(h2("参加者（オンライン）"))
parts.append(bullet("PC またはスマートフォン（cluster対応端末）"))
parts.append(bullet("clusterアカウント（事前登録推奨）"))
parts.append(bullet("イヤホン・マイク（ボイスチャット参加の場合）"))
parts.append(empty())
parts.append(h2("運営側"))
parts.append(bullet("clusterワールド構築（AIダンジョン専用ワールド制作）"))
parts.append(bullet("AI謎解きシステム（Claude API等を活用）"))
parts.append(bullet("進行用PC・スクリーン・配信機材"))
parts.append(bullet("テクニカルサポートスタッフ 2名以上"))
parts.append(empty())

# Section 7
parts.append(h1("7. 期待される効果"))
parts.append(bullet("参加者同士の自然な交流促進（ゲームを通じた心理的ハードルの低下）", bold=True))
parts.append(bullet("Hiscoブランドの先進性・革新性のアピール", bold=True))
parts.append(bullet("地理的制約を超えた多様な参加者の獲得", bold=True))
parts.append(bullet("AIとメタバースの実際の活用事例として業界内での話題性創出", bold=True))
parts.append(empty())

# Section 8
parts.append(h1("8. 準備スケジュール"))
prep = [
    ("4週前", "企画確定・役割分担・clusterワールド設計開始"),
    ("3週前", "AIダンジョンシステム開発・テスト"),
    ("2週前", "参加者招待・事前登録案内送付"),
    ("1週前", "リハーサル・最終調整"),
    ("前日", "最終チェック・機材確認"),
    ("当日", "本番開催"),
]
for period, task in prep:
    parts.append(row(period, task))
parts.append(empty())

# Footer
parts.append(sep())
parts.append(p("本企画書は随時更新予定です。ご意見・ご要望はお気軽にお申し付けください。", color="595959", align="center", sb="120"))
parts.append(p("Hisco 企画チーム　／　作成日：2026年3月25日", color="595959", align="center", sb="60"))

body = "\n".join(parts)

document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="1701"/>
    </w:sectPr>
  </w:body>
</w:document>"""

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.writestr('[Content_Types].xml', content_types)
    zf.writestr('_rels/.rels', rels)
    zf.writestr('word/_rels/document.xml.rels', word_rels)
    zf.writestr('word/document.xml', document.encode('utf-8'))
    zf.writestr('word/styles.xml', styles.encode('utf-8'))

print(f"Created: {output_path}")
print(f"Size: {os.path.getsize(output_path)} bytes")

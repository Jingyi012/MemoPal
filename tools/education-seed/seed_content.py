"""Reviewed-file projections, pinyin diagnostics and CSV/report generation.

StudyItem business validation remains on the API dry-run path, not in this module.
"""
import csv
import io
import json
import re
import unicodedata
from pathlib import Path

from importlib.metadata import version

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = Path(__file__).parent / "data" / "my-p3-original.json"
REPORT_FILE = ROOT / "docs" / "education-seed-review.md"
NAMESPACE = "memopal-demo-my-p3-v1"
CSV_HEADERS = ["key", "kind", "primary", "secondary", "phonetic", "extra", "hint", "position", "language"]
TONE_MARKS = set("āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ")
CONTENT_FIELDS = ("primary", "secondary", "phonetic", "extra", "hint")


def load_seed(path=DATA_FILE):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def objectives(seed):
    for course in seed["courses"]:
        for objective in course["objectives"]:
            yield course, objective


def api_items(objective):
    return [dict(stableKey=row["key"], position=row["position"], kind=row["kind"],
                 primary=row["primary"], secondary=row.get("secondary"), phonetic=row.get("phonetic"),
                 extra=row.get("extra"), hint=row.get("hint"), mediaRef=None,
                 languageCode=row["languageCode"]) for row in objective["items"]]


def csv_text(objective):
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\r\n")
    writer.writerow(CSV_HEADERS)
    for row in objective["items"]:
        writer.writerow([row.get(field) if row.get(field) is not None else ""
                         for field in ["key", "kind", "primary", "secondary", "phonetic", "extra", "hint", "position", "languageCode"]])
    return output.getvalue()


def pinyin_diagnostics(seed):
    from pypinyin import Style, lazy_pinyin, pinyin
    diagnostics = []
    polyphones = {}
    for _, objective in objectives(seed):
        for row in objective["items"]:
            provided = row.get("phonetic")
            computed = None
            selected = []
            if provided:
                syllables = provided.lower().split()
                computed_syllables = lazy_pinyin(row["primary"], style=Style.TONE)
                computed = " ".join(computed_syllables)
                for index, char in enumerate(row["primary"]):
                    readings = sorted(set(pinyin(char, style=Style.TONE, heteronym=True)[0]))
                    if len(readings) > 1:
                        chosen = syllables[index] if index < len(syllables) else "?"
                        use = f"{row['primary']}：{chosen}"
                        entry = polyphones.setdefault(char, {"readings": readings, "uses": set()})
                        entry["uses"].add(use)
                        selected.append(f"{char}={chosen}")
            mismatch = provided is not None and unicodedata.normalize("NFC", provided) != computed
            diagnostics.append(dict(objective=objective["slug"], row=row, computed=computed,
                                    mismatch=mismatch, polyphones=selected))
    return diagnostics, polyphones


def validate_document(seed):
    """Seed policy checks only. Authoritative length/type/position rules use API dry-run."""
    errors = []
    if seed.get("schemaVersion") != 1 or seed.get("seedNamespace") != NAMESPACE:
        errors.append("Unsupported seed schema/namespace.")
    all_objectives = set()
    course_slugs = set()
    for course in seed.get("courses", []):
        if course["slug"] in course_slugs:
            errors.append("Duplicate course slug.")
        course_slugs.add(course["slug"])
        for objective in course["objectives"]:
            if objective["slug"] in all_objectives:
                errors.append("Duplicate objective slug.")
            all_objectives.add(objective["slug"])
            if objective.get("contentOrigin") != "Original" or objective.get("reviewStatus") != "Unreviewed":
                errors.append(f"{objective['slug']}: provenance/review must remain Original/Unreviewed.")
            keys = set()
            for row in objective["items"]:
                label = f"{objective['slug']}/{row['key']}"
                if row["key"] in keys:
                    errors.append(f"{label}: duplicate stable key.")
                keys.add(row["key"])
                if row.get("contentOrigin") != "Original" or row.get("reviewStatus") != "Unreviewed":
                    errors.append(f"{label}: provenance/review must remain Original/Unreviewed.")
                if row["kind"] == "LanguageItem" and not (set(row.get("phonetic") or "") & TONE_MARKS):
                    errors.append(f"{label}: tone-marked pinyin is required (neutral syllables may be unmarked).")
                text = " ".join(str(row.get(field) or "") for field in CONTENT_FIELDS)
                if re.search(r"https?://|www\.|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}|\d{7,}|[™®]", text):
                    errors.append(f"{label}: URL/contact/long numeric data is prohibited.")
                if row.get("mediaRef"):
                    errors.append(f"{label}: media is not included in this pack.")
        assessment_slugs = set()
        for assessment in course.get("assessments", []):
            if assessment["slug"] in assessment_slugs:
                errors.append("Duplicate assessment slug.")
            assessment_slugs.add(assessment["slug"])
            question_keys = set()
            for question in assessment["questions"]:
                if question["key"] in question_keys:
                    errors.append("Duplicate question key.")
                question_keys.add(question["key"])
                if question["objectiveSlug"] not in {o["slug"] for o in course["objectives"]}:
                    errors.append("Question objective must be in its course.")
                if question.get("contentOrigin") != "Original" or question.get("reviewStatus") != "Unreviewed":
                    errors.append("Question provenance/review must remain Original/Unreviewed.")
    diagnostics, _ = pinyin_diagnostics(seed)
    errors.extend(f"{d['objective']}/{d['row']['key']}: supplied pinyin differs from library; see review report."
                  for d in diagnostics if d["mismatch"])
    return errors


def _cell(value):
    return str(value or "—").replace("|", "\\|").replace("\r", "").replace("\n", "<br>")


def write_assets(seed):
    diagnostics, polyphones = pinyin_diagnostics(seed)
    mismatches = [d for d in diagnostics if d["mismatch"]]
    for _, objective in objectives(seed):
        (DATA_FILE.parent / f"{objective['slug']}.csv").write_bytes(csv_text(objective).encode("utf-8-sig"))
    lines = ["# 小三原创演示种子：教师审核报告", "",
             "> 全部为机器生成的原创演示内容，请教师审核后再用于教学。", "",
             "不是官方教学大纲，不对应任何学校或出版社教材。所有条目均为 Original / Unreviewed；程序校验通过不等于教师审核。",
             "", f"- 条目：{len(diagnostics)}（生字 12、配词 24、成语 8、水循环 6、蝴蝶阶段 4）。",
             f"- 已填写拼音并二次校验：{sum(bool(d['row'].get('phonetic')) for d in diagnostics)} 条。",
             f"- 程序拼音与录入拼音不一致：{len(mismatches)} 条。",
             f"- 目标字词 Primary 中，本库列出多读音的不同汉字：{len(polyphones)} 个；涉及 {sum(bool(d['polyphones']) for d in diagnostics)} 条。",
             f"- 校验工具：pypinyin {version('pypinyin')}，Style.TONE；无自定义词典覆盖，不启用变调；轻声按拼音规则不加声调符号。",
             "", "下表录入拼音由机器填写，再与拼音库默认词组读音独立比较。多音字候选按单字 heteronym=True 列出本库所有候选，含少见读音；不保证覆盖所有地区/历史读音。范围是作为学习目标的 LanguageItem 字词，不是释义句中每一个字。",
             "", "## 每条内容（形体与语义仍待教师审核）", "",
             "| 知识点 / key | 字/词或步骤 | 录入拼音 | 程序拼音 | 原创释义 | 拆解提示 / 情境 | 校验状态 |",
             "|---|---|---|---|---|---|---|"]
    for d in diagnostics:
        row = d["row"]
        status = "不一致，需复核" if d["mismatch"] else "拼音一致" if row.get("phonetic") else "拼音不适用；科学内容待审核"
        if d["polyphones"]:
            status += "；多音：" + "，".join(d["polyphones"])
        if "非字源" in (row.get("extra") or ""):
            status += "；联想，非字源"
        lines.append("| " + " | ".join(_cell(v) for v in [d["objective"]+" / "+row["key"], row["primary"], row.get("phonetic"), d["computed"], row.get("secondary"), row.get("extra"), status]) + " |")
    lines += ["", "## 拼音不一致清单", ""]
    lines += [f"- {d['objective']}/{d['row']['key']}：录入 {_cell(d['row']['phonetic'])}；程序 {_cell(d['computed'])}" for d in mismatches] or ["无。"]
    lines += ["", "## 多音字：库内全部候选及本条使用读音", "", "| 字 | 库内全部候选 | 本条所用读音与对应字词 |", "|---|---|---|"]
    for char, data in sorted(polyphones.items()):
        lines.append(f"| {char} | {'、'.join(data['readings'])} | {'；'.join(sorted(data['uses']))} |")
    lines += ["", "## 教师审核要点与来源边界", "",
              "- 字形提示只描述可见部件；画面是记字联想，非字源/造字学解释。园的外框是囗，与口部件有别。",
              "- 水循环六步只是示意路线，真实水循环有分支；云中的小水滴/冰晶不是气态水蒸气。蝴蝶蛹不写成蚕茧。",
              "- 小测评 6 题见 JSON 的 assessments；答案仅是作者导入数据，不会写入学习条目或学习者 DTO。",
              "- 原创范围为释义、例句、提示、情境、步骤句与题目；常用汉字、词语、成语本身不是本项目创造的词汇。未复制/改写教材、生字表或词典释义原文。",
              "- [pypinyin 官方说明](https://pypi.org/project/pypinyin/)仅用于发音二次校验；未采用其词典释义。",
              "- 科学事实核对：[USGS 水循环](https://www.usgs.gov/special-topics/water-science-school/water-cycle)、[Smithsonian 蝴蝶生命周期](https://gardens.si.edu/learn/for-educators/cultivating-habitat/butterfly-gardening/about-butterflies/)。未摘录/翻译来源句子、图片或课程文件。",
              "", "教师签名/日期：________；审核意见：________。审核签字不会由脚本自动改变服务器 ReviewStatus。", ""]
    REPORT_FILE.write_text("\n".join(lines), encoding="utf-8")
    return dict(items=len(diagnostics), pinyinMismatches=len(mismatches), polyphonicCharacters=len(polyphones),
                polyphonicEntries=sum(bool(d["polyphones"]) for d in diagnostics), report=str(REPORT_FILE))

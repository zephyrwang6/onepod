#!/usr/bin/env python3
"""
Fetch podcast content from Feishu wiki and generate podcasts.json data file.
"""

import requests
import json
import re
import sys
import time
import os

APP_ID = os.environ.get("FEISHU_APP_ID", "")
APP_SECRET = os.environ.get("FEISHU_APP_SECRET", "")
BASE_URL = "https://open.feishu.cn/open-apis"

if not APP_ID or not APP_SECRET:
    print("Error: Set FEISHU_APP_ID and FEISHU_APP_SECRET environment variables", file=sys.stderr)
    sys.exit(1)
PARENT_NODE = "TOSJwKzxTiFdiRk0aducHNBFntg"
SPACE_ID = "7591325128043121630"


def get_token():
    url = f"{BASE_URL}/auth/v3/tenant_access_token/internal"
    resp = requests.post(url, json={"app_id": APP_ID, "app_secret": APP_SECRET})
    return resp.json().get("tenant_access_token")


def get_children(token):
    url = f"{BASE_URL}/wiki/v2/spaces/{SPACE_ID}/nodes?parent_node_token={PARENT_NODE}&page_size=50"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    result = resp.json()
    if result.get("code") == 0:
        return result["data"]["items"]
    return []


def get_doc_blocks(token, obj_token):
    headers = {"Authorization": f"Bearer {token}"}
    all_blocks = []
    page_token = ""

    while True:
        url = f"{BASE_URL}/docx/v1/documents/{obj_token}/blocks?page_size=100"
        if page_token:
            url += f"&page_token={page_token}"
        resp = requests.get(url, headers=headers)
        result = resp.json()
        if result.get("code") != 0:
            break
        items = result.get("data", {}).get("items", [])
        all_blocks.extend(items)
        if not result.get("data", {}).get("has_more"):
            break
        page_token = result["data"].get("page_token", "")

    return all_blocks


def extract_text_from_elements(elements):
    parts = []
    for el in elements:
        tr = el.get("text_run", {})
        content = tr.get("content", "")
        if content:
            parts.append(content)
    return "".join(parts)


def extract_youtube_id(text):
    patterns = [
        r'youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'youtu\.be/([a-zA-Z0-9_-]{11})',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return m.group(1)
    return None


def blocks_to_content(blocks):
    """Convert feishu blocks to structured content."""
    full_text = ""
    youtube_id = None
    sections = []
    current_section = {"title": "", "paragraphs": []}

    for block in blocks:
        bt = block.get("block_type")

        text = ""
        if bt == 2:  # text
            els = block.get("text", {}).get("elements", [])
            text = extract_text_from_elements(els)
        elif bt == 3:  # h1
            els = block.get("heading1", {}).get("elements", [])
            text = extract_text_from_elements(els)
            if current_section["paragraphs"]:
                sections.append(current_section)
            current_section = {"title": text, "paragraphs": []}
            continue
        elif bt == 4:  # h2
            els = block.get("heading2", {}).get("elements", [])
            text = extract_text_from_elements(els)
            if current_section["paragraphs"]:
                sections.append(current_section)
            current_section = {"title": text, "paragraphs": []}
            continue
        elif bt == 5:  # h3
            els = block.get("heading3", {}).get("elements", [])
            text = extract_text_from_elements(els)
        elif bt == 12:  # bullet
            els = block.get("bullet", {}).get("elements", [])
            text = "• " + extract_text_from_elements(els)
        elif bt == 13:  # ordered
            els = block.get("ordered", {}).get("elements", [])
            text = extract_text_from_elements(els)
        elif bt == 1:  # page
            continue
        else:
            continue

        if text.strip() == "---":
            if current_section["paragraphs"]:
                sections.append(current_section)
            current_section = {"title": "", "paragraphs": []}
            continue

        if text.strip():
            full_text += text + "\n"
            current_section["paragraphs"].append(text)

            if not youtube_id:
                yt = extract_youtube_id(text)
                if yt:
                    youtube_id = yt

    if current_section["paragraphs"]:
        sections.append(current_section)

    return full_text, youtube_id, sections


def fetch_youtube_meta(video_id):
    """Fetch YouTube video metadata: title, channel, views, publish date."""
    meta = {
        "ytTitle": None,
        "ytChannel": None,
        "ytChannelUrl": None,
        "ytViews": None,
        "ytPublished": None,
    }
    if not video_id:
        return meta

    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        resp = requests.get(oembed_url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            meta["ytTitle"] = data.get("title")
            meta["ytChannel"] = data.get("author_name")
            meta["ytChannelUrl"] = data.get("author_url")
    except Exception as e:
        print(f"    oEmbed failed for {video_id}: {e}", file=sys.stderr)

    try:
        page_url = f"https://www.youtube.com/watch?v={video_id}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        resp = requests.get(page_url, headers=headers, timeout=15)
        html = resp.text

        view_match = re.search(r'"viewCount":"(\d+)"', html)
        if view_match:
            meta["ytViews"] = int(view_match.group(1))

        date_match = re.search(r'"publishDate":"([^"]+)"', html)
        if date_match:
            raw_date = date_match.group(1)
            meta["ytPublished"] = raw_date[:10]
    except Exception as e:
        print(f"    Page scrape failed for {video_id}: {e}", file=sys.stderr)

    return meta


def parse_title(raw_title):
    """Extract date code and clean title."""
    m = re.match(r'^(\d{4})[：:\s-]+(.+)$', raw_title)
    if m:
        return m.group(1), m.group(2)
    m = re.match(r'^(\d{4})\s+(.+)$', raw_title)
    if m:
        return m.group(1), m.group(2)
    return "", raw_title


def main():
    print("Fetching token...", file=sys.stderr)
    token = get_token()

    print("Fetching podcast list...", file=sys.stderr)
    children = get_children(token)
    print(f"Found {len(children)} podcasts", file=sys.stderr)

    podcasts = []
    for i, child in enumerate(children):
        title = child["title"]
        obj_token = child["obj_token"]
        node_token = child["node_token"]

        print(f"  [{i+1}/{len(children)}] {title}", file=sys.stderr)

        blocks = get_doc_blocks(token, obj_token)
        full_text, youtube_id, sections = blocks_to_content(blocks)

        date_code, clean_title = parse_title(title)

        intro_paragraphs = []
        highlights = []

        for sec in sections:
            if "精华" in sec.get("title", "") or not sec.get("title"):
                if not intro_paragraphs and not sec.get("title"):
                    intro_paragraphs = sec["paragraphs"]
                elif "精华" in sec.get("title", ""):
                    highlights = sec["paragraphs"]
            elif not intro_paragraphs:
                intro_paragraphs = sec["paragraphs"]

        if not intro_paragraphs and sections:
            intro_paragraphs = sections[0]["paragraphs"]
        if not highlights and len(sections) > 1:
            highlights = sections[-1]["paragraphs"]

        yt_meta = fetch_youtube_meta(youtube_id)
        if youtube_id:
            time.sleep(0.5)

        podcast = {
            "id": node_token,
            "title": clean_title,
            "rawTitle": title,
            "dateCode": date_code,
            "youtubeId": youtube_id,
            "feishuUrl": f"https://my.feishu.cn/wiki/{node_token}",
            "intro": intro_paragraphs[:15],
            "highlights": highlights[:20],
            "fullText": full_text[:5000],
            **yt_meta,
        }
        podcasts.append(podcast)

    podcasts.sort(key=lambda x: x["dateCode"], reverse=True)

    output = json.dumps(podcasts, ensure_ascii=False, indent=2)
    out_path = os.path.join(os.path.dirname(__file__), "src", "podcasts.json")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"\nDone! Generated {out_path} with {len(podcasts)} entries", file=sys.stderr)


if __name__ == "__main__":
    main()

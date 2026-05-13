import re, os

with open('/Users/la6/Documents/GitHub/justlovejazz/references/text-effect.cxml', 'r') as f:
    content = f.read()

docs = re.findall(r'<document index="\d+">(.*?)</document>', content, re.DOTALL)

for doc in docs:
    src_match = re.search(r'<source>(.*?)</source>', doc)
    content_match = re.search(r'<document_content>([\s\S]*?)</document_content>', doc)
    if src_match and content_match:
        filename = src_match.group(1).strip()
        filecontent = content_match.group(1).strip()
        filepath = f'/Users/la6/Documents/GitHub/justlovejazz/references/troika/{filename}'
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as out:
            out.write(filecontent + '\n')
        print(f'Extracted: {filename} ({len(filecontent)} chars)')

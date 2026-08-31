import os
import glob
import re

tools_dir = 'src/components/tools'
files = glob.glob(os.path.join(tools_dir, '*.tsx'))

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def repl(m):
        return m.group(0).replace('<h2', '<h1').replace('</h2', '</h1')
    
    new_content = re.sub(r'<h2 className="[^"]*text-sm font-semibold[^"]*".*?</h2>', repl, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

seo_path = 'src/components/seo/SeoContent.tsx'
with open(seo_path, 'r', encoding='utf-8') as f:
    seo_content = f.read()

seo_content = seo_content.replace('<h1 className="mt-6 mb-3 text-2xl font-bold', '<h2 className="mt-6 mb-3 text-2xl font-bold')
seo_content = seo_content.replace('(Offline & Secure)</h1>', '(Offline & Secure)</h2>')

related_map_code = """const RELATED_MAP: Record<string, string[]> = {
  "json-formatter": ["json-to-typescript", "yaml-json", "css-svg-minifier", "diff-checker"],
  "jwt-decoder": ["base64-decoder", "url-encoder", "hmac-generator", "hash-generator"],
  "unix-timestamp": ["cron-visualizer", "jwt-decoder", "uuid-generator", "json-formatter"],
  "curl-converter": ["json-formatter", "url-encoder", "base64-decoder", "yaml-json"],
  "diff-checker": ["json-formatter", "css-svg-minifier", "markdown-previewer", "case-converter"],
  "xml-formatter": ["json-formatter", "yaml-json", "diff-checker", "css-svg-minifier"],
  "sql-formatter": ["json-formatter", "diff-checker", "regex-tester", "case-converter"],
  "base64-decoder": ["jwt-decoder", "url-encoder", "hash-generator", "hmac-generator"],
  "url-encoder": ["base64-decoder", "jwt-decoder", "curl-converter", "hash-generator"],
  "hash-generator": ["hmac-generator", "jwt-decoder", "base64-decoder", "uuid-generator"],
  "regex-tester": ["diff-checker", "json-formatter", "sql-formatter", "case-converter"],
  "json-to-typescript": ["json-formatter", "yaml-json", "svg-to-jsx", "case-converter"],
  "cron-visualizer": ["unix-timestamp", "regex-tester", "diff-checker", "uuid-generator"],
  "yaml-json": ["json-formatter", "xml-formatter", "json-to-typescript", "diff-checker"],
  "css-svg-minifier": ["svg-to-jsx", "diff-checker", "json-formatter", "xml-formatter"],
  "graphql-formatter": ["json-formatter", "json-to-typescript", "yaml-json", "curl-converter"],
  "markdown-previewer": ["diff-checker", "regex-tester", "css-svg-minifier", "case-converter"],
  "hmac-generator": ["hash-generator", "jwt-decoder", "base64-decoder", "uuid-generator"],
  "cidr-calculator": ["unix-timestamp", "regex-tester", "hash-generator", "cron-visualizer"],
  "svg-to-jsx": ["css-svg-minifier", "json-to-typescript", "case-converter", "json-formatter"],
  "uuid-generator": ["hash-generator", "hmac-generator", "unix-timestamp", "jwt-decoder"],
  "case-converter": ["regex-tester", "diff-checker", "json-to-typescript", "sql-formatter"],
};"""

seo_content = re.sub(r'const RELATED_MAP: Record<string, string\[\]> = \{.*?\};', related_map_code, seo_content, flags=re.DOTALL)

with open(seo_path, 'w', encoding='utf-8') as f:
    f.write(seo_content)
print(f"Updated {seo_path}")

import { describe, expect, it } from "vitest";
import { formatXml, minifyXml } from "../xml";
import { minifyCss, minifyHtml, minifySvg, validateHtml } from "../minify";
import { sortJsonKeys, validateJson } from "../json";

describe("formatXml", () => {
  it("indents nested elements with the requested width", () => {
    const out = formatXml("<a><b><c>x</c></b></a>", 2);
    expect(out).toBe("<a>\n  <b>\n    <c>x</c>\n  </b>\n</a>");
    expect(formatXml("<a><b/></a>", 4)).toBe("<a>\n    <b/>\n</a>");
  });
});

describe("minifyXml", () => {
  it("keeps spaces inside declarations and text content", () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<note>\n  <body>Don\'t forget me</body>\n</note>';
    expect(minifyXml(xml)).toBe('<?xml version="1.0" encoding="UTF-8"?><note><body>Don\'t forget me</body></note>');
  });
});

describe("minifyCss", () => {
  it("keeps multi-value declarations intact", () => {
    expect(minifyCss(".a {\n  padding: 16px 24px;\n  border: 1px solid #e2e8f0;\n}\n")).toBe(
      ".a{padding:16px 24px;border:1px solid #e2e8f0}"
    );
  });

  it("strips comments and spaces around selectors and combinators", () => {
    expect(minifyCss("/* x */ ul > li , a + b { color : red ; }")).toBe("ul>li,a+b{color:red}");
  });

  it("keeps media query and keyword spacing valid", () => {
    expect(minifyCss("@media screen and (min-width: 600px) {\n  .a { margin: 0 auto !important; }\n}")).toBe(
      "@media screen and (min-width:600px){.a{margin:0 auto !important}}"
    );
  });

  it("does not break calc() math or quoted strings", () => {
    expect(minifyCss(".a { width: calc(100% - 2px + 1rem); content: \" : \"; }")).toBe(
      '.a{width:calc(100% - 2px + 1rem);content:" : "}'
    );
  });
});

describe("minifySvg", () => {
  it("keeps attributes separated", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"\n    width="24"   height="24">\n  <!-- c -->\n  <circle cx="12" cy="12" r="10"></circle>\n</svg>';
    expect(minifySvg(svg)).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10"></circle></svg>');
  });
});

describe("minifyHtml", () => {
  it("drops comments and whitespace around block tags but keeps inline gaps", () => {
    const html = "<div>\n  <!-- note -->\n  <p>\n    Hello <b>big</b> <i>world</i>\n  </p>\n</div>";
    expect(minifyHtml(html)).toBe("<div><p>Hello <b>big</b> <i>world</i></p></div>");
  });

  it("leaves pre/script untouched and minifies style blocks", () => {
    const html = "<pre>  keep\n  this </pre>\n<script>\n  const a = 1;\n</script>\n<style>\n  .a { color : red ; }\n</style>";
    expect(minifyHtml(html)).toBe("<pre>  keep\n  this </pre> <script>\n  const a = 1;\n</script> <style>.a{color:red}</style>");
  });

  it("validates that some markup is present", () => {
    expect(validateHtml("<p>x</p>").valid).toBe(true);
    expect(validateHtml("just text").valid).toBe(false);
    expect(validateHtml("   ").valid).toBe(true);
  });
});

describe("sortJsonKeys", () => {
  it("sorts keys at every depth and keeps array order", () => {
    const sorted = sortJsonKeys({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: null } });
    expect(JSON.stringify(sorted)).toBe('{"a":{"c":null,"d":[3,{"y":2,"z":1}]},"b":1}');
  });
});

describe("validateJson", () => {
  it("reports a line number for invalid input", () => {
    const result = validateJson('{\n  "a": 1,\n}');
    expect(result.valid).toBe(false);
    expect(result.line).toBe(3);
  });
});

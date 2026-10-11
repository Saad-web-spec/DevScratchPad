import { describe, expect, it } from "vitest";
import {
  generateFetch,
  generateGoHttp,
  generatePythonRequests,
  parseCurlCommand,
} from "@/lib/tools/curl";

const UI_SAMPLE =
  'curl -X POST https://api.example.com/data \\\n -H "Content-Type: application/json"\\\n -H "Authorization: Bearer token123"\\\n -d \'{"key":"value"}\'';

type RecordedCall = { url: string; init?: Record<string, unknown> };
type AsyncFn = (...args: unknown[]) => Promise<unknown>;
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (
  ...params: string[]
) => AsyncFn;

/** Executes generated fetch code against a stub fetch and returns the recorded call. */
async function runFetchCode(code: string): Promise<RecordedCall> {
  const calls: RecordedCall[] = [];
  const stubFetch = async (url: string, init?: Record<string, unknown>) => {
    calls.push({ url, init });
    return { status: 200, json: async () => ({}), text: async () => "" };
  };
  const quietConsole = { log: () => undefined };
  const fileInput = { files: [new Blob(["file-bytes"])] };
  const fn = new AsyncFunction("fetch", "console", "fileInput", code);
  await fn(stubFetch, quietConsole, fileInput);
  expect(calls).toHaveLength(1);
  return calls[0];
}

describe("parseCurlCommand: tokenizer", () => {
  it("keeps backslashes literal inside single quotes", () => {
    const parsed = parseCurlCommand(String.raw`curl 'https://x.io' -H 'X-Path: C:\dir\new'`);
    expect(parsed.headers).toEqual({ "X-Path": String.raw`C:\dir\new` });
  });

  it("only treats \\\" \\\\ \\$ and \\` as escapes inside double quotes", () => {
    const parsed = parseCurlCommand(String.raw`curl https://x.io -H "X-A: say \"hi\" \$HOME \\ \d"`);
    expect(parsed.headers["X-A"]).toBe(String.raw`say "hi" $HOME \ \d`);
  });

  it("decodes $'...' ANSI-C strings", () => {
    const parsed = parseCurlCommand(String.raw`curl https://x.io --data-raw $'a\nb\tc\'d\\'`);
    expect(parsed.body).toBe("a\nb\tc'd\\");
  });

  it("concatenates adjacent quoted and unquoted parts", () => {
    const parsed = parseCurlCommand("curl https://x.io -H'X-Token: abc' -H\"X-Two: \"'2'");
    expect(parsed.headers).toEqual({ "X-Token": "abc", "X-Two": "2" });
  });

  it("handles unquoted backslash escapes", () => {
    const parsed = parseCurlCommand(String.raw`curl https://x.io -H X-A:\ b`);
    expect(parsed.headers).toEqual({ "X-A": "b" });
    expect(parsed.warnings).toBeUndefined();
  });

  it("removes POSIX line continuations (LF and CRLF)", () => {
    const parsed = parseCurlCommand("curl -X POST \\\n  https://x.io \\\r\n  -d a=1 \\  \n  -d b=2");
    expect(parsed.url).toBe("https://x.io");
    expect(parsed.body).toBe("a=1&b=2");
    expect(parsed.warnings).toBeUndefined();
  });

  it("removes Windows cmd caret continuations", () => {
    const parsed = parseCurlCommand('curl ^\r\n  "https://x.io/api" ^\r\n  -H "Accept: */*" ^\r\n  --compressed');
    expect(parsed.url).toBe("https://x.io/api");
    expect(parsed.headers).toEqual({ Accept: "*/*" });
    expect(parsed.error).toBeUndefined();
  });

  it("removes PowerShell backtick continuations and accepts curl.exe", () => {
    const parsed = parseCurlCommand("curl.exe `\n  https://x.io `\n  -H 'A: b'");
    expect(parsed.url).toBe("https://x.io");
    expect(parsed.headers).toEqual({ A: "b" });
  });

  it("tolerates a leading $ prompt and stops at a pipe", () => {
    const parsed = parseCurlCommand("  $ curl -s https://x.io | jq .");
    expect(parsed.url).toBe("https://x.io");
    expect(parsed.warnings).toBeUndefined();
  });
});

describe("parseCurlCommand: options", () => {
  it("expands combined short flags like -sSL and -sSLk", () => {
    expect(parseCurlCommand("curl -sSL https://x.io")).toEqual({
      url: "https://x.io",
      method: "GET",
      headers: {},
      followRedirects: true,
    });
    const insecure = parseCurlCommand("curl -sSLk https://x.io");
    expect(insecure.insecure).toBe(true);
    expect(insecure.followRedirects).toBe(true);
  });

  it("reads attached short values (-XPOST, -HName: v, -dfoo)", () => {
    const parsed = parseCurlCommand("curl -XPOST '-HX-A: b' -dfoo https://x.io");
    expect(parsed.method).toBe("POST");
    expect(parsed.headers).toEqual({ "X-A": "b" });
    expect(parsed.body).toBe("foo");
  });

  it("reads --opt=value long options", () => {
    const parsed = parseCurlCommand("curl --request=put --data=foo --url=x.io/path");
    expect(parsed.method).toBe("PUT");
    expect(parsed.body).toBe("foo");
    expect(parsed.url).toBe("http://x.io/path");
  });

  it("joins multiple data flags with & and defaults the method to POST", () => {
    const parsed = parseCurlCommand(
      "curl https://x.io -d a=1 --data-binary b=2 --data-urlencode 'q=hello world' --data-raw @literal",
    );
    expect(parsed.method).toBe("POST");
    expect(parsed.body).toBe("a=1&b=2&q=hello%20world&@literal");
  });

  it("handles --json", () => {
    const parsed = parseCurlCommand(`curl --json '{"a":1}' https://x.io -H 'accept: text/plain'`);
    expect(parsed.method).toBe("POST");
    expect(parsed.body).toBe('{"a":1}');
    expect(parsed.headers).toEqual({ accept: "text/plain", "Content-Type": "application/json" });
  });

  it("moves data into the query string with -G", () => {
    const parsed = parseCurlCommand("curl -G https://x.io/search?a=1#top -d n=2 --data-urlencode 'q=a b'");
    expect(parsed.method).toBe("GET");
    expect(parsed.url).toBe("https://x.io/search?a=1&n=2&q=a%20b#top");
    expect(parsed.body).toBeUndefined();
    expect(parseCurlCommand("curl -G https://x.io -d n=2").url).toBe("https://x.io?n=2");
  });

  it("uses HEAD for -I unless -X overrides it", () => {
    expect(parseCurlCommand("curl -I https://x.io").method).toBe("HEAD");
    expect(parseCurlCommand("curl -I -X GET https://x.io").method).toBe("GET");
  });

  it("parses -u credentials", () => {
    expect(parseCurlCommand("curl -u alice:s3:cret https://x.io").auth).toEqual({
      user: "alice",
      password: "s3:cret",
    });
    expect(parseCurlCommand("curl --user bob https://x.io").auth).toEqual({ user: "bob", password: "" });
  });

  it("parses -F form fields and files", () => {
    const parsed = parseCurlCommand("curl -F name=John -F 'avatar=@/tmp/a.png;type=image/png' https://x.io");
    expect(parsed.method).toBe("POST");
    expect(parsed.body).toBeUndefined();
    expect(parsed.form).toEqual([
      { name: "name", value: "John", isFile: false },
      { name: "avatar", value: "/tmp/a.png", isFile: true },
    ]);
  });

  it("maps -b, -A and -e to headers", () => {
    const parsed = parseCurlCommand("curl -b 'a=1' -b b=2 -A 'Bot/1.0' -e https://ref.io https://x.io");
    expect(parsed.headers).toEqual({ Cookie: "a=1; b=2", "User-Agent": "Bot/1.0", Referer: "https://ref.io" });
  });

  it("dedupes headers case-insensitively, keeping the first position", () => {
    const parsed = parseCurlCommand("curl -H 'Accept: a' -H 'X-One: 1' -H 'accept: b' -H 'X-Empty;' https://x.io");
    expect(Object.entries(parsed.headers)).toEqual([
      ["Accept", "b"],
      ["X-One", "1"],
      ["X-Empty", ""],
    ]);
  });

  it("consumes the argument of ignored options", () => {
    const parsed = parseCurlCommand(
      "curl -o out.json -m 10 --max-time 5 -w '%{http_code}' --retry 3 -x http://proxy:8080 --cacert ca.pem https://x.io",
    );
    expect(parsed.url).toBe("https://x.io");
    expect(parsed.warnings).toBeUndefined();
  });

  it("warns about unsupported options without consuming the next token", () => {
    const parsed = parseCurlCommand("curl --frobnicate https://x.io");
    expect(parsed.url).toBe("https://x.io");
    expect(parsed.warnings).toEqual(["Ignored unsupported option --frobnicate"]);
  });

  it("prefixes http:// when the URL has no scheme", () => {
    expect(parseCurlCommand("curl localhost:3000/api").url).toBe("http://localhost:3000/api");
  });

  it("reports a missing URL", () => {
    const parsed = parseCurlCommand("curl -X POST -H 'A: b'");
    expect(parsed.error).toBe("No URL found in the curl command.");
    expect(generateFetch(parsed)).toBe("");
    expect(generatePythonRequests(parsed)).toBe("");
    expect(generateGoHttp(parsed)).toBe("");
  });

  it("rejects input that is not a curl command", () => {
    for (const input of ["", "wget https://x.io", "curlx https://x.io"]) {
      expect(parseCurlCommand(input).error).toBe("Input does not appear to be a curl command.");
    }
  });
});

describe("generateFetch", () => {
  it("emits a bare call for a plain GET", () => {
    expect(generateFetch(parseCurlCommand("curl https://x.io"))).toBe(
      'const response = await fetch("https://x.io");\n\nconst data = await response.text();\nconsole.log(data);',
    );
  });

  it("renders the JSON POST example", () => {
    expect(generateFetch(parseCurlCommand(UI_SAMPLE))).toBe(
      [
        'const response = await fetch("https://api.example.com/data", {',
        '  method: "POST",',
        "  headers: {",
        '    "Content-Type": "application/json",',
        '    Authorization: "Bearer token123",',
        "  },",
        "  body: JSON.stringify({",
        '    key: "value",',
        "  }),",
        "});",
        "",
        "const data = await response.json();",
        "console.log(data);",
      ].join("\n"),
    );
  });

  it("produces runnable code that sends the parsed request", async () => {
    const value = `it's a "quoted" value`;
    const parsed = parseCurlCommand(
      `curl https://x.io -H "X-Quote: it's a \\"quoted\\" value" -d '{"n":null,"ok":true,"list":[1,2]}'`,
    );
    const call = await runFetchCode(generateFetch(parsed));
    expect(call.url).toBe("https://x.io");
    const headers = call.init?.headers as Record<string, string>;
    expect(headers["X-Quote"]).toBe(value);
    expect(JSON.parse(call.init?.body as string)).toEqual({ n: null, ok: true, list: [1, 2] });
  });

  it("uses a string literal for non-JSON bodies", async () => {
    const code = generateFetch(parseCurlCommand(`curl https://x.io -d 'a=1&b=it'"'"'s'`));
    expect(code).toContain('body: "a=1&b=it\'s",');
    expect(code).not.toContain("JSON.stringify");
    const call = await runFetchCode(code);
    expect(call.init?.body).toBe("a=1&b=it's");
  });

  it("builds FormData without a multipart Content-Type header", async () => {
    const code = generateFetch(
      parseCurlCommand("curl -H 'Content-Type: multipart/form-data' -F a=1 -F f=@x.bin https://x.io"),
    );
    expect(code).toContain('form.append("f", fileInput.files[0]); // @x.bin');
    expect(code).not.toContain("multipart");
    const call = await runFetchCode(code);
    expect(call.init?.body).toBeInstanceOf(FormData);
  });

  it("adds basic auth and the -k note", async () => {
    const code = generateFetch(parseCurlCommand("curl -k -u user:pass https://x.io"));
    expect(code).toContain('Authorization: "Basic " + btoa("user:pass"),');
    expect(code.split("\n")[0]).toBe(
      "// fetch cannot skip TLS verification (curl -k); configure it on your server/agent instead.",
    );
    const call = await runFetchCode(code);
    expect((call.init?.headers as Record<string, string>).Authorization).toBe(`Basic ${btoa("user:pass")}`);
  });
});

describe("generatePythonRequests", () => {
  it("renders a plain GET", () => {
    expect(generatePythonRequests(parseCurlCommand("curl https://x.io"))).toBe(
      'import requests\n\nurl = "https://x.io"\n\nresponse = requests.get(url)\nprint(response.status_code)\nprint(response.text)',
    );
  });

  it("renders the JSON POST example", () => {
    expect(generatePythonRequests(parseCurlCommand(UI_SAMPLE))).toBe(
      [
        "import requests",
        "",
        'url = "https://api.example.com/data"',
        "",
        "headers = {",
        '    "Content-Type": "application/json",',
        '    "Authorization": "Bearer token123",',
        "}",
        "",
        "payload = {",
        '    "key": "value",',
        "}",
        "",
        "response = requests.post(url, headers=headers, json=payload)",
        "print(response.status_code)",
        "print(response.text)",
      ].join("\n"),
    );
  });

  it("converts JSON literals to Python and keeps big numbers exact", () => {
    const code = generatePythonRequests(
      parseCurlCommand(`curl https://x.io --json '{"a":true,"b":false,"c":null,"id":12345678901234567890}'`),
    );
    expect(code).toContain('    "a": True,\n    "b": False,\n    "c": None,\n    "id": 12345678901234567890,');
    expect(code).toContain("json=payload");
    expect(code).not.toContain("data=payload");
  });

  it("escapes quotes in header values", () => {
    const code = generatePythonRequests(parseCurlCommand(`curl https://x.io -H "X-Quote: it's \\"q\\""`));
    expect(code).toContain(`    "X-Quote": "it's \\"q\\"",`);
  });

  it("uses data= for non-JSON bodies and splits long calls", () => {
    const code = generatePythonRequests(parseCurlCommand("curl -k -u u:p -X PROPFIND -d a=1 https://x.io"));
    expect(code).toContain('data = "a=1"');
    expect(code).toContain(
      'response = requests.request(\n    "PROPFIND",\n    url,\n    headers=headers,\n    data=data,\n    auth=("u", "p"),\n    verify=False,\n)',
    );
  });

  it("sends -F fields as data/files", () => {
    const code = generatePythonRequests(parseCurlCommand("curl -F name=John -F 'doc=@/tmp/a.pdf' https://x.io"));
    expect(code).toContain('data = {\n    "name": "John",\n}');
    expect(code).toContain('files = {\n    "doc": open("/tmp/a.pdf", "rb"),\n}');
    expect(code).toContain("response = requests.post(url, data=data, files=files)");
  });
});

describe("generateGoHttp", () => {
  it("only imports what a GET needs", () => {
    const code = generateGoHttp(parseCurlCommand("curl -H 'Accept: text/html' https://x.io"));
    expect(code).toContain('import (\n\t"fmt"\n\t"io"\n\t"log"\n\t"net/http"\n)');
    expect(code).not.toContain('"strings"');
    expect(code).not.toContain("ioutil");
    expect(code).toContain('req, err := http.NewRequest("GET", "https://x.io", nil)');
    expect(code).toContain('req.Header.Set("Accept", "text/html")');
  });

  it("renders the JSON POST example", () => {
    expect(generateGoHttp(parseCurlCommand(UI_SAMPLE))).toBe(
      [
        "package main",
        "",
        "import (",
        '\t"fmt"',
        '\t"io"',
        '\t"log"',
        '\t"net/http"',
        '\t"strings"',
        ")",
        "",
        "func main() {",
        '\tbody := strings.NewReader(`{"key":"value"}`)',
        '\treq, err := http.NewRequest("POST", "https://api.example.com/data", body)',
        "\tif err != nil {",
        "\t\tlog.Fatal(err)",
        "\t}",
        '\treq.Header.Set("Content-Type", "application/json")',
        '\treq.Header.Set("Authorization", "Bearer token123")',
        "",
        "\tresp, err := http.DefaultClient.Do(req)",
        "\tif err != nil {",
        "\t\tlog.Fatal(err)",
        "\t}",
        "\tdefer resp.Body.Close()",
        "",
        "\trespBody, err := io.ReadAll(resp.Body)",
        "\tif err != nil {",
        "\t\tlog.Fatal(err)",
        "\t}",
        '\tfmt.Printf("%s\\n", respBody)',
        "}",
      ].join("\n"),
    );
  });

  it("falls back to an interpreted string when the body has a backtick", () => {
    const code = generateGoHttp(parseCurlCommand("curl -d 'a`b' https://x.io"));
    expect(code).toContain('body := strings.NewReader("a`b")');
  });

  it("escapes quotes in header values", () => {
    const code = generateGoHttp(parseCurlCommand(`curl https://x.io -H "X-Quote: it's \\"q\\""`));
    expect(code).toContain(`req.Header.Set("X-Quote", "it's \\"q\\"")`);
  });

  it("handles forms, basic auth and -k", () => {
    const code = generateGoHttp(parseCurlCommand("curl -k -u u:p -F a=1 -F f=@dir/x.bin https://x.io"));
    expect(code).toContain(
      'import (\n\t"bytes"\n\t"crypto/tls"\n\t"fmt"\n\t"io"\n\t"log"\n\t"mime/multipart"\n\t"net/http"\n\t"os"\n)',
    );
    expect(code).toContain('if err := writer.WriteField("a", "1"); err != nil {');
    expect(code).toContain('file, err := os.Open("dir/x.bin")');
    expect(code).toContain('part, err := writer.CreateFormFile("f", "x.bin")');
    expect(code).toContain('req.Header.Set("Content-Type", writer.FormDataContentType())');
    expect(code).toContain('req.SetBasicAuth("u", "p")');
    expect(code).toContain("TLSClientConfig: &tls.Config{InsecureSkipVerify: true},");
    expect(code).toContain("resp, err := client.Do(req)");
    expect(code).not.toContain("http.DefaultClient");
  });
});

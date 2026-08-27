// Simple check to see if the page is just a raw JSON response
function isRawJSONPage() {
  const contentType = document.contentType;
  // Chrome sets contentType to application/json for pure json pages sometimes,
  // or it just renders it in a <pre> tag.
  if (contentType === 'application/json') return true;

  // Fallback: check if the page contains a single pre tag and no other elements
  if (document.body && document.body.childNodes.length === 1) {
    const child = document.body.childNodes[0];
    if (child.tagName === 'PRE') {
      try {
        JSON.parse(child.textContent);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  return false;
}

function init() {
  if (!isRawJSONPage()) return;

  const pre = document.querySelector('pre');
  if (!pre) return;

  const rawJson = pre.textContent;
  let parsedJson;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch (e) {
    return; // Not valid JSON
  }

  // Clear body
  document.body.innerHTML = '';
  document.head.innerHTML = ''; // Clear default styles injected by Chrome for raw JSON

  // Inject our custom UI
  const container = document.createElement('div');
  container.className = 'dsp-json-container';

  // Header with branding and link to DevScratchpad
  const header = document.createElement('div');
  header.className = 'dsp-header';
  
  const title = document.createElement('h1');
  title.innerHTML = `<span>Formatted by</span> DevScratchpad`;
  
  const ctaBtn = document.createElement('a');
  ctaBtn.className = 'dsp-cta-btn';
  // Send the JSON to DevScratchpad via a query parameter or localStorage if we had the same origin,
  // but since we don't, we can just link to the formatter tool.
  ctaBtn.href = 'https://tools.saadengineer.works/json-formatter';
  ctaBtn.target = '_blank';
  ctaBtn.textContent = 'Edit in DevScratchpad';
  
  header.appendChild(title);
  header.appendChild(ctaBtn);

  // Formatted JSON display
  const jsonDisplay = document.createElement('pre');
  jsonDisplay.className = 'dsp-json-display';
  jsonDisplay.innerHTML = syntaxHighlight(JSON.stringify(parsedJson, null, 2));

  container.appendChild(header);
  container.appendChild(jsonDisplay);
  
  document.body.appendChild(container);
}

// Simple syntax highlighting for JSON
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key';
      } else {
        cls = 'string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean';
    } else if (/null/.test(match)) {
      cls = 'null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

init();

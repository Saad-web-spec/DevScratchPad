import os
import sys
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717A"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 810, "DevScratchpad — Architecture, Features & SEO Report")
            self.setStrokeColor(colors.HexColor("#E4E4E7"))
            self.setLineWidth(0.5)
            self.line(40, 804, 555, 804)
        
        # Footer
        self.setStrokeColor(colors.HexColor("#E4E4E7"))
        self.setLineWidth(0.5)
        self.line(40, 38, 555, 38)
        self.drawString(40, 26, "https://tools.saadengineer.works | 100% Client-Side Privacy")
        self.drawRightString(555, 26, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def generate_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#09090B"),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#52525B"),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#09090B"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#27272A"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#27272A"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        "DocBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#3F3F46"),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        "DocCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#18181B")
    )

    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#27272A")
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#09090B")
    )

    table_cell_code = ParagraphStyle(
        "TableCellCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#2563EB")
    )

    table_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#09090B")
    )

    story = []

    # Title Banner Block
    banner_data = [
        [
            Paragraph("<b>DevScratchpad</b>", ParagraphStyle("BTitle", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=colors.white)),
        ],
        [
            Paragraph("Comprehensive Architecture, UI/UX Standards, Tool Matrix &amp; SEO Engine Report", ParagraphStyle("BSub", fontName="Helvetica", fontSize=10, leading=14, textColor=colors.HexColor("#D4D4D8"))),
        ],
        [
            Paragraph("<b>Stack:</b> Next.js 16 (App Router &amp; Turbopack) &bull; React 19 &bull; Tailwind CSS v4 &bull; Monaco Editor &bull; 100% Client-Side Privacy", ParagraphStyle("BMeta", fontName="Helvetica", fontSize=8, leading=11, textColor=colors.HexColor("#A1A1AA"))),
        ]
    ]
    banner_table = Table(banner_data, colWidths=[515])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#09090B")),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 16),
        ('RIGHTPADDING', (0,0), (-1,-1), 16),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 14))

    # SECTION 1
    story.append(Paragraph("1. Executive Summary &amp; Core Architectural Principles", h1_style))
    story.append(Paragraph(
        "<b>DevScratchpad</b> is an open-source, ultra-fast developer scratchpad and utility suite designed to replace cluttered, server-dependent online formatters. Built with Next.js 16 (Turbopack) and React 19, it processes complex developer workflows entirely inside local client memory.",
        body_style
    ))

    # Highlight box
    box_data = [[
        Paragraph(
            "<b>100% Zero-Server Privacy Guarantee:</b> All JSON formatting, JWT decoding, cryptographic hashing, cURL conversions, and regex evaluations occur entirely inside the user's browser sandbox. No input or secret ever leaves the client machine.",
            ParagraphStyle("BoxP", fontName="Helvetica", fontSize=8.5, leading=12, textColor=colors.HexColor("#065F46"))
        )
    ]]
    box_table = Table(box_data, colWidths=[515])
    box_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ECFDF5")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#A7F3D0")),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(box_table)
    story.append(Spacer(1, 10))

    # SECTION 2
    story.append(Paragraph("2. UI/UX Spatial Design &amp; Theme Tokens", h1_style))
    story.append(Paragraph(
        "The interface enforces strict minimalist spatial standards, eliminating double-nested card containers and providing a single unified canvas background across all tools.",
        body_style
    ))

    theme_data = [
        [Paragraph("Element Role", table_header), Paragraph("Tailwind Token Class", table_header), Paragraph("Hex Specification", table_header)],
        [Paragraph("Primary Canvas", table_cell_bold), Paragraph("bg-[#09090B] / bg-white", table_cell_code), Paragraph("#09090B (Dark) / #FFFFFF (Light)", table_cell)],
        [Paragraph("Elevated Cards &amp; Panels", table_cell_bold), Paragraph("bg-[#121215] / bg-[#f8fafc]", table_cell_code), Paragraph("#121215 (Dark) / #F8FAFC (Light)", table_cell)],
        [Paragraph("Borders &amp; Dividers", table_cell_bold), Paragraph("border-[#27272A] / border-[#e2e8f0]", table_cell_code), Paragraph("#27272A (Dark) / #E2E8F0 (Light)", table_cell)],
        [Paragraph("Secondary Action Buttons", table_cell_bold), Paragraph("bg-[#18181B] hover:bg-[#27272A]", table_cell_code), Paragraph("#18181B (Pill / Button Base)", table_cell)],
        [Paragraph("Primary Action CTAs", table_cell_bold), Paragraph("bg-blue-600 hover:bg-blue-700", table_cell_code), Paragraph("#2563EB (Accent Blue)", table_cell)],
        [Paragraph("Local Status Bar", table_cell_bold), Paragraph("bg-[#121215] border-t border-[#27272A]", table_cell_code), Paragraph("32px Local Monaco Footer", table_cell)],
        [Paragraph("Validation Status", table_cell_bold), Paragraph("text-emerald-400 / text-rose-400", table_cell_code), Paragraph("Live green/red badge indicators", table_cell)],
    ]
    t_theme = Table(theme_data, colWidths=[140, 185, 190])
    t_theme.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F4F4F5")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_theme)
    story.append(Spacer(1, 10))

    # SECTION 3
    story.append(Paragraph("3. Typography Engine &amp; Micro-Feedback Protocol", h1_style))
    story.append(Paragraph(
        "<b>Uniform Monospace Input Engine:</b> All raw input surfaces (Cron expressions, Regex search bars, HMAC secrets, CIDR inputs) use uniform styling: <code>font-mono text-base tracking-wide bg-[#121215] border border-[#27272A] text-zinc-100 rounded-lg p-3</code>.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Secondary Action Buttons:</b> Standardized across all routes with <code>h-9 px-3 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-zinc-300 text-xs font-medium rounded-md</code>.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Copy Micro-Feedback:</b> All copy actions across Monaco headers, hash rows, HMAC outputs, and share triggers transition to <b>Copied!</b> with a green checkmark icon for exactly <b>1.5 seconds (1500ms)</b> before resetting.",
        body_style
    ))

    story.append(PageBreak())

    # SECTION 4
    story.append(Paragraph("4. Comprehensive Tool Matrix (19 Production Utilities)", h1_style))
    story.append(Paragraph(
        "DevScratchpad categorizes 19 developer tools across Code Formatters, Security/Crypto, Unix Utilities, Data Converters, and Text Diff operations:",
        body_style
    ))

    tools_data = [
        [Paragraph("Tool Name", table_header), Paragraph("Slug", table_header), Paragraph("Architectural &amp; Functional Highlights", table_header)],
        [Paragraph("JSON Formatter", table_cell_bold), Paragraph("/json-formatter", table_cell_code), Paragraph("2/4 space indentation, minification, real-time syntax error line detection.", table_cell)],
        [Paragraph("JWT Decoder", table_cell_bold), Paragraph("/jwt-decoder", table_cell_code), Paragraph("Decodes Header, Payload &amp; Signature; converts exp/iat/nbf epochs to ISO dates.", table_cell)],
        [Paragraph("Unix Timestamp", table_cell_bold), Paragraph("/unix-timestamp", table_cell_code), Paragraph("Epoch &harr; Date conversion with ms detection, ISO 8601 sync, and 'Now' trigger.", table_cell)],
        [Paragraph("cURL Converter", table_cell_bold), Paragraph("/curl-converter", table_cell_code), Paragraph("Translates cURL commands into JavaScript (fetch), Python (requests), and Go.", table_cell)],
        [Paragraph("Diff Checker", table_cell_bold), Paragraph("/diff-checker", table_cell_code), Paragraph("Side-by-side or inline code diffing with character-level additions and deletions.", table_cell)],
        [Paragraph("XML Formatter", table_cell_bold), Paragraph("/xml-formatter", table_cell_code), Paragraph("XML beautifier with multi-space indent controls, validation, and minification.", table_cell)],
        [Paragraph("SQL Formatter", table_cell_bold), Paragraph("/sql-formatter", table_cell_code), Paragraph("PostgreSQL, MySQL, SQLite, T-SQL, PL/SQL beautifier with keyword casing.", table_cell)],
        [Paragraph("Base64 Tool", table_cell_bold), Paragraph("/base64-decoder", table_cell_code), Paragraph("Safe UTF-8 string encoding and decoding with URL-safe base64 support.", table_cell)],
        [Paragraph("URL Encoder", table_cell_bold), Paragraph("/url-encoder", table_cell_code), Paragraph("Component and Full URI encoder/decoder with query parameter escaping.", table_cell)],
        [Paragraph("Hash Generator", table_cell_bold), Paragraph("/hash-generator", table_cell_code), Paragraph("Parallel cryptographic computation of MD5, SHA-1, SHA-256, and SHA-512.", table_cell)],
        [Paragraph("Regex Tester", table_cell_bold), Paragraph("/regex-tester", table_cell_code), Paragraph("Real-time RegExp testing with flags (g, i, m, s), match lists, and substitution.", table_cell)],
        [Paragraph("JSON to TypeScript", table_cell_bold), Paragraph("/json-to-typescript", table_cell_code), Paragraph("Extracts strongly typed TypeScript interfaces and type aliases from JSON.", table_cell)],
        [Paragraph("Cron Visualizer", table_cell_bold), Paragraph("/cron-visualizer", table_cell_code), Paragraph("Parses 5/6-part cron expressions into plain English with 5-column breakdown.", table_cell)],
        [Paragraph("YAML Converter", table_cell_bold), Paragraph("/yaml-json", table_cell_code), Paragraph("Bidirectional YAML &harr; JSON transformation with one-click data swap.", table_cell)],
        [Paragraph("CSS/SVG Minifier", table_cell_bold), Paragraph("/css-svg-minifier", table_cell_code), Paragraph("Strips comments and whitespace; displays byte savings and compression ratio.", table_cell)],
        [Paragraph("GraphQL Formatter", table_cell_bold), Paragraph("/graphql-formatter", table_cell_code), Paragraph("Formats, validates, and beautifies GraphQL queries and schemas.", table_cell)],
        [Paragraph("Markdown Previewer", table_cell_bold), Paragraph("/markdown-previewer", table_cell_code), Paragraph("Live Markdown editor with sanitized HTML preview via marked and DOMPurify.", table_cell)],
        [Paragraph("HMAC Generator", table_cell_bold), Paragraph("/hmac-generator", table_cell_code), Paragraph("Computes SHA256/SHA512 HMAC signatures in Hex &amp; Base64 for webhooks.", table_cell)],
        [Paragraph("CIDR Calculator", table_cell_bold), Paragraph("/cidr-calculator", table_cell_code), Paragraph("IPv4 subnet calculator (network, broadcast, wildcard, usable host range).", table_cell)],
    ]
    t_tools = Table(tools_data, colWidths=[110, 115, 290])
    t_tools.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F4F4F5")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_tools)
    story.append(Spacer(1, 10))

    # SECTION 5
    story.append(Paragraph("5. Local Storage, Snapshots &amp; Privacy Engine", h1_style))
    story.append(Paragraph(
        "&bull; <b>Local History Buffer (<code>src/lib/storage.ts</code>):</b> Automatically logs up to 15 executions (capped at 5KB per payload) in browser <code>localStorage</code> under <code>devscratchpad_history</code>.<br/>"
        "&bull; <b>Workspace Snapshots:</b> Bookmark multi-pane editor states into named local snapshots.<br/>"
        "&bull; <b>URL Hash Sharing:</b> The <code>ShareButton</code> serializes payloads directly into URL hash fragments (<code>#data=...</code>), completely bypassing server storage.",
        bullet_style
    ))

    story.append(PageBreak())

    # SECTION 6
    story.append(Paragraph("6. Search Engine &amp; Content Optimization (SCO / SEO) System", h1_style))
    story.append(Paragraph(
        "DevScratchpad implements an end-to-end SEO infrastructure designed for organic discovery and maximum search ranking:",
        body_style
    ))

    story.append(Paragraph("6.1 Static Site Generation (SSG) &amp; Meta Engine", h2_style))
    story.append(Paragraph(
        "&bull; <b>Pre-rendered Routes:</b> <code>generateStaticParams()</code> pre-compiles 24 static pages with 0ms TTFB.<br/>"
        "&bull; <b>Dynamic Metadata:</b> <code>generateMetadata()</code> creates unique titles, descriptions, canonical URLs (<code>https://tools.saadengineer.works/{slug}</code>), and OpenGraph/Twitter summary cards.",
        bullet_style
    ))

    story.append(Paragraph("6.2 Structured Data (Schema.org JSON-LD)", h2_style))
    story.append(Paragraph(
        "Every tool route renders a rich <code>WebApplication</code> JSON-LD schema enabling Google Rich Result cards with free offer licensing and developer categorization.",
        body_style
    ))

    story.append(Paragraph("6.3 Long-Tail Procedural Content Engine", h2_style))
    story.append(Paragraph(
        "The <code>SeoContent.tsx</code> component provides rich semantic documentation under every tool:",
        body_style
    ))
    story.append(Paragraph(
        "&bull; <b>Semantic Headings:</b> H1 and H2 tags optimized for search intent (e.g. <i>'How to use JSON Formatter'</i>).<br/>"
        "&bull; <b>Step-by-Step Instructions:</b> Ordered procedural guides detailing exact inputs and actions.<br/>"
        "&bull; <b>Edge Cases &amp; Constraints:</b> Technical documentation of syntax constraints and memory limits.<br/>"
        "&bull; <b>Privacy Trust Badge:</b> Visual callout verifying 100% client-side execution.",
        bullet_style
    ))

    story.append(Paragraph("6.4 Sitemaps &amp; Crawl Indexing", h2_style))
    story.append(Paragraph(
        "&bull; <b>Dynamic Sitemap (<code>/sitemap.xml</code>):</b> Automatically lists root and all tool slugs with weekly frequency and priority weighting (1.0 for root, 0.8 for tools).<br/>"
        "&bull; <b>Robots Protocol (<code>/robots.txt</code>):</b> Unrestricted crawl permissions pointing to sitemap.",
        bullet_style
    ))

    # SECTION 7
    story.append(Paragraph("7. Technical Stack &amp; Build Verification", h1_style))
    stack_data = [
        [Paragraph("Layer", table_header), Paragraph("Technology", table_header), Paragraph("Version / Role", table_header)],
        [Paragraph("Core Framework", table_cell_bold), Paragraph("Next.js (App Router, Turbopack)", table_cell), Paragraph("16.3.3 &bull; SSG Static Compilation", table_cell)],
        [Paragraph("Frontend Runtime", table_cell_bold), Paragraph("React &amp; React DOM", table_cell), Paragraph("19.2.8 &bull; Concurrent Mode", table_cell)],
        [Paragraph("Styling Engine", table_cell_bold), Paragraph("Tailwind CSS &amp; PostCSS", table_cell), Paragraph("v4.0.0 &bull; Minimalist Spatial Tokens", table_cell)],
        [Paragraph("Code Editor", table_cell_bold), Paragraph("Monaco Editor for React", table_cell), Paragraph("^4.7.0 &bull; VS Code Engine", table_cell)],
        [Paragraph("Parsing Engines", table_cell_bold), Paragraph("sql-formatter, yaml, cronstrue, graphql", table_cell), Paragraph("High-precision client formatters", table_cell)],
        [Paragraph("Security / Crypto", table_cell_bold), Paragraph("crypto-js, spark-md5, dompurify", table_cell), Paragraph("Local hashing &amp; HTML sanitization", table_cell)],
        [Paragraph("Hosting &amp; Analytics", table_cell_bold), Paragraph("Vercel Edge Network &amp; Analytics", table_cell), Paragraph("Global Edge CDN &bull; zero server costs", table_cell)],
    ]
    t_stack = Table(stack_data, colWidths=[130, 180, 205])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F4F4F5")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E4E4E7")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 10))

    # SECTION 8
    story.append(Paragraph("8. Production Health &amp; Deployment Status", h1_style))
    story.append(Paragraph(
        "&bull; <b>TypeScript Verification:</b> 0 type errors across strict type checking.<br/>"
        "&bull; <b>Build Status:</b> <code>next build</code> passes with 24 static pages compiled in 2.7s.<br/>"
        "&bull; <b>Git Synchronization:</b> All source files committed and pushed to <code>main</code> on <code>Saad-web-spec/DevScratchPad</code>.",
        bullet_style
    ))

    # Build document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == "__main__":
    out_file = r"c:\Users\User\Desktop\Project_website\DevScratchpad_Project_Report.pdf"
    generate_pdf(out_file)

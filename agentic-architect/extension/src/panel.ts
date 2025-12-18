import * as vscode from "vscode";
import type { OrchestrationResult, TerminalRunResult } from "@shared/types";

export interface PanelState {
  result: OrchestrationResult | null;
  terminal: TerminalRunResult | null;
  specification?: string;
}

export class ControlPanel {
  private static instance: ControlPanel | null = null;
  private panel: vscode.WebviewPanel | null = null;
  private state: PanelState = { result: null, terminal: null };

  private constructor(private readonly extensionUri: vscode.Uri) {}

  static show(extensionUri: vscode.Uri, state: PanelState) {
    if (!this.instance) {
      this.instance = new ControlPanel(extensionUri);
    }
    this.instance.update(state);
    this.instance.reveal();
  }

  private update(state: PanelState) {
    this.state = state;
    if (!this.panel) {
      return;
    }
    this.panel.webview.html = this.renderHtml(this.panel.webview);
  }

  private reveal() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "agenticArchitectControl",
      "Agentic Architect",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    this.panel.onDidDispose(() => {
      this.panel = null;
    });

    this.panel.webview.html = this.renderHtml(this.panel.webview);
  }

  private renderHtml(webview: vscode.Webview) {
    const state = JSON.stringify(this.state);
    return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #020617;
        --panel: rgba(15, 23, 42, 0.7);
        --accent: #8b5cf6;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: var(--bg);
        color: #e2e8f0;
      }
      .container {
        max-width: 960px;
        margin: 0 auto;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 20px;
        backdrop-filter: blur(8px);
      }
      h1 {
        font-size: 22px;
        margin: 0 0 12px;
        color: white;
      }
      h2 {
        font-size: 16px;
        margin-bottom: 12px;
        color: white;
      }
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 12px;
      }
      li {
        background: rgba(148, 163, 184, 0.08);
        border-radius: 14px;
        padding: 12px 16px;
      }
      .tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(139, 92, 246, 0.2);
        color: #c4b5fd;
        border-radius: 999px;
        padding: 4px 10px;
        text-transform: uppercase;
        font-size: 11px;
      }
      pre {
        white-space: pre-wrap;
        background: rgba(15, 23, 42, 0.9);
        border-radius: 14px;
        padding: 12px;
        font-size: 12px;
        overflow-x: auto;
      }
      .meta {
        font-size: 12px;
        color: rgba(226, 232, 240, 0.6);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <section class="panel">
        <h1>Agentic Architect Kontrol Paneli</h1>
        <p class="meta">Specification: <span id="specification">Yükleniyor...</span></p>
      </section>

      <section class="panel">
        <h2>Plan Adımları</h2>
        <ul id="plan"></ul>
      </section>

      <section class="panel">
        <h2>Ajan Mesajları</h2>
        <ul id="agents"></ul>
      </section>

      <section class="panel">
        <h2>RAG Bağlamı</h2>
        <ul id="context"></ul>
      </section>

      <section class="panel">
        <h2>Terminal Sonuçları</h2>
        <div id="terminal"></div>
      </section>
    </div>
    <script type="module">
      const state = ${state};
      const planEl = document.getElementById("plan");
      const agentsEl = document.getElementById("agents");
      const contextEl = document.getElementById("context");
      const terminalEl = document.getElementById("terminal");
      const specEl = document.getElementById("specification");

      if (state.specification) {
        specEl.textContent = state.specification;
      } else {
        specEl.textContent = "Belirtilmedi";
      }

      if (state.result?.plan?.length) {
        state.result.plan.forEach((step) => {
          const item = document.createElement("li");
          item.innerHTML = \`
            <div class="tag">\${step.id}</div>
            <h3>\${step.summary}</h3>
            <p class="meta">\${step.rationale}</p>
          \`;
          planEl.appendChild(item);
        });
      } else {
        planEl.innerHTML = "<li>Henüz plan oluşturulmadı.</li>";
      }

      if (state.result?.codingNotes?.length) {
        state.result.codingNotes.concat(state.result.reviewNotes ?? []).forEach((note) => {
          const item = document.createElement("li");
          item.innerHTML = \`
            <div class="tag">\${note.role}</div>
            <strong>\${note.content}</strong>
            <p class="meta">\${note.reasoning}</p>
          \`;
          agentsEl.appendChild(item);
        });
      } else {
        agentsEl.innerHTML = "<li>Ajan mesajı yok.</li>";
      }

      if (state.result?.relevantContext?.length) {
        state.result.relevantContext.forEach((ctx) => {
          const item = document.createElement("li");
          item.innerHTML = \`
            <div class="tag">\${ctx.path}</div>
            <p class="meta">Benzerlik: \${ctx.similarity.toFixed(2)}</p>
            <pre>\${ctx.preview}</pre>
          \`;
          contextEl.appendChild(item);
        });
      } else {
        contextEl.innerHTML = "<li>Bağlam bulunamadı.</li>";
      }

      if (state.terminal) {
        terminalEl.innerHTML = \`
          <div class="tag">\${state.terminal.success ? "Başarılı" : "Hatalı"}</div>
          <p class="meta">Komut: \${state.terminal.command} | Deneme: \${state.terminal.attempts}</p>
          <pre>\${state.terminal.stdout || state.terminal.stderr}</pre>
        \`;
      } else {
        terminalEl.innerHTML = "<p class='meta'>Henüz terminal çalıştırılmadı.</p>";
      }
    </script>
  </body>
</html>`;
  }
}

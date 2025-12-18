"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Brain,
  Braces,
  CheckCircle2,
  Command,
  FileCode2,
  Loader2,
  PlayCircle,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import type { OrchestrationResult, TerminalRunResult } from "@shared/types";

interface WorkspaceFile {
  path: string;
  content: string;
}

const sampleWorkspace: WorkspaceFile[] = [
  {
    path: "src/agents/manager.ts",
    content: `export function buildPlan(requirement: string): string[] {
  const steps = requirement
    .split(/[.!?]/)
    .map((step) => step.trim())
    .filter(Boolean);

  if (!steps.length) {
    return ["Gereksinimi analiz et", "Güncel kodu tara", "Planı uygula"];
  }
  return steps;
}
`,
  },
  {
    path: "src/agents/coder.ts",
    content: `export function implement(step: string, context: string) {
  return {
    summary: step,
    generatedCode: [
      "// Generated implementation",
      \`// Context:: \${context.slice(0, 120)}\`,
    ].join("\\n"),
  };
}
`,
  },
  {
    path: "src/agents/reviewer.ts",
    content: `export function review(step: string, code: string) {
  const issues: string[] = [];
  if (!code.includes("test")) {
    issues.push("Test eksikliği tespit edildi");
  }

  return {
    step,
    approved: issues.length === 0,
    issues,
  };
}
`,
  },
];

const sampleSpecification = `Kullanıcıdan gelen gereksinimi yöneten "Manager" ajanı plan çıkarmalı.
"Coder" ajanı planı kod üretimine çevirmeli.
"Reviewer" ajanı üretilen kodu hata denetimine sokmalı.
RAG bağlamı sadece ilgili dosyaları getirmeli.`;

type FormValues = {
  specification: string;
  tests: string;
};

export function Dashboard() {
  const [files, setFiles] = useState<WorkspaceFile[]>(sampleWorkspace);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [terminalResult, setTerminalResult] = useState<TerminalRunResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningCommand, setIsRunningCommand] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      specification: sampleSpecification,
      tests: "npm run test\nnpm run lint",
    },
  });

  const tests = useMemo(() => result?.suggestedCommands ?? [], [result]);

  const addNewFile = () => {
    const index = files.length + 1;
    setFiles((prev) => [
      ...prev,
      {
        path: `src/new-file-${index}.ts`,
        content: "// Yeni dosya içeriğini buraya girin.",
      },
    ]);
  };

  const updateFile = (index: number, patch: Partial<WorkspaceFile>) => {
    setFiles((prev) =>
      prev.map((file, idx) => (idx === index ? { ...file, ...patch } : file)),
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onSubmit = handleSubmit(async (values) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specification: values.specification,
          files,
          tests: values.tests
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error("Orkestrasyon başarısız.");
      }

      const payload: OrchestrationResult = await response.json();
      setResult(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  });

  const runCommand = async (command: string) => {
    setIsRunningCommand(true);
    try {
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        throw new Error("Komut çalıştırılamadı.");
      }

      const payload: TerminalRunResult = await response.json();
      setTerminalResult(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRunningCommand(false);
    }
  };

  const resetState = () => {
    setFiles(sampleWorkspace);
    setResult(null);
    setTerminalResult(null);
    reset({
      specification: sampleSpecification,
      tests: "npm run test\nnpm run lint",
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-16 px-6 lg:px-0">
      <header className="soft-container relative overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-200 shadow">
            <Sparkles className="h-4 w-4 text-violet-400" />
            Agentik Yazılım Mühendisi - VS Code Eklentisi Konsolu
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Autonomous Software Architect & Coder
            </h1>
            <p className="max-w-3xl text-base text-slate-200/80">
              Çok ajanlı planlama, otonom dosya yönetimi ve kendi kendini iyileştiren terminal ile
              yüksek otonomide çalışan bir VS Code eklentisini simüle edin. Ajanlarınız proje
              bağlamını vektörleştirir, ilgili dosyaları seçer ve hata döngüsünde kendi kendini
              onarır.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="rounded-full bg-white/10 px-3 py-1">CrewAI üçlü ajan</span>
            <span className="rounded-full bg-white/10 px-3 py-1">MCP erişim köprüleri</span>
            <span className="rounded-full bg-white/10 px-3 py-1">RAG destekli bağlam</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Self-healing terminal</span>
          </div>
        </div>
      </header>

      <section className="panel-grid lg:grid-cols-[2fr_1fr]">
        <form onSubmit={onSubmit} className="soft-container flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-300" />
              Görev Tanımı
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetState}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Örneği Yükle
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-white/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analiz ediliyor
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Orkestrasyonu Başlat
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            {...register("specification")}
            rows={6}
            className="min-h-[160px] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none ring-violet-500/40 focus:ring"
            placeholder="Ajanların gerçekleştirmesini istediğiniz gereksinimi yazın..."
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-200">Önerilen Test Komutları</label>
            <textarea
              {...register("tests")}
              rows={2}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none ring-violet-500/40 focus:ring"
            />
          </div>
        </form>

        <div className="soft-container flex h-full flex-col gap-4">
          <div className="section-title flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-violet-300" />
            Workspace Dosyaları
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {files.map((file, index) => (
              <div key={file.path + index} className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                  <input
                    value={file.path}
                    onChange={(event) => updateFile(index, { path: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-2 py-1 outline-none focus:border-violet-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-full bg-red-500/20 px-2 py-1 text-[11px] text-red-200 transition hover:bg-red-500/30"
                  >
                    Sil
                  </button>
                </div>
                <textarea
                  value={file.content}
                  onChange={(event) => updateFile(index, { content: event.target.value })}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[13px] text-slate-100 outline-none focus:border-violet-400"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addNewFile}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-white/30 px-3 py-2 text-sm text-slate-200 transition hover:border-violet-400 hover:text-white"
          >
            <Braces className="h-4 w-4" />
            Yeni Dosya Ekle
          </button>
        </div>
      </section>

      <section className="panel-grid lg:grid-cols-[2fr_1fr]">
        <div className="soft-container flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Command className="h-5 w-5 text-violet-300" />
              Multi-Agent Orchestration
            </h2>
          </div>

          {result ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-200">Plan Adımları</p>
                <ul className="space-y-3 text-sm text-slate-200/90">
                  {result.plan.map((step) => (
                    <li key={step.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-violet-200/80">
                        <span>{step.id}</span>
                        <span>{step.status}</span>
                      </div>
                      <p className="mt-2 font-medium text-white">{step.summary}</p>
                      <p className="mt-1 text-xs text-slate-300/80">{step.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-200">Ajan Günlükleri</p>
                  <div className="space-y-4 text-sm text-slate-200/90">
                    {result.codingNotes.map((note) => (
                      <div key={note.timestamp + note.role} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <span className="text-xs uppercase tracking-wide text-violet-300">{note.role}</span>
                        <p className="mt-2 font-medium text-white">{note.content}</p>
                        <p className="mt-1 text-xs text-slate-300/80">{note.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-200">Reviewer Notları</p>
                  <ul className="space-y-3 text-sm text-slate-200/90">
                    {result.reviewNotes.map((note) => (
                      <li key={note.timestamp + note.role} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="font-medium text-white">{note.content}</p>
                        <p className="mt-1 text-xs text-slate-300/80">{note.reasoning}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-center text-sm text-slate-300">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <p>Planı görmek için yeni bir orkestrasyon başlatın.</p>
            </div>
          )}
        </div>

        <div className="soft-container flex flex-col gap-4">
          <h2 className="section-title">RAG Bağlamı</h2>
          {result?.relevantContext?.length ? (
            <ul className="space-y-3 text-sm text-slate-200/90">
              {result.relevantContext.map((context) => (
                <li key={context.path} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-violet-200/80">
                    <span>{context.path}</span>
                    <span>{context.similarity.toFixed(2)}</span>
                  </div>
                  <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/40 p-3 text-[12px] text-slate-300/90">
                    {context.preview}
                  </pre>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-center text-sm text-slate-300">
              İlgili dosyalar burada görünecek.
            </div>
          )}
        </div>
      </section>

      <section className="panel-grid md:grid-cols-2">
        <div className="soft-container flex flex-col gap-4">
          <div className="section-title flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-violet-300" />
            Self-Healing Terminal
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200/80">
            <p className="mb-3 text-xs uppercase tracking-wide text-violet-200">
              Önerilen Komutlar
            </p>
            {tests.length ? (
              <div className="flex flex-wrap gap-2">
                {tests.map((command) => (
                  <button
                    key={command}
                    type="button"
                    onClick={() => runCommand(command)}
                    className="rounded-full bg-white/10 px-3 py-2 text-xs text-slate-200 transition hover:bg-violet-500/60 hover:text-white"
                  >
                    {command}
                  </button>
                ))}
              </div>
            ) : (
              <p>Önce orkestrasyon çalıştırarak komut önerilerini alın.</p>
            )}
          </div>

          <button
            type="button"
            disabled={isRunningCommand}
            onClick={() => runCommand("npm run build")}
            className="inline-flex items-center gap-2 self-start rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-white/20"
          >
            {isRunningCommand ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Terminal Çalışıyor
              </>
            ) : (
              <>
                <Command className="h-4 w-4" />
                npm run build
              </>
            )}
          </button>

          {terminalResult && (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-slate-200/90">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-violet-200">
                  {terminalResult.command}
                </span>
                {terminalResult.success ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Başarılı
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-[11px] text-red-300">
                    Hata
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-300/80">
                Deneme: {terminalResult.attempts} | Fixler:{" "}
                {terminalResult.fixesApplied.length
                  ? terminalResult.fixesApplied.join(", ")
                  : "Uygulanmadı"}
              </p>
              <pre className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/40 p-3 text-[12px] text-slate-300/90">
                {terminalResult.stdout || terminalResult.stderr}
              </pre>
            </div>
          )}
        </div>

        <div className="soft-container flex flex-col gap-4">
          <div className="section-title flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-violet-300" />
            Reviewer Çıktıları
          </div>
          {result?.reviewNotes?.length ? (
            <div className="grid gap-3">
              {result.reviewNotes.map((note) => (
                <div key={note.timestamp + note.content} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-sm font-semibold text-white">{note.content}</p>
                  <p className="mt-2 text-xs text-slate-300/80">{note.reasoning}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/15 p-6 text-center text-sm text-slate-300">
              Orkestrasyon sonuçları burada listelenecek.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


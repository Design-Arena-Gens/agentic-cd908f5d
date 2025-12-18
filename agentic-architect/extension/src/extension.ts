import * as vscode from "vscode";
import { collectWorkspaceDocuments, resolveWorkspaceFolder } from "./fileSystem";
import { orchestrateWorkspace } from "./orchestrator";
import { ControlPanel, PanelState } from "./panel";
import { runInSelfHealingTerminal } from "./terminal";

let panelState: PanelState = {
  result: null,
  terminal: null,
};

async function pickSpecification() {
  const input = await vscode.window.showInputBox({
    prompt: "Ajanların çözmesini istediğiniz görevi yazın",
    placeHolder: "Örn: API katmanını iyileştir ve hataları gider",
  });
  return input;
}

async function runAgenticWorkflow(context: vscode.ExtensionContext) {
  const specification = await pickSpecification();
  if (!specification) {
    return;
  }

  const workspacePath = resolveWorkspaceFolder();
  if (!workspacePath) {
    vscode.window.showWarningMessage("Agentic Architect: Lütfen önce bir workspace açın.");
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Agentic Architect: Ajanlar çalışıyor",
    },
    async (progress) => {
      progress.report({ message: "Workspace taranıyor..." });
      const documents = await collectWorkspaceDocuments();
      if (!documents.length) {
        vscode.window.showWarningMessage("Workspace içinde analiz edilecek dosya bulunamadı.");
        return;
      }

      progress.report({ message: "Plan oluşturuluyor..." });
      const configuration = vscode.workspace.getConfiguration("agenticArchitect");
      const defaultTest = configuration.get<string>("defaultTestCommand") ?? "";

      const result = orchestrateWorkspace(specification, documents, defaultTest ? [defaultTest] : []);
      panelState = { ...panelState, specification, result };

      ControlPanel.show(context.extensionUri, panelState);
      vscode.window.showInformationMessage(`Agentic Architect: ${result.plan.length} adımlı plan hazır.`);

      if (defaultTest) {
        progress.report({ message: `Self-healing terminal '${defaultTest}' komutunu çalıştırıyor...` });
        try {
          const terminalResult = await runInSelfHealingTerminal(defaultTest, workspacePath);
          panelState = { ...panelState, terminal: terminalResult };
          ControlPanel.show(context.extensionUri, panelState);
        } catch (error) {
          vscode.window.showErrorMessage(`Agentic Architect terminal hatası: ${String(error)}`);
        }
      }
    },
  );
}

export function activate(context: vscode.ExtensionContext) {
  const runDisposable = vscode.commands.registerCommand("agenticArchitect.run", () =>
    runAgenticWorkflow(context),
  );

  const openDisposable = vscode.commands.registerCommand("agenticArchitect.openPanel", () => {
    ControlPanel.show(context.extensionUri, panelState);
  });

  context.subscriptions.push(runDisposable, openDisposable);
}

export function deactivate() {}


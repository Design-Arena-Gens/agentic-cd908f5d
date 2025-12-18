## Autonomous Software Architect & Coder

Agentik yazılım mühendisi eklentisi ve demo kontrol paneli. Bu depo iki ana parçadan oluşur:

1. **Next.js demo arayüzü** (`/`) — üç ajanlı CrewAI orkestrasyonunu, RAG tabanlı bağlamı ve self-healing terminalini görselleştirir.
2. **VS Code uzantısı** (`/extension`) — gerçek workspace üzerinde aynı yetenekleri uygular, panel açar ve terminal komutlarını otomatik iyileştirir.

### Next.js uygulaması

```bash
npm install
npm run dev
# http://localhost:3000 adresinde arayüzü açın
```

Üretim derlemesi için:

```bash
npm run build
npm start
```

### VS Code uzantısı

```bash
cd extension
npm install
npm run build
```

Uzantıyı VS Code'da denemek için:

1. `vsce package` ile `.vsix` oluşturabilir veya VS Code içindeki Run and Debug panelinden `Extension` konfigürasyonunu çalıştırabilirsiniz.
2. Komut Paleti'nden **Agentic Architect: Otonom Süreci Başlat** komutunu çağırın.

### Özellikler

- **Multi-Agent Orchestration:** Manager, Coder ve Reviewer ajanları otomatik plan çıkarır, kod adımlarını üretir ve kalite kontrolü yapar.
- **MCP Entegrasyonu:** Yerel dosya sistemi taraması, terminal komutu çalıştırma ve tarayıcı yönlendirmeleri için VS Code API'leri kullanılır.
- **RAG Tabanlı Bağlam:** Workspace dosyaları vektörleştirilir, sorguyla en alakalı kesitler seçilir ve ajanlara iletilir.
- **Self-Healing Terminal:** Komutlar çalıştırılır, hata alınırsa teşhis edilip otomatik düzeltme girişiminde bulunulur.

### Yapı

- Paylaşılan çekirdek mantık `shared/` klasöründedir ve hem web arayüzü hem de uzantı tarafından kullanılır.
- `src/app/api` uç noktaları yerel olarak orkestrasyon ve terminal işlemleri sunar, Vercel üzerinde de çalışacak şekilde yapılandırılmıştır.

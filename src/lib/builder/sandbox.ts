import type { ProjectFile } from "@/types/project";

export interface SandboxState {
  files: ProjectFile[];
  entryPoint: string;
  isRunning: boolean;
}

export function createSandboxHtml(files: ProjectFile[]): string {
  const htmlFile = files.find(
    (f) => f.path.endsWith("index.html") || f.path.endsWith("page.tsx")
  );
  const cssFiles = files.filter(
    (f) => f.path.endsWith(".css") || f.path.endsWith(".scss")
  );
  const jsFiles = files.filter(
    (f) =>
      f.path.endsWith(".js") ||
      f.path.endsWith(".ts") ||
      f.path.endsWith(".tsx") ||
      f.path.endsWith(".jsx")
  );

  const cssContent = cssFiles.map((f) => f.content).join("\n");
  const jsContent = jsFiles
    .filter((f) => !f.path.includes("page.tsx") && !f.path.includes("layout"))
    .map((f) => f.content)
    .join("\n");

  if (htmlFile && htmlFile.path.endsWith(".html")) {
    return htmlFile.content;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${cssContent}</style>
</head>
<body class="bg-gray-950 text-white min-h-screen">
  <div id="root">
    <div class="p-8 text-center">
      <h1 class="text-2xl font-bold mb-4">Project Preview</h1>
      <p class="text-gray-400">Live preview of your generated project</p>
      <div class="mt-8 p-4 bg-gray-900 rounded-lg text-left">
        <p class="text-sm text-gray-500 mb-2">Files generated:</p>
        <ul class="text-sm space-y-1">
          ${files.map((f) => `<li class="text-amber-400">📄 ${f.path}</li>`).join("\n          ")}
        </ul>
      </div>
    </div>
  </div>
  <script>${jsContent}</script>
</body>
</html>`;
}

export function getSandboxUrl(projectId: string): string {
  return `/api/preview/${projectId}`;
}

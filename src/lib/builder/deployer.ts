import type { ProjectFile } from "@/types/project";

export interface DeployResult {
  deploymentUrl: string;
  status: "queued" | "building" | "ready" | "error";
  deploymentId: string;
}

export async function deployToVercel({
  projectName,
  files,
}: {
  projectName: string;
  files: ProjectFile[];
}): Promise<DeployResult> {
  const token = process.env.VERCEL_API_ACCESS_TOKEN;
  if (!token) {
    throw new Error("VERCEL_API_ACCESS_TOKEN is not configured");
  }

  const vercelFiles = files.map((f) => ({
    file: f.path,
    data: Buffer.from(f.content).toString("base64"),
    encoding: "base64" as const,
  }));

  const response = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      files: vercelFiles,
      projectSettings: {
        framework: "nextjs",
        buildCommand: "npm run build",
        outputDirectory: ".next",
        installCommand: "npm install",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel deploy failed: ${error}`);
  }

  const data = await response.json();

  return {
    deploymentUrl: `https://${data.url}`,
    status: "queued",
    deploymentId: data.id,
  };
}

export async function deployToRender({
  projectName,
  repoUrl,
}: {
  projectName: string;
  repoUrl: string;
}): Promise<DeployResult> {
  const token = process.env.RENDER_API_KEY;
  if (!token) {
    throw new Error("RENDER_API_KEY is not configured");
  }

  const response = await fetch("https://api.render.com/v1/services", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "web_service",
      name: projectName,
      repo: repoUrl,
      autoDeploy: "yes",
      buildCommand: "npm install && npm run build",
      startCommand: "npm start",
      plan: "starter",
      runtime: "node",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Render deploy failed: ${error}`);
  }

  const data = await response.json();

  return {
    deploymentUrl: `https://${data.service.slug}.onrender.com`,
    status: "building",
    deploymentId: data.service.id,
  };
}

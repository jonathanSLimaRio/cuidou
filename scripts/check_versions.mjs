import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";

const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const npmCommand = process.execPath;
const checks = [
  { label: "Node", command: process.execPath, args: ["--version"] },
  { label: "npm", command: npmCommand, args: [npmCli, "--version"] },
  {
    label: "Expo (CuidouApp)",
    command: npmCommand,
    args: [npmCli, "--prefix", "CuidouApp", "exec", "expo", "--", "--version"],
  },
  { label: "Maestro", command: "maestro", args: ["--version"] },
];

let maestroAvailable = false;

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
    timeout: 30_000,
  });
  const optional = check.label === "Maestro";

  if (result.error || result.status !== 0) {
    console.log(`${check.label}: indisponível${optional ? " (opcional)" : ""}`);
    continue;
  }

  if (check.label === "Maestro") {
    maestroAvailable = true;
  }

  const version = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  console.log(`${check.label}: ${version || "versão não informada"}`);
}

if (!maestroAvailable) {
  console.log("Maestro não encontrado; instale-o para executar os fluxos mobile Maestro.");
}

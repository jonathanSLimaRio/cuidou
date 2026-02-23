import { loadEnvConfig } from "@next/env";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  DESIGN_MEDIA_KEYS,
  type DesignMediaCatalogItem,
  type DesignMediaKey,
  designMediaCatalog,
} from "../src/content/design-media-catalog";
import { uploadMediaToWordPress } from "../src/lib/wordpress-media";

loadEnvConfig(process.cwd());

type DesignMediaSpec = {
  key: DesignMediaKey;
  alt: string;
  width: number;
  height: number;
  prompt: string;
};

type CliFlags = {
  skipGenerate: boolean;
  onlyKeys: Set<DesignMediaKey> | null;
  quality: "low" | "medium" | "high" | "auto";
};

const OUTPUT_DIR = join(process.cwd(), "output", "imagegen", "cuidou-v2");
const CATALOG_PATH = join(process.cwd(), "src", "content", "design-media-catalog.ts");
const DEFAULT_IMAGE_CLI = join(
  process.env.CODEX_HOME || join(homedir(), ".codex"),
  "skills",
  "imagegen",
  "scripts",
  "image_gen.py",
);

const specs: DesignMediaSpec[] = [
  {
    key: "homeHero",
    alt: "Família com babá sorrindo na sala, estilo ilustração amigável",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: website hero for a childcare and elder care marketplace. Primary request: create a warm Brazilian family home scene with a babysitter and parent discussing routine while a child plays calmly. Style: polished 2D illustration, friendly and modern, no childish exaggeration. Composition: horizontal 3:2 with clear space on left for headline. Lighting: soft daylight through window. Color palette: navy, pastel pink, pastel yellow, cyan accents. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "serviceBabysitter",
    alt: "Babá cuidando de criança em atividade educativa",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: service section card for babysitting. Primary request: babysitter helping a young child with educational blocks and reading in a tidy living room. Style: warm editorial illustration, clean shapes and subtle textures. Composition: horizontal 3:2, subject centered. Lighting: bright natural afternoon. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "serviceElderCare",
    alt: "Cuidadora acompanhando idosa em caminhada segura",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: service section card for elder care. Primary request: professional caregiver walking alongside an elderly woman in a safe neighborhood park, supportive and respectful body language. Style: friendly modern illustration. Composition: horizontal 3:2, both subjects visible. Lighting: golden morning light. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "serviceModeration",
    alt: "Interface de moderação com selos de verificação",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: ui-mockup. Asset type: trust and moderation section image. Primary request: conceptual interface scene showing profile verification badges, moderation queue cards and safety checks. Style: playful but professional flat illustration. Composition: horizontal 3:2 with layered dashboard cards. Colors: navy, white, pastel accents. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "serviceChat",
    alt: "Família e profissional conversando por chat protegido",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: ui-mockup. Asset type: communication section image. Primary request: split scene with family and caregiver chatting through a private messaging app on phones, with safe lock iconography in the environment. Style: modern friendly illustration. Composition: horizontal 3:2, dynamic diagonal layout. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "featuredPro1",
    alt: "Profissional de cuidado com postura acolhedora",
    width: 1024,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: professional card portrait. Primary request: confident female caregiver portrait, smiling, neutral home background, approachable and professional. Style: clean digital illustration portrait. Composition: square 1:1 medium close-up. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "featuredPro2",
    alt: "Profissional de cuidado em atendimento residencial",
    width: 1024,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: professional card portrait. Primary request: babysitter profile portrait, warm expression, subtle toys and books in blurred background. Style: polished digital illustration. Composition: square 1:1 medium close-up. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "featuredPro3",
    alt: "Cuidadora experiente em ambiente doméstico",
    width: 1024,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: professional card portrait. Primary request: elder caregiver portrait in cozy home setting, trustful and calm expression. Style: modern soft illustration. Composition: square 1:1 medium close-up. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "testimonialFamily",
    alt: "Família satisfeita com contratação de cuidadora",
    width: 1024,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: testimonial avatar image. Primary request: happy Brazilian family portrait in home environment, candid friendly mood. Style: modern illustration, clean and soft. Composition: square 1:1 head-and-shoulders group portrait. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "testimonialProfessional",
    alt: "Profissional feliz após contratação bem-sucedida",
    width: 1024,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: testimonial avatar image. Primary request: professional caregiver smiling with confident posture, neutral pastel background. Style: soft editorial illustration. Composition: square 1:1 portrait. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "loginHero",
    alt: "Ilustração de confiança e acesso seguro na plataforma",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: illustration-story. Asset type: login page visual panel. Primary request: caregiver and family representative greeting each other while secure app login symbols appear subtly in scene. Style: friendly premium illustration. Composition: horizontal 3:2 with room for overlay text. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "onboardingHero",
    alt: "Usuário escolhendo papel entre família e profissional",
    width: 1536,
    height: 1024,
    prompt:
      'Use case: ui-mockup. Asset type: onboarding visual panel. Primary request: person selecting between two clear paths, "family" and "professional", represented with icon cards and supportive scene. Style: modern playful illustration. Composition: horizontal 3:2. Constraints: no logos, no watermark, no readable text.',
  },
  {
    key: "jobsHero",
    alt: "Mapa de oportunidades com vagas abertas",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: ui-mockup. Asset type: marketplace jobs hero visual. Primary request: dashboard-like scene with job cards, location pins and caregiving icons across Brazil regions. Style: modern illustration with clear hierarchy. Composition: horizontal 3:2. Constraints: no logos, no text, no watermark.",
  },
  {
    key: "professionalsHero",
    alt: "Galeria de profissionais com selo de verificação",
    width: 1536,
    height: 1024,
    prompt:
      "Use case: ui-mockup. Asset type: marketplace professionals hero visual. Primary request: gallery of caregiver profile cards with verification seals and availability badges. Style: clean colorful illustration. Composition: horizontal 3:2 with layered cards. Constraints: no logos, no text, no watermark.",
  },
];

function parseFlags(argv: string[]): CliFlags {
  const skipGenerate = argv.includes("--skip-generate");
  const qualityArg = argv.find((arg) => arg.startsWith("--quality="))?.split("=")[1];
  const quality: CliFlags["quality"] =
    qualityArg === "low" || qualityArg === "medium" || qualityArg === "high" || qualityArg === "auto"
      ? qualityArg
      : "high";

  const onlyRaw = argv.find((arg) => arg.startsWith("--only="))?.split("=")[1];
  const onlyValues = onlyRaw?.split(",").map((item) => item.trim()) ?? [];

  if (onlyValues.length === 0) {
    return {
      skipGenerate,
      onlyKeys: null,
      quality,
    };
  }

  const onlyKeys = new Set<DesignMediaKey>();
  for (const value of onlyValues) {
    if (DESIGN_MEDIA_KEYS.includes(value as DesignMediaKey)) {
      onlyKeys.add(value as DesignMediaKey);
    }
  }

  return {
    skipGenerate,
    onlyKeys,
    quality,
  };
}

function resolveSpecs(flags: CliFlags) {
  if (!flags.onlyKeys) {
    return specs;
  }

  return specs.filter((item) => flags.onlyKeys?.has(item.key));
}

function commandExists(command: string) {
  const check = spawnSync("which", [command], { stdio: "ignore" });
  return check.status === 0;
}

function runGenerate(spec: DesignMediaSpec, outputFilePath: string, quality: CliFlags["quality"]) {
  const cliPath = process.env.IMAGE_GEN_CLI || DEFAULT_IMAGE_CLI;
  if (!existsSync(cliPath)) {
    throw new Error(`Image generation CLI not found: ${cliPath}`);
  }

  const args = [
    cliPath,
    "generate",
    "--prompt",
    spec.prompt,
    "--size",
    `${spec.width}x${spec.height}`,
    "--quality",
    quality,
    "--out",
    outputFilePath,
    "--output-format",
    "png",
  ];

  const runner = commandExists("uv")
    ? {
        command: "uv",
        args: ["run", "--with", "openai", "--with", "pillow", "python", ...args],
      }
    : {
        command: "python3",
        args,
      };

  const generated = spawnSync(runner.command, runner.args, {
    stdio: "inherit",
    env: process.env,
  });

  if (generated.status !== 0) {
    throw new Error(`Image generation failed for ${spec.key}`);
  }
}

function escapeValue(value: string) {
  return JSON.stringify(value);
}

function serializeCatalog(items: Record<DesignMediaKey, DesignMediaCatalogItem>) {
  const keys = DESIGN_MEDIA_KEYS.map((key) => `  "${key}"`).join(",\n");
  const body = DESIGN_MEDIA_KEYS.map((key) => {
    const item = items[key];
    return [
      `  ${key}: {`,
      `    key: "${item.key}",`,
      `    url: ${escapeValue(item.url)},`,
      `    alt: ${escapeValue(item.alt)},`,
      `    width: ${item.width},`,
      `    height: ${item.height},`,
      `    mediaId: ${item.mediaId === null ? "null" : item.mediaId},`,
      "  },",
    ].join("\n");
  }).join("\n");

  return `export const DESIGN_MEDIA_KEYS = [\n${keys},\n] as const;\n\nexport type DesignMediaKey = (typeof DESIGN_MEDIA_KEYS)[number];\n\nexport type DesignMediaCatalogItem = {\n  key: DesignMediaKey;\n  url: string;\n  alt: string;\n  width: number;\n  height: number;\n  mediaId: number | null;\n};\n\nexport const designMediaCatalog: Record<DesignMediaKey, DesignMediaCatalogItem> = {\n${body}\n};\n`;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const selectedSpecs = resolveSpecs(flags);

  if (!process.env.WORDPRESS_URL || !process.env.WP_USER || !process.env.WP_APP_PASS) {
    throw new Error("WORDPRESS_URL, WP_USER and WP_APP_PASS are required");
  }

  if (!flags.skipGenerate && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for generation. Use --skip-generate to upload existing files.");
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const nextCatalog: Record<DesignMediaKey, DesignMediaCatalogItem> = {
    ...designMediaCatalog,
  };

  for (const spec of selectedSpecs) {
    const outputFilePath = join(OUTPUT_DIR, `${spec.key}.png`);
    const exists = existsSync(outputFilePath);

    if (!exists && flags.skipGenerate) {
      throw new Error(`Missing file for upload: ${outputFilePath}`);
    }

    if (!flags.skipGenerate) {
      console.log(`Generating ${spec.key}...`);
      runGenerate(spec, outputFilePath, flags.quality);
    } else {
      console.log(`Skipping generation for ${spec.key}, using existing image.`);
    }

    const buffer = await readFile(outputFilePath);
    const upload = await uploadMediaToWordPress({
      buffer: new Uint8Array(buffer),
      fileName: basename(outputFilePath),
      mimeType: "image/png",
      folderTag: "cuidou-v2-design",
      title: `cuidou-v2-${spec.key}`,
    });

    console.log(`Uploaded ${spec.key}: mediaId=${upload.mediaId}`);

    nextCatalog[spec.key] = {
      key: spec.key,
      url: upload.sourceUrl,
      alt: spec.alt,
      width: spec.width,
      height: spec.height,
      mediaId: upload.mediaId,
    };
  }

  await writeFile(CATALOG_PATH, serializeCatalog(nextCatalog), "utf8");
  console.log(`Catalog updated: ${CATALOG_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

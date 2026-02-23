import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type PrismaClientType = typeof import("../src/lib/prisma")["prisma"];
type UploadMediaFn = typeof import("../src/lib/wordpress-media")["uploadMediaToWordPress"];

type CliFlags = {
  dryRun: boolean;
  limit: number;
};

type MigrationSummary = {
  attachments: {
    scanned: number;
    migrated: number;
    skipped: number;
    failed: number;
  };
  documents: {
    scanned: number;
    migrated: number;
    skipped: number;
    failed: number;
  };
};

const WORDPRESS_URL = process.env.WORDPRESS_URL ?? "";

function parseFlags(argv: string[]): CliFlags {
  const dryRun = argv.includes("--dry-run");
  const limitIndex = argv.findIndex((arg) => arg === "--limit");
  const limitArg = limitIndex >= 0 ? argv[limitIndex + 1] : undefined;
  const parsedLimit = limitArg ? Number.parseInt(limitArg, 10) : Number.NaN;

  return {
    dryRun,
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 500,
  };
}

function getFileNameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const candidate = pathname.split("/").pop() ?? "";
    return candidate.length > 0 ? candidate : `legacy-${Date.now()}`;
  } catch {
    return `legacy-${Date.now()}`;
  }
}

function isWordPressUrl(url: string) {
  return WORDPRESS_URL.length > 0 && url.startsWith(WORDPRESS_URL);
}

async function fetchLegacyBinary(url: string) {
  const headers: HeadersInit = {};
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Legacy fetch failed (${response.status}) for ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return {
    bytes: new Uint8Array(arrayBuffer),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}

async function migrateAttachments(flags: CliFlags, summary: MigrationSummary) {
  const { prisma } = (await import("../src/lib/prisma")) as { prisma: PrismaClientType };
  const { uploadMediaToWordPress } = (await import("../src/lib/wordpress-media")) as {
    uploadMediaToWordPress: UploadMediaFn;
  };

  const attachments = await prisma.messageAttachment.findMany({
    where: {
      NOT: {
        pathname: {
          startsWith: "wp-media:",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: flags.limit,
  });

  summary.attachments.scanned = attachments.length;

  for (const attachment of attachments) {
    if (attachment.pathname.startsWith("wp-media:")) {
      summary.attachments.skipped += 1;
      continue;
    }

    const sourceUrl = attachment.downloadUrl || attachment.url;
    if (!sourceUrl) {
      summary.attachments.failed += 1;
      console.error(`Attachment ${attachment.id}: missing source URL`);
      continue;
    }

    if (flags.dryRun) {
      summary.attachments.migrated += 1;
      console.log(`[dry-run] Attachment ${attachment.id} -> ${sourceUrl}`);
      continue;
    }

    try {
      const legacy = await fetchLegacyBinary(sourceUrl);
      const fileName = attachment.fileName || getFileNameFromUrl(sourceUrl);

      const uploaded = await uploadMediaToWordPress({
        buffer: legacy.bytes,
        fileName,
        mimeType: attachment.mimeType || legacy.contentType,
        folderTag: `chat-migration-${attachment.messageId}`,
        title: `chat-attachment-${attachment.id}`,
      });

      await prisma.messageAttachment.update({
        where: { id: attachment.id },
        data: {
          pathname: `wp-media:${uploaded.mediaId}`,
          url: uploaded.sourceUrl,
          downloadUrl: `/api/messages/attachments/${attachment.id}/download`,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
          fileName: uploaded.fileName,
        },
      });

      summary.attachments.migrated += 1;
      console.log(`Attachment ${attachment.id}: migrated to wp-media:${uploaded.mediaId}`);
    } catch (error) {
      summary.attachments.failed += 1;
      console.error(`Attachment ${attachment.id}: migration failed`, error);
    }
  }
}

async function migrateDocuments(flags: CliFlags, summary: MigrationSummary) {
  const { prisma } = (await import("../src/lib/prisma")) as { prisma: PrismaClientType };
  const { uploadMediaToWordPress } = (await import("../src/lib/wordpress-media")) as {
    uploadMediaToWordPress: UploadMediaFn;
  };

  const documents = await prisma.professionalDocument.findMany({
    where: {
      NOT: {
        fileUrl: {
          startsWith: WORDPRESS_URL,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: flags.limit,
  });

  summary.documents.scanned = documents.length;

  for (const document of documents) {
    if (isWordPressUrl(document.fileUrl)) {
      summary.documents.skipped += 1;
      continue;
    }

    if (!document.fileUrl) {
      summary.documents.failed += 1;
      console.error(`Document ${document.id}: missing fileUrl`);
      continue;
    }

    if (flags.dryRun) {
      summary.documents.migrated += 1;
      console.log(`[dry-run] Document ${document.id} -> ${document.fileUrl}`);
      continue;
    }

    try {
      const legacy = await fetchLegacyBinary(document.fileUrl);
      const fileName = getFileNameFromUrl(document.fileUrl);

      const uploaded = await uploadMediaToWordPress({
        buffer: legacy.bytes,
        fileName,
        mimeType: legacy.contentType,
        folderTag: `doc-migration-${document.professionalProfileId}`,
        title: `professional-document-${document.id}`,
      });

      await prisma.professionalDocument.update({
        where: { id: document.id },
        data: {
          fileUrl: uploaded.sourceUrl,
        },
      });

      summary.documents.migrated += 1;
      console.log(`Document ${document.id}: migrated to ${uploaded.sourceUrl}`);
    } catch (error) {
      summary.documents.failed += 1;
      console.error(`Document ${document.id}: migration failed`, error);
    }
  }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  if (!WORDPRESS_URL) {
    throw new Error("WORDPRESS_URL is required to run migration");
  }

  const summary: MigrationSummary = {
    attachments: {
      scanned: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
    },
    documents: {
      scanned: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
    },
  };

  console.log("Starting legacy migration Blob -> WordPress", flags);

  await migrateAttachments(flags, summary);
  await migrateDocuments(flags, summary);

  console.log("Migration summary:");
  console.log(JSON.stringify(summary, null, 2));

  const { prisma } = (await import("../src/lib/prisma")) as { prisma: PrismaClientType };
  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error("Legacy migration failed", error);
    process.exitCode = 1;
  });

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "wechat-client");

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});

const stableUuid = (target) => {
  const relative = path.relative(client, target);
  const hash = createHash("sha256").update(`xiangkou-huashipu:${relative}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};

const writeMeta = (target, importer, version, files, fixedUuid) => {
  const metaPath = `${target}.meta`;
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : {};
  const repaired = {
    ...meta,
    ver: version,
    importer,
    imported: true,
    uuid: fixedUuid ?? meta.uuid ?? stableUuid(target),
    files,
    subMetas: meta.subMetas ?? {},
    userData: meta.userData ?? {},
  };
  fs.writeFileSync(metaPath, `${JSON.stringify(repaired, null, 2)}\n`);
};

const writeImageMeta = (target) => {
  const metaPath = `${target}.meta`;
  if (fs.existsSync(metaPath)) return;

  const uuid = stableUuid(target);
  const displayName = path.basename(target, path.extname(target));
  const textureUuid = `${uuid}@6c48a`;
  const spriteFrameUuid = `${uuid}@f9941`;
  const meta = {
    ver: "1.0.27",
    importer: "image",
    imported: true,
    uuid,
    files: [".json", ".png"],
    subMetas: {
      "6c48a": {
        importer: "texture",
        uuid: textureUuid,
        displayName,
        id: "6c48a",
        name: "texture",
        userData: {
          wrapModeS: "clamp-to-edge",
          wrapModeT: "clamp-to-edge",
          imageUuidOrDatabaseUri: uuid,
          isUuid: true,
          visible: false,
          minfilter: "linear",
          magfilter: "linear",
          mipfilter: "none",
          anisotropy: 0,
        },
        ver: "1.0.22",
        imported: true,
        files: [".json"],
        subMetas: {},
      },
      f9941: {
        importer: "sprite-frame",
        uuid: spriteFrameUuid,
        displayName,
        id: "f9941",
        name: "spriteFrame",
        userData: {
          trimThreshold: 1,
          rotated: false,
          offsetX: 0,
          offsetY: 0,
          trimX: 0,
          trimY: 0,
          width: 128,
          height: 128,
          rawWidth: 128,
          rawHeight: 128,
          borderTop: 0,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          packable: true,
          pixelsToUnit: 100,
          pivotX: 0.5,
          pivotY: 0.5,
          meshType: 0,
        },
        ver: "1.0.12",
        imported: true,
        files: [".json"],
        subMetas: {},
      },
    },
    userData: {
      type: "sprite-frame",
      hasAlpha: true,
      redirect: "",
    },
  };
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
};

export const repairCocosSourceMetas = () => {
  for (const target of walk(path.join(client, "assets/scripts"))) {
    if (target.endsWith(".ts")) {
      const fixedUuid = target.endsWith("assets/scripts/ui/game-bootstrap.ts")
        ? "f6264a25-42df-4e16-bd0a-42a035db36ba"
        : undefined;
      writeMeta(target, "typescript", "4.0.24", [], fixedUuid);
    }
  }
  writeMeta(
    path.join(client, "assets/scenes/Boot.scene"),
    "scene",
    "1.1.50",
    [".json"],
    "bf0757ef-bb28-4dfa-a365-c03412b96bc4",
  );

  const itemDirectory = path.join(client, "assets/resources/art/items");
  if (fs.existsSync(itemDirectory)) {
    for (const target of walk(itemDirectory)) {
      if (target.endsWith(".png")) writeImageMeta(target);
    }
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  repairCocosSourceMetas();
  console.log("Cocos scene/TypeScript metadata repaired");
}

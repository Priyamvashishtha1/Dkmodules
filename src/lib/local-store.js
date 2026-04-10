import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "local-db.json");

function createEmptyStore() {
  return {
    customers: [],
    wallets: [],
    purchases: [],
    offers: []
  };
}

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    const raw = await readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      const emptyStore = createEmptyStore();
      await writeFile(dataFile, JSON.stringify(emptyStore, null, 2));
      return emptyStore;
    }

    throw error;
  }
}

async function saveStore(store) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFile, JSON.stringify(store, null, 2));
}

export async function withLocalStore(updater) {
  const store = await ensureStore();
  const result = await updater(store);
  await saveStore(store);
  return result;
}

export async function readLocalStore() {
  return ensureStore();
}

export function createRecordId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

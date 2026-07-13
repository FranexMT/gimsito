import Dexie, { type EntityTable } from "dexie";
import type { WorkoutLog } from "@/types/exercise";

export interface Settings {
  key: string;
  bodyWeightKg?: number;
  name?: string;
  heightCm?: number | null;
}

export interface Profile {
  name: string;
  heightCm: number | null;
}

class GymRankedsDB extends Dexie {
  logs!: EntityTable<WorkoutLog, "id">;
  settings!: EntityTable<Settings, "key">;

  constructor() {
    super("gym-rankeds");
    this.version(1).stores({
      logs: "++id, exerciseId, date",
      settings: "key",
    });
  }
}

export const db = new GymRankedsDB();

export async function getBodyWeight(): Promise<number> {
  const s = await db.settings.get("bodyWeight");
  return s?.bodyWeightKg ?? 70;
}

export async function setBodyWeight(kg: number): Promise<void> {
  await db.settings.put({ key: "bodyWeight", bodyWeightKg: kg });
}

export async function getProfile(): Promise<Profile> {
  const s = await db.settings.get("profile");
  return { name: s?.name ?? "", heightCm: s?.heightCm ?? null };
}

export async function setProfile(profile: Profile): Promise<void> {
  await db.settings.put({ key: "profile", name: profile.name, heightCm: profile.heightCm });
}

export async function clearAllData(): Promise<void> {
  await db.logs.clear();
}

export type SkillFile = { path: string; size: number; executableLooking: boolean };
export type Skill = { id: string; slug: string; name: string; description: string; path: string; files: SkillFile[]; trustStatus: string };
export type SkillAssignment = { agentId: string; skillId: string };

export type ImportFile = { path: string; size: number; executableLooking: boolean };
export const validateSkillImportInventory = (files: ImportFile[], destination: string, existing: string[] = []) => {
  const normalized = files.map((file) => file.path.replaceAll("\\", "/"));
  if (normalized.some((path) => !path || path.startsWith("/") || path.split("/").includes(".."))) throw new Error("Skill import contains a traversal path.");
  if (normalized.some((path) => path === "" || path.endsWith("/"))) throw new Error("Skill import contains an invalid file path.");
  const collisions = normalized.filter((path) => existing.includes(`${destination}/${path}`)).map((path) => `${destination}/${path}`);
  return { destination, files, collisions, hasExecutableLookingFiles: files.some((file) => file.executableLooking), safe: collisions.length === 0 };
};

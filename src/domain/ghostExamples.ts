const examples: Record<string, string> = {
  "MEMORY.md": "# Memory\n\n<!-- Keep only durable facts that improve future work. -->\n\n## Facts\n\n- Add a verified fact here.\n",
  "TOOLS.md": "# Tools\n\n<!-- Document boundaries; never imply a tool exists when it does not. -->\n\n- filesystem: read project files only\n",
  "STATUS.md": "# Status\n\n## Current state\n\n- Describe the smallest verified next step.\n",
  "CONTEXT.md": "# Context\n\n<!-- Background context, separate from stable instructions. -->\n",
};

export const ghostExampleFor = (path: string | null) =>
  path ? examples[path.split("/").pop() ?? ""] ?? null : null;

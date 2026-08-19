import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useState,
} from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { EditorState as CMState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  highlightSelectionMatches,
  openSearchPanel,
  searchKeymap,
} from "@codemirror/search";
import type {
  Agent,
  DeletePreview,
  FileDocument,
  ProjectFile,
  ProjectSnapshot,
  RecoveryEntry,
} from "./domain/project";
import { clean, type EditorState, reduceEditor } from "./domain/editorState";
import { buildFileTree, type FileTreeNode } from "./domain/fileTree";
import { AddFileDialog } from "./components/AddFileDialog";
import { DeleteAgentDialog } from "./components/DeleteAgentDialog";
import { RecoveryPanel } from "./components/RecoveryPanel";
import { RenameAgentDialog } from "./components/RenameAgentDialog";
import {
  createAgentWithContent,
  createProject,
  createProjectFile,
  getUiMode,
  listProjectFiles,
  listRecoveryEntries,
  openProject,
  previewDeleteAgent,
  readProjectDocument,
  revealInFinder,
  renameAgent,
  restoreRecoveryEntry,
  saveAgentPosition,
  setUiMode,
  trashAgent,
  upsertEdge,
  deleteEdge,
  writeProjectDocument,
  inspectProject,
  applyTemplate,
  listSkills,
  listSkillAssignments,
  setSkillAssignment,
  inspectSkillImport,
  applySkillImport,
  listRuns,
  startRun,
  decideRun,
  cancelRun,
  resumeRun,
  listRunEvents,
} from "./services/projectService";
import { useProjectFilePoller } from "./hooks/useProjectFilePoller";
import { FileCatalog } from "./components/FileCatalog";
import { ghostExampleFor } from "./domain/ghostExamples";
import type { UiMode } from "./domain/uiMode";
import { EdgeInspector } from "./components/EdgeInspector";
import { defaultEdge, edgeId, type WorkflowEdge } from "./domain/graph";
import { TemplateGallery } from "./components/TemplateGallery";
import { CommandPalette, type PaletteAction } from "./components/CommandPalette";
import { ImportReview, type ImportSummary } from "./components/ImportReview";
import { AssistantPanel } from "./components/AssistantPanel";
import type { Proposal } from "./domain/proposals";
import { createSimulation, reduceSimulation, type SimulationEvent } from "./domain/simulation";
import { SimulationControls } from "./components/SimulationControls";
import { TracePanel } from "./components/TracePanel";
import { LessonPanel } from "./components/LessonPanel";
import { ContextResetExercise } from "./components/ContextResetExercise";
import { LESSONS, type Lesson } from "./content/lessons";
import type { Skill, SkillAssignment } from "./domain/skills";
import { SkillAssignment as SkillAssignmentPanel } from "./components/SkillAssignment";
import { SkillInspector } from "./components/SkillInspector";
import { SkillImportPreview } from "./components/SkillImportPreview";
import type { SkillImportPreview as SkillImportPreviewData } from "./services/projectService";
import { proposalForTemplate, type WorkflowTemplate } from "./templates/workflows";
import { Button } from "./components/ui/button";
import { Bot, Eye, FilePlus2, FolderOpen, MoreHorizontal, PanelLeft, PanelRight, Plus, Save, Search, Sparkles, Trash2, Workflow, X } from "lucide-react";
import type { RunEvent, RunSummary } from "./domain/runs";
import { RunControls, RunInspector } from "./components/RunControls";
import { RunTrace } from "./components/RunTrace";
import { UsageSummary } from "./components/UsageSummary";
import { useLanguage } from "./i18n/language";
import { LanguageSettings } from "./components/LanguageSettings";
import { AGENT_PRESETS, DEFAULT_AGENT_PRESET, agentMarkdown } from "./domain/agentPresets";

type Notice = { tone: "error" | "success"; message: string } | null;
const defaultPurpose = "";
const errorMessage = (error: unknown) =>
  (() => {
    const raw = error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
    if (raw.includes("Could not inspect skill source:")) {
      return "Skill folder unavailable. Choose an existing folder containing SKILL.md.";
    }
    return raw;
  })();

export function App() {
  const { t } = useLanguage();
  const [project, setProject] = useState<ProjectSnapshot | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentPresetId, setAgentPresetId] = useState(DEFAULT_AGENT_PRESET.id);
  const [agentName, setAgentName] = useState(DEFAULT_AGENT_PRESET.name);
  const [agentPurpose, setAgentPurpose] = useState(DEFAULT_AGENT_PRESET.purpose);
  const [agentAdvancedOpen, setAgentAdvancedOpen] = useState(false);
  const [agentMarkdownDraft, setAgentMarkdownDraft] = useState(() => agentMarkdown(DEFAULT_AGENT_PRESET));
  const [addFileDialogOpen, setAddFileDialogOpen] = useState(false);
  const [addFileParentPath, setAddFileParentPath] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null);
  const [deleteAllAgentsOpen, setDeleteAllAgentsOpen] = useState(false);
  const [recoveryEntries, setRecoveryEntries] = useState<RecoveryEntry[]>([]);
  const [mode, setMode] = useState<UiMode>("learn");
  const [conflict, setConflict] = useState<
    { disk: FileDocument; mine: string } | null
  >(null);
  const [compare, setCompare] = useState(false);
  const [edgeDraft, setEdgeDraft] = useState<WorkflowEdge | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [simulation, dispatchSimulation] = useReducer(reduceSimulation, null, () => createSimulation({ root: "", project: { id: "", name: "" }, agents: [], graph: { nodes: [], edges: [] } }));
  const [selectedSimulationEvent, setSelectedSimulationEvent] = useState<SimulationEvent | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(LESSONS[0]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillAssignments, setSkillAssignments] = useState<SkillAssignment[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skillImport, setSkillImport] = useState<(SkillImportPreviewData & { sourcePath: string }) | null>(null);
  const [skillSourcePath, setSkillSourcePath] = useState("");
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunSummary | null>(null);
  const [runEvents, setRunEvents] = useState<RunEvent[]>([]);
  const [runTask, setRunTask] = useState("");
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
  const [flowCollapsed, setFlowCollapsed] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [rawFilesOpen, setRawFilesOpen] = useState(true);
  const [fileFilter, setFileFilter] = useState("");
  const [navWidth, setNavWidth] = useState(() => Number(localStorage.getItem("agent-lab.nav-width")) || 248);
  const [flowWidth, setFlowWidth] = useState(() => Number(localStorage.getItem("agent-lab.flow-width")) || 360);
  const [draggingDivider, setDraggingDivider] = useState<"nav" | "flow" | null>(null);
  const [draggingNavSection, setDraggingNavSection] = useState<"agents" | "files" | null>(null);
  const [navAgentsHeight, setNavAgentsHeight] = useState(() => Number(localStorage.getItem("agent-lab.nav-agents-height")) || 165);
  const [navFilesHeight, setNavFilesHeight] = useState(() => Number(localStorage.getItem("agent-lab.nav-files-height")) || 300);
  const navigatorSectionsRef = useRef<HTMLDivElement>(null);
  const selectedAgent = useMemo(
    () => project?.agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [project, selectedAgentId],
  );
  const openAddFileDialog = useCallback((parentPath = selectedAgent?.path ?? "") => {
    setAddFileParentPath(parentPath);
    setAddFileDialogOpen(true);
  }, [selectedAgent?.path]);
  const workspaceStyle = {
    gridTemplateColumns: `${navigatorCollapsed ? "0px" : `${navWidth}px`} ${navigatorCollapsed ? "0px" : "5px"} minmax(320px, 1fr) ${flowCollapsed ? "0px" : "5px"} ${flowCollapsed ? "0px" : `${flowWidth}px`}`,
  };
  useEffect(() => {
    if (!draggingDivider) return;
    const move = (event: PointerEvent) => {
      if (draggingDivider === "nav") {
        const next = Math.min(360, Math.max(190, event.clientX));
        setNavWidth(next);
        localStorage.setItem("agent-lab.nav-width", String(next));
      } else {
        const next = Math.min(520, Math.max(280, window.innerWidth - event.clientX));
        setFlowWidth(next);
        localStorage.setItem("agent-lab.flow-width", String(next));
      }
    };
    const stop = () => setDraggingDivider(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [draggingDivider]);
  useEffect(() => {
    if (!draggingNavSection) return;
    const move = (event: PointerEvent) => {
      const bounds = navigatorSectionsRef.current?.getBoundingClientRect();
      if (!bounds) return;
      if (draggingNavSection === "agents") {
        const next = Math.min(360, Math.max(120, event.clientY - bounds.top));
        setNavAgentsHeight(next);
        localStorage.setItem("agent-lab.nav-agents-height", String(next));
      } else {
        const next = Math.min(440, Math.max(150, event.clientY - bounds.top - navAgentsHeight - 5));
        setNavFilesHeight(next);
        localStorage.setItem("agent-lab.nav-files-height", String(next));
      }
    };
    const stop = () => setDraggingNavSection(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
  }, [draggingNavSection, navAgentsHeight]);
  useEffect(() => {
    if (project) dispatchSimulation({ type: "load", project });
  }, [project?.root, project?.graph.edges.length, project?.graph.nodes.length]);
  useEffect(() => {
    if (!simulation.playing) return;
    const timer = window.setInterval(() => dispatchSimulation({ type: "step" }), 700);
    return () => window.clearInterval(timer);
  }, [simulation.playing]);
  const refreshFiles = useCallback(async (root: string) => {
    try {
      setFiles(await listProjectFiles(root));
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    }
  }, []);
  const refreshRecovery = useCallback(async (root: string) => {
    try {
      setRecoveryEntries(await listRecoveryEntries(root));
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    }
  }, []);
  const refreshSkills = useCallback(async (root: string) => {
    try {
      const [nextSkills, nextAssignments] = await Promise.all([listSkills(root), listSkillAssignments(root)]);
      setSkills(nextSkills);
      setSkillAssignments(nextAssignments);
      setSelectedSkillId((current) => current && nextSkills.some((skill) => skill.id === current) ? current : nextSkills[0]?.id ?? null);
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
  }, []);
  const refreshRuns = useCallback(async (root: string, preferredId?: string) => {
    try {
      const next = await listRuns(root);
      setRuns(next);
      const selected = next.find((run) => run.id === preferredId) ?? next[0] ?? null;
      setSelectedRun(selected);
      setRunEvents(selected ? await listRunEvents(root, selected.id) : []);
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
  }, []);
  const openFile = useCallback(
    async (path: string, sourceProject = project) => {
      if (!sourceProject) return;
      setSelectedFile(path);
      setSelectedAgentId(
        sourceProject.agents.find((agent) =>
          agent.files.some((file) => file.path === path)
        )?.id ?? null,
      );
      try {
        setEditor(clean(await readProjectDocument(sourceProject.root, path)));
        setConflict(null);
        setCompare(false);
      } catch (error) {
        setNotice({ tone: "error", message: errorMessage(error) });
      }
    },
    [project],
  );
  const selectAgent = async (agent: Agent, sourceProject = project) => {
    if (!sourceProject) return;
    const file = agent.files.find((item) => item.path.endsWith("/AGENT.md")) ??
      agent.files[0];
    setSelectedAgentId(agent.id);
    if (file) await openFile(file.path, sourceProject);
  };
  const loadProject = async (
    next: ProjectSnapshot,
    success?: string,
    preferredAgentId = selectedAgentId,
  ) => {
    setProject(next);
    await refreshFiles(next.root);
    await refreshRecovery(next.root);
    await refreshSkills(next.root);
    await refreshRuns(next.root);
    setMode(await getUiMode(next.root));
    const agent = next.agents.find((item) => item.id === preferredAgentId) ??
      next.agents[0];
    if (agent) await selectAgent(agent, next);
    else {
      setSelectedAgentId(null);
      setSelectedFile(null);
      setEditor(null);
    }
    if (success) setNotice({ tone: "success", message: success });
  };
  const run = async (
    operation: () => Promise<ProjectSnapshot>,
    success?: string,
  ) => {
    setBusy(true);
    setNotice(null);
    try {
      await loadProject(await operation(), success);
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };
  const createNewAgent = async () => {
    const name = agentName.trim();
    const purpose = agentPurpose.trim();
    if (!project || !name || !purpose) return;
    setBusy(true);
    setNotice(null);
    try {
      const preset = AGENT_PRESETS.find((item) => item.id === agentPresetId) ?? DEFAULT_AGENT_PRESET;
      const content = agentAdvancedOpen
        ? agentMarkdownDraft
        : agentMarkdown({ ...preset, purpose }, name);
      const next = await createAgentWithContent(project.root, name, purpose, content);
      const created = next.agents.find((agent) => agent.name === name) ?? next.agents[next.agents.length - 1];
      setAgentDialogOpen(false);
      await loadProject(next, `${name} created on disk.`, created?.id);
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };
  const requestDeleteAgent = async (agentId: string) => {
    if (!project) return;
    setBusy(true);
    setNotice(null);
    try {
      setDeletePreview(await previewDeleteAgent(project.root, agentId));
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };
  const save = async (content = editor?.content) => {
    if (
      !project || !selectedFile || !editor || content === undefined ||
      content === editor.savedContent
    ) return;
    setBusy(true);
    setNotice(null);
    setEditor(reduceEditor(editor, { type: "save-started" }));
    try {
      const saved = await writeProjectDocument(
        project.root,
        selectedFile,
        content,
        editor.revision,
      );
      setEditor(reduceEditor(editor, { type: "saved", document: saved }));
      await refreshFiles(project.root);
    } catch (error) {
      const raw = errorMessage(error);
      if (raw.includes("file_conflict")) {
        try {
          const disk = await readProjectDocument(project.root, selectedFile);
          setConflict({ disk, mine: content });
          setEditor(reduceEditor(editor, { type: "conflict", document: disk }));
        } catch {
          setNotice({ tone: "error", message: raw });
        }
      } else setNotice({ tone: "error", message: raw });
    } finally {
      setBusy(false);
    }
  };
  const onPoll = useCallback(
    (
      next: ProjectFile[],
      diff: { added: string[]; removed: string[]; changed: string[] },
    ) => {
      setFiles(next);
      if (
        selectedFile && diff.changed.includes(selectedFile) && editor &&
        editor.status !== "saving" &&
        editor.revision !==
          next.find((file) => file.path === selectedFile)?.revision &&
        project
      ) {
        void readProjectDocument(project.root, selectedFile).then((disk) => {
          setConflict({ disk, mine: editor.content });
          setEditor((current) =>
            current
              ? reduceEditor(current, { type: "conflict", document: disk })
              : current
          );
        });
      }
    },
    [editor, project, selectedFile],
  );
  useProjectFilePoller(project?.root ?? null, onPoll, busy);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "1") {
        event.preventDefault();
        setNavigatorCollapsed(false);
        setFlowCollapsed(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "2") {
        event.preventDefault();
        setNavigatorCollapsed(false);
        setFlowCollapsed(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "3") {
        event.preventDefault();
        setNavigatorCollapsed(true);
        setFlowCollapsed(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  if (!project) {
    return (
      <Welcome
        busy={busy}
        notice={notice}
        onCreate={(parent, name) =>
          void run(
            () => createProject(parent, name),
            t("app.projectCreated"),
          )}
        onOpen={(path) => void run(() => openProject(path))}
        importSummary={importSummary}
        onInspect={async (path) => {
          try { setImportSummary(await inspectProject(path)); }
          catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
        }}
        onCancelImport={() => setImportSummary(null)}
      />
    );
  }
  const tree = buildFileTree(files);
  const filteredTree = filterTree(tree, fileFilter);
  const applySelectedTemplate = async (template: WorkflowTemplate) => {
    setBusy(true);
    setNotice(null);
    try {
      if (template.agents.length === 0) {
        setTemplatesOpen(false);
        setNotice({ tone: "success", message: t("app.blankTemplate") });
        return;
      }
      const next = await applyTemplate(project.root, proposalForTemplate(template));
      setTemplatesOpen(false);
      await loadProject(next, t("app.projectApplied", { name: template.name }));
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
    finally { setBusy(false); }
  };
  const applyAssistantProposal = async (proposal: Proposal) => {
    setBusy(true);
    setNotice(null);
    try {
      const existingAgents = new Set(project.agents.map((agent) => agent.id));
      const existingEdges = new Set(project.graph.edges.map((edge) => edge.id));
      const nextProposal = {
        ...proposal,
        agents: proposal.agents.filter((agent) => !existingAgents.has(agent.id)),
        files: proposal.files.filter((file) => !existingAgents.has(`agent:${file.path.split("/")[1]}`)),
        edges: proposal.edges.filter((edge) => !existingEdges.has(edge.id)),
      };
      const next = await applyTemplate(project.root, nextProposal);
      setAssistantOpen(false);
      await loadProject(next, nextProposal.agents.length ? t("app.proposalApplied") : t("app.proposalNoChanges"));
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
    finally { setBusy(false); }
  };
  const inspectSkillFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;
    try { setSkillImport({ ...(await inspectSkillImport(selected, project.root)), sourcePath: selected }); }
    catch (error) {
      const message = errorMessage(error);
      setNotice({ tone: "error", message: message.includes("Could not inspect skill source:") ? t("app.skillFolderUnavailable") : message });
    }
  };
  const inspectSkillSourcePath = async () => {
    if (!skillSourcePath.trim()) return;
    try { setSkillImport({ ...(await inspectSkillImport(skillSourcePath.trim(), project.root)), sourcePath: skillSourcePath.trim() }); }
    catch (error) {
      const message = errorMessage(error);
      setNotice({ tone: "error", message: message.includes("Could not inspect skill source:") ? t("app.skillFolderUnavailable") : message });
    }
  };
  const assignSelectedSkill = async (assigned: boolean) => {
    if (!selectedAgentId || !selectedSkillId) return;
    try { setSkillAssignments(await setSkillAssignment(project.root, selectedAgentId, selectedSkillId, assigned)); }
    catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
  };
  const selectRun = async (run: RunSummary) => {
    setSelectedRun(run);
    setRunEvents(await listRunEvents(project.root, run.id));
  };
  const startLocalRun = async () => {
    if (!selectedAgentId || !runTask.trim()) return;
    setBusy(true);
    try {
      const created = await startRun(project.root, selectedAgentId, runTask);
      await refreshRuns(project.root, created.id);
      setNotice({ tone: "success", message: t("app.runStarted", { id: created.id }) });
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
    finally { setBusy(false); }
  };
  const updateRun = async (operation: () => Promise<RunSummary>) => {
    if (!selectedRun) return;
    setBusy(true);
    try { const next = await operation(); await refreshRuns(project.root, next.id); }
    catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
    finally { setBusy(false); }
  };
  const paletteActions: PaletteAction[] = [
    { id: "assistant", label: t("app.aiAssistant"), run: () => setAssistantOpen(true) },
    { id: "templates", label: t("app.templates"), run: () => setTemplatesOpen(true) },
    { id: "new-agent", label: t("app.createAgent"), run: () => setAgentDialogOpen(true) },
    { id: "add-file", label: t("app.addFile"), run: () => openAddFileDialog() },
    { id: "reveal", label: t("app.revealProject"), run: () => void revealInFinder(project.root) },
    { id: "learn", label: `${t("mode.learn")}/${t("mode.build")}`, hint: `${t("mode.label")}: ${mode === "learn" ? t("mode.learn") : t("mode.build")}`, run: () => { const next = mode === "learn" ? "build" : "learn"; setMode(next); void setUiMode(project.root, next); } },
  ];
  const runStateLabel = (state: RunSummary["state"]) => t(`app.runState.${state}` as "app.runState.idle");
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><span className="brand-dot" aria-hidden="true" />Agent Lab</div>
        <div className="topbar-actions">
          <Button
            variant="ghost"
            size="icon"
            title={t("app.closeProject")}
            aria-label={t("app.closeProject")}
            onClick={() => {
              setProject(null);
              setEditor(null);
              setFiles([]);
            }}
          ><X /></Button>
          <Button
            variant="ghost"
            size="icon"
            title={navigatorCollapsed ? t("app.showNavigator") : t("app.hideNavigator")}
            aria-label={navigatorCollapsed ? t("app.showNavigator") : t("app.hideNavigator")}
            onClick={() => setNavigatorCollapsed((value) => !value)}
          ><PanelLeft /></Button>
          <Button
            variant="ghost"
            size="icon"
            title={flowCollapsed ? t("app.showFlow") : t("app.hideFlow")}
            aria-label={flowCollapsed ? t("app.showFlow") : t("app.hideFlow")}
            onClick={() => setFlowCollapsed((value) => !value)}
          ><PanelRight /></Button>
          <div className="toolbar-menu-wrap">
            <Button
              variant="ghost"
              size="icon"
              title={t("app.moreActions")}
              aria-label={t("app.moreActions")}
              aria-expanded={moreMenuOpen}
              onClick={() => setMoreMenuOpen((value) => !value)}
            ><MoreHorizontal /></Button>
            {moreMenuOpen && (
              <div className="toolbar-menu" role="menu">
                <button role="menuitem" onClick={() => { setMoreMenuOpen(false); setTemplatesOpen(true); }}><Workflow />{t("app.templates")}</button>
                <button role="menuitem" onClick={() => { setMoreMenuOpen(false); setAssistantOpen(true); }}><Sparkles />{t("app.aiAssistant")}</button>
                <button role="menuitem" onClick={() => { setMoreMenuOpen(false); setPaletteOpen(true); }}><Search />{t("app.commandPalette")}</button>
                <LanguageSettings />
              </div>
            )}
          </div>
        </div>
      </header>
      {notice && <div className={`notice ${notice.tone}`} role="alert" aria-live="assertive">{notice.message}
      </div>}
      <main className={`workspace ${draggingDivider ? "is-resizing" : ""}`} style={workspaceStyle}>
        <aside className={`navigator panel ${navigatorCollapsed ? "pane-collapsed" : ""}`}>
          <div className="panel-header">
            <span className="eyebrow">{t("app.projectFiles")}</span>
            <div>
              <Button
                variant="ghost"
                size="icon"
                title={t("app.revealProject")}
                aria-label={t("app.revealProject")}
                onClick={() => void revealInFinder(project.root)}
              ><FolderOpen /></Button>
              <Button
                variant="ghost"
                size="icon"
                title={t("app.addFile")}
                aria-label={t("app.addFile")}
                onClick={() => openAddFileDialog()}
                disabled={busy}
              ><FilePlus2 /></Button>
              <Button
                variant="ghost"
                size="icon"
                title={t("app.createAgent")}
                aria-label={t("app.createAgent")}
                onClick={() => {
                  setAgentPresetId(DEFAULT_AGENT_PRESET.id);
                  setAgentName(DEFAULT_AGENT_PRESET.name);
                  setAgentPurpose(DEFAULT_AGENT_PRESET.purpose);
                  setAgentAdvancedOpen(false);
                  setAgentMarkdownDraft(agentMarkdown(DEFAULT_AGENT_PRESET));
                  setAgentDialogOpen(true);
                }}
                disabled={busy}
              ><Plus /></Button>
            </div>
          </div>
          <div className="navigator-search">
            <Search aria-hidden="true" />
            <input value={fileFilter} onChange={(event) => setFileFilter(event.target.value)} placeholder={t("app.filterProject")} aria-label={t("app.filterProject")} />
            <kbd>⌘F</kbd>
          </div>
          <div
            className={`navigator-sections ${draggingNavSection ? "is-resizing-nav" : ""}`}
            ref={navigatorSectionsRef}
            style={{ gridTemplateRows: `${navAgentsHeight}px 5px ${navFilesHeight}px 5px minmax(150px, 1fr)` }}
          >
            <section className="navigator-section navigator-section-agents">
              <div className="navigator-group-heading"><span>{t("app.agents")}</span><small>{project.agents.length}</small></div>
              {project.agents.length === 0
                ? <p className="navigator-empty">{t("app.noAgents")}</p>
                : <div className="agent-list" aria-label={t("app.agents")}>{project.agents.map((agent) => <div className="agent-list-row" key={agent.id}><button className={`agent-list-item ${selectedAgentId === agent.id ? "selected" : ""}`} onClick={() => void selectAgent(agent)}><span><strong>{agent.name}</strong><small>{agent.purpose}</small></span></button><Button variant="ghost" size="icon" className="agent-list-trash" title={`${t("app.moveAgent")}: ${agent.name}`} aria-label={`${t("app.moveAgent")}: ${agent.name}`} onClick={() => void requestDeleteAgent(agent.id)} disabled={busy}><Trash2 /></Button></div>)}</div>}
            </section>
            <NavSectionDivider label={t("app.agents")} onStart={() => setDraggingNavSection("agents")} />
            <section className="navigator-section navigator-section-files">
              <button className="navigator-disclosure" onClick={() => setRawFilesOpen((value) => !value)} aria-expanded={rawFilesOpen}><span><span className="navigator-disclosure-mark" aria-hidden="true">{rawFilesOpen ? "−" : "+"}</span>{t("app.projectFiles")}</span><small>{files.length}</small></button>
              {rawFilesOpen && <div className="tree" aria-label={t("app.projectFiles")}>
                {filteredTree.map((node) => (
                  <TreeNode
                    key={node.path}
                    node={node}
                    agents={project.agents}
                    selectedAgentId={selectedAgentId}
                    selectedFile={selectedFile}
                    onOpen={(path) => void openFile(path)}
                    onSelectAgent={(agent) => void selectAgent(agent)}
                    onAddFile={(agent) => openAddFileDialog(agent.path)}
                    onReveal={(path) => void revealInFinder(project.root, path)}
                    onRequestDelete={(agentId) => void requestDeleteAgent(agentId)}
                  />
                ))}
              </div>}
            </section>
            <NavSectionDivider label={t("app.projectFiles")} onStart={() => setDraggingNavSection("files")} />
            <section className="navigator-section navigator-section-guide">
              <FileCatalog mode={mode} />
            </section>
          </div>
          <div className="navigator-footer">
            <div className="navigator-footer-heading">
              <span className="eyebrow">{t("app.root")}</span>
              {project.agents.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="danger-icon"
                  title={t("app.moveAllToRecovery")}
                  aria-label={t("app.moveAllToRecovery")}
                  onClick={() => setDeleteAllAgentsOpen(true)}
                  disabled={busy}
                ><Trash2 /></Button>
              )}
            </div>
            <code>{project.root}</code>
          </div>
        </aside>
        {!navigatorCollapsed && <PaneDivider side="nav" onStart={() => setDraggingDivider("nav")} />}
        <section className="inspector panel">
          <div className="panel-header editor-header">
            <div>
              <strong>{selectedFile ?? t("app.selectFile")}</strong>
            </div>
            <div className="editor-toolbar">
              {editor && (
                <span className={`save-state ${editor.status}`}>
                  {editor.status === "dirty"
                    ? t("app.unsaved")
                    : editor.status === "saving"
                    ? t("app.saving")
                    : editor.status === "conflict"
                    ? t("app.conflict")
                    : editor.status === "error"
                    ? t("app.error")
                    : t("app.saved")}
                </span>
              )}
              {editor && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="save-icon-button"
                  aria-label={t("app.saveFile")}
                  title={`${t("app.saveFile")} (⌘S)`}
                  disabled={busy || editor.status !== "dirty"}
                  onClick={() => void save()}
                ><Save /></Button>
              )}
            </div>
          </div>
          {editor && selectedFile
            ? (
              <MarkdownEditor
                state={editor}
                onChange={(content) =>
                  setEditor((current) =>
                    current
                      ? reduceEditor(current, { type: "edit", content })
                      : current
                  )}
                onSave={() => void save()}
              />
            )
            : (
              <div className="empty-state">
                <h2>{t("app.chooseMarkdown")}</h2>
                <p>{t("app.navigatorDescription")}</p>
              </div>
            )}
        </section>
        {!flowCollapsed && <PaneDivider side="flow" onStart={() => setDraggingDivider("flow")} />}
        <section className={`flow panel ${flowCollapsed ? "pane-collapsed" : ""}`}>
          <div className="panel-header">
            <span className="eyebrow">{t("app.flow")}</span>
            <div className="panel-tools">
              <span className="flow-meta">
                {project.graph.nodes.length}{" "}
                {project.graph.nodes.length === 1 ? t("app.node") : t("app.nodes")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                title={t("app.renameAgent")}
                aria-label={t("app.renameAgent")}
                onClick={() => setRenameDialogOpen(true)}
                disabled={busy || !selectedAgent}
              ><span className="toolbar-letter">Aa</span></Button>
              <Button
                variant="ghost"
                size="icon"
                title={t("app.moveAgent")}
                aria-label={t("app.moveAgent")}
                onClick={() => selectedAgent && void requestDeleteAgent(selectedAgent.id)}
                disabled={busy || !selectedAgent}
              ><Trash2 /></Button>
              <Button variant="ghost" size="icon" title={t("app.connectAgents")} aria-label={t("app.connectAgents")} onClick={() => {
                const source = selectedAgentId ?? project.graph.nodes[0]?.id;
                const target = project.graph.nodes.find((node) => node.id !== source)?.id;
                if (source && target) setEdgeDraft({ ...defaultEdge(source, target), id: "new-edge" });
              }} disabled={busy || project.graph.nodes.length < 2}><Workflow /></Button>
            </div>
          </div>
          <div className="flow-canvas">
            {project.graph.edges.map((edge) => {
              const source = project.graph.nodes.find((node) => node.id === edge.source);
              const target = project.graph.nodes.find((node) => node.id === edge.target);
              if (!source || !target) return null;
              return <button key={edge.id} className="flow-edge" style={{ left: (source.position.x + target.position.x) / 2 + 58, top: (source.position.y + target.position.y) / 2 + 12 }} onClick={() => setEdgeDraft(edge)} title={t("app.inspectConnection")}>{edge.label || edge.relation}</button>;
            })}
            {project.graph.nodes.length === 0
              ? (
                <div className="flow-empty">
                  {t("app.noNodes")}
                </div>
              )
              : project.graph.nodes.map((node) => (
                <FlowNode
                  key={node.id}
                  node={node}
                  selected={node.id === selectedAgentId}
                  onSelect={() => {
                    const agent = project.agents.find((item) =>
                      item.id === node.id
                    );
                    if (agent) void selectAgent(agent);
                  }}
                  onPositionChange={(position) => {
                    setProject((current) =>
                      current
                        ? {
                          ...current,
                          graph: {
                            ...current.graph,
                            nodes: current.graph.nodes.map((item) =>
                              item.id === node.id ? { ...item, position } : item
                            ),
                          },
                        }
                        : current
                    );
                    void saveAgentPosition(project.root, node.id, position);
                  }}
                />
              ))}
            {simulation.events[simulation.cursor] && <div className={`simulation-packet ${simulation.playing ? "moving" : ""}`} role="status" aria-live="polite">● {simulation.events[simulation.cursor].payload}</div>}
          </div>
          <div className="flow-footer">{t("app.dragNode")} {project.graph.edges.length > 0 && <span className="edge-summary">{project.graph.edges.length} {project.graph.edges.length === 1 ? t("app.relation") : t("app.relations")}</span>}</div>
          <details className="flow-section" open><summary>{t("simulation.label")}</summary><SimulationControls state={simulation} dispatch={dispatchSimulation} /><TracePanel state={simulation} onSelect={setSelectedSimulationEvent} /></details>
          <details className="flow-section"><summary>{t("app.learn")}</summary><LessonPanel selected={selectedLesson} onSelect={setSelectedLesson} /><ContextResetExercise /></details>
          <details className="flow-section"><summary>{t("app.runs")} <small>{runs.length}</small></summary><RunControls agents={project.agents} selectedAgentId={selectedAgentId} task={runTask} onTask={setRunTask} onStart={() => void startLocalRun()} busy={busy} /><div className="run-list panel-section" aria-label={t("app.runs")}><div className="run-history-copy"><strong>{t("run.historyTitle")}</strong><span>{t("run.historyDescription")}</span></div>{runs.length === 0 ? <p className="muted-copy">{t("app.noDurableRuns")}</p> : runs.map((run) => <button key={run.id} className={`run-list-item ${selectedRun?.id === run.id ? "selected" : ""}`} onClick={() => void selectRun(run)}><strong>{run.id}</strong><span>{t(`app.runState.${run.state}` as "app.runState.idle")} · {run.task}</span></button>)}</div><RunInspector run={selectedRun} onApprove={() => void updateRun(() => decideRun(project.root, selectedRun!.id, true))} onReject={() => void updateRun(() => decideRun(project.root, selectedRun!.id, false))} onCancel={() => void updateRun(() => cancelRun(project.root, selectedRun!.id))} onResume={() => void updateRun(() => resumeRun(project.root, selectedRun!.id))} /><RunTrace events={runEvents} /><UsageSummary runs={runs} /></details>
          <details className="flow-section"><summary>{t("app.skills")} <small>{skills.length}</small></summary><SkillAssignmentPanel agents={project.agents} skills={skills} assignments={skillAssignments} selectedAgentId={selectedAgentId} selectedSkillId={selectedSkillId} onSelectSkill={setSelectedSkillId} /><SkillInspector skill={skills.find((skill) => skill.id === selectedSkillId) ?? null} assigned={Boolean(selectedAgentId && selectedSkillId && skillAssignments.some((item) => item.agentId === selectedAgentId && item.skillId === selectedSkillId))} onAssign={(assigned) => void assignSelectedSkill(assigned)} /><div className="skill-import-action"><input aria-label={t("app.localSkillPath")} value={skillSourcePath} onChange={(event) => setSkillSourcePath(event.target.value)} placeholder="/private/tmp/skill-folder" /><button className="secondary-button" onClick={() => void inspectSkillSourcePath()}>{t("app.previewPath")}</button><button className="quiet-button" onClick={() => void inspectSkillFolder()}>{t("app.chooseFolder")}</button></div></details>
          <RecoveryPanel
            entries={recoveryEntries}
            busy={busy}
            onRestore={async (entry) => {
              setBusy(true);
              setNotice(null);
              try {
                await loadProject(
                  await restoreRecoveryEntry(project.root, entry.actionId),
                  `${entry.agentName} restored on disk.`,
                  entry.agentId,
                );
              } catch (error) {
                setNotice({ tone: "error", message: errorMessage(error) });
              } finally {
                setBusy(false);
              }
            }}
          />
        </section>
      </main>
      {conflict && (
        <div className="modal-backdrop">
          <div
            className="conflict-dialog"
            role="dialog"
            aria-label={t("app.fileChangedExternally")}
          >
            <span className="eyebrow">{t("app.conflictEyebrow")}</span>
            <h2>{t("dialog.fileChanged")}</h2>
            <p>{t("dialog.fileChangedDescription", { file: selectedFile ?? "" })}</p>
            {compare && (
              <div className="compare-grid">
                <pre>{conflict.mine}</pre>
                <pre>{conflict.disk.content}</pre>
              </div>
            )}
            <div className="dialog-actions">
              <button
                className="quiet-button"
                onClick={() => setCompare((value) => !value)}
              >
                {compare ? t("dialog.hideCompare") : t("dialog.compare")}
              </button>
              <button
                className="quiet-button"
                onClick={() => {
                  setEditor(clean(conflict.disk));
                  setConflict(null);
                }}
              >
                {t("dialog.reload")}
              </button>
              <button
                className="primary-button"
                onClick={async () => {
                  if (!selectedFile) return;
                  setBusy(true);
                  try {
                    const saved = await writeProjectDocument(
                      project.root,
                      selectedFile,
                      conflict.mine,
                      conflict.disk.revision,
                    );
                    setEditor(clean(saved));
                    setConflict(null);
                    await refreshFiles(project.root);
                  } catch (error) {
                    setNotice({ tone: "error", message: errorMessage(error) });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("dialog.keepMine")}
              </button>
            </div>
          </div>
        </div>
      )}
      {agentDialogOpen && (
        <div className="modal-backdrop">
          <form
            className="agent-dialog"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void createNewAgent();
            }}
          >
            <span className="eyebrow">{t("app.newAgent")}</span>
            <h2>{t("dialog.createAgent")}</h2>
            <label>
              {t("dialog.starterRole")}<select value={agentPresetId} onChange={(event) => {
                const preset = AGENT_PRESETS.find((item) => item.id === event.target.value) ?? DEFAULT_AGENT_PRESET;
                setAgentPresetId(preset.id);
                setAgentName(preset.name);
                setAgentPurpose(preset.purpose);
                setAgentMarkdownDraft(agentMarkdown(preset));
              }}>
                {AGENT_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <label>
              {t("dialog.name")}<input
                autoFocus
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
              />
            </label>
            <label>
              {t("dialog.purpose")}<textarea
                value={agentPurpose}
                onChange={(event) => setAgentPurpose(event.target.value)}
                placeholder={t("app.examplePurpose")}
                rows={3}
              />
              <small className="field-hint">{t("app.examplePurpose")}</small>
            </label>
            <button
              type="button"
              className="advanced-toggle"
              aria-expanded={agentAdvancedOpen}
              onClick={() => setAgentAdvancedOpen((value) => !value)}
            >
              <span>{agentAdvancedOpen ? t("dialog.hideAdvanced") : t("dialog.advancedOptions")}</span>
              <span aria-hidden="true">{agentAdvancedOpen ? "−" : "+"}</span>
            </button>
            {agentAdvancedOpen && (
              <label className="agent-markdown-field">
                {t("dialog.markdownEditor")}
                <span className="field-hint">{t("dialog.markdownEditorHint")}</span>
                <textarea
                  className="agent-markdown-draft"
                  value={agentMarkdownDraft}
                  onChange={(event) => setAgentMarkdownDraft(event.target.value)}
                  rows={15}
                  spellCheck={false}
                />
              </label>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="quiet-button"
                onClick={() => setAgentDialogOpen(false)}
              >
                {t("dialog.cancel")}
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={busy || !agentName.trim() || !agentPurpose.trim()}
              >
                {t("dialog.createAgent")}
              </button>
            </div>
          </form>
        </div>
      )}
      {addFileDialogOpen && (
        <AddFileDialog
          parentPath={addFileParentPath}
          busy={busy}
          onCancel={() => setAddFileDialogOpen(false)}
          onSave={async (name, initialContent) => {
            setBusy(true);
            setNotice(null);
            try {
              const document = await createProjectFile(
                project.root,
                addFileParentPath,
                name,
                initialContent,
              );
              setAddFileDialogOpen(false);
              await refreshFiles(project.root);
              await openFile(document.path);
            } catch (error) {
              setNotice({ tone: "error", message: errorMessage(error) });
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      {renameDialogOpen && selectedAgent && (
        <RenameAgentDialog
          agent={selectedAgent}
          busy={busy}
          onCancel={() => setRenameDialogOpen(false)}
          onSave={async (newName) => {
            setBusy(true);
            setNotice(null);
            try {
              const next = await renameAgent(project.root, selectedAgent.id, newName);
              const renamed = next.agents.find((agent) => agent.name === newName);
              setRenameDialogOpen(false);
              await loadProject(
                next,
                `${newName} renamed on disk.`,
                renamed?.id,
              );
            } catch (error) {
              setNotice({ tone: "error", message: errorMessage(error) });
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      {deletePreview && (
        <DeleteAgentDialog
          preview={deletePreview}
          busy={busy}
          onCancel={() => setDeletePreview(null)}
          onConfirm={async () => {
            setBusy(true);
            setNotice(null);
            try {
              const entry = await trashAgent(project.root, deletePreview.agentId);
              setDeletePreview(null);
              await loadProject(
                await openProject(project.root),
                `${entry.agentName} moved to recovery.`,
              );
            } catch (error) {
              setNotice({ tone: "error", message: errorMessage(error) });
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      {deleteAllAgentsOpen && (
        <div className="modal-backdrop">
          <section className="agent-dialog delete-agent-dialog" role="dialog" aria-label={t("dialog.moveAllQuestion")}>
            <span className="eyebrow">{t("app.recoverableDelete")}</span>
            <h2>{t("dialog.moveAllQuestion")}</h2>
            <p className="file-path-preview">
              {t("dialog.noPermanentDelete", { count: project.agents.length, plural: project.agents.length === 1 ? "" : "s" })}
            </p>
            <ul className="agent-bulk-list">
              {project.agents.map((agent) => <li key={agent.id}><strong>{agent.name}</strong><span>{agent.purpose}</span></li>)}
            </ul>
            <div className="dialog-actions">
              <button type="button" className="quiet-button" onClick={() => setDeleteAllAgentsOpen(false)} disabled={busy}>{t("dialog.cancel")}</button>
              <button
                type="button"
                className="primary-button danger-button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setNotice(null);
                  try {
                    const agents = [...project.agents];
                    for (const agent of agents) await trashAgent(project.root, agent.id);
                    setDeleteAllAgentsOpen(false);
                    await loadProject(await openProject(project.root), `${agents.length} agents moved to recovery.`);
                  } catch (error) {
                    setNotice({ tone: "error", message: errorMessage(error) });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("app.moveAllToRecovery")}
              </button>
            </div>
          </section>
        </div>
      )}
      {edgeDraft && <EdgeInspector
        edge={edgeDraft}
        agents={project.agents}
        busy={busy}
        onCancel={() => setEdgeDraft(null)}
        onSave={async (edge) => {
          setBusy(true);
          setNotice(null);
          try {
            const editingExisting = project.graph.edges.some((item) => item.id === edge.id);
            const next = await upsertEdge(project.root, {
              ...edge,
              id: editingExisting ? edge.id : edgeId(edge.source, edge.target, edge.relation),
            });
            setEdgeDraft(null);
            await loadProject(next, "Relation saved on disk.");
          } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
          finally { setBusy(false); }
        }}
        onDelete={project.graph.edges.some((edge) => edge.id === edgeDraft.id) ? async () => {
          setBusy(true);
          try { const next = await deleteEdge(project.root, edgeDraft.id); setEdgeDraft(null); await loadProject(next, "Relation removed from disk."); }
          catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
          finally { setBusy(false); }
        } : undefined}
      />}
      {templatesOpen && <TemplateGallery busy={busy} onCancel={() => setTemplatesOpen(false)} onApply={(template) => void applySelectedTemplate(template)} />}
      {assistantOpen && <AssistantPanel busy={busy} onCancel={() => setAssistantOpen(false)} onApply={(proposal) => void applyAssistantProposal(proposal)} />}
      {selectedSimulationEvent && <div className="modal-backdrop"><section className="agent-dialog simulation-event-dialog" role="dialog" aria-label={t("dialog.simulationEvent")}><span className="eyebrow">{t("app.syntheticEvent")}</span><h2>{selectedSimulationEvent.sender} → {selectedSimulationEvent.receiver}</h2><dl className="event-details"><dt>{t("dialog.relation")}</dt><dd>{selectedSimulationEvent.relation}</dd><dt>{t("dialog.payload")}</dt><dd>{selectedSimulationEvent.payload}</dd><dt>{t("dialog.filesRead")}</dt><dd>{selectedSimulationEvent.filesRead.join(", ") || t("common.none")}</dd><dt>{t("dialog.filesWritten")}</dt><dd>{selectedSimulationEvent.filesWritten.join(", ") || t("common.none")}</dd><dt>{t("dialog.state")}</dt><dd>{selectedSimulationEvent.before} → {selectedSimulationEvent.after}</dd></dl><div className="dialog-actions"><button className="primary-button" onClick={() => setSelectedSimulationEvent(null)}>{t("dialog.closeEvent")}</button></div></section></div>}
      {skillImport && <SkillImportPreview skillName={skillImport.skillName} files={skillImport.files} collisions={skillImport.collisions} hasExecutableLookingFiles={skillImport.hasExecutableLookingFiles} onCancel={() => setSkillImport(null)} onImport={async () => { try { await applySkillImport(skillImport.sourcePath, project.root); setSkillImport(null); await refreshSkills(project.root); setNotice({ tone: "success", message: t("app.skillImported") }); } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); } }} />}
      {paletteOpen && <CommandPalette actions={paletteActions} onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}

function TreeNode(
  { node, agents, selectedAgentId, selectedFile, onOpen, onSelectAgent, onAddFile, onReveal, onRequestDelete }: {
    node: FileTreeNode;
    agents: Agent[];
    selectedAgentId: string | null;
    selectedFile: string | null;
    onOpen: (path: string) => void;
    onSelectAgent: (agent: Agent) => void;
    onAddFile: (agent: Agent) => void;
    onReveal: (path: string) => void;
    onRequestDelete: (agentId: string) => void;
  },
) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const agent = node.kind === "directory"
    ? agents.find((item) => item.path === node.path)
    : undefined;
  return node.kind === "directory"
    ? (
      <div className="tree-directory">
        <div
          className={`tree-row directory-row ${agent?.id === selectedAgentId ? "selected-agent" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (agent) {
              setExpanded(true);
              onSelectAgent(agent);
            } else setExpanded((value) => !value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (agent) {
                setExpanded(true);
                onSelectAgent(agent);
              } else setExpanded((value) => !value);
            }
          }}
        >
          <span className="tree-disclosure-mark" aria-hidden="true">{expanded ? "−" : "+"}</span>
          <span className="tree-directory-copy">
            <strong>{node.name}</strong>
            {agent && <small>{agent.purpose}</small>}
          </span>
          {agent && (
            <Button
              variant="ghost"
              size="icon"
              className="tree-add-file"
              title={t("app.addFileTo", { name: agent.name })}
              aria-label={t("app.addFileTo", { name: agent.name })}
              onClick={(event) => {
                event.stopPropagation();
                onAddFile(agent);
              }}
            ><FilePlus2 /></Button>
          )}
          {agent && (
            <Button
              variant="ghost"
              size="icon"
              className="tree-delete"
              title={t("app.moveToRecoveryFor", { name: agent.name })}
              aria-label={t("app.moveToRecoveryFor", { name: agent.name })}
              onClick={(event) => {
                event.stopPropagation();
                onRequestDelete(agent.id);
              }}
            ><Trash2 /></Button>
          )}
        </div>
        {expanded && (
          <div className="tree-children">
            {node.children?.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                agents={agents}
                selectedAgentId={selectedAgentId}
                selectedFile={selectedFile}
                onOpen={onOpen}
                onSelectAgent={onSelectAgent}
                onAddFile={onAddFile}
                onReveal={onReveal}
                onRequestDelete={onRequestDelete}
              />
            ))}
          </div>
        )}
      </div>
    )
    : (
      <div className="tree-file">
        <button
          className={`tree-row file-row ${
            selectedFile === node.path ? "selected" : ""
          }`}
          onClick={() => onOpen(node.path)}
        >
          <span>{node.name}</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="tree-reveal"
          aria-label={t("app.revealFile", { path: node.path })}
          title={t("app.revealFile", { path: node.path })}
          onClick={() => onReveal(node.path)}
        ><Eye /></Button>
      </div>
    );
}

function filterTree(nodes: FileTreeNode[], query: string): FileTreeNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return nodes;
  return nodes.flatMap((node) => {
    const children = node.children ? filterTree(node.children, needle) : undefined;
    if (node.name.toLowerCase().includes(needle) || (children && children.length > 0)) {
      return [{ ...node, children }];
    }
    return [];
  });
}

function PaneDivider({ side, onStart }: { side: "nav" | "flow"; onStart: () => void }) {
  const { t } = useLanguage();
  return <div className={`pane-divider pane-divider-${side}`} role="separator" aria-orientation="vertical" aria-label={t("app.resizePane", { pane: side === "nav" ? t("app.paneNavigator") : t("app.paneFlow") })} onPointerDown={(event) => { event.preventDefault(); onStart(); }}><span /></div>;
}

function NavSectionDivider({ label, onStart }: { label: string; onStart: () => void }) {
  const { t } = useLanguage();
  return <div className="nav-section-divider" role="separator" aria-orientation="horizontal" aria-label={t("app.resizeSection", { pane: label })} onPointerDown={(event) => { event.preventDefault(); onStart(); }}><span /></div>;
}

function MarkdownEditor(
  { state, onChange, onSave }: {
    state: EditorState;
    onChange: (content: string) => void;
    onSave: () => void;
  },
) {
  const { t } = useLanguage();
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  useEffect(() => {
    if (!host.current) return;
    const initial = CMState.create({
      doc: state.content,
      extensions: [
        history(),
        markdown(),
        EditorView.lineWrapping,
        highlightSelectionMatches(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, {
          key: "Mod-s",
          run: () => {
            onSave();
            return true;
          },
        }, {
          key: "Mod-f",
          run: (target) => {
            openSearchPanel(target);
            return true;
          },
        }]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString());
        }),
      ],
    });
    view.current = new EditorView({ state: initial, parent: host.current });
    return () => {
      view.current?.destroy();
      view.current = null;
    };
  }, [state.path]);
  useEffect(() => {
    if (
      view.current && view.current.state.doc.toString() !== state.content &&
      state.status !== "dirty"
    ) {
      view.current.dispatch({
        changes: {
          from: 0,
          to: view.current.state.doc.length,
          insert: state.content,
        },
      });
    }
  }, [state.content, state.status]);
  const ghost = state.content === "" ? ghostExampleFor(state.path) : null;
  const useGhost = () => {
    if (!ghost || !view.current) return;
    view.current.dispatch({ changes: { from: 0, to: 0, insert: ghost } });
  };
  return (
    <>
      <div
        className="editor codemirror-editor"
        ref={host}
        aria-label={t("app.markdownEditor")}
      />
      {ghost && (
        <div className="ghost-example">
          <div><span className="eyebrow">{t("app.example")}</span><p>{t("app.examplePreview")}</p></div>
          <pre>{ghost}</pre>
          <button className="quiet-button" onClick={useGhost}>{t("app.useExample")}</button>
        </div>
      )}
      <div className="editor-actions">
        <span className="editor-hint">
          {t("app.editorShortcuts")}
        </span>
      </div>
    </>
  );
}
function FlowNode({
  node,
  selected,
  onSelect,
  onPositionChange,
}: {
  node: ProjectSnapshot["graph"]["nodes"][number];
  selected: boolean;
  onSelect: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  return (
    <button
      className={`flow-node ${selected ? "selected" : ""} ${
        dragging ? "dragging" : ""
      }`}
      style={{ left: node.position.x, top: node.position.y }}
      onClick={onSelect}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        setOrigin({
          x: event.clientX - node.position.x,
          y: event.clientY - node.position.y,
        });
      }}
      onPointerMove={(event) => {
        if (dragging) {
          onPositionChange({
            x: Math.max(12, event.clientX - origin.x),
            y: Math.max(12, event.clientY - origin.y),
          });
        }
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <Bot className="agent-glyph" aria-hidden="true" />
      <span>
        <strong>{node.name}</strong>
        <small>{useLanguage().t("app.agent")}</small>
      </span>
    </button>
  );
}
function Welcome(
  { busy, notice, onCreate, onOpen, onInspect, importSummary, onCancelImport }: {
    busy: boolean;
    notice: Notice;
    onCreate: (parentPath: string, name: string) => void;
    onOpen: (path: string) => void;
    onInspect: (path: string) => void;
    importSummary: ImportSummary | null;
    onCancelImport: () => void;
  },
) {
  const { t } = useLanguage();
  const [openPath, setOpenPath] = useState("");
  const [parentPath, setParentPath] = useState("");
  const [projectName, setProjectName] = useState(() => t("welcome.defaultProjectName"));
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const choose = async (setter: (value: string) => void) => {
    try {
      const selection = await open({ directory: true, multiple: false });
      if (typeof selection === "string") setter(selection);
    } catch (error) {
      setLocalNotice(String(error));
    }
  };
  return (
    <div className="welcome-shell">
      <div className="welcome-column">
        <span className="eyebrow">{t("welcome.localDesktop")}</span>
        <h1>Agent Lab</h1>
        <p className="welcome-lede">{t("welcome.lede")}</p>
        <section className="welcome-section">
          <div className="section-label">{t("welcome.openExisting")}</div>
          <div className="input-row">
            <input
              value={openPath}
              onChange={(event) => setOpenPath(event.target.value)}
              placeholder="/Users/you/Documents/my-agent-project"
              aria-label={t("welcome.existingPath")}
            />
            <button
              className="quiet-button"
              onClick={() => void choose(setOpenPath)}
            >
              {t("app.chooseFolder")}
            </button>
          </div>
          <button
            className="primary-button wide-button"
            disabled={busy || !openPath.trim()}
            onClick={() => onInspect(openPath.trim())}
          >
            {t("welcome.open")}
          </button>
        </section>
        <section className="welcome-section">
          <div className="section-label">{t("welcome.createNew")}</div>
          <div className="input-stack">
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder={t("welcome.defaultProjectName")}
              aria-label={t("welcome.projectName")}
            />
            <div className="input-row">
              <input
                value={parentPath}
                onChange={(event) => setParentPath(event.target.value)}
                placeholder={t("welcome.parentFolder")}
                aria-label={t("app.parentFolderPath")}
              />
              <button
                className="quiet-button"
                onClick={() => void choose(setParentPath)}
              >
                {t("app.chooseFolder")}
              </button>
            </div>
          </div>
          <button
            className="secondary-button wide-button"
            disabled={busy || !parentPath.trim() || !projectName.trim()}
            onClick={() => onCreate(parentPath.trim(), projectName.trim())}
          >
            {t("welcome.create")}
          </button>
        </section>
        {(notice || localNotice) && (
          <div className={`notice ${notice?.tone ?? "error"}`} role="alert" aria-live="assertive">
            {notice?.message ?? localNotice}
          </div>
        )}
        <p className="welcome-footnote">
          {t("welcome.noCloud")}
        </p>
        {importSummary && <ImportReview summary={importSummary} busy={busy} onCancel={onCancelImport} onOpen={() => { onCancelImport(); onOpen(importSummary.root); }} />}
      </div>
    </div>
  );
}

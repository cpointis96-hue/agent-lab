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
  createAgent,
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
import { Bot, ChevronDown, ChevronRight, Eye, FilePlus2, FolderOpen, MoreHorizontal, PanelLeft, PanelRight, Plus, Save, Search, Sparkles, Trash2, Workflow, X } from "lucide-react";
import type { RunEvent, RunSummary } from "./domain/runs";
import { RunControls, RunInspector } from "./components/RunControls";
import { RunTrace } from "./components/RunTrace";
import { UsageSummary } from "./components/UsageSummary";

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
  const [project, setProject] = useState<ProjectSnapshot | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentName, setAgentName] = useState("Researcher");
  const [agentPurpose, setAgentPurpose] = useState(defaultPurpose);
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
  const [runTask, setRunTask] = useState("Review the selected agent's local task.");
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
  const [flowCollapsed, setFlowCollapsed] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [rawFilesOpen, setRawFilesOpen] = useState(false);
  const [fileFilter, setFileFilter] = useState("");
  const [navWidth, setNavWidth] = useState(() => Number(localStorage.getItem("agent-lab.nav-width")) || 248);
  const [flowWidth, setFlowWidth] = useState(() => Number(localStorage.getItem("agent-lab.flow-width")) || 360);
  const [draggingDivider, setDraggingDivider] = useState<"nav" | "flow" | null>(null);
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
      const next = await createAgent(project.root, name, purpose);
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
            "Project created on disk.",
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
        setNotice({ tone: "success", message: "Blank template selected; no files changed." });
        return;
      }
      const next = await applyTemplate(project.root, proposalForTemplate(template));
      setTemplatesOpen(false);
      await loadProject(next, `${template.name} applied on disk.`);
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
      await loadProject(next, nextProposal.agents.length ? "Assistant proposal applied on disk." : "Proposal matched the existing project; nothing new was written.");
    } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); }
    finally { setBusy(false); }
  };
  const inspectSkillFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;
    try { setSkillImport({ ...(await inspectSkillImport(selected, project.root)), sourcePath: selected }); }
    catch (error) {
      const message = errorMessage(error);
      setNotice({ tone: "error", message: message.includes("Could not inspect skill source:") ? "Skill folder unavailable. Choose an existing folder containing SKILL.md." : message });
    }
  };
  const inspectSkillSourcePath = async () => {
    if (!skillSourcePath.trim()) return;
    try { setSkillImport({ ...(await inspectSkillImport(skillSourcePath.trim(), project.root)), sourcePath: skillSourcePath.trim() }); }
    catch (error) {
      const message = errorMessage(error);
      setNotice({ tone: "error", message: message.includes("Could not inspect skill source:") ? "Skill folder unavailable. Choose an existing folder containing SKILL.md." : message });
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
      setNotice({ tone: "success", message: `${created.id} started and is waiting for approval.` });
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
    { id: "assistant", label: "Open AI Design Assistant", run: () => setAssistantOpen(true) },
    { id: "templates", label: "Open workflow templates", run: () => setTemplatesOpen(true) },
    { id: "new-agent", label: "New Agent", run: () => setAgentDialogOpen(true) },
    { id: "add-file", label: "Add File", run: () => openAddFileDialog() },
    { id: "reveal", label: "Reveal project in Finder", run: () => void revealInFinder(project.root) },
    { id: "learn", label: "Switch Learn/Build", hint: `Current: ${mode}`, run: () => { const next = mode === "learn" ? "build" : "learn"; setMode(next); void setUiMode(project.root, next); } },
  ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><span className="brand-dot" aria-hidden="true" />Agent Lab</div>
        <div className="topbar-actions">
          <Button
            variant="ghost"
            size="icon"
            title="Close project"
            aria-label="Close project"
            onClick={() => {
              setProject(null);
              setEditor(null);
              setFiles([]);
            }}
          ><X /></Button>
          <Button
            variant="ghost"
            size="icon"
            title={navigatorCollapsed ? "Show navigator" : "Hide navigator"}
            aria-label={navigatorCollapsed ? "Show navigator" : "Hide navigator"}
            onClick={() => setNavigatorCollapsed((value) => !value)}
          ><PanelLeft /></Button>
          <Button
            variant="ghost"
            size="icon"
            title={flowCollapsed ? "Show flow" : "Hide flow"}
            aria-label={flowCollapsed ? "Show flow" : "Hide flow"}
            onClick={() => setFlowCollapsed((value) => !value)}
          ><PanelRight /></Button>
          <div className="toolbar-menu-wrap">
            <Button
              variant="ghost"
              size="icon"
              title="More project actions"
              aria-label="More project actions"
              aria-expanded={moreMenuOpen}
              onClick={() => setMoreMenuOpen((value) => !value)}
            ><MoreHorizontal /></Button>
            {moreMenuOpen && (
              <div className="toolbar-menu" role="menu">
                <button role="menuitem" onClick={() => { setMoreMenuOpen(false); setTemplatesOpen(true); }}><Workflow />Templates</button>
                <button role="menuitem" onClick={() => { setMoreMenuOpen(false); setAssistantOpen(true); }}><Sparkles />AI Assistant</button>
                <button role="menuitem" onClick={() => { setMoreMenuOpen(false); setPaletteOpen(true); }}><Search />Command palette</button>
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
            <span className="eyebrow">PROJECT</span>
            <div>
              <Button
                variant="ghost"
                size="icon"
                title="Reveal project in Finder"
                aria-label="Reveal project in Finder"
                onClick={() => void revealInFinder(project.root)}
              ><FolderOpen /></Button>
              <Button
                variant="ghost"
                size="icon"
                title="Add file"
                aria-label="Add file"
                onClick={() => openAddFileDialog()}
                disabled={busy}
              ><FilePlus2 /></Button>
              <Button
                variant="ghost"
                size="icon"
                title="Create agent"
                aria-label="Create agent"
                onClick={() => {
                  setAgentName("Researcher");
                  setAgentPurpose("");
                  setAgentDialogOpen(true);
                }}
                disabled={busy}
              ><Plus /></Button>
            </div>
          </div>
          <div className="navigator-search">
            <Search aria-hidden="true" />
            <input value={fileFilter} onChange={(event) => setFileFilter(event.target.value)} placeholder="Filter project" aria-label="Filter project" />
            <kbd>⌘F</kbd>
          </div>
          <section className="navigator-group">
            <div className="navigator-group-heading"><span>AGENTS</span><small>{project.agents.length}</small></div>
            {project.agents.length === 0
              ? <p className="navigator-empty">No agents yet. Use <strong>+</strong> to create one.</p>
              : <div className="agent-list" aria-label="Agents">{project.agents.map((agent) => <div className="agent-list-row" key={agent.id}><button className={`agent-list-item ${selectedAgentId === agent.id ? "selected" : ""}`} onClick={() => void selectAgent(agent)}><Bot /><span><strong>{agent.name}</strong><small>{agent.purpose}</small></span></button><Button variant="ghost" size="icon" className="agent-list-trash" title={`Move ${agent.name} to recovery`} aria-label={`Move ${agent.name} to recovery`} onClick={() => void requestDeleteAgent(agent.id)} disabled={busy}><Trash2 /></Button></div>)}</div>}
          </section>
          <section className="navigator-group navigator-group-files">
            <button className="navigator-disclosure" onClick={() => setRawFilesOpen((value) => !value)} aria-expanded={rawFilesOpen}><span><ChevronRight className={rawFilesOpen ? "rotated" : ""} />PROJECT FILES</span><small>{files.length}</small></button>
          </section>
          {rawFilesOpen && <div className="tree" aria-label="Project filesystem">
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
          <FileCatalog mode={mode} />
          <div className="navigator-footer">
            <div className="navigator-footer-heading">
              <span className="eyebrow">ROOT</span>
              {project.agents.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="danger-icon"
                  title="Move all agents to recovery"
                  aria-label="Move all agents to recovery"
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
              <strong>{selectedFile ?? "Select a file"}</strong>
            </div>
            <div className="editor-toolbar">
              {editor && (
                <span className={`save-state ${editor.status}`}>
                  {editor.status === "dirty"
                    ? "Unsaved"
                    : editor.status === "saving"
                    ? "Saving…"
                    : editor.status === "conflict"
                    ? "Conflict"
                    : editor.status === "error"
                    ? "Error"
                    : "Saved"}
                </span>
              )}
              {editor && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="save-icon-button"
                  aria-label="Save file"
                  title="Save file (⌘S)"
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
                <h2>Choose a Markdown file.</h2>
                <p>
                  The navigator reflects the real files inside this project.
                </p>
              </div>
            )}
        </section>
        {!flowCollapsed && <PaneDivider side="flow" onStart={() => setDraggingDivider("flow")} />}
        <section className={`flow panel ${flowCollapsed ? "pane-collapsed" : ""}`}>
          <div className="panel-header">
            <span className="eyebrow">FLOW</span>
            <div className="panel-tools">
              <span className="flow-meta">
                {project.graph.nodes.length}{" "}
                node{project.graph.nodes.length === 1 ? "" : "s"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                title="Rename selected agent"
                aria-label="Rename selected agent"
                onClick={() => setRenameDialogOpen(true)}
                disabled={busy || !selectedAgent}
              ><span className="toolbar-letter">Aa</span></Button>
              <Button
                variant="ghost"
                size="icon"
                title="Move selected agent to recovery"
                aria-label="Move selected agent to recovery"
                onClick={() => selectedAgent && void requestDeleteAgent(selectedAgent.id)}
                disabled={busy || !selectedAgent}
              ><Trash2 /></Button>
              <Button variant="ghost" size="icon" title="Connect agents" aria-label="Connect agents" onClick={() => {
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
              return <button key={edge.id} className="flow-edge" style={{ left: (source.position.x + target.position.x) / 2 + 58, top: (source.position.y + target.position.y) / 2 + 12 }} onClick={() => setEdgeDraft(edge)} title="Inspect connection">{edge.label || edge.relation}</button>;
            })}
            {project.graph.nodes.length === 0
              ? (
                <div className="flow-empty">
                  Your first agent will appear here.
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
          <div className="flow-footer">Drag a node to save its layout. {project.graph.edges.length > 0 && <span className="edge-summary">{project.graph.edges.length} relation{project.graph.edges.length === 1 ? "" : "s"}</span>}</div>
          <details className="flow-section" open><summary>Simulation</summary><SimulationControls state={simulation} dispatch={dispatchSimulation} /><TracePanel state={simulation} onSelect={setSelectedSimulationEvent} /></details>
          <details className="flow-section"><summary>Learn</summary><LessonPanel selected={selectedLesson} onSelect={setSelectedLesson} /><ContextResetExercise /></details>
          <details className="flow-section"><summary>Runs <small>{runs.length}</small></summary><RunControls agents={project.agents} selectedAgentId={selectedAgentId} task={runTask} onTask={setRunTask} onStart={() => void startLocalRun()} busy={busy} /><div className="run-list panel-section" aria-label="Durable runs">{runs.length === 0 ? <p className="muted-copy">No durable runs.</p> : runs.map((run) => <button key={run.id} className={`run-list-item ${selectedRun?.id === run.id ? "selected" : ""}`} onClick={() => void selectRun(run)}><strong>{run.id}</strong><span>{run.state} · {run.task}</span></button>)}</div><RunInspector run={selectedRun} onApprove={() => void updateRun(() => decideRun(project.root, selectedRun!.id, true))} onReject={() => void updateRun(() => decideRun(project.root, selectedRun!.id, false))} onCancel={() => void updateRun(() => cancelRun(project.root, selectedRun!.id))} onResume={() => void updateRun(() => resumeRun(project.root, selectedRun!.id))} /><RunTrace events={runEvents} /><UsageSummary runs={runs} /></details>
          <details className="flow-section"><summary>Skills <small>{skills.length}</small></summary><SkillAssignmentPanel agents={project.agents} skills={skills} assignments={skillAssignments} selectedAgentId={selectedAgentId} selectedSkillId={selectedSkillId} onSelectSkill={setSelectedSkillId} /><SkillInspector skill={skills.find((skill) => skill.id === selectedSkillId) ?? null} assigned={Boolean(selectedAgentId && selectedSkillId && skillAssignments.some((item) => item.agentId === selectedAgentId && item.skillId === selectedSkillId))} onAssign={(assigned) => void assignSelectedSkill(assigned)} /><div className="skill-import-action"><input aria-label="Local skill folder path" value={skillSourcePath} onChange={(event) => setSkillSourcePath(event.target.value)} placeholder="/private/tmp/skill-folder" /><button className="secondary-button" onClick={() => void inspectSkillSourcePath()}>Preview path</button><button className="quiet-button" onClick={() => void inspectSkillFolder()}>Choose folder</button></div></details>
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
            aria-label="File changed externally"
          >
            <span className="eyebrow">CONFLICT</span>
            <h2>File changed externally</h2>
            <p>{selectedFile} changed on disk while you had unsaved edits.</p>
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
                {compare ? "Hide compare" : "Compare"}
              </button>
              <button
                className="quiet-button"
                onClick={() => {
                  setEditor(clean(conflict.disk));
                  setConflict(null);
                }}
              >
                Reload
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
                Keep mine
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
            <span className="eyebrow">NEW AGENT</span>
            <h2>Create an agent</h2>
            <label>
              Name<input
                autoFocus
                value={agentName}
                onChange={(event) => setAgentName(event.target.value)}
              />
            </label>
            <label>
              Purpose<textarea
                value={agentPurpose}
                onChange={(event) => setAgentPurpose(event.target.value)}
                placeholder="Research official sources and return a short cited brief."
                rows={3}
              />
              <small className="field-hint">Example: Research official sources about a topic and return a short cited brief.</small>
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                className="quiet-button"
                onClick={() => setAgentDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={busy || !agentName.trim() || !agentPurpose.trim()}
              >
                Create agent
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
          <section className="agent-dialog delete-agent-dialog" role="dialog" aria-label="Move all agents to recovery">
            <span className="eyebrow">RECOVERABLE DELETE</span>
            <h2>Move all agents to recovery?</h2>
            <p className="file-path-preview">
              {project.agents.length} agent{project.agents.length === 1 ? "" : "s"} will leave the project tree and remain recoverable. No file will be permanently deleted.
            </p>
            <ul className="agent-bulk-list">
              {project.agents.map((agent) => <li key={agent.id}><strong>{agent.name}</strong><span>{agent.purpose}</span></li>)}
            </ul>
            <div className="dialog-actions">
              <button type="button" className="quiet-button" onClick={() => setDeleteAllAgentsOpen(false)} disabled={busy}>Cancel</button>
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
                Move all to recovery
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
      {selectedSimulationEvent && <div className="modal-backdrop"><section className="agent-dialog simulation-event-dialog" role="dialog" aria-label="Simulation event"><span className="eyebrow">SYNTHETIC EVENT</span><h2>{selectedSimulationEvent.sender} → {selectedSimulationEvent.receiver}</h2><dl className="event-details"><dt>Relation</dt><dd>{selectedSimulationEvent.relation}</dd><dt>Payload</dt><dd>{selectedSimulationEvent.payload}</dd><dt>Files read</dt><dd>{selectedSimulationEvent.filesRead.join(", ") || "None"}</dd><dt>Files written</dt><dd>{selectedSimulationEvent.filesWritten.join(", ") || "None"}</dd><dt>State</dt><dd>{selectedSimulationEvent.before} → {selectedSimulationEvent.after}</dd></dl><div className="dialog-actions"><button className="primary-button" onClick={() => setSelectedSimulationEvent(null)}>Close</button></div></section></div>}
      {skillImport && <SkillImportPreview skillName={skillImport.skillName} files={skillImport.files} collisions={skillImport.collisions} hasExecutableLookingFiles={skillImport.hasExecutableLookingFiles} onCancel={() => setSkillImport(null)} onImport={async () => { try { await applySkillImport(skillImport.sourcePath, project.root); setSkillImport(null); await refreshSkills(project.root); setNotice({ tone: "success", message: "Skill imported as inert local data." }); } catch (error) { setNotice({ tone: "error", message: errorMessage(error) }); } }} />}
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
          <span>{expanded ? <ChevronDown /> : <ChevronRight />}</span>
          <span className="tree-directory-copy">
            <strong>{node.name}</strong>
            {agent && <small>{agent.purpose}</small>}
          </span>
          {agent && (
            <Button
              variant="ghost"
              size="icon"
              className="tree-add-file"
              title={`Add file to ${agent.name}`}
              aria-label={`Add file to ${agent.name}`}
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
              title={`Move ${agent.name} to recovery`}
              aria-label={`Move ${agent.name} to recovery`}
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
          <span>·</span>
          <span>{node.name}</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="tree-reveal"
          aria-label={`Reveal ${node.path} in Finder`}
          title={`Reveal ${node.path} in Finder`}
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
  return <div className={`pane-divider pane-divider-${side}`} role="separator" aria-orientation="vertical" aria-label={`Resize ${side === "nav" ? "navigator" : "flow"}`} onPointerDown={(event) => { event.preventDefault(); onStart(); }}><span /></div>;
}

function MarkdownEditor(
  { state, onChange, onSave }: {
    state: EditorState;
    onChange: (content: string) => void;
    onSave: () => void;
  },
) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  useEffect(() => {
    if (!host.current) return;
    const initial = CMState.create({
      doc: state.content,
      extensions: [
        history(),
        markdown(),
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
        aria-label="Markdown editor"
      />
      {ghost && (
        <div className="ghost-example">
          <div><span className="eyebrow">EXAMPLE</span><p>Preview only — this file stays empty until you choose to use it.</p></div>
          <pre>{ghost}</pre>
          <button className="quiet-button" onClick={useGhost}>Use example</button>
        </div>
      )}
      <div className="editor-actions">
        <span className="editor-hint">
          ⌘S save · ⌘F search · ⌘Z undo · ⌘⇧Z redo
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
        <small>agent</small>
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
  const [openPath, setOpenPath] = useState("");
  const [parentPath, setParentPath] = useState("");
  const [projectName, setProjectName] = useState("My Agent Project");
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
        <span className="eyebrow">LOCAL-FIRST DESKTOP APP</span>
        <h1>Agent Lab</h1>
        <p className="welcome-lede">
          Learn agent architectures by building the real, readable files behind
          them.
        </p>
        <section className="welcome-section">
          <div className="section-label">Open existing project</div>
          <div className="input-row">
            <input
              value={openPath}
              onChange={(event) => setOpenPath(event.target.value)}
              placeholder="/Users/you/Documents/my-agent-project"
              aria-label="Existing project path"
            />
            <button
              className="quiet-button"
              onClick={() => void choose(setOpenPath)}
            >
              Choose
            </button>
          </div>
          <button
            className="primary-button wide-button"
            disabled={busy || !openPath.trim()}
            onClick={() => onInspect(openPath.trim())}
          >
            Open project
          </button>
        </section>
        <section className="welcome-section">
          <div className="section-label">Create new project</div>
          <div className="input-stack">
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="My Agent Project"
              aria-label="Project name"
            />
            <div className="input-row">
              <input
                value={parentPath}
                onChange={(event) => setParentPath(event.target.value)}
                placeholder="Parent folder"
                aria-label="Parent folder path"
              />
              <button
                className="quiet-button"
                onClick={() => void choose(setParentPath)}
              >
                Choose
              </button>
            </div>
          </div>
          <button
            className="secondary-button wide-button"
            disabled={busy || !parentPath.trim() || !projectName.trim()}
            onClick={() => onCreate(parentPath.trim(), projectName.trim())}
          >
            Create project
          </button>
        </section>
        {(notice || localNotice) && (
          <div className={`notice ${notice?.tone ?? "error"}`} role="alert" aria-live="assertive">
            {notice?.message ?? localNotice}
          </div>
        )}
        <p className="welcome-footnote">
          No account. No cloud. No agent execution.
        </p>
        {importSummary && <ImportReview summary={importSummary} busy={busy} onCancel={onCancelImport} onOpen={() => { onCancelImport(); onOpen(importSummary.root); }} />}
      </div>
    </div>
  );
}

import { create } from "zustand";

export type IDEViewMode = 'editor' | 'simulator';
export type SidebarView = 'explorer' | 'boards' | 'settings' | 'extensions' | null;

interface MicroIDEState {
  // Boards
  selectedBoardId: string;
  setSelectedBoardId: (id: string) => void;

  // Layout & Navigation
  activeViewMode: IDEViewMode;
  setActiveViewMode: (mode: IDEViewMode) => void;
  activeSidebarView: SidebarView;
  setActiveSidebarView: (view: SidebarView) => void;

  // Terminal & Output
  isTerminalOpen: boolean;
  toggleTerminal: () => void;
  serialOutput: string[];
  appendSerialOutput: (text: string) => void;
  clearSerialOutput: () => void;

  // Code content
  codeContent: string;
  setCodeContent: (code: string) => void;
}

const DEFAULT_CODE = `void setup() {
  Serial.begin(9600);
  Serial.println("Nexus Cloud IDE Initialization Complete!");
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`;

export const useMicroIDEStore = create<MicroIDEState>((set) => ({
  // Boards
  selectedBoardId: "arduino-uno",
  setSelectedBoardId: (id) => set({ selectedBoardId: id }),

  // Layout & Navigation
  activeViewMode: 'simulator',
  setActiveViewMode: (mode) => set({ activeViewMode: mode }),
  activeSidebarView: 'boards',
  setActiveSidebarView: (view) => set({ activeSidebarView: view }),

  // Terminal
  isTerminalOpen: false,
  toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
  serialOutput: ["Ready to connect..."],
  appendSerialOutput: (text) => set((state) => ({ serialOutput: [...state.serialOutput, text] })),
  clearSerialOutput: () => set({ serialOutput: [] }),

  // Code content
  codeContent: DEFAULT_CODE,
  setCodeContent: (code) => set({ codeContent: code }),
}));

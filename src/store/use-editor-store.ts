import { create } from "zustand";
import { type Editor } from "@tiptap/react";

interface EditorState {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  saveStatus: "saved" | "saving" | "error" | null;
  setSaveStatus: (status: "saved" | "saving" | "error" | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),
  saveStatus: null,
  setSaveStatus: (status) => set({ saveStatus: status }),
}));

// src/types/line-it.d.ts
declare global {
  interface LineIt {
    loadButton: () => void;
  }
  
  interface Window {
    LineIt?: LineIt;
  }
}

export {};
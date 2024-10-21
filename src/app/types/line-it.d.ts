// src/types/line-it.d.ts

interface LineIt {
    loadButton: () => void;
  }
  
  interface Window {
    LineIt?: LineIt;
  }
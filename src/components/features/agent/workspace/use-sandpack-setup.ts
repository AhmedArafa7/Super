
"use client";

import React from "react";
import { BASE_PROJECT_CONTEXT } from "@/lib/agent-base-context";

interface SandpackFile {
  path: string;
  content: string;
  language: string;
}

export function useSandpackSetup(files: SandpackFile[], activeFile?: SandpackFile) {
  const sandpackFiles = React.useMemo(() => {
    const map: Record<string, string> = {
      // 1. BASE PROJECT CONTEXT (Real files provided as fallback)
      ...BASE_PROJECT_CONTEXT,

      // 2. Native Alias Support via tsconfig.json (Professional package mocking)
      "/tsconfig.json": JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
            "next/*": ["src/mocks/next/*"]
          },
          jsx: "react-jsx"
        }                       
      }, null, 2)
    };  
    
    files.forEach(f => {
      const key = f.path.startsWith('/') ? f.path : `/${f.path}`;
      map[key] = f.content;
    });
    
    // --- NEXT.JS BROWSER MOCKS ---
    map["/src/mocks/next/navigation.js"] = `
        import React from "react";
        const noop = () => {};
        const mockRouter = {
            push: noop, replace: noop, back: noop, forward: noop, 
            refresh: noop, prefetch: noop, pathname: "/"
        };
        export const useRouter = () => mockRouter;
        export const usePathname = () => "/";
        export const useParams = () => ({});
        export const useSearchParams = () => ({ get: () => null });
    `;

    map["/src/mocks/next/image.js"] = `
        import React from "react";
        export default function Image(props) {
            return <img {...props} style={{ maxWidth: "100%", height: "auto", ...props.style }} />;
        }
    `;

    if (activeFile) {
      const activeKey = activeFile.path.startsWith('/') ? activeFile.path : `/${activeFile.path}`;
      
      map["/App.tsx"] = `
import React from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import Component from "${activeKey.replace(/\.tsx?$/, "")}";

export default function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
        <Component />
      </div>
    </AuthProvider>
  );
}`;
    }
    
    return map;
  }, [files, activeFile]);

  return { sandpackFiles };
}

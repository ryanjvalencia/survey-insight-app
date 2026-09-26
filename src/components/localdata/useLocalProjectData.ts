"use client";

import { useEffect, useState } from "react";
import type { ParseResult } from "@/types";
import { loadColumnTypes, loadUpload, type ColumnTypes } from "@/lib/localdata";
import { getBrowserStore } from "@/lib/localdata/indexeddb";

export type LocalProjectData =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; upload: ParseResult | null; columnTypes: ColumnTypes | null };

const LOADING: LocalProjectData = { status: "loading" };

/**
 * Loads a project's raw upload and saved column types from this browser's
 * IndexedDB. Data is only read client-side; the server never sees it.
 */
export function useLocalProjectData(projectId: string): LocalProjectData {
  const [state, setState] = useState<{ projectId: string; data: LocalProjectData }>({
    projectId,
    data: LOADING,
  });

  useEffect(() => {
    let cancelled = false;
    const store = getBrowserStore();
    Promise.all([loadUpload(store, projectId), loadColumnTypes(store, projectId)]).then(
      ([upload, columnTypes]) => {
        if (!cancelled) {
          setState({ projectId, data: { status: "ready", upload, columnTypes } });
        }
      },
      () => {
        if (!cancelled) setState({ projectId, data: { status: "error" } });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return state.projectId === projectId ? state.data : LOADING;
}

import { useMemo, useReducer } from "react";

import type { FieldReviewItem, SortMode } from "../domain";

interface ReviewControlsState {
  conflictsOnly: boolean;
  sortMode: SortMode;
  queryField: FieldReviewItem | null;
}

type ReviewControlsAction =
  | { type: "toggle-conflicts-only"; checked: boolean }
  | { type: "set-sort-mode"; sortMode: SortMode }
  | { type: "open-query"; field: FieldReviewItem }
  | { type: "close-query" };

const initialState: ReviewControlsState = {
  conflictsOnly: false,
  sortMode: "section",
  queryField: null,
};

function reviewControlsReducer(
  state: ReviewControlsState,
  action: ReviewControlsAction,
): ReviewControlsState {
  switch (action.type) {
    case "toggle-conflicts-only":
      return { ...state, conflictsOnly: action.checked };
    case "set-sort-mode":
      return { ...state, sortMode: action.sortMode };
    case "open-query":
      return { ...state, queryField: action.field };
    case "close-query":
      return { ...state, queryField: null };
    default:
      return state;
  }
}

export function useReviewControls() {
  const [state, dispatch] = useReducer(reviewControlsReducer, initialState);

  return useMemo(
    () => ({
      state,
      setConflictsOnly: (checked: boolean) =>
        dispatch({ type: "toggle-conflicts-only", checked }),
      setSortMode: (sortMode: SortMode) => dispatch({ type: "set-sort-mode", sortMode }),
      openQuery: (field: FieldReviewItem) => dispatch({ type: "open-query", field }),
      closeQuery: () => dispatch({ type: "close-query" }),
    }),
    [state],
  );
}

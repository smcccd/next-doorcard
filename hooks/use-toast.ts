"use client";

// Inspired by react-hot-toast library
import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

// Priority-based toast limits
const PRIORITY_LIMITS = {
  low: 2,
  normal: 3,
  high: 4,
  critical: 5,
};

// Priority-based auto-dismiss timeouts (in ms)
const PRIORITY_TIMEOUTS = {
  low: 3000,
  normal: 5000,
  high: 8000,
  critical: 0, // Never auto-dismiss
};

import type {
  ToasterToast,
  ActionType,
  Action,
  State,
  ToastPriority,
} from "@/types/hooks/toast";

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, priority: ToastPriority = 'normal', persistent = false) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  // Don't auto-dismiss persistent toasts or critical priority toasts
  const timeout = PRIORITY_TIMEOUTS[priority];
  if (persistent || timeout === 0) {
    return;
  }

  const timeoutId = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, timeout);

  toastTimeouts.set(toastId, timeoutId);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": {
      const newToast = {
        priority: 'normal' as ToastPriority,
        position: 'bottom-right' as const,
        persistent: false,
        ...action.toast,
      };

      // Sort toasts by priority (critical > high > normal > low)
      const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
      const sortedToasts = [newToast, ...state.toasts]
        .sort((a, b) => (priorityOrder[b.priority!] || 0) - (priorityOrder[a.priority!] || 0))
        .slice(0, TOAST_LIMIT);

      return {
        ...state,
        toasts: sortedToasts,
      };
    }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        const toast = state.toasts.find(t => t.id === toastId);
        if (toast) {
          addToRemoveQueue(toastId, toast.priority, toast.persistent);
        }
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, toast.priority, toast.persistent);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

import type { Toast } from "@/types/hooks/toast";

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

// Helper functions for common toast patterns
const toastHelpers = {
  success: (props: Omit<Toast, 'variant' | 'priority'>) => 
    toast({ ...props, variant: 'default', priority: 'normal' }),
  
  error: (props: Omit<Toast, 'variant' | 'priority'>) => 
    toast({ ...props, variant: 'destructive', priority: 'high' }),
  
  warning: (props: Omit<Toast, 'variant' | 'priority'>) => 
    toast({ ...props, variant: 'default', priority: 'normal' }),
  
  critical: (props: Omit<Toast, 'variant' | 'priority' | 'persistent'>) => 
    toast({ ...props, variant: 'destructive', priority: 'critical', persistent: true }),
  
  info: (props: Omit<Toast, 'variant' | 'priority'>) => 
    toast({ ...props, variant: 'default', priority: 'low' }),
};

export { useToast, toast, toastHelpers };

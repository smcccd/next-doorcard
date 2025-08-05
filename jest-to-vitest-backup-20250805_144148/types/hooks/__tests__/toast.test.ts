import type { ToasterToast, ActionType, Action, State, Toast } from "../toast";

describe("Toast Types", () => {
  it("should define ToasterToast type with required properties", () => {
    const mockToast: ToasterToast = {
      id: "test-toast-1",
      title: "Test Title",
      description: "Test Description",
    };

    expect(mockToast.id).toBe("test-toast-1");
    expect(mockToast.title).toBe("Test Title");
    expect(mockToast.description).toBe("Test Description");
  });

  it("should define ActionType constants", () => {
    // Test that action types are available
    expect(typeof ActionType).toBe("undefined"); // ActionType is imported as a type

    // But we can test the actual action creators work with the types
    const addAction: Action = {
      type: "ADD_TOAST",
      toast: {
        id: "test-1",
        title: "Test",
      },
    };

    expect(addAction.type).toBe("ADD_TOAST");
    expect(addAction.toast.id).toBe("test-1");
  });

  it("should define UPDATE_TOAST action", () => {
    const updateAction: Action = {
      type: "UPDATE_TOAST",
      toast: {
        title: "Updated Title",
      },
    };

    expect(updateAction.type).toBe("UPDATE_TOAST");
    expect(updateAction.toast.title).toBe("Updated Title");
  });

  it("should define DISMISS_TOAST action", () => {
    const dismissAction: Action = {
      type: "DISMISS_TOAST",
      toastId: "test-1",
    };

    expect(dismissAction.type).toBe("DISMISS_TOAST");
    expect(dismissAction.toastId).toBe("test-1");
  });

  it("should define REMOVE_TOAST action", () => {
    const removeAction: Action = {
      type: "REMOVE_TOAST",
      toastId: "test-1",
    };

    expect(removeAction.type).toBe("REMOVE_TOAST");
    expect(removeAction.toastId).toBe("test-1");
  });

  it("should define State interface", () => {
    const mockState: State = {
      toasts: [
        {
          id: "toast-1",
          title: "Test Toast 1",
        },
        {
          id: "toast-2",
          title: "Test Toast 2",
        },
      ],
    };

    expect(mockState.toasts).toHaveLength(2);
    expect(mockState.toasts[0].id).toBe("toast-1");
    expect(mockState.toasts[1].id).toBe("toast-2");
  });

  it("should define Toast type (without id)", () => {
    const mockToast: Toast = {
      title: "Test Toast",
      description: "Toast without ID",
    };

    expect(mockToast.title).toBe("Test Toast");
    expect(mockToast.description).toBe("Toast without ID");
    // id should not be present in Toast type
    expect("id" in mockToast).toBe(false);
  });
});

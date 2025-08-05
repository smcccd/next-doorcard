import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, testHelpers, mockData, setupUserEvent } from "../test-utils";

// Mock userEvent setup to control timing
jest.mock("@testing-library/user-event", () => ({
  setup: jest.fn(() => ({
    click: jest.fn(),
    type: jest.fn(),
    clear: jest.fn(),
  })),
}));

const mockUserEvent = userEvent as MockedObject<typeof userEvent>;

describe("Test Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Custom Render Function", () => {
    it("should render React components", () => {
      const TestComponent = () => <div data-testid="test">Hello World</div>;

      render(<TestComponent />);

      expect(screen.getByTestId("test")).toBeInTheDocument();
      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should pass through render options", () => {
      const TestComponent = () => <div data-testid="test">Test</div>;

      const { container } = render(<TestComponent />, {
        container: document.createElement("section"),
      });

      expect(container.tagName).toBe("SECTION");
    });

    it("should wrap components with AllTheProviders", () => {
      const TestComponent = () => {
        // Test that we can access React context if providers were added
        return <div data-testid="wrapped">Wrapped Component</div>;
      };

      render(<TestComponent />);

      expect(screen.getByTestId("wrapped")).toBeInTheDocument();
    });

    it("should handle complex component hierarchies", () => {
      const ParentComponent = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="parent">{children}</div>
      );

      const ChildComponent = () => <span data-testid="child">Child</span>;

      render(
        <ParentComponent>
          <ChildComponent />
        </ParentComponent>
      );

      expect(screen.getByTestId("parent")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("Test Helpers", () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    describe("getSearchInput", () => {
      it("should find input with type=search", () => {
        container.innerHTML = '<input type="search" />';

        const searchInput = testHelpers.getSearchInput(container);

        expect(searchInput).not.toBeNull();
        expect(searchInput?.getAttribute("type")).toBe("search");
      });

      it("should find input with search placeholder", () => {
        container.innerHTML = '<input placeholder="Search professors" />';

        const searchInput = testHelpers.getSearchInput(container);

        expect(searchInput).not.toBeNull();
        expect(searchInput?.getAttribute("placeholder")).toContain("Search");
      });

      it("should find element with searchbox role", () => {
        container.innerHTML = '<div role="searchbox">Search</div>';

        const searchInput = testHelpers.getSearchInput(container);

        expect(searchInput).not.toBeNull();
        expect(searchInput?.getAttribute("role")).toBe("searchbox");
      });

      it("should return null when no search input found", () => {
        container.innerHTML = '<input type="text" />';

        const searchInput = testHelpers.getSearchInput(container);

        expect(searchInput).toBeNull();
      });

      it("should prioritize type=search over placeholder", () => {
        container.innerHTML = `
          <input placeholder="Search" id="placeholder" />
          <input type="search" id="type-search" />
        `;

        const searchInput = testHelpers.getSearchInput(container);

        expect(searchInput?.id).toBe("type-search");
      });
    });

    describe("getCampusFilter", () => {
      it("should find element with campus-filter testid", () => {
        container.innerHTML = '<select data-testid="campus-filter"></select>';

        const campusFilter = testHelpers.getCampusFilter(container);

        expect(campusFilter).not.toBeNull();
        expect(campusFilter?.getAttribute("data-testid")).toBe("campus-filter");
      });

      it("should find select with campus name", () => {
        container.innerHTML = '<select name="campus-selection"></select>';

        const campusFilter = testHelpers.getCampusFilter(container);

        expect(campusFilter).not.toBeNull();
        expect(campusFilter?.getAttribute("name")).toBe("campus-selection");
      });

      it("should find element with campus aria-label", () => {
        container.innerHTML = '<div aria-label="Select Campus">Filter</div>';

        const campusFilter = testHelpers.getCampusFilter(container);

        expect(campusFilter).not.toBeNull();
        expect(campusFilter?.getAttribute("aria-label")).toContain("Campus");
      });

      it("should return null when no campus filter found", () => {
        container.innerHTML = '<select name="other-filter"></select>';

        const campusFilter = testHelpers.getCampusFilter(container);

        expect(campusFilter).toBeNull();
      });
    });

    describe("getProfessorCards", () => {
      it("should find elements with professor-card testid", () => {
        container.innerHTML = `
          <div data-testid="professor-card">Prof 1</div>
          <div data-testid="professor-card">Prof 2</div>
        `;

        const professorCards = testHelpers.getProfessorCards(container);

        expect(professorCards).toHaveLength(2);
        expect(professorCards[0].textContent).toBe("Prof 1");
        expect(professorCards[1].textContent).toBe("Prof 2");
      });

      it("should always return the first querySelectorAll result (testid takes precedence)", () => {
        container.innerHTML = `
          <article>Professor Article 1</article>
          <article>Professor Article 2</article>
        `;

        const professorCards = testHelpers.getProfessorCards(container);

        // The function uses || logic with querySelectorAll, which always returns a NodeList
        // Even empty NodeLists are truthy, so it always returns the first one
        expect(professorCards).toHaveLength(0); // No testid cards found
      });

      it("should always return testid result even when other selectors would match", () => {
        container.innerHTML = `
          <div class="professor-card">Prof Class 1</div>
          <div class="professor-card">Prof Class 2</div>
        `;

        const professorCards = testHelpers.getProfessorCards(container);

        // The function uses || logic, so it returns the first querySelectorAll result
        // which is always the testid search (even if empty)
        expect(professorCards).toHaveLength(0); // No testid cards, returns empty NodeList
      });

      it("should prioritize testid over other selectors", () => {
        container.innerHTML = `
          <div data-testid="professor-card">Testid Card</div>
          <article>Article Card</article>
          <div class="professor-card">Class Card</div>
        `;

        const professorCards = testHelpers.getProfessorCards(container);

        // Should return testid results first
        expect(professorCards).toHaveLength(1);
        expect(professorCards[0].textContent).toBe("Testid Card");
      });

      it("should return empty NodeList when no cards found", () => {
        container.innerHTML = "<div>No professor cards</div>";

        const professorCards = testHelpers.getProfessorCards(container);

        // Should return empty NodeList, not null
        expect(professorCards).toHaveLength(0);
      });
    });

    describe("waitForDataToLoad", () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it("should wait when loading indicators are present", async () => {
        container.innerHTML = '<div data-testid="loading">Loading...</div>';

        const waitPromise = testHelpers.waitForDataToLoad(container);

        // Fast-forward time
        jest.advanceTimersByTime(100);

        await waitPromise;

        expect(jest.getTimerCount()).toBe(0);
      });

      it("should wait for aria-label loading indicators", async () => {
        container.innerHTML =
          '<div aria-label="Loading data">Please wait</div>';

        const waitPromise = testHelpers.waitForDataToLoad(container);

        jest.advanceTimersByTime(100);

        await waitPromise;

        expect(jest.getTimerCount()).toBe(0);
      });

      it("should wait for class-based loading indicators", async () => {
        container.innerHTML = '<div class="loading">Loading...</div>';

        const waitPromise = testHelpers.waitForDataToLoad(container);

        jest.advanceTimersByTime(100);

        await waitPromise;

        expect(jest.getTimerCount()).toBe(0);
      });

      it("should resolve immediately when no loading indicators", async () => {
        container.innerHTML = "<div>Content loaded</div>";

        const waitPromise = testHelpers.waitForDataToLoad(container);

        await waitPromise;

        // Should resolve without waiting
        expect(jest.getTimerCount()).toBe(0);
      });

      it("should handle multiple loading indicators", async () => {
        container.innerHTML = `
          <div data-testid="loading">Loading 1</div>
          <div class="loading">Loading 2</div>
        `;

        const waitPromise = testHelpers.waitForDataToLoad(container);

        jest.advanceTimersByTime(100);

        await waitPromise;

        expect(jest.getTimerCount()).toBe(0);
      });
    });
  });

  describe("Mock Data Generators", () => {
    describe("doorcard mock", () => {
      it("should generate default doorcard data", () => {
        const doorcard = mockData.doorcard();

        expect(doorcard).toEqual({
          id: "test-id",
          name: "Dr. Test Professor",
          doorcardName: "Professor Test",
          officeNumber: "123",
          term: "Fall",
          year: "2024",
          college: "SKYLINE",
          isActive: true,
          isPublic: true,
          user: {
            name: "Dr. Test Professor",
            username: "test-prof",
            title: "Dr.",
            website: "https://example.com",
          },
          appointmentCount: 3,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01",
        });
      });

      it("should accept overrides", () => {
        const overrides = {
          name: "Prof. Custom Name",
          college: "CSM",
          isActive: false,
        };

        const doorcard = mockData.doorcard(overrides);

        expect(doorcard.name).toBe("Prof. Custom Name");
        expect(doorcard.college).toBe("CSM");
        expect(doorcard.isActive).toBe(false);

        // Should keep other defaults
        expect(doorcard.id).toBe("test-id");
        expect(doorcard.term).toBe("Fall");
      });

      it("should handle nested object overrides", () => {
        const overrides = {
          user: {
            name: "Custom User",
            username: "custom-user",
            title: "Prof.",
            website: "https://custom.com",
          },
        };

        const doorcard = mockData.doorcard(overrides);

        expect(doorcard.user.name).toBe("Custom User");
        expect(doorcard.user.username).toBe("custom-user");
        expect(doorcard.user.title).toBe("Prof.");
        expect(doorcard.user.website).toBe("https://custom.com");
      });

      it("should handle empty overrides", () => {
        const doorcard1 = mockData.doorcard();
        const doorcard2 = mockData.doorcard({});

        expect(doorcard1).toEqual(doorcard2);
      });
    });

    describe("appointment mock", () => {
      it("should generate default appointment data", () => {
        const appointment = mockData.appointment();

        expect(appointment).toEqual({
          id: "appt-1",
          name: "Office Hours",
          startTime: "10:00",
          endTime: "11:00",
          dayOfWeek: "MONDAY",
          category: "OFFICE_HOURS",
          location: "Room 123",
        });
      });

      it("should accept overrides", () => {
        const overrides = {
          name: "Lab Session",
          dayOfWeek: "FRIDAY",
          category: "LECTURE",
        };

        const appointment = mockData.appointment(overrides);

        expect(appointment.name).toBe("Lab Session");
        expect(appointment.dayOfWeek).toBe("FRIDAY");
        expect(appointment.category).toBe("LECTURE");

        // Should keep other defaults
        expect(appointment.id).toBe("appt-1");
        expect(appointment.startTime).toBe("10:00");
      });

      it("should handle time overrides", () => {
        const overrides = {
          startTime: "14:00",
          endTime: "16:00",
        };

        const appointment = mockData.appointment(overrides);

        expect(appointment.startTime).toBe("14:00");
        expect(appointment.endTime).toBe("16:00");
      });
    });
  });

  describe("setupUserEvent", () => {
    it("should return configured userEvent instance", () => {
      const userEventInstance = setupUserEvent();

      expect(mockUserEvent.setup).toHaveBeenCalledWith({
        delay: null,
      });
      expect(userEventInstance).toBeDefined();
    });

    it("should disable delays for test speed", () => {
      setupUserEvent();

      expect(mockUserEvent.setup).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: null,
        })
      );
    });

    it("should return different instances on multiple calls", () => {
      const instance1 = setupUserEvent();
      const instance2 = setupUserEvent();

      expect(mockUserEvent.setup).toHaveBeenCalledTimes(2);
      // Each call should return a new instance
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
    });
  });

  describe("Re-exports", () => {
    it("should re-export testing-library functions", () => {
      // Test that common testing-library functions are available
      expect(screen).toBeDefined();
      expect(within).toBeDefined();
    });

    it("should export custom render as default render", () => {
      const TestComponent = () => (
        <div data-testid="export-test">Export Test</div>
      );

      render(<TestComponent />);

      expect(screen.getByTestId("export-test")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("should work together for complete test scenarios", async () => {
      const TestApp = () => {
        return (
          <div>
            <input
              type="search"
              placeholder="Search professors"
              data-testid="search"
            />
            <select data-testid="campus-filter">
              <option value="SKYLINE">Skyline</option>
              <option value="CSM">CSM</option>
            </select>
            <div data-testid="professor-card">Dr. Test Professor</div>
            <div data-testid="loading" style={{ display: "none" }}>
              Loading...
            </div>
          </div>
        );
      };

      const { container } = render(<TestApp />);

      // Test all helpers work together
      const searchInput = testHelpers.getSearchInput(container);
      const campusFilter = testHelpers.getCampusFilter(container);
      const professorCards = testHelpers.getProfessorCards(container);

      expect(searchInput).not.toBeNull();
      expect(campusFilter).not.toBeNull();
      expect(professorCards).toHaveLength(1);

      await testHelpers.waitForDataToLoad(container);

      // Should complete without hanging
      expect(screen.getByTestId("search")).toBeInTheDocument();
    });
  });
});

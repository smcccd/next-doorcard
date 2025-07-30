import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Page Object Model for HomePage - encapsulates all interactions
 * This makes tests resilient to UI changes by centralizing selectors
 */
export class HomePageObject {
  private user = userEvent.setup({ delay: null });

  // Header elements
  async expectPageHeader() {
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText(/office hours.*contact information/i)
    ).toBeInTheDocument();
  }

  // Search functionality
  async searchForProfessor(searchTerm: string) {
    const searchInput = this.getSearchInput();
    await this.user.clear(searchInput);
    await this.user.type(searchInput, searchTerm);
  }

  getSearchInput() {
    return (
      screen.getByRole("textbox", { name: /search/i }) ||
      screen.getByPlaceholderText(/search/i) ||
      screen.getByDisplayValue(/search/i)
    );
  }

  // Campus filter
  async selectCampus(campus: "ALL" | "SKYLINE" | "CSM" | "CANADA") {
    const campusRadio = screen.getByRole("radio", {
      name: new RegExp(this.getCampusLabel(campus), "i"),
    });
    await this.user.click(campusRadio);
  }

  expectCampusSelected(campus: "ALL" | "SKYLINE" | "CSM" | "CANADA") {
    const campusRadio = screen.getByRole("radio", {
      name: new RegExp(this.getCampusLabel(campus), "i"),
    });
    expect(campusRadio).toBeChecked();
  }

  private getCampusLabel(campus: string) {
    const labels = {
      ALL: "All Campuses",
      SKYLINE: "Skyline",
      CSM: "CSM",
      CANADA: "Cañada",
    };
    return labels[campus as keyof typeof labels] || campus;
  }

  // Department filter
  async selectDepartment(department: string) {
    const departmentSelect = screen.getByRole("combobox", {
      name: /department/i,
    });
    await this.user.click(departmentSelect);

    const option = screen.getByRole("option", {
      name: new RegExp(department, "i"),
    });
    await this.user.click(option);
  }

  // Day filter
  async selectDay(day: string) {
    const daySelect = screen.getByRole("combobox", { name: /day/i });
    await this.user.click(daySelect);

    const option = screen.getByRole("option", { name: new RegExp(day, "i") });
    await this.user.click(option);
  }

  // Professor cards
  getProfessorCards() {
    // Try multiple selectors to find professor cards
    const cards =
      screen.queryAllByRole("article") ||
      screen.queryAllByTestId("professor-card") ||
      screen
        .queryAllByText(/office.*hours/i)
        .map((el) => el.closest('[class*="card"]'))
        .filter(Boolean);

    return cards as HTMLElement[];
  }

  expectProfessorCardsVisible() {
    const cards = this.getProfessorCards();
    expect(cards.length).toBeGreaterThan(0);
  }

  async clickProfessorCard(index: number = 0) {
    const cards = this.getProfessorCards();
    expect(cards[index]).toBeInTheDocument();
    await this.user.click(cards[index]);
  }

  expectProfessorCardContains(text: string, index: number = 0) {
    const cards = this.getProfessorCards();
    expect(
      within(cards[index]).getByText(new RegExp(text, "i"))
    ).toBeInTheDocument();
  }

  // Loading and empty states
  expectLoadingState() {
    expect(
      screen.getByText(/loading/i) ||
        screen.getByRole("status") ||
        screen.getByTestId("loading-spinner")
    ).toBeInTheDocument();
  }

  expectEmptyState() {
    expect(
      screen.getByText(/no.*professor.*found/i) ||
        screen.getByText(/no.*results/i) ||
        screen.getByRole("status", { name: /empty/i })
    ).toBeInTheDocument();
  }

  // Tips and help sections
  expectHelpfulTips() {
    expect(
      screen.getByText(/tip/i) ||
        screen.getByText(/helpful/i) ||
        screen.getByRole("complementary")
    ).toBeInTheDocument();
  }

  // Wait for data to load
  async waitForDataLoad() {
    // Wait for loading states to disappear
    await screen.findByRole("main", {}, { timeout: 3000 });

    // Ensure no loading indicators remain
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  }
}

/**
 * Page Object for Professor Detail/Doorcard View
 */
export class ProfessorPageObject {
  private user = userEvent.setup({ delay: null });

  expectProfessorHeader(name?: string) {
    const heading = screen.getByRole("heading", { level: 1 });
    if (name) {
      expect(heading).toHaveTextContent(new RegExp(name, "i"));
    }
    expect(heading).toBeInTheDocument();
  }

  expectOfficeHours() {
    expect(
      screen.getByText(/office.*hours/i) ||
        screen.getByRole("table") ||
        screen.getByTestId("schedule")
    ).toBeInTheDocument();
  }

  expectContactInfo() {
    expect(
      screen.getByText(/office/i) ||
        screen.getByText(/room/i) ||
        screen.getByText(/location/i)
    ).toBeInTheDocument();
  }

  async printDoorcard() {
    const printButton = screen.getByRole("button", { name: /print/i });
    await this.user.click(printButton);
  }
}

/**
 * Reusable form interactions
 */
export class FormHelpers {
  private user = userEvent.setup({ delay: null });

  async fillSelect(labelRegex: RegExp, value: string) {
    const select = screen.getByRole("combobox", { name: labelRegex });
    await this.user.click(select);

    const option = screen.getByRole("option", { name: new RegExp(value, "i") });
    await this.user.click(option);
  }

  async fillInput(labelRegex: RegExp, value: string) {
    const input = screen.getByRole("textbox", { name: labelRegex });
    await this.user.clear(input);
    await this.user.type(input, value);
  }

  async clickButton(nameRegex: RegExp) {
    const button = screen.getByRole("button", { name: nameRegex });
    await this.user.click(button);
  }

  expectFormError(message?: string) {
    const alert = screen.getByRole("alert") || screen.getByText(/error/i);
    expect(alert).toBeInTheDocument();

    if (message) {
      expect(alert).toHaveTextContent(new RegExp(message, "i"));
    }
  }
}

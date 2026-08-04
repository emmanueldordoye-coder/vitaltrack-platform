import { render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";

import { AppShell } from "./app-shell";
import { NavLinks } from "./nav-links";
import { ShellHeader } from "./shell-header";
import { supportedNavigation } from "./routes";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockedUsePathname = jest.mocked(usePathname);

describe("Project Lighthouse shell", () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue("/dashboard");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders the Figma-inspired shell while preserving user identity and sign out", () => {
    render(
      <AppShell signOutAction="/sign-out" userEmail="user@example.com">
        <div>Page content</div>
      </AppShell>,
    );

    expect(screen.getByTestId("app-shell")).toHaveClass(
      "bg-lighthouse-background",
    );
    expect(screen.getByTestId("app-sidebar")).toHaveClass(
      "bg-lighthouse-primary",
      "lg:w-[220px]",
    );
    expect(screen.getByText("VitalTrack")).toBeInTheDocument();
    expect(screen.getByText("Technologies")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("renders only the supported MVP navigation routes", () => {
    render(<NavLinks />);

    for (const item of supportedNavigation) {
      expect(
        screen.getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    }

    expect(screen.queryByText("Vendors")).not.toBeInTheDocument();
    expect(screen.queryByText("Receiving")).not.toBeInTheDocument();
    expect(screen.queryByText("Suggested Orders")).not.toBeInTheDocument();
    expect(screen.queryByText("Order Review")).not.toBeInTheDocument();
    expect(screen.queryByText("Purchase Confirmation")).not.toBeInTheDocument();
  });

  it.each(supportedNavigation)(
    "marks $label active when the current route is $href",
    ({ href, label }) => {
      mockedUsePathname.mockReturnValue(href);

      render(<NavLinks />);

      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );

  it("keeps the navigation usable on narrow screens", () => {
    render(<NavLinks />);

    expect(screen.getByTestId("primary-navigation-list")).toHaveClass(
      "flex",
      "lg:block",
    );
  });

  it("renders the current route in the shell header", () => {
    mockedUsePathname.mockReturnValue("/inventory");

    render(<ShellHeader />);

    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("Project Lighthouse")).toBeInTheDocument();
  });

  it("keeps the shell responsive between mobile and desktop layouts", () => {
    render(
      <AppShell signOutAction="/sign-out" userEmail="operator@example.com">
        <div>Dashboard</div>
      </AppShell>,
    );

    expect(screen.getByTestId("app-sidebar")).toHaveClass("lg:w-[220px]");
    expect(screen.getByTestId("app-navigation-scroll")).toHaveClass(
      "overflow-x-auto",
      "lg:overflow-y-auto",
    );
    expect(
      within(screen.getByTestId("app-main")).getByText("Dashboard"),
    ).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";

import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Facilities" value={12} />);

    expect(screen.getByText("Facilities")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});

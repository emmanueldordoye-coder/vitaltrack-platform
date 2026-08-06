import { render, screen } from "@testing-library/react";
import { useFormState, useFormStatus } from "react-dom";

import { initialAuthFormState } from "./form-state";
import SignInPage from "./page";
import { SignInForm } from "./sign-in-form";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormState: jest.fn(),
  useFormStatus: jest.fn(),
}));

const mockedUseFormState = jest.mocked(useFormState);
const mockedUseFormStatus = jest.mocked(useFormStatus);

describe("SignInPage", () => {
  beforeEach(() => {
    mockedUseFormState.mockReturnValue([initialAuthFormState, "/sign-in"] as never);
    mockedUseFormStatus.mockReturnValue({ pending: false } as never);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders the Dentira sign-in form with customer-safe copy", () => {
    render(<SignInPage />);

    expect(screen.getByText("VitalTrack")).toBeInTheDocument();
    expect(screen.getByText("Dentira operations workspace")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Supply ordering, ready for the day.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/continue to the Dentira supply workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/project lighthouse/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/smoketest/i)).not.toBeInTheDocument();
  });

  it("renders validation and authentication errors without changing form behavior", () => {
    mockedUseFormState.mockReturnValue([
      {
        status: "error",
        message: "Enter a valid email address.",
      },
      "/sign-in",
    ] as never);

    render(
      <SignInForm
        action={jest.fn() as never}
        initialState={initialAuthFormState}
      />,
    );

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-form")).toHaveAttribute("novalidate");
  });

  it("wires successful submissions through the existing server action", () => {
    const action = jest.fn() as never;

    render(
      <SignInForm action={action} initialState={initialAuthFormState} />,
    );

    expect(mockedUseFormState).toHaveBeenCalledWith(
      action,
      initialAuthFormState,
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "name",
      "password",
    );
  });
});

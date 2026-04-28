import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock("expo-image", () => ({
  Image: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: any }) => children,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/api/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  },
}));

describe("Login screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error test fetch mock
    global.fetch = jest.fn();
  });

  it("shows validation message for malformed email", async () => {
    const Login = require("@/app/login").default as typeof import("@/app/login").default;
    const screen = render(<Login />);

    fireEvent.changeText(screen.getByPlaceholderText("Email"), "bad-email");
    fireEvent.changeText(screen.getByPlaceholderText("Password"), "password123");
    fireEvent.press(screen.getByText("Login"));

    expect(await screen.findByText("Please enter a valid email.")).toBeTruthy();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("routes to lobbies on successful auth and profile check", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {
        session: { access_token: "token-abc" },
        user: { user_metadata: { username: "dev1" } },
      },
      error: null,
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ username: "dev1", preferred_campus: "busch" }),
    });

    const Login = require("@/app/login").default as typeof import("@/app/login").default;
    const screen = render(<Login />);

    fireEvent.changeText(screen.getByPlaceholderText("Email"), "dev@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Password"), "password123");
    fireEvent.press(screen.getByText("Login"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)/lobbies");
    });
  });
});

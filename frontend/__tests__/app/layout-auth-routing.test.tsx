import { render, waitFor, act } from "@testing-library/react-native";

const mockReplace = jest.fn();
const mockUseSegments = jest.fn();
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSignOut = jest.fn();

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({ replace: mockReplace }),
  useSegments: () => mockUseSegments(),
}));

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/api/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => mockOnAuthStateChange(),
      signOut: () => mockSignOut(),
    },
  },
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("RootLayout auth routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSegments.mockReturnValue(["(tabs)"]);
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    // @ts-expect-error test fetch mock
    global.fetch = jest.fn();
  });

  it("redirects users without profile to complete-profile", async () => {
    mockUseSegments.mockReturnValue(["(tabs)"]);
    mockGetSession.mockResolvedValueOnce({
      data: { session: { access_token: "access-token" } },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 404,
      ok: false,
      json: async () => ({}),
    });

    const RootLayout = require("@/app/_layout")
      .default as typeof import("@/app/_layout").default;

    render(<RootLayout />);

    await act(async () => {
      await flushPromises();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/complete-profile");
    });
  });
});
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../src/modules/auth/application/AuthContext";
import { getCurrentUser, login, logout, register } from "../src/modules/auth/infrastructure/authApi";

vi.mock("../src/modules/auth/infrastructure/authApi", () => ({ getCurrentUser: vi.fn(), login: vi.fn(), logout: vi.fn(), register: vi.fn() }));

function Consumer() {
  const auth = useAuth();
  return <div><span>{auth.loading ? "cargando" : auth.user?.firstName || "anónimo"}</span><button type="button" onClick={() => auth.login({ email: "a" })}>login</button><button type="button" onClick={() => auth.register({ email: "b" })}>registro</button><button type="button" onClick={auth.logout}>logout</button></div>;
}

describe("contexto de autenticación", () => {
  it("recupera sesión e implementa login, registro y logout", async () => {
    getCurrentUser.mockResolvedValue({ firstName: "Inicial" });
    login.mockResolvedValue({ user: { firstName: "Ana" } });
    register.mockResolvedValue({ user: { firstName: "Eva" } });
    logout.mockResolvedValue(null);
    render(<AuthProvider><Consumer /></AuthProvider>);
    expect(await screen.findByText("Inicial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "login" }));
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "registro" }));
    expect(await screen.findByText("Eva")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(screen.getByText("anónimo")).toBeInTheDocument());
  });
});

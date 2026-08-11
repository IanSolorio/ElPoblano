import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const paymentMocks = vi.hoisted(() => ({
  init: vi.fn(),
  process: vi.fn(),
  brickProps: null,
}));

vi.mock("@mercadopago/sdk-react", () => ({
  initMercadoPago: paymentMocks.init,
  Payment: (props) => {
    paymentMocks.brickProps = props;
    return <div aria-label="Brick de pago simulado" />;
  },
}));

vi.mock("../src/modules/orders/infrastructure/orderApi", () => ({
  processMercadoPagoPayment: paymentMocks.process,
}));

const callbacks = () => ({
  onApproved: vi.fn(),
  onRejected: vi.fn(),
  onStatus: vi.fn(),
  onError: vi.fn(),
});

const order = { id: "order-1", total: 10 };
const account = { email: "cliente@example.com", firstName: "Ana", lastName: "Pérez" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  paymentMocks.brickProps = null;
});

describe("pago mediante Mercado Pago", () => {
  it("UT-FE-22: procesa el modo E2E, configuración faltante y respuestas del Brick", async () => {
    vi.stubEnv("VITE_E2E_PAYMENT_STUB", "true");
    vi.stubEnv("VITE_MERCADO_PAGO_PUBLIC_KEY", "");
    vi.resetModules();
    let Component = (await import("../src/modules/payments/components/MercadoPagoPayment.jsx")).default;
    const stubCallbacks = callbacks();
    const user = userEvent.setup();

    paymentMocks.process.mockResolvedValueOnce({ payment: { status: "APPROVED" } });
    render(<Component order={order} user={account} {...stubCallbacks} />);
    await user.click(screen.getByRole("button", { name: "Aprobar pago de prueba" }));
    await waitFor(() => expect(stubCallbacks.onApproved).toHaveBeenCalledOnce());

    paymentMocks.process.mockResolvedValueOnce({ payment: { status: "REJECTED" } });
    await user.click(screen.getByRole("button", { name: "Rechazar pago de prueba" }));
    await waitFor(() => expect(stubCallbacks.onRejected).toHaveBeenCalledOnce());

    paymentMocks.process.mockRejectedValueOnce(new Error("Proveedor no disponible"));
    await user.click(screen.getByRole("button", { name: "Aprobar pago de prueba" }));
    await waitFor(() => expect(stubCallbacks.onError).toHaveBeenCalledWith("Proveedor no disponible"));
    cleanup();

    vi.stubEnv("VITE_E2E_PAYMENT_STUB", "false");
    vi.resetModules();
    Component = (await import("../src/modules/payments/components/MercadoPagoPayment.jsx")).default;
    render(<Component order={order} user={account} {...callbacks()} />);
    expect(screen.getByText(/Mercado Pago no está configurado/)).toBeInTheDocument();
    cleanup();

    vi.stubEnv("VITE_MERCADO_PAGO_PUBLIC_KEY", "TEST-public-key");
    vi.resetModules();
    Component = (await import("../src/modules/payments/components/MercadoPagoPayment.jsx")).default;
    const brickCallbacks = callbacks();
    render(<Component order={order} user={account} {...brickCallbacks} />);
    expect(paymentMocks.init).toHaveBeenCalledWith("TEST-public-key", { locale: "es-PE" });

    paymentMocks.process.mockResolvedValueOnce({ payment: { status: "APPROVED" } });
    await act(async () => paymentMocks.brickProps.onSubmit({ formData: { token: "card-token" } }));
    expect(brickCallbacks.onApproved).toHaveBeenCalledOnce();

    paymentMocks.process.mockResolvedValueOnce({ payment: { status: "PENDING" } });
    await expect(act(async () => paymentMocks.brickProps.onSubmit({ formData: { token: "pending-token" } }))).rejects.toThrow("El pago está siendo procesado");

    act(() => paymentMocks.brickProps.onError({ message: "Brick no disponible" }));
    expect(brickCallbacks.onError).toHaveBeenCalledWith("Brick no disponible");
  });
});

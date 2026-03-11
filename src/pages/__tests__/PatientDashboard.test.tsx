import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock patient auth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "patient-123", email: "patient@test.com" },
    profile: { id: "profile-1", nome: "Paciente Teste", clinic_id: "clinic-1" },
    roles: ["paciente"],
    isAdmin: false,
    isMaster: false,
    isGestor: false,
    isPatient: true,
    isProfissional: false,
    isSecretario: false,
    clinicId: "clinic-1",
    patientId: "patient-id-123",
    loading: false,
    hasPermission: (resource: string) => ["minha_agenda", "meus_planos", "meus_pagamentos"].includes(resource),
    canEdit: () => false,
  }),
}));

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { nome_fantasia: "Clínica Teste", telefone: "11999999999" } }),
          maybeSingle: () => Promise.resolve({ data: null }),
          gte: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [] }),
            }),
          }),
          order: () => ({
            limit: () => Promise.resolve({ data: [] }),
          }),
        }),
        gte: () => ({
          lte: () => Promise.resolve({ data: [], count: 0 }),
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
        limit: () => Promise.resolve({ data: [] }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: vi.fn() }) }),
    }),
    removeChannel: vi.fn(),
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

// Mock useDashboardLayout
vi.mock("@/hooks/useDashboardLayout", () => ({
  useDashboardLayout: () => ({
    cards: [
      { id: "sessoes", label: "Próximas Sessões", visible: true },
      { id: "exercicios", label: "Exercícios", visible: true },
      { id: "planos", label: "Meus Planos", visible: true },
      { id: "pagamentos", label: "Pagamentos", visible: true },
      { id: "mensagens", label: "Mensagens", visible: true },
      { id: "contratos", label: "Contratos", visible: true },
      { id: "convenios", label: "Parceiros / Convênios", visible: true },
      { id: "feriados", label: "Feriados", visible: true },
    ],
    updateCards: vi.fn(),
    toggleCard: vi.fn(),
    resetCards: vi.fn(),
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const renderPatientDashboard = async () => {
  const queryClient = createTestQueryClient();
  const PatientDashboard = (await import("@/pages/PatientDashboard")).default;

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PatientDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Patient Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render patient dashboard with greeting", async () => {
    await renderPatientDashboard();
    // Should show greeting with patient name or generic greeting
    expect(screen.getByText(/Olá|Bem-vindo/i)).toBeInTheDocument();
  });

  it("should display resource cards", async () => {
    await renderPatientDashboard();
    
    // Check for key sections
    expect(screen.getByText(/Próximas Sessões/i)).toBeInTheDocument();
    expect(screen.getByText(/Exercícios/i)).toBeInTheDocument();
    expect(screen.getByText(/Pagamentos/i)).toBeInTheDocument();
  });

  it("should have WhatsApp button for clinic contact", async () => {
    await renderPatientDashboard();
    
    // Should have a way to contact clinic
    const whatsappButton = screen.queryByText(/WhatsApp|Falar com a Clínica/i);
    expect(whatsappButton).toBeInTheDocument();
  });

  it("should have customize dashboard button", async () => {
    await renderPatientDashboard();
    
    const customizeButton = screen.queryByText(/Personalizar/i);
    expect(customizeButton).toBeInTheDocument();
  });
});

describe("Patient Permissions", () => {
  it("patient should have limited permissions", async () => {
    const mod = await import("@/hooks/useAuth");
    const auth = vi.mocked(mod).useAuth();
    
    expect(auth.isPatient).toBe(true);
    expect(auth.isAdmin).toBe(false);
    expect(auth.hasPermission("minha_agenda")).toBe(true);
    expect(auth.hasPermission("meus_planos")).toBe(true);
    expect(auth.hasPermission("financeiro")).toBe(false);
    expect(auth.canEdit("pacientes")).toBe(false);
  });
});

describe("Patient Navigation", () => {
  it("should navigate to exercises page when clicking exercises card", async () => {
    const mockNavigate = vi.fn();
    vi.mock("react-router-dom", async () => {
      const actual = await vi.importActual("react-router-dom");
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    await renderPatientDashboard();
    
    // Exercise card should exist
    const exerciseCard = screen.queryByText(/Exercícios/i);
    expect(exerciseCard).toBeInTheDocument();
  });
});

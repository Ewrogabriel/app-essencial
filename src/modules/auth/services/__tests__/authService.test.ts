import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "../authService";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => {
    return {
        supabase: {
            from: (...args: any[]) => mockFrom(...args),
            auth: {
                signOut: vi.fn(),
            },
        }
    };
});

describe("AuthService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle, maybeSingle: mockMaybeSingle });
    });

    describe("getProfile", () => {
        it("should return profile data when successful", async () => {
            const mockProfile = { id: "1", nome: "Test User" };
            mockSingle.mockResolvedValue({ data: mockProfile, error: null });

            const result = await authService.getProfile("user-123");
            expect(result).toEqual(mockProfile);
            expect(mockFrom).toHaveBeenCalledWith("profiles");
        });

        it("should return null and handle error on failure", async () => {
            mockSingle.mockResolvedValue({ data: null, error: { message: "Error" } });

            const result = await authService.getProfile("user-123");
            expect(result).toBeNull();
        });
    });

    describe("getRoles", () => {
        it("should return an array of roles", async () => {
            const mockRoles = [{ role: "admin" }, { role: "profissional" }];
            mockEq.mockResolvedValue({ data: mockRoles, error: null });

            const result = await authService.getRoles("user-123");
            expect(result).toEqual(["admin", "profissional"]);
            expect(mockFrom).toHaveBeenCalledWith("user_roles");
        });
    });
});

import { toast } from "sonner";

export class AppError extends Error {
    constructor(
        public message: string,
        public code?: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = "AppError";
    }
}

/** Type guard that safely checks whether an unknown value carries a `code` string property. */
function isErrorWithCode(value: unknown): value is { code: string } {
    return (
        typeof value === "object" &&
        value !== null &&
        "code" in value &&
        typeof (value as Record<string, unknown>).code === "string"
    );
}

export const handleError = (error: unknown, customMessage?: string) => {
    console.error("App Error:", error);

    let message = customMessage || "Ocorreu um erro inesperado.";

    if (error instanceof AppError) {
        message = error.message;
    } else if (error instanceof Error) {
        message = error.message;
    }

    const code = isErrorWithCode(error) ? error.code : undefined;

    toast.error(message, {
        description: code ? `Código: ${code}` : undefined,
    });

    return new AppError(message, code, error);
};

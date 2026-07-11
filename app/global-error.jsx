"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#142D65] text-[#F2EFE9] p-4 text-center">
          <div>
            <h1 className="text-lg font-bold mb-2">Algo deu errado.</h1>
            <button
              onClick={() => reset()}
              className="bg-[#C6FE1F] text-[#A02018] font-bold uppercase text-xs tracking-wide px-4 py-2 mt-2"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

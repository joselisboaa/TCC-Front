"use client";

import { SnackbarProvider, enqueueSnackbar } from "notistack";
import React, { ReactNode } from "react";

export function NotistackProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      {children}
    </SnackbarProvider>
  );
}

export const useSnackbar = () => enqueueSnackbar;

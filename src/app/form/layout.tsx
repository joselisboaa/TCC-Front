"use client";

import { ReactNode } from "react";
import NavbarCommonUser from "@/components/NavbarCommonUser";
import { CssBaseline, Container } from "@mui/material";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <CssBaseline />
      <NavbarCommonUser />
      <Container sx={{ marginTop: 4 }}>
        {children}
      </Container>
    </>
  );
}

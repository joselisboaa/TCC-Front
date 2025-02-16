"use client";

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { CssBaseline, Container } from "@mui/material";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <CssBaseline />
      <Navbar />
      <Container sx={{ marginTop: 4 }}>
        {children}
      </Container>
    </>
  );
}

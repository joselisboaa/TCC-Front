"use client";

import { Box, Typography } from "@mui/material";

export default function SemCadastroPage() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
      padding={2}
    >
      <Typography variant="h4" gutterBottom sx={{ color: "#7E57C2", fontWeight: "bold" }}>
        Cadastro Não Encontrado
      </Typography>
      
      <Typography variant="body1" sx={{ maxWidth: 500, fontWeight: "bold", mb: 1 }}>
        Você ainda não possui cadastro no sistema.
      </Typography>
      
      <Typography variant="body1" sx={{ maxWidth: 500 }}>
        Por favor, entre em contato com os administradores para solicitar seu acesso.
      </Typography>
    </Box>
  );
}

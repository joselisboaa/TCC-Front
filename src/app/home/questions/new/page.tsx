/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Autocomplete, CircularProgress, Typography, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

export interface UserGroup {
  id: number;
  text: string;
}

export default function QuestionForm({ questionId }: any) {
  const [text, setText] = useState("");
  const [userGroup, setUserGroup] = useState<UserGroup | null>(null);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { data: userGroups, isLoading: loadingGroups } = useQuery<UserGroup[]>(
    "userGroups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", {
        method: "GET"
      });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar grupos de usuários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const saveQuestionMutation = useMutation(
    async () => {
      await fetchRequest("/questions", {
        method: "POST",
        body: { text, user_group_id: userGroup?.id },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Questão salva com sucesso!", { variant: "success" });
        router.push("/home/questions");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao salvar questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const handleSubmit = () => {
    if (!text.trim() || !userGroup) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }
    saveQuestionMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/home/questions");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        height: "fit",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          {questionId ? "Editar Questão" : "Criar Nova Questão"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os detalhes da questão abaixo.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Texto da questão"
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
            variant="outlined"
          />

          <Autocomplete
            value={userGroup}
            onChange={(event, newValue) => setUserGroup(newValue)}
            options={userGroups || []}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={loadingGroups}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecionar Grupo de Usuários"
                fullWidth
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingGroups ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#D32F2F",
                color: "#FFF",
                fontWeight: "bold",
                width: "11rem",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { backgroundColor: "#B71C1C" },
              }}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #7E57C2, #5E3BEE)",
                color: "#FFF",
                fontWeight: "bold",
                width: "11rem",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" },
              }}
              onClick={handleSubmit}
              disabled={saveQuestionMutation.isLoading}
            >
              {saveQuestionMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

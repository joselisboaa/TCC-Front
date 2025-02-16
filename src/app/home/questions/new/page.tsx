/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Autocomplete, CircularProgress, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface UserGroup {
  id: number;
  text: string;
}

interface QuestionFormProps {
  questionId?: string;
}

export default function QuestionForm({ questionId }: QuestionFormProps) {
  const [text, setText] = useState("");
  const [userGroup, setUserGroup] = useState<UserGroup | null>(null);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const token = Cookies.get("jwt") as string;

  const { data: userGroups, isLoading: loadingGroups } = useQuery<UserGroup[]>(
    "userGroups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        {questionId ? "Editar Questão" : "Criar Nova Questão"}
      </Typography>

      <TextField
        label="Texto da questão"
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{ marginBottom: 2 }}
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

      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={saveQuestionMutation.isLoading}
        >
          {saveQuestionMutation.isLoading ? <CircularProgress size={24} /> : "Salvar"}
        </Button>
      </Box>
    </Box>
  );
}

/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface UserGroup {
  id: number;
  text: string;
}

export default function EditQuestion() {
  const [text, setText] = useState("");
  const [userGroup, setUserGroup] = useState<UserGroup | null>(null);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams(); 

  // Fetch question data
  const { data: questionData, isLoading: isFetchingQuestion } = useQuery(
    ["question", id],
    async () => {
      const response = await fetchRequest<null, { text: string; user_group_id: number }>(
        `/questions/${id}`,
        {
          method: "GET",
        }
      );
      return response.body;
    },
    {
      enabled: !!id,
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar a questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/questions");
      },
    }
  );

  const { data: userGroups, isLoading: isFetchingUserGroups } = useQuery(
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

  const updateMutation = useMutation(
    async () => {
      await fetchRequest(`/questions/${id}`, {
        method: "PUT",
        body: { text, user_group_id: userGroup?.id },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Questão atualizada com sucesso!", { variant: "success" });
        router.push("/home/questions");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao atualizar questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  useEffect(() => {
    if (questionData) {
      setText(questionData.text);
      const selectedGroup = userGroups?.find((group) => group.id === questionData.user_group_id);
      setUserGroup(selectedGroup || null);
    }
  }, [questionData, userGroups]);

  const handleSubmit = () => {
    if (!text.trim() || !userGroup) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }
    updateMutation.mutate();
  };

  if (isFetchingQuestion || isFetchingUserGroups) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Editar Questão
      </Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Texto da questão"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
        />
        <Autocomplete
          value={userGroup}
          onChange={(event, newValue) => setUserGroup(newValue)}
          options={userGroups || []}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Selecionar Grupo de Usuários"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetchingUserGroups ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={updateMutation.isLoading}
        >
          {updateMutation.isLoading ? <CircularProgress size={20} /> : "Salvar"}
        </Button>
      </Box>
    </Box>
  );
}

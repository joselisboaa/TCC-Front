/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface Answer {
  id: number;
  text: string;
}

export default function EditOrientation() {
  const [text, setText] = useState("");
  const [value, setValue] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  // Fetch orientation data
  const { data: orientationData, isLoading: isFetchingOrientation } = useQuery(
    ["orientation", id],
    async () => {
      const response = await fetchRequest<null, { text: string; value: number; answer_id: number }>(
        `/orientations/${id}`,
        {
          method: "GET"
        }
      );
      return response.body;
    },
    {
      enabled: !!id,
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/orientations");
      },
    }
  );

  // Fetch answers for selection
  const { data: answers, isLoading: isFetchingAnswers } = useQuery(
    "answers",
    async () => {
      const response = await fetchRequest<null, Answer[]>("/answers", {
        method: "GET"
      });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar respostas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const updateMutation = useMutation(
    async () => {
      await fetchRequest(`/orientations/${id}`, {
        method: "PUT",
        body: { text, value, answer_id: selectedAnswer?.id }
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Orientação atualizada com sucesso!", { variant: "success" });
        router.push("/home/orientations");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao atualizar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  useEffect(() => {
    if (orientationData) {
      setText(orientationData.text);
      setValue(orientationData.value);
      const associatedAnswer = answers?.find((a) => a.id === orientationData.answer_id);
      setSelectedAnswer(associatedAnswer || null);
    }
  }, [orientationData, answers]);

  const handleSubmit = () => {
    if (!text.trim() || value === null || !selectedAnswer) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }
    updateMutation.mutate();
  };

  if (isFetchingOrientation || isFetchingAnswers) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Editar Orientação
      </Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Texto da Orientação"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
        />
        <TextField
          label="Valor"
          type="number"
          value={value || ""}
          onChange={(e) => setValue(Number(e.target.value) || null)}
          fullWidth
        />
        <Autocomplete
          value={selectedAnswer}
          onChange={(event, newValue) => setSelectedAnswer(newValue)}
          options={answers || []}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Selecionar Resposta"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetchingAnswers ? <CircularProgress size={20} /> : null}
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

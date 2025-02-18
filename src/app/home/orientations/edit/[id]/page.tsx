/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

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

  const handleCancel = () => {
    router.push("/home/orientations");
  };

  if (isFetchingOrientation || isFetchingAnswers) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
          Editar Orientação
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os detalhes da orientação abaixo.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Texto da Orientação"
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
            variant="outlined"
          />

          <TextField
            label="Peso da Orientação"
            type="number"
            fullWidth
            value={value || ""}
            onChange={(e) => setValue(Number(e.target.value) || null)}
            variant="outlined"
          />

          <Autocomplete
            value={selectedAnswer}
            onChange={(event, newValue) => setSelectedAnswer(newValue)}
            options={answers || []}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={isFetchingAnswers}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecionar Resposta"
                fullWidth
                required
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
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

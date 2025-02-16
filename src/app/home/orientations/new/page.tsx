/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface Answer {
  id: number;
  text: string;
}

export default function CreateOrientation() {
  const [text, setText] = useState("");
  const [value, setValue] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const token = Cookies.get("jwt") as string;

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

  const handleSubmit = async () => {
    if (!text.trim() || value === null || !selectedAnswer) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      await fetchRequest("/orientations", {
        method: "POST",
        body: { text, value, answer_id: selectedAnswer.id },
      });

      enqueueSnackbar("Orientação criada com sucesso!", { variant: "success" });
      router.push("/home/orientations");
    } catch (error) {
      enqueueSnackbar(
        `Erro ao criar orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Criar Orientação
      </Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Texto da Orientação"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
        />
        <TextField
          label="Peso da Orientação"
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
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Salvar"}
        </Button>
      </Box>
    </Box>
  );
}

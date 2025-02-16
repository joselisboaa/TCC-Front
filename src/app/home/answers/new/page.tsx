/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface Question {
  id: number;
  text: string;
}

export default function CreateAnswer() {
  const [text, setText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [other, setOther] = useState(false); // Campo "Outros"
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const token = Cookies.get("jwt") as string;

  // Fetch questions for selection
  const { data: questions, isLoading: isFetchingQuestions } = useQuery(
    "questions",
    async () => {
      const response = await fetchRequest<null, Question[]>("/questions", {
        method: "GET",
      });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar perguntas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const handleSubmit = async () => {
    if (!text.trim() || !selectedQuestion) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      await fetchRequest("/answers", {
        method: "POST",
        body: { text, question_id: selectedQuestion.id, other },
      });

      enqueueSnackbar("Resposta criada com sucesso!", { variant: "success" });
      router.push("/home/answers");
    } catch (error) {
      enqueueSnackbar(
        `Erro ao criar resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Criar Resposta
      </Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Texto da Resposta"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
        />
        <Autocomplete
          value={selectedQuestion}
          onChange={(event, newValue) => setSelectedQuestion(newValue)}
          options={questions || []}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Selecionar Pergunta"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetchingQuestions ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <FormControlLabel
          control={
            <Switch
              checked={other}
              onChange={(e) => setOther(e.target.checked)}
              color="primary"
            />
          }
          label="Outros"
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

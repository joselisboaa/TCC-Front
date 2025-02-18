/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

interface Question {
  id: number;
  text: string;
}

export default function CreateAnswer() {
  const [text, setText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [other, setOther] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

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

  const handleCancel = () => {
    router.push("/home/answers");
  };

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
          Criar Resposta
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os detalhes da resposta abaixo.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Texto da Resposta"
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
            variant="outlined"
          />

          <Autocomplete
            value={selectedQuestion}
            onChange={(event, newValue) => setSelectedQuestion(newValue)}
            options={questions || []}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={isFetchingQuestions}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecionar Pergunta"
                fullWidth
                required
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
            control={<Switch checked={other} onChange={(e) => setOther(e.target.checked)} color="primary" />}
            label="Outros"
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
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

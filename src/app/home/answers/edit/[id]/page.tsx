/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

interface Question {
  id: number;
  text: string;
}

export default function EditAnswer() {
  const [text, setText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [other, setOther] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const { data: answerData, isLoading: isFetchingAnswer } = useQuery(
    ["answer", id],
    async () => {
      const response = await fetchRequest<null, { text: string; question_id: number; other: boolean }>(
        `/answers/${id}`,
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
          `Erro ao carregar a resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/answers");
      },
    }
  );

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

  const updateMutation = useMutation(
    async () => {
      await fetchRequest(`/answers/${id}`, {
        method: "PUT",
        body: { text, question_id: selectedQuestion?.id, other },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Resposta atualizada com sucesso!", { variant: "success" });
        router.push("/home/answers");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao atualizar a resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  useEffect(() => {
    if (answerData) {
      setText(answerData.text);
      setOther(answerData.other);
      const associatedQuestion = questions?.find((q) => q.id === answerData.question_id);
      setSelectedQuestion(associatedQuestion || null);
    }
  }, [answerData, questions]);

  const handleSubmit = () => {
    if (!text.trim() || !selectedQuestion) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }
    updateMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/home/answers");
  };

  if (isFetchingAnswer || isFetchingQuestions) {
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
          Editar Resposta
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os detalhes da resposta abaixo.
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
            label="Reposta com campo Outros"
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{ background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } }}
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

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface Question {
  id: number;
  text: string;
}

export default function EditAnswer() {
  const [text, setText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [other, setOther] = useState(false); // Novo campo "Outros"
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams(); 
  const token = Cookies.get("jwt") as string;

  // Fetch answer data
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
      setOther(answerData.other); // Preenche o valor inicial de "Outros"
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

  if (isFetchingAnswer || isFetchingQuestions) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Editar Resposta
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
          disabled={updateMutation.isLoading}
        >
          {updateMutation.isLoading ? <CircularProgress size={20} /> : "Salvar"}
        </Button>
      </Box>
    </Box>
  );
}

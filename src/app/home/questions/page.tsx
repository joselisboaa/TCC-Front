/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardActions, CardContent, Typography, CircularProgress, Box } from "@mui/material";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface Question {
  id: string;
  text: string;
}

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const token = Cookies.get("jwt") as string;

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const response = await fetchRequest<null, Question[]>("/questions", {
          method: "GET",
        });
        setQuestions(response.body);
      } catch (error) {
        enqueueSnackbar(
          `Erro ao carregar questões: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  async function handleDelete(id: string) {
    try {
      setLoading(true);
      await fetchRequest<null, null>(`/questions/${id}`, {
        method: "DELETE",
      });

      enqueueSnackbar("Questão removida com sucesso!", { variant: "success" });
      setQuestions((prev) => prev.filter((question) => question.id !== id));
    } catch (error) {
      enqueueSnackbar(
        `Erro ao excluir questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Questões
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/questions/new")}
        sx={{ marginBottom: 2 }}
      >
        Criar Nova Questão
      </Button>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        {questions.map((question) => (
          <Card key={question.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2 }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {question.text}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="success"
                onClick={() => router.push(`/home/questions/edit/${question.id}`)}
                sx={{ marginRight: 1 }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(question.id)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : "Excluir"}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

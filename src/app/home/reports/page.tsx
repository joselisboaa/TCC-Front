/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { Box, Button, Card, CardActions, CardContent, CircularProgress, Typography, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormControlLabel, RadioGroup, Radio } from "@mui/material";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import { useQuery } from "react-query";

interface Answer {
  id: number;
  text: string;
  other: boolean;
  question_id: number;
  question: {
    id: number;
    text: string;
    user_group_id: number;
  };
}

interface Orientation {
  id: number;
  text: string;
  value: number;
  answer_id: number;
  answer: Answer;
}

interface ResponseOrientation {
  response_id: number;
  orientation_id: number;
  orientation: Orientation;
}

interface UserGroup {
  text: string;
}

interface User {
  phone_number: string;
  email: string;
  name: string;
  user_groups: UserGroup[];
}

interface Response {
  id: number;
  timestamp: string;
  user_id: number;
  responseOrientations: ResponseOrientation[];
  user: User;
}

export default function Responses() {
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [reportHtml, setReportHtml] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();

  const { data: responses = [], isLoading } = useQuery<Response[]>({
    queryKey: ["responses"],
    queryFn: async () => {
      const response = await fetchRequest<null, Response[]>("/responses", { method: "GET" });
      return response.body;
    },
  });

  async function handleGenerateReport(id: number) {
    try {
      const response = await fetchRequest<null, string>(`/responses/${id}/report`, {
        method: "GET",
      });
      setReportHtml(response.body);
    } catch (error) {
      enqueueSnackbar(
        `Erro ao gerar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    }
  }

  function handleViewResponses(id: number) {
    const response = responses.find(res => res.id === id) || null;
    setSelectedResponse(response);
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Respostas
      </Typography>
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        {responses.map((response) => (
          <Card key={response.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2 }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                Resposta de {response.user.name ? response.user.name : "Anônimo"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Data de envio: {new Date(response.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Telefone: {response.user.phone_number}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email: {response.user.email}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grupos de Usuário: {response.user.user_groups.map(group => group.text).join(", ")}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleGenerateReport(response.id)}
                disabled={response.responseOrientations.length === 0}
              >
                Gerar Relatório
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleViewResponses(response.id)}
                disabled={response.responseOrientations.length === 0}
              >
                Ver Respostas
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      {reportHtml && (
        <Box sx={{ marginTop: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Relatório Gerado
          </Typography>
          <Box dangerouslySetInnerHTML={{ __html: reportHtml }} />
        </Box>
      )}
      <Dialog open={!!selectedResponse} onClose={() => setSelectedResponse(null)}>
        <DialogTitle sx={{ color: "#7E57C2" }}>Respostas do Usuário</DialogTitle>
        <DialogContent sx={{ width: "100%"}}>
          {selectedResponse?.responseOrientations?.length ? (
            selectedResponse.responseOrientations.map(({ orientation }) => (
              <Box key={orientation.id} sx={{ marginBottom: 2 }}>
                <Typography variant="h6">{orientation.answer.question.text}</Typography>
                <FormControl component="fieldset">
                  <RadioGroup value={orientation.answer.id}>
                    <FormControlLabel
                      value={orientation.answer.id}
                      control={<Radio sx={{ color: "#7E57C2" }} />}
                      label={orientation.answer.text}
                    />
                  </RadioGroup>
                </FormControl>
                <Typography variant="body2" color="textSecondary">
                  Valor: {orientation.value}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2">Nenhuma resposta disponível.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedResponse(null)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

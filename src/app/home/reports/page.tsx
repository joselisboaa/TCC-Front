/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Box, Button, Card, CardActions, CardContent, CircularProgress, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";

interface Orientation {
  id: number;
  text: string;
  value: number;
  answer_id: number;
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
  orientations: Orientation[];
  user: User;
}

export default function Responses() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    async function fetchResponses() {
      try {
        setLoading(true);
        const response = await fetchRequest<null, Response[]>("/responses", {
          method: "GET",
        });
        setResponses(response.body);
        console.log(response)
      } catch (error) {
        enqueueSnackbar(
          `Erro ao carregar respostas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    }
    fetchResponses();
  }, []);

  async function handleGenerateReport(id: number) {
    try {
      setLoading(true);
      const response = await fetchRequest<null, string>(`/responses/${id}/report`, {
        method: "GET",
      });
      setReportHtml(response.body);
    } catch (error) {
      enqueueSnackbar(
        `Erro ao gerar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Respostas
      </Typography>
      {loading && (
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
                Grupos de Usuário: {response.user.user_groups.map(group => group.text).join(', ')}
              </Typography>
              {response.orientations.length > 0 && (
                <Box sx={{ marginTop: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Orientações:
                  </Typography>
                  {response.orientations.map((orientation) => (
                    <Typography key={orientation.id} variant="body2" color="textSecondary">
                      - {orientation.text} (Valor: {orientation.value})
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleGenerateReport(response.id)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : "Gerar Relatório"}
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
    </Box>
  );
}
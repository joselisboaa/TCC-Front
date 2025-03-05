"use client";

import { useState } from "react";
import { Box, Button, Card, CardActions, CardContent, CircularProgress, Typography, Backdrop } from "@mui/material";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import { useQuery, useMutation } from "react-query";
import ReportDialog from "@/components/ReportDialog";

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

interface Question {
  text: string;
  answer: string;
}

interface reportOrientation {
  questions: Question[];
  value: number;
}

interface ReportData {
  id: number;
  timestamp: string;
  orientations: Record<string, reportOrientation>;
}

interface Response {
  id: number;
  timestamp: string;
  user_id: number;
  responseOrientations: ResponseOrientation[];
  user: User;
}

export default function Responses() {
  const [jsonData, setJsonData] = useState<ReportData | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const { data: responses = [], isLoading } = useQuery<Response[]>({
    queryKey: ["responses"],
    queryFn: async () => {
      const response = await fetchRequest<null, Response[]>("/responses", { method: "GET" });
      return response.body;
    },
  });

  const { mutate: handleGenerateReport, isLoading: isResponseLoading } = useMutation(
    async (id: number) => {
      setLoadingReportId(id);
      const response = await fetchRequest<null, ReportData>(`/responses/${id}/report`, {
        method: "GET",
      });
      return response.body;
    },
    {
      onSuccess: (data) => {
        setJsonData(data);
      },
      onError: (error) => {
        console.error(error);
        enqueueSnackbar(
          `Erro ao gerar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );  

  return (
    <Box sx={{ padding: 4 }}>
      <Backdrop open={isResponseLoading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" component="h1" gutterBottom>
        Relatórios dos Usuários
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
                color="secondary"
                onClick={() => handleGenerateReport(response.id)}
                disabled={response.responseOrientations.length === 0 || loadingReportId === response.id}
              >
                {loadingReportId === response.id ? <CircularProgress size={25} sx={{ color: "#FFF", marginInline: "4.5rem" }} /> : "Visualizar Relatório"}              
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <ReportDialog open={jsonData !== null} jsonData={jsonData} onClose={() => {
        setJsonData(null);
        setLoadingReportId(null); 
      }} />
    </Box>
  );
}

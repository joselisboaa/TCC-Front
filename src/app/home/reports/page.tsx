"use client";

import { useState } from "react";
import { Box, Button, Card, CardActions, CardContent, CircularProgress, Typography, Backdrop } from "@mui/material";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import { useQuery, useMutation } from "react-query";
import ReportDialog from "@/components/ReportDialog";
import AverageDialog from "@/components/ResponsesAverageDialog";

interface UserGroup {
  id?: number;
  text: string;
  description?: string;
}

interface Question {
  id: number;
  text: string;
  user_group_id: number;
  last_change: string;
  user_group?: UserGroup;
}

interface Answer {
  id: number;
  text: string;
  value: number;
  last_change: string;
  other: boolean;
  questions: Question[];
}

interface AnsweredQuestion {
  question: Question;
  answer: Answer;
}

interface User {
  phone_number: string;
  email: string;
  name: string;
  user_groups: UserGroup[];
}

interface DetailedResponse {
  id: number;
  user_id: number;
  timestamp: string;
  user: User;
  answeredQuestions: AnsweredQuestion[];
}

interface Response {
  id: number;
  timestamp: string;
  user_id: number;
  user: User;
}

interface Orientation {
  id: number;
  text: string;
  threshold: number;
  question_id: number;
  question: Question;
}

interface AverageResponses {
  id: number;
  text: string;
  average: number;
  total: number;
  threshold: string;
}

export default function Responses() {
  const [jsonData, setJsonData] = useState<DetailedResponse | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);
  const [averageOpen, setAverageOpen] = useState(false);
  const [averageResponses, setAverageResponses] = useState<AverageResponses[]>([]);
  const [orientations, setOrientations] = useState<Orientation[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const { data: responses = [], isLoading } = useQuery<Response[]>({
    queryKey: ["responses"],
    queryFn: async () => {
      const response = await fetchRequest<null, Response[]>("/responses", { method: "GET" });
      return response.body;
    },
  });

  const { mutate: handleGenerateAverageReport, isLoading: isLoadingAverageResponses } = useMutation(
    async () => {
      const response = await fetchRequest<null, AverageResponses[]>("/responses/average", { method: "GET" });
      return response.body;
    },
    {
      onSuccess: (data) => {
        setAverageResponses(data);
        setAverageOpen(true);
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao gerar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  )

  const { mutate: handleFetchOrientations, isLoading: isOrientationsLoading } = useMutation(
    async () => {
      const response = await fetchRequest<null, Orientation[]>(`/orientations`, {
        method: "GET",
      });

      return response.body;
    },
    {
      onSuccess: (data) => {
        setOrientations(data);
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao gerar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );  

  const { mutate: handleGenerateReport, isLoading: isResponseLoading } = useMutation(
    async (id: number) => {
      setLoadingReportId(id);
      const response = await fetchRequest<null, DetailedResponse>(`/responses/${id}/report`, {
        method: "GET",
      });

      return response.body;
    },
    {
      onSuccess: (data) => {
        setJsonData(data);
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao gerar relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );  
  

  return (
    <Box sx={{ padding: { xs: 2, sm: 4 } }}>
      <Backdrop open={isLoading || isResponseLoading || isLoadingAverageResponses || isOrientationsLoading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        fontSize: { xs: '1.5rem', sm: '2rem' }
      }}>
        Relatórios dos Usuários
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            handleGenerateAverageReport();
            handleFetchOrientations();
          }}
          disabled={isLoadingAverageResponses}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          {isLoadingAverageResponses ? <CircularProgress size={20} /> : "Ver Relatório Geral"}
        </Button>
      </Box>
      <Box sx={{ display: "grid", gap: 2 }}>
        {responses.map((response) => (
          <Card key={response.id} variant="outlined" sx={{ 
            display: "flex", 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: "space-between", 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            padding: { xs: 1, sm: 2 }
          }}>
            <CardContent sx={{ 
              flex: 1,
              padding: { xs: 1, sm: 2 },
              '&:last-child': { paddingBottom: { xs: 1, sm: 2 } }
            }}>
              <Typography variant="h6" component="div" sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
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
            <CardActions sx={{ 
              padding: { xs: 1, sm: 2 },
              justifyContent: { xs: 'stretch', sm: 'flex-end' }
            }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  handleGenerateReport(response.id);
                }}
                disabled={loadingReportId === response.id}
                sx={{ 
                  width: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {loadingReportId === response.id ? (
                  <CircularProgress size={25} sx={{ color: "#FFF" }} />
                ) : (
                  "Visualizar Relatório"
                )}              
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <ReportDialog open={jsonData !== null} jsonData={jsonData} onClose={() => {
        setJsonData(null);
        setLoadingReportId(null); 
      }}/>
      <AverageDialog 
        open={averageOpen}
        orientations={orientations}
        onClose={() => {
          setAverageOpen(false);
        }}
        data={averageResponses}
      />
    </Box>
  );
}

"use client";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  CircularProgress,
  Typography,
  FormControl,
  Container,
  Paper,
  Box,
  FormHelperText,
  Backdrop,
} from "@mui/material";
import fetchRequest from "@/utils/fetchRequest";
import { useQuery, useMutation } from "react-query";
import Cookies from "js-cookie";
import { jwtVerify } from "jose";
import { useSnackbar } from "notistack";
import { useState } from "react";
import ReportDialog from "@/components/ReportDialog";
import { useRouter } from "next/navigation";


interface Answer {
  id: number;
  text: string;
  value: number;
  other: boolean;
  questions: Question[];
  last_change: string;
}

interface Question {
  id: number;
  text: string;
  user_group_id: number;
  answers: Answer[];
  last_change: string;
}

interface FormValues {
  answers: {
    question_id: number;
    answer_id: number;
    other_text?: string | null;
  }[];
}

interface User {
  id: number;
  phone_number: string;
  email: string;
  name: string;
  password: string;
  user_groups: { id: number; text: string; description: string }[];
}

interface Response {
  id: number;
  user_id: number;
  user: User;
  responseOrientations: [];
  timestamp: string;
}

interface AnsweredQuestion {
  question: Question;
  answer: Answer;
}

interface DetailedResponse {
  id: number;
  user_id: number;
  timestamp: string;
  user: User;
  answeredQuestions: AnsweredQuestion[];
}

const responseSchema = yup.object().shape({
  answers: yup
    .array()
    .of(
      yup.object().shape({
        question_id: yup.number().required("ID da pergunta é obrigatório"),
        answer_id: yup.number().required("ID da resposta é obrigatória"),
        other_text: yup.string().nullable(),
      })
    )
    .required("Pelo menos uma resposta é obrigatória"),
});

async function getUserIdFromToken(): Promise<number | null> {
  const token = Cookies.get("jwt");
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const user = payload.user as User;
    return user.id;
  } catch (error) {
    console.error("Erro ao validar JWT:", error);
    throw new Error("Falha ao validar o token JWT");
  }
}

function useUserId() {
  return useQuery<number | null, Error>("userId", getUserIdFromToken, {
    retry: false,
    staleTime: Infinity,
  });
}

export default function QuestionForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<DetailedResponse | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);
  const router = useRouter();


  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: yupResolver(responseSchema),
    defaultValues: {
      answers: [],
    },
  });

  const { data: userId, isLoading: isUserIdLoading, error: userIdError } = useUserId();

  const { data: formData, isLoading: isFormDataLoading, error: formDataError } = useQuery<Question[], Error>(
    ["formData", userId],
    async () => {
      if (!userId) throw new Error("ID do usuário não fornecido");
      const res = await fetchRequest<any, { body: Question[] }>(`/users/${userId}/form`);
      if (!Array.isArray(res.body)) throw new Error("Dados do formulário inválidos");

    const uniqueQuestions = res.body
    .filter((question) => Array.isArray(question.answers) && question.answers.length > 0)
    .reduce((acc: Question[], current: Question) => {
      const exists = acc.find(q => q.id === current.id);
      return exists ? acc : [...acc, current];
    }, []);

      return uniqueQuestions;
    },
    {
      enabled: !!userId,
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao carregar formulário: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );


  const { data: userResponses } = useQuery<Response[]>(["responses", userId],
    async () => {
      if (!userId) return null;
      const res = await fetchRequest<Response, any>(`/responses?user-id=${userId}`);
      return res.body;
    }, {
      enabled: !!userId
    }
  );

  const handleClear = () => {
    reset({ answers: [] });
  };

  const { isLoading: isSubmittingForm, mutate: submitMutation } = useMutation(
    async (data: FormValues) => {
      if (!userId) throw new Error("ID do usuário não encontrado");

      const requestBody = {
        user_id: userId,
        questions: data.answers.map((answer) => ({
          question_id: answer.question_id,
          answer_id: answer.answer_id,
        })),
      };

      await fetchRequest("/responses", {
        method: "POST",
        body: requestBody,
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Respostas enviadas com sucesso!", { variant: "success" });
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao enviar respostas: ${error instanceof Error ? error.message : "Erro desconhecido"}`, {
          variant: "error",
        });
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

  const onSubmit = (data: FormValues) => {
    const unansweredQuestions = formData?.filter(
      (question) => !data.answers.find((a) => a.question_id === question.id)
    );
  
    if (unansweredQuestions && unansweredQuestions.length > 0) {
      const msg = "Você deve responder todas as perguntas antes de enviar.";
      setFormErrorMessage(msg);
      enqueueSnackbar(msg, { variant: "warning" });
      return;
    }
  
    setFormErrorMessage(null);
    submitMutation(data);
  };  
  

  if (!userResponses || isUserIdLoading || isFormDataLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 250 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (userIdError) {
    return <Typography color="error">Erro ao validar o token: {userIdError.message}</Typography>;
  }

  if (formDataError) {
    return <Typography color="error">Erro ao carregar o formulário: {formDataError.message}</Typography>;
  }

  if (!formData || formData.length === 0) {
    return <Typography color="error">Nenhum dado encontrado.</Typography>;
  }

  if (userResponses && userResponses.length > 0) {
    const lastResponseTimestamp = new Date(userResponses[userResponses.length - 1].timestamp);

    const hasChanges = formData.some(question => {
      return (
        new Date(question.last_change).getTime() > lastResponseTimestamp.getTime() ||
        question.answers.some(answer => new Date(answer.last_change).getTime() > lastResponseTimestamp.getTime())
      );
    });

    if (!hasChanges) {
      return (
        <Container maxWidth="sm" className="flex items-center justify-center h-fit">
          <Paper elevation={3} className="p-6 w-full text-center">
            <Typography color="secondary" variant="h6">
              Você já respondeu este formulário.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  handleGenerateReport(userResponses[userResponses.length - 1].id);
                }}
                disabled={loadingReportId === userResponses[userResponses.length - 1].id}
              >
                {loadingReportId === userResponses[userResponses.length - 1].id ? <CircularProgress size={25} sx={{ color: "#FFF", marginInline: "4.5rem" }} /> : "Visualizar Resposta"}              
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push(`/form/edit/${userResponses[userResponses.length - 1].id}`)}
                disabled={loadingReportId === userResponses[userResponses.length - 1].id}
              >
                {loadingReportId === userResponses[userResponses.length - 1].id ? <CircularProgress size={25} sx={{ color: "#FFF", marginInline: "4.5rem" }} /> : "Editar Resposta"}              
              </Button>
            </Box>
          </Paper>
          <ReportDialog open={jsonData !== null} jsonData={jsonData} onClose={() => {
            setJsonData(null);
            setLoadingReportId(null); 
          }}/>
        </Container>
      );
    }
  }

  return (
    <Container maxWidth="sm" className="flex items-center justify-center h-fit">
      <Backdrop open={isSubmittingForm} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Paper elevation={3} className="p-6 w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box role="alert" aria-live="assertive" sx={{ position: "absolute", left: "-9999px" }}>
          {formErrorMessage && <Typography>{formErrorMessage}</Typography>}
        </Box>
          <Typography id="form-title" variant="h5" className="mb-5" gutterBottom align="center">
            Questionário
          </Typography>
          {formData.map((question, questionIndex) => (
            <div key={question.id} className="mb-4">
              <Typography variant="h6" gutterBottom>
                {question.text}
              </Typography>
              <FormControl component="fieldset" error={!!errors.answers?.[questionIndex]?.answer_id}>
                <Controller
                  name={`answers`}
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value.find((a) => a.question_id === question.id)?.answer_id || ""}
                      onChange={(e) => {
                        const selectedAnswerId = Number(e.target.value);
                        const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId);

                        field.onChange([
                          ...field.value.filter((a) => a.question_id !== question.id),
                          {
                            question_id: question.id,
                            answer_id: selectedAnswerId,
                            other_text: selectedAnswer?.other ? "" : undefined,
                          },
                        ]);
                      }}
                    >
                      {question.answers.map((answer) => (
                        <div key={answer.id}>
                          <FormControlLabel
                            value={answer.id}
                            control={<Radio sx={{ color: "#7E57C2" }} />}
                            label={answer.text}
                          />
                          {answer.other &&
                            watch("answers").find((a) => a.question_id === question.id)?.answer_id === answer.id && (
                              <Controller
                                name={`answers.${question.id}.other_text`}
                                control={control}
                                render={({ field: otherField }) => (
                                  <TextField
                                    {...otherField}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="Digite sua resposta"
                                    sx={{ mt: 1 }}
                                  />
                                )}
                              />
                            )}
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.answers && (
                  <FormHelperText sx={{ fontSize: 14 }} error>
                    {errors.answers?.message}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
          ))}
          <div className="my-2 mt-16">
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #7E57C2, #5E3BEE)",
                color: "#FFF",
                fontWeight: "bold",
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" },
              }}
              type="submit"
              disabled={isSubmittingForm}
            >
              {isSubmittingForm ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
            <Button
              variant="contained"
              sx={{
                background: "red",
                mt: 2,
                color: "#FFFFFF",
                fontWeight: "bold",
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
              }}
              onClick={handleClear}
            >
              Limpar
            </Button>
          </div>
        </form>
      </Paper>
    </Container>
  );
}

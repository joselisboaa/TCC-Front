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
        <CircularProgress aria-label="Carregando o questionário" />
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
                {loadingReportId === userResponses[userResponses.length - 1].id ? <CircularProgress aria-label="Carregando a visualização das suas respostas" size={25} sx={{ color: "#FFF", marginInline: "4.5rem" }} /> : "Visualizar Resposta"}              
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push(`/form/edit/${userResponses[userResponses.length - 1].id}`)}
                disabled={loadingReportId === userResponses[userResponses.length - 1].id}
              >
                {loadingReportId === userResponses[userResponses.length - 1].id ? <CircularProgress aria-label="Carregando página de edição do questionário" size={25} sx={{ color: "#FFF", marginInline: "4.5rem" }} /> : "Editar Resposta"}              
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
        <CircularProgress aria-label="Enviando suas respostas" color="inherit" />
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
            <fieldset key={question.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem' }}>
            <legend>
              <Typography component="h2" sx={{ paddingInline: '1rem' }} variant="subtitle1" id={`legend-${question.id}`}
                aria-label={`Pergunta: ${question.text} (campo obrigatório)`}>
                {question.text} <span aria-hidden="true">*</span>
              </Typography>
            </legend>
            <FormControl
              sx={{ width: '100%' }}
              component="fieldset"
              error={!!errors.answers?.[questionIndex]?.answer_id}
              aria-required="true"
              role="group"
              aria-labelledby={`legend-${question.id}`}
            >
              <Controller
                name="answers"
                control={control}
                render={({ field }) => {
                  const selectedAnswer = field.value.find((a) => a.question_id === question.id)?.answer_id || "";

                  return (
                    <RadioGroup
                      name={`question-${question.id}`}
                      value={selectedAnswer}
                      onChange={(e) => {
                        const answerId = Number(e.target.value);
                        const answer = question.answers.find((a) => a.id === answerId);
                        const newAnswers = field.value.filter((a) => a.question_id !== question.id);
                        newAnswers.push({
                          question_id: question.id,
                          answer_id: answerId,
                          other_text: answer?.other ? "" : undefined,
                        });
                        field.onChange(newAnswers);
                      }}
                    >
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="p-3 w-full">
                          <FormControlLabel
                            control={
                              <Radio
                                id={`answer-${answer.id}`}
                                inputProps={{
                                  'aria-label': `${answer.text} (para a pergunta: ${question.text})`,
                                }}
                              />
                            }
                            label={answer.text}
                            htmlFor={`answer-${answer.id}`}
                            value={answer.id}
                            sx={{ width: '100%', gap: '1rem' }}
                            componentsProps={{
                              typography: { sx: { width: '100%', whiteSpace: 'normal' } }
                            }}
                          />
                          {answer.other && selectedAnswer === answer.id && (
                            <Controller
                              name={`answers.${questionIndex}.other_text`}
                              control={control}
                              render={({ field: otherField }) => (
                                <Box mt={1}>
                                  <label htmlFor={`other-${answer.id}`} className="sr-only">
                                    Campo para resposta personalizada
                                  </label>
                                  <TextField
                                    id={`other-${answer.id}`}
                                    {...otherField}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="Digite sua resposta"
                                    aria-describedby={`legend-${question.id}`}
                                  />
                                </Box>
                              )}
                            />
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  );
                }}
              />
              {errors.answers?.[questionIndex]?.answer_id && (
                <FormHelperText role="alert" id={`error-${question.id}`}>
                  {errors.answers[questionIndex]?.answer_id?.message || "Campo obrigatório"}
                </FormHelperText>
              )}
            </FormControl>
          </fieldset>          
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
              {isSubmittingForm ? <CircularProgress aria-label="Carregando" size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
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

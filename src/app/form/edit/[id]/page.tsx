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
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";

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
    cacheTime: Infinity,
  });
}

export default function EditQuestionForm({ params }: { params: Promise<{ id: string }> }) {
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
    const [isFormReady, setIsFormReady] = useState(false);
    const resolvedParams = use(params);
    const responseId = resolvedParams.id;

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
        getValues,
        watch,
    } = useForm<FormValues>({
        resolver: yupResolver(responseSchema),
        defaultValues: {
            answers: [],
        },
    });

    const { data: userId, isLoading: isUserIdLoading, error: userIdError } = useUserId();

    const { data: responseData, isLoading: isResponseLoading } = useQuery<DetailedResponse>(
        ["response", responseId],
        async () => {
            const res = await fetchRequest<DetailedResponse, any>(`/responses/${responseId}`);
            return res.body;
        },
        {
            enabled: !!responseId,
            staleTime: 0,
            cacheTime: 0,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            onSuccess: (data) => {
                const formattedAnswers = data.answeredQuestions.map((aq) => ({
                    question_id: aq.question.id,
                    answer_id: aq.answer.id,
                    other_text: aq.answer.other ? "" : undefined,
                }));
                reset({ answers: formattedAnswers });
            },
            onError: (error) => {
                enqueueSnackbar(
                    `Erro ao carregar resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
                    { variant: "error" }
                );
            },
        }
    );

    const { data: formData, isLoading: isFormDataLoading, error: formDataError } = useQuery<Question[], Error>(
        ["formData", userId],
        async () => {
            if (!userId) throw new Error("ID do usuário não fornecido");
            const res = await fetchRequest<any, { body: Question[] }>(`/users/${userId}/form`);
            if (!Array.isArray(res.body)) throw new Error("Dados do formulário inválidos");

            return res.body
                .filter((question) => Array.isArray(question.answers) && question.answers.length > 0)
                .reduce((acc: Question[], current: Question) => {
                    const exists = acc.find(q => q.id === current.id);
                    return exists ? acc : [...acc, current];
                }, []);
        },
        {
            enabled: !!userId,
            staleTime: 0,
            cacheTime: 0,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            onError: (error) => {
                enqueueSnackbar(
                    `Erro ao carregar formulário: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
                    { variant: "error" }
                );
            },
        }
    );

    if (responseData && userId && responseData.user_id !== userId) {
        notFound();
      }      

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

        await fetchRequest(`/responses/${responseId}`, {
            method: "PUT",
            body: requestBody,
        });
        },
        {
        onSuccess: () => {
            enqueueSnackbar("Respostas atualizadas com sucesso!", { variant: "success" });
            router.push("/form");
        },
        onError: (error) => {
            enqueueSnackbar(`Erro ao atualizar respostas: ${error instanceof Error ? error.message : "Erro desconhecido"}`, {
            variant: "error",
            });
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

    const handleClear = () => {
        reset({ answers: [] });
    };


    const isDataReady = !isUserIdLoading && !isFormDataLoading && !isResponseLoading && 
                       responseData && formData && getValues("answers").length > 0;

    if (!isDataReady) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
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
                    Editar Questionário
                </Typography>
                {formData?.map((question, questionIndex) => {
                    const currentAnswer = watch("answers").find((a) => a.question_id === question.id);
                    const selectedAnswer = question.answers.find((a) => a.id === currentAnswer?.answer_id);
                    
                    return (
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
                                            value={currentAnswer?.answer_id || ""}
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
                                                    {answer.other && currentAnswer?.answer_id === answer.id && (
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
                    );
                })}
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
                        {isSubmittingForm ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Atualizar"}
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
                    <Button
                    variant="outlined"
                    aria-label="Voltar para o início"
                    sx={{
                        mt: 2,
                        color: "#3E1E9A",
                        borderColor: "#3E1E9A",
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        "&:hover": {
                        borderColor: "#2A1570",
                        backgroundColor: "rgba(62, 30, 154, 0.08)",
                        },
                    }}
                    onClick={() => router.push("/form")}
                    >
                    Voltar
                    </Button>
                </div>
            </form>
        </Paper>
    </Container>
    );
} 
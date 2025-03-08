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
} from "@mui/material";
import fetchRequest from "@/utils/fetchRequest";
import { useQuery, useMutation } from "react-query";
import Cookies from "js-cookie";
import { jwtVerify } from "jose";
import { useSnackbar } from "notistack";


interface Answer {
  id: number;
  text: string;
  other: boolean;
  question_id: number;
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
    .min(1, "Pelo menos uma resposta é obrigatória")
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
  
  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<FormValues>({
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
      if (!Array.isArray(res.body)) {
        throw new Error("Dados do formulário inválidos");
      }
      return res.body;
    },
    {
      enabled: !!userId,
      onError: (error) => {
        enqueueSnackbar(`Erro ao carregar formulário: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const { data: userResponses } = useQuery<Response[]>(["responses", userId], 
    async () => {
      if (!userId) return null;
      const res = await fetchRequest<Response, any>(`/responses?user-id=${userId}`);
      return res.body;
    }, { enabled: !!userId }
  );
  
  const handleClear = () => {
    reset({
      answers: [],
    });
  };

  const submitMutation = useMutation(
    async (data: FormValues) => {
      if (!userId) throw new Error("ID do usuário não encontrado");

      const requestBody = {
        answers: Object.entries(data.answers).map(([questionId, answer]) => ({
          id: answer.answer_id,
          text: formData
            ?.find((q) => q.id === Number(questionId))
            ?.answers.find((a) => a.id === answer.answer_id)?.text || "",
          other: formData
            ?.find((q) => q.id === Number(questionId))
            ?.answers.find((a) => a.id === answer.answer_id)?.other || false,
          question_id: Number(questionId),
        })),
        user_id: userId,
        other_answers: Object.fromEntries(
          Object.entries(data.answers)
            .filter(([_, answer]) => answer.other_text)
            .map(([questionId, answer]) => [questionId, answer.other_text || ""])
        ),
      };

      await fetchRequest("/responses", {
        method: "POST",
        body: requestBody,
      });
    },
    {
      onSuccess: () => {
        alert("Respostas enviadas com sucesso!");
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao enviar respostas: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const onSubmit = (data: FormValues) => {
    submitMutation.mutate(data);
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
      return new Date(question.last_change).getTime() > new Date(lastResponseTimestamp).getTime() ||
      question.answers.some(answer => new Date(answer.last_change).getTime() > new Date(lastResponseTimestamp).getTime())
    });
    
    if (!hasChanges) {
      return <Typography color="secondary" variant="h6" align="center">Você já respondeu este formulário.</Typography>;
    }
  }

  return (
    <Container maxWidth="sm" className="flex items-center justify-center h-fit">
      <Paper elevation={3} className="p-6 w-full">
        <form onSubmit={handleSubmit(onSubmit)}>
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
                        ...field.value.filter((a) => a.question_id !== question.id), // Remove a resposta anterior da mesma pergunta
                        {
                          question_id: question.id,
                          answer_id: selectedAnswerId,
                          other_text: selectedAnswer?.other ? "" : undefined, // Garante que `other_text` seja tratado
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
                        {answer.other && watch(`answers`).find((a) => a.question_id === question.id)?.answer_id === answer.id && (
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
                <FormHelperText sx={{fontSize: 14}} error>{errors.answers?.message}</FormHelperText>
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
              disabled={submitMutation.isLoading}
            >
              {submitMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
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
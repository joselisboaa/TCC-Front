"use client";

import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";
import { useMemo, useEffect } from "react";

interface Answer {
  id: number;
  text: string;
  question: Question;
}

interface Question {
  id: number;
  text: string;
  user_group: { text: string };
}

interface Orientation {
  id: number;
  text: string;
  value: number;
  answer_id: number;
  answer: {
    id: number;
    text: string;
    other: boolean;
    question_id: number;
    question: {
      id: number;
      text: string;
      user_group_id: number;
      user_group: { id: number; text: string; description: string };
    };
  };
}

interface FormData {
  text: string;
  value: number;
  answer: Answer;
  question: Question;
}

const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da orientação é obrigatório"),
  value: yup.number().typeError("O peso deve ser um número").required("O peso da orientação é obrigatório"),
  question: yup
  .object()
  .required("A questão é obrigatória")
  .shape({
    id: yup.number().required("A questão é obrigatória"),
    text: yup.string().required("A questão é obrigatória"),
    user_group: yup.object().shape({ text: yup.string().required("A questão é obrigatória") }),
  })
  .test("valid-question", "A questão é obrigatória", (value) => {
    return value && value.id !== 0 && value.text.trim() !== "";
  }),
  answer: yup
  .object()
  .required("A resposta é obrigatória")
  .shape({
    id: yup.number().required("A questão é obrigatória"),
    text: yup.string().required("A questão é obrigatória"),
    question: yup.object().shape({
      id: yup.number().required("A questão é obrigatória"),
      text: yup.string().required("A questão é obrigatória"),
      user_group: yup.object().shape({ text: yup.string().required("A questão é obrigatória") }),
    }),
  })
  .test("valid-answer", "A resposta é obrigatória", (value) => {
    return value && value.id !== 0 && value.text.trim() !== "";
  })
});

export default function EditOrientation() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const { control, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      text: "",
      value: 0,
      answer: { id: 0, text: "", question: { id: 0, text: "", user_group: { text: "" } } },
      question: { id: 0, text: "", user_group: { text: "" }}
    },
  });

  const { data: orientationData, isLoading: isFetchingOrientation } = useQuery(
    ["orientation", id],
    async () => {
      const response = await fetchRequest<null, Orientation>(`/orientations/${id}`, { method: "GET" });
      return response.body;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setValue("text", data.text);
        setValue("value", data.value);
        setValue("answer", data.answer);
        setValue("question", data.answer.question);
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao carregar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
        router.push("/home/orientations");
      },
    }
  );

  const { data: questions, isLoading: isFetchingQuestions } = useQuery(
    "questions",
    async () => {
      const response = await fetchRequest<null, Question[]>("/questions", { method: "GET" });
      return response.body;
    }
  );

  const { data: answers, isLoading: isFetchingAnswers } = useQuery(
    "answers",
    async () => {
      const response = await fetchRequest<null, Answer[]>("/answers", { method: "GET" });
      return response.body;
    }
  );

  const selectedQuestion = watch("question");

  const filteredAnswers = useMemo(() => (
    selectedQuestion?.id ? answers?.filter(a => a.question?.id === selectedQuestion.id) : answers
  ), [selectedQuestion, answers]);

  useEffect(() => {
    if (!selectedQuestion?.id) return;
  
    const possibleAnswers = answers?.filter(a => a.question?.id === selectedQuestion.id) || [];

    const currentAnswer = getValues("answer");
  
    setValue("answer", possibleAnswers.length > 0 ? currentAnswer : { id: 0, text: "", question: selectedQuestion }, { shouldDirty: true });
  }, [selectedQuestion, answers, setValue]);  

  const updateMutation = useMutation(
    async (data: FormData) => {
      await fetchRequest(`/orientations/${id}`, {
        method: "PUT",
        body: { text: data.text, value: data.value, answer_id: data.answer.id },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Orientação atualizada com sucesso!", { variant: "success" });
        router.push("/home/orientations");
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao atualizar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const onSubmit = (data: FormData) => {
    console.log(data)
    updateMutation.mutate(data);
  };

  if (isFetchingOrientation || isFetchingAnswers || isFetchingQuestions || getValues("question.id") === 0 || getValues("answer.id") === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "fit" }}>
      <Paper elevation={4} sx={{ padding: 4, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Editar Orientação
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os detalhes da orientação abaixo.
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
          <Controller 
            name="text" 
            control={control} 
            render={({ field }) => (
              <TextField {...field} label="Texto" fullWidth error={!!errors.text} helperText={errors.text?.message} />
            )}
          />
          <Controller 
            name="value" 
            control={control} 
            render={({ field }) => (
              <TextField {...field} label="Peso" type="number" fullWidth error={!!errors.value} helperText={errors.value?.message} />
            )} 
          />
          <Controller
            name="question"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={questions || []}
                getOptionLabel={(option) => option?.text || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => field.onChange(newValue || null)}
                renderInput={(params) => <TextField {...params} label="Filtrar respostas a partir da Pergunta" error={!!errors.question} helperText={errors.question?.message} fullWidth />}
              />
            )}
          />

          <Controller
            name="answer"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={filteredAnswers || []}
                getOptionLabel={(option) => option?.text || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => field.onChange(newValue || null)}
                renderInput={(params) => <TextField {...params} label="Resposta" error={!!errors.answer} helperText={errors.answer?.message} fullWidth />}
              />
            )}
          />
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }}
              onClick={() => router.push("/home/orientations")}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              sx={{ background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } }}
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
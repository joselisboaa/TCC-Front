"use client";

import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";

interface UserGroup {
  text?: string;
}

interface Question {
  id: number;
  text: string;
  user_group?: UserGroup;
}

interface Answer {
  text: string;
  question: Question;
  other: boolean;
}

const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da resposta é obrigatório"),
  question: yup
    .object({
      id: yup.number().required("A questão é obrigatória").moreThan(0, "A questão é obrigatória"),
      text: yup.string().required("A questão é obrigatória"),
      user_group: yup.object().shape({ text: yup.string().optional() }).optional(),
    })
    .required("A questão é obrigatória"),
  other: yup.boolean().required("Campo 'Outros' é obrigatório"),
});


export default function EditAnswer() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const { control, getValues, handleSubmit, setValue, formState: { errors } } = useForm<Answer>({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      question: { 
        id: 0, 
        text: "",
        user_group: { text: "" }
      },
      other: false
    },
  });
  

  const { data: questions, isLoading: isFetchingQuestions } = useQuery(
    "questions",
    async () => {
      const response = await fetchRequest<null, Question[]>("/questions", { method: "GET" });
      return response.body;
    },
    {
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao carregar perguntas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const { data: answerData, isLoading: isFetchingAnswer } = useQuery(
    ["answer", id],
    async () => {
      const response = await fetchRequest<null, { text: string; question: Question; question_id: number; other: boolean }>(
        `/answers/${id}`,
        { method: "GET" }
      );
      return response.body;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        const matchedQuestion = questions?.find(q => q.id === data.question.id);
        setValue("text", data.text);
        setValue("other", data.other);
        setValue("question", {
          id: data.question.id,
          text: data.question.text,
          user_group: matchedQuestion?.user_group,
        });
           
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao carregar a resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/answers");
      },
    }
  );

  const updateMutation = useMutation(
    async (data: Answer) => {
      await fetchRequest(`/answers/${id}`, {
        method: "PUT",
        body: { text: data.text, question_id: data.question.id, other: data.other },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Resposta atualizada com sucesso!", { variant: "success" });
        router.push("/home/answers");
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao atualizar a resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  if (isFetchingAnswer || isFetchingQuestions || getValues("question.id") === 0) {
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
          Editar Resposta
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os detalhes da resposta abaixo.
        </Typography>

        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Controller
              name="text"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Texto da Resposta" fullWidth variant="outlined" error={!!errors.text} helperText={errors.text?.message} />
              )}
            />

            <Controller
              name="question"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={questions || []}
                  getOptionLabel={(option) => `${option.text} ${option.user_group?.text ? "(" + option.user_group.text + ")" : ""}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Selecionar Pergunta" fullWidth variant="outlined" error={!!errors.question} helperText={errors.question?.message} />
                  )}
                />
              )}
            />

            <Controller
              name="other"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={field.value} color="primary" />} label="Outros" />
              )}
            />

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
                variant="contained"
                sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }}
                onClick={() => router.push("/home/answers")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } }}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

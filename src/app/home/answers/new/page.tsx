"use client";

import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";

interface Question {
  id: number;
  text: string;
  user_group: { id: number; text: string };
}

const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da resposta é obrigatório"),
  question: yup
    .object()
    .shape({
      id: yup.number().required("A questão é obrigatória"),
      text: yup.string().required("A questão é obrigatória"),
      user_group: yup
        .object()
        .shape({
          text: yup.string(),
        })
        .nullable(),
    })
    .test("valid-question", "A questão é obrigatória", (value) => {
      return value && value.id !== 0 && value.text.trim() !== "";
    })
    .nullable()
    .required("A pergunta é obrigatória"),
  other: yup.boolean().required("O campo outros é obrigatório"),
});


export default function CreateAnswer() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  
  const { control, handleSubmit, formState: { errors }, } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      question: { id: 0, text: "" },
      other: false,
    },
  });

  const { data: questions, isLoading: isFetchingQuestions } = useQuery<Question[]>(
    "questions",
    async () => {
      const response = await fetchRequest<null, Question[]>("/questions", { method: "GET" });
      return response.body;
    },
    {
      onError: (error) => {
        enqueueSnackbar(`Erro ao carregar perguntas: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const createMutation = useMutation(
    async (data: any) => {
      await fetchRequest("/answers", {
        method: "POST",
        body: { text: data.text, question_id: data.question.id, other: data.other },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Resposta criada com sucesso!", { variant: "success" });
        router.push("/home/answers");
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao criar resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "fit" }}>
      <Paper elevation={4} sx={{ padding: 4, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Criar Resposta
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os detalhes da resposta abaixo.
        </Typography>

        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Controller
              name="text"
              control={control}
              render={({ field }) => <TextField {...field} label="Texto da Resposta" fullWidth variant="outlined" error={!!errors.text} helperText={errors.text?.message}/>}
            />

            <Controller
              name="question"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={questions || []}
                  getOptionLabel={(option) => {
                    if (!option || !option.text) return "";
                    return `${option.text} ${option.user_group?.text ? "(" + option.user_group.text + ")" : ""}`;
                  }}
                                    onChange={(_, newValue) => field.onChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Pergunta"
                      fullWidth
                      variant="outlined"
                      error={!!errors.question} helperText={errors.question?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isFetchingQuestions ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />

            <Controller
              name="other"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} color="primary" />}
                  label="Outros"
                />
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
                disabled={createMutation.isLoading}
              >
                {createMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

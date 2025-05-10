"use client";

import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch, useMediaQuery } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";


const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da resposta é obrigatório"),
  other: yup.boolean().required("O campo outros é obrigatório"),
  value: yup.number().required("O valor é obrigatório").typeError("O valor deve ser um número"),
});


export default function CreateAnswer() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const isDesktop = useMediaQuery('(min-width:600px)');
  
  const { control, handleSubmit, formState: { errors }, } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      other: false,
      value: 0,
    },
  });

  const createMutation = useMutation(
    async (data: { text: string; other: boolean; value: number }) => {
      await fetchRequest("/answers", {
        method: "POST",
        body: { 
          text: data.text, 
          other: data.other,
          value: data.value
        },
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
    <Box sx={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      padding: { xs: 2, sm: 4 }
    }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          ...(isDesktop && {
            backgroundColor: "white",
            borderRadius: 3,
            boxShadow: 4,
            padding: 4
          })
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          color: "#5E3BEE",
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
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
              name="value"
              control={control}
              render={({ field }) => (
                <TextField 
                  {...field} 
                  label="Valor da Resposta" 
                  fullWidth 
                  variant="outlined" 
                  error={!!errors.value} 
                  helperText={errors.value?.message}
                  type="number"
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

            <Box sx={{ 
              display: "flex", 
              gap: 2, 
              justifyContent: "center",
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Button
                variant="contained"
                sx={{ 
                  backgroundColor: "#D32F2F", 
                  color: "#FFF", 
                  fontWeight: "bold", 
                  width: { xs: "100%", sm: "11rem" }, 
                  padding: "10px", 
                  borderRadius: "8px", 
                  "&:hover": { backgroundColor: "#B71C1C" } 
                }}
                onClick={() => router.push("/home/answers")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ 
                  background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", 
                  color: "#FFF", 
                  fontWeight: "bold", 
                  width: { xs: "100%", sm: "11rem" }, 
                  padding: "10px", 
                  borderRadius: "8px", 
                  "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } 
                }}
                disabled={createMutation.isLoading}
              >
                {createMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  );
}

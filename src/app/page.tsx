"use client";

import { useSearchParams, useRouter, ReadonlyURLSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import fetchRequest from "../utils/fetchRequest";
import useVerifyAuth from "@/utils/hooks/useVerifyAuth";
import { Backdrop, CircularProgress, Button, Paper, Typography, Box } from "@mui/material";


const SearchHandler = ({ router }: { router: ReturnType<typeof useRouter> }) => {
  const searchParams = useSearchParams() as ReadonlyURLSearchParams;
  const search = searchParams.get("code");
  const [loadingJWT, setLoadingJWT] = useState(false);

  useEffect(() => {
    if (search) {
      setLoadingJWT(true);
      Cookies.set("jwt", search);
    }
  }, [search]);

  useEffect(() => {
    if (loadingJWT) {
      router.push("/home");
    }
  }, [loadingJWT, router]);

  return (
    <Backdrop open={loadingJWT} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

const LoginPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const myJwt = Cookies.get("jwt");
  const { data, isLoading: isVerifying, isError } = useVerifyAuth(myJwt);

  useEffect(() => {
    if (data?.body.redirectURL) {
      router.push(data.body.redirectURL);
    }
  }, [data, router]);

  const handleGoogleLogin = async () => {
    let redirectPath = "";
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetchRequest<null, { redirectUrl: string; statusCode: number }>(
        "/oauth2/login",
        { method: "GET" }
      );

      if (response.statusCode === 200 && response.body.redirectUrl) {
        redirectPath = response.body.redirectUrl;
      } else {
        setErrorMessage("Erro ao redirecionar para login com Google.");
      }
    } catch (error) {
      setErrorMessage(
        `Ocorreu um erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    } finally {
      setLoading(false);
      if (redirectPath) {
        router.push(redirectPath);
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
      <Paper className="flex flex-col items-center p-8 rounded-lg shadow-lg text-center w-full max-w-4xl h-full min-h-screen md:min-h-0 md:h-auto">
        <Suspense fallback={
          <Backdrop open={isVerifying} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <CircularProgress color="inherit" />
          </Backdrop>
        }>
          <SearchHandler router={router} />
        </Suspense>

        <Typography variant="h4" component="h1" className="mb-4 text-main_theme">
          Mapeamento de Acessibilidade
        </Typography>
        <Typography variant="body1" className="mb-8 text-gray-600">
          A acessibilidade é a chave para abrir as portas da oportunidade.
        </Typography>

        {errorMessage && (
          <Typography color="error" className="mb-4">
            {errorMessage}
          </Typography>
        )}
        <Button
          variant="outlined"
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 24px',
            border: '1px solid #dadce0',
            borderRadius: '4px', 
            boxShadow: 'none', 
            fontSize: '16px', 
            fontWeight: 500, 
            color: '#3c4043', 
            backgroundColor: '#ffffff', 
            textTransform: 'none', 
            '&:hover': {
              backgroundColor: '#f8f9fa', 
              boxShadow: 'none', 
            },
            '&:focus': {
              outline: 'none', 
            },
            transition: 'background-color 150ms ease',
            opacity: loading ? 0.5 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            minWidth: '120px', 
          }}
          >
          {loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>              
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google Logo"
                style={{ width: '18px', height: '18px', marginRight: '8px' }}
              />
              <Typography sx={{height: "20px"}}>
                Entrar com Google
              </Typography>
            </Box>
          )}
        </Button>
        <Image
          width={800}
          height={600}
          src="/pcd.png"
          alt="People Illustration"
          className="mt-8 w-full max-w-lg h-auto object-contain"
        />
      </Paper>
    </div>
  );
};

export default LoginPage;
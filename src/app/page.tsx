"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Cookies from "js-cookie";
import fetchRequest from "../utils/fetchRequest";
import { useQuery } from "react-query";
import useVerifyAuth from "@/utils/hooks/useVerifyAuth";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const search = searchParams?.get("code");

  if (search) {
    Cookies.set("jwt", search);
    router.push("/home");
  }

  const myJwt = Cookies.get("jwt");

  const { data, isLoading: isVerifying, isError } = useVerifyAuth(myJwt) as any;

  useEffect(() => {
    if (data?.body.redirectURL) {
      router.push(data.body.redirectURL);
    }
  }, [data]);

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
      router.push(redirectPath);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-4xl h-full min-h-screen md:min-h-0 md:h-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-4">
          Mapeamento de Acessibilidade
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-8">
          A acessibilidade é a chave para abrir as portas da oportunidade.
        </p>

        {errorMessage && (
          <p className="text-red-500 mb-4 text-sm sm:text-base">{errorMessage}</p>
        )}

        <button
          onClick={handleGoogleLogin}
          className={`flex items-center justify-center py-3 px-6 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base lg:text-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition duration-150 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? (
            <span>Carregando...</span>
          ) : (
            <>
              <Image
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google Logo"
                className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
              />
              Entrar com Google
            </>
          )}
        </button>
        <Image
          width={800}
          height={600}
          src="/pcd.png"
          alt="People Illustration"
          className="mt-8 w-full max-w-lg h-auto object-contain"
        />
      </div>
    </div>
  );
};

export default LoginPage;

import { useQuery } from "react-query";
import fetchRequest from "../fetchRequest";

const useVerifyAuth = (jwtToken: string | undefined) => {
  const { data, isLoading, isError } = useQuery(
    ["verifyUserAuth", jwtToken],
    async () => {
      if (!jwtToken) return null;

      const response = await fetchRequest<null, { redirectURL: string }>(
        `/oauth2/login/verify?jwt=${jwtToken}`,
        { method: "GET" }
      );

      return response;
    },
    {
      enabled: !!jwtToken,
      retry: false,
    }
  );

  return { data, isLoading, isError };
};

export default useVerifyAuth;

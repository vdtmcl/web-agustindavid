import { login } from "../../_lib/auth";
export const onRequestPost = async ({ request, env }: any) => login(request, env);
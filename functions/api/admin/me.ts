import { isAuthenticated } from "../../_lib/auth";
import { json, noStore } from "../../_lib/response";
export const onRequestGet = async ({ request, env }: any) => json({ authenticated: await isAuthenticated(request, env) }, { headers: noStore() });
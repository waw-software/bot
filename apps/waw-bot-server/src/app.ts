import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { API_VERSION, HealthResponseSchema } from "@waw/api-contract";
import Fastify, {
	type FastifyInstance,
	type FastifyServerOptions,
} from "fastify";
import { CAPABILITIES } from "./capabilities.js";

export function createApp(options: FastifyServerOptions = {}): FastifyInstance {
	const app = Fastify(options);

	app
		.withTypeProvider<TypeBoxTypeProvider>()
		.get(
			"/health",
			{ schema: { response: { 200: HealthResponseSchema } } },
			async () => ({
				apiVersion: API_VERSION,
				capabilities: [...CAPABILITIES],
			}),
		);

	return app;
}

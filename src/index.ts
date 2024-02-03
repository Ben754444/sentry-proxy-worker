export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const SENTRY_INGEST_DOMAIN = env.SENTRY_INGEST_DOMAIN ?? "ingest.sentry.io";
			const ALLOWED_DSN = (env.ALLOWED_DSN ?? "").split(",");
			if(ALLOWED_DSN[0].length === 0){
				ALLOWED_DSN.shift()
			}

			const url = new URL(request.url);

			if(request.method === "GET"){
				// js file will be last part
				const file = url.pathname.split("/").pop();
				const res = await fetch(`https://js.sentry-cdn.com/${file}`);
				return res;
			}

			if (request.method === "POST") {
				const body = await request.text();
				if(!body) {
					return new Response(JSON.stringify({success: false, code: 400, message: "Bad Request", error: "Invalid Request"}), {status: 400, headers: { 'Content-Type': 'application/json' }}); 
				}
				const head = JSON.parse(body.split("\n")[0])
				
				const dsn = new URL(head.dsn)

				if(!dsn.hostname.endsWith(SENTRY_INGEST_DOMAIN)) {
					console.log(`Hostname does not end with SENTRY_INGEST_DOMAIN`)
					return new Response(JSON.stringify({success: false, code: 422, message: "Unprocessable Entity", error: "Invalid DSN"}), {status: 422, headers: { 'Content-Type': 'application/json' }});
				}

				if(ALLOWED_DSN.length > 0 && !ALLOWED_DSN.includes(dsn.href)) {
					console.log(`Strict mode is on and DSN is not in ALLOWED_DSN`)
					return new Response(JSON.stringify({success: false, code: 422, message: "Unprocessable Entity", error: "Invalid DSN"}), {status: 422, headers: { 'Content-Type': 'application/json' }});
				}
				
				const sentry_res = await fetch(`https://${dsn.hostname}/api${dsn.pathname}/envelope/`, { //the trailing slash is important
					method: request.method,
					headers: {
						...request.headers,
						"X-Forwarded-For": request.headers.get("CF-Connecting-IP")!
					},
					body: body
				});

				return sentry_res;

			}

			// sentry wouldnt make this request, so it's someone messing around
			return new Response(JSON.stringify({success: false, code: 400, message: "Bad Request", error: "Invalid Request"}), {status: 400, headers: { 'Content-Type': 'application/json' }});

		} catch (error) {
			console.error(error)
			return new Response(JSON.stringify({success: false, code: 500, message: "Internal Server Error", error: undefined}), {status: 500, headers: { 'Content-Type': 'application/json' }});
		}

		
	},
};

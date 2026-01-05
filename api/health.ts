export const runtime = 'edge';

export function GET(request: Request) {
    return new Response(
        JSON.stringify({
            status: "ok",
            time: new Date().toISOString(),
        }),
        {
            status: 200,
            headers: {
                "content-type": "application/json",
            },
        }
    );
}

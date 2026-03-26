export const maxDuration = 60;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Clé API non configurée" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { messages, max_tokens = 4096 } = body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json(
        { error: `Erreur API Anthropic: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (e) {
    return Response.json(
      { error: `Erreur serveur: ${e.message}` },
      { status: 500 }
    );
  }
}

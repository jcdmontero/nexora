import anthropic

client = anthropic.Anthropic(
    base_url="http://localhost:4000",
    api_key="dummy"
)

try:
    response = client.messages.create(
        model="claude-opus-4-8",  # <- nombre expuesto por LiteLLM
        max_tokens=1024,
        messages=[
            {"role": "user", "content": "¡Hola! ¿Cómo estás hoy?"}
        ]
    )

    print("✅ Respuesta exitosa:")
    print(response.content[0].text)

except Exception as e:
    print(f"❌ Error: {e}")
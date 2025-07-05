from api import ollama_ai,groq_ai

completion = groq_ai("We want to make photo recognition app?")
for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")

# var = ollama_ai("What is the capital of France?")
# print(var)

# Backend (mock) do inbox

Backend funcional que o frontend consome — útil para rodar a API **localmente e offline**
(store em memória). A app também pode apontar para uma API hospedada (ver README do frontend).

## Rodar localmente (store em memória, sem AWS)

```bash
cd server
node local.mjs           # sobe em http://localhost:4000
# ou, da raiz do repo:   docker compose up
```

Os dados reiniciam a cada restart — é proposital.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/me` | Perfil do atendente logado |
| GET | `/conversations` | Lista de conversas |
| GET | `/conversations/:id/messages` | Mensagens de uma conversa |
| POST | `/conversations/:id/messages` | Envia mensagem `{ text }` |
| POST | `/ai/suggest` | Sugestão de resposta da IA `{ conversationId }` |

---

## (Interno) Deploy na AWS

Hospedado via **Lambda + API Gateway HTTP API + DynamoDB**. Não requer SAM/CDK CLI — usa o
transform de SAM nativo do CloudFormation pelo AWS CLI.

```bash
cd server
npm install
npm run build      # esbuild -> dist/lambda.js

aws cloudformation package \
  --template-file template.yaml \
  --s3-bucket <bucket-de-deploy> \
  --output-template-file packaged.yaml \
  --profile <seu-perfil> --region us-east-1

aws cloudformation deploy \
  --template-file packaged.yaml \
  --stack-name inbox-backend-mock \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides SeedToken=<token> OpenAiApiKey=<opcional> \
  --profile <seu-perfil> --region us-east-1

# Popular os dados de exemplo (uma vez):
API=$(aws cloudformation describe-stacks --stack-name inbox-backend-mock \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text \
  --profile <seu-perfil> --region us-east-1)
curl -X POST "$API/admin/seed" -H "x-seed-token: <token>"
```

A `OPENAI_API_KEY` é opcional: sem ela, `/ai/suggest` retorna uma sugestão heurística (mock),
mantendo o endpoint funcional e sem custo. Com ela, usa a OpenAI de verdade (proxy server-side).

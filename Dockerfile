# Estágio de build
FROM node:20-alpine AS build

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências ignorando conflitos de peer dependencies
RUN npm install --legacy-peer-deps

# Copia o resto do código da aplicação
COPY . .

# Captura os argumentos de build do Easypanel e os transforma em variáveis de ambiente para o Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Faz o build da aplicação React/Vite (gera a pasta dist)
RUN npm run build

# Estágio de produção (Nginx)
FROM nginx:alpine

# Copia os arquivos da build para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sobrescreve a configuração padrão do Nginx para suportar as rotas da SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

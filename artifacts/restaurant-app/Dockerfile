# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies based on lockfile
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install; \
  elif [ -f yarn.lock ]; then yarn install; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Copy all files
COPY . .

# Build the application
# We need to set the API URL for production
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy built assets from the build stage to nginx serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Add a custom nginx configuration to handle React routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Dockerfile for Next.js Frontend
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application source
COPY . .

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

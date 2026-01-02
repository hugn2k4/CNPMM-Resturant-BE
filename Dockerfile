# Dockerfile for Restaurant Backend (Express) - DEV MODE
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start in dev mode with hot reload
CMD ["npm", "run", "dev"]

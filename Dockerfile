# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend files
COPY package*.json ./
COPY index.js ./
COPY data ./data

# Copy frontend build
COPY build ./build

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "index.js"] 
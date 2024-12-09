# Backend Dockerfile
FROM node:18-alpine

# Install build tools for native modules
RUN apk add --no-cache g++ make python3 cmake

# Set the working directory inside the container
WORKDIR /app

# Set environment to development for dependency installation
ENV NODE_ENV=development

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies, including dev dependencies
RUN npm install

# Install nodemon globally for hot-reloading
RUN npm install -g nodemon

# Copy the rest of the backend code
COPY . .

# Expose the port the backend listens on
EXPOSE 3000

# Command to run the backend with nodemon
CMD ["nodemon", "server.js"]



# # Backend Dockerfile
# FROM node:18-alpine

# # Set the working directory inside the container
# WORKDIR /app

# # Set environment to development for dependency installation
# ENV NODE_ENV=development

# # Copy package.json and package-lock.json for dependency installation
# COPY package*.json ./

# # Install dependencies, including dev dependencies
# RUN npm install

# # Install nodemon globally for hot-reloading
# RUN npm install -g nodemon

# # Copy the rest of the backend code (optional for Docker builds; unnecessary if using volumes)
# COPY . .

# # Expose the port the backend listens on
# EXPOSE 3000

# # Command to run the backend with nodemon
# CMD ["nodemon", "server.js"]

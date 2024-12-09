FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the port the frontend listens on
EXPOSE 4200

# Set environment to development
ENV NODE_ENV=development

# Command to run the frontend
CMD ["npm", "start"]

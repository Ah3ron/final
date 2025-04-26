# Use the Node alpine official image
# https://hub.docker.com/_/node
FROM node:lts-alpine

# Create and change to the app directory.
WORKDIR /app

# Copy the files to the container image
COPY package*.json ./

# Install packages
RUN npm ci

# Copy local code to the container image.
COPY . ./

# Specify the variable you need
ARG DATABASE_URL
# Use the varible
RUN echo $DATABASE_URL

# Build the app.
RUN npm run build
RUN npm run db:push

# Serve the app
CMD ["npm", "run", "start"]
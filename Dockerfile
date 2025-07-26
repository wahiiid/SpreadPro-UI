FROM node:24.1.0
# Set the working directory inside the container
WORKDIR /app
# Install pnpm globally
RUN npm install -g pnpm
# Copy package.json and package-lock.json to the working directory
COPY ./package*.json ./
# Copy the entire project to the working directory
COPY . .
# Install project dependencies
RUN pnpm install
RUN pnpm run build
# Expose the port your app will run on
EXPOSE 5173
# Run pnpm run dev when the container starts
CMD ["pnpm", "run", "preview"]
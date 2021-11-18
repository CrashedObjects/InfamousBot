FROM node:latest

# Install python (needed for compiling certain libs)
RUN apt-get update || : && apt-get install python -y

# Create code dir
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copy and install bot
COPY package.json /usr/src/bot
RUN npm install

COPY . /usr/src/bot

# Todo mount database to persistent storage

# Start
CMD ["node", "index.js"]
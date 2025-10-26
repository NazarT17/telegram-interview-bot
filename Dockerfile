FROM node:18-alpineFROM node:18-alpine



WORKDIR /appWORKDIR /app



# Copy package files# Copy package files

COPY package*.json ./COPY package*.json ./



# Install dependencies# Install dependencies

RUN npm ci --only=productionRUN npm ci --only=production



# Copy source code# Copy TypeScript config and source

COPY . .COPY tsconfig.json ./

COPY src ./src

# Build TypeScript

RUN npm run build# Install dev dependencies for build

RUN npm install --only=development

# Run the bot

CMD ["npm", "start"]# Build TypeScript

RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Start the bot
CMD ["npm", "start"]

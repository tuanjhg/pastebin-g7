FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy source code
COPY . .


EXPOSE 3001

CMD ["npm", "run", "start"]

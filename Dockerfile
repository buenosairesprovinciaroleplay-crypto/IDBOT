FROM node:20

RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    build-essential \
    g++ \
    python3

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

CMD ["npm", "start"]

FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone 

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p /app/data/

EXPOSE 3000

CMD ["node", "app.js"]


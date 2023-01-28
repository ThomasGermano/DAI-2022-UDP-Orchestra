FROM node:19
WORKDIR /opt/app
COPY src ./
RUN npm install
ENTRYPOINT ["node", "auditor.js"]
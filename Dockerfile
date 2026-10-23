# Run the repository's Jest suite before producing a production image.
FROM node:22-alpine AS verify
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test -- --runInBand
RUN echo "Automated tests passed" > /verified

# The final image contains only static website assets and nginx.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=verify /verified /etc/hp-calculator-build-verification
COPY index.html modern.html legacy.html /usr/share/nginx/html/
COPY calculator.js calculator-core.js modern.js theme.js help.js service-worker.js /usr/share/nginx/html/
COPY styles.css modern.css manifest.json faq-data.json /usr/share/nginx/html/
COPY Assets/ /usr/share/nginx/html/Assets/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
CMD ["nginx", "-g", "daemon off;"]

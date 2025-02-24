# Utilizza un'immagine Node.js leggera
FROM node:18-alpine

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di dipendenze ed installa le dipendenze
COPY package*.json ./
RUN npm install

# Copia l'intero progetto nella directory di lavoro
COPY . .

# Espone la porta che il server utilizza (5000)
EXPOSE 5000

# Avvia l'applicazione (assicurati che "npm run dev" sia definito in package.json)
CMD ["npm", "run", "dev"]
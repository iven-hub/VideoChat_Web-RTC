const SERVER_PORT = process.env.PORT //verifica se colocamos alguma porta nas variaveis de ambiente
const app = require('./src/App')(SERVER_PORT)

app.start() // inicia a aplicação
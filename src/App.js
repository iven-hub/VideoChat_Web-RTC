const express = require('express')
const app = express()
const http = require('http').createServer(app)
require('./SocketService')(http) // usa o socketService para configurar os eventos do socket

class App {
    constructor(port) {
        this.port = port ? port : 3000
    }

    start() { //responsável por startar o express
        app.get('/health', (req, res) => { // configura uma porta 
            res.send({
                status: 'UP'
            })
        })
        
        app.use(express.static('public')) // expande os arquivos publicos que estáo na pasta public
                
        http.listen(this.port, () => {// iniciar o servidor
            console.log(`server up at port: ${this.port}`)
        })
    }
}

module.exports = (port) => {
    return new App(port)
}
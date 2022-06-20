// Aqui defenimos os nomes de cada evento

const EVENT_CONNECTION = 'connection'
const EVENT_CALL = 'call'
const EVENT_OFFER = 'offer'
const EVENT_ANSWER = 'answer'
const EVENT_CANDIDATE = 'candidate'
const EVENT_DISCONNECT_USER = 'disconnect-user'

const EVENT_DISCONNECT = 'disconnect'

class SocketService {
    constructor(http) {
        this.init(http)
    }

    init(http) {
        this.io = require('socket.io')(http)

        this.io.on(EVENT_CONNECTION, (socket) => { // Evento de conexão, quando o usuario começa a conexao com o signaling server
            const room = socket.handshake.query.room // verifica se foi criada uma room
            if (!room) {
                socket.disconnect() // senão o usuario fica de fora
            } else {
                console.log(`new user enter in room ${room}`)
                socket.join(room) // se tiver tudo certo ele eh adicionado na sala
                console.log('requesting offers')
                socket.to(room).emit(EVENT_CALL, { id: socket.id }) // envia evento de call para que esta na sala

                socket.on(EVENT_OFFER, (data) => { // quem recebeu o evento de call, vai responder com offer
                    console.log(`${socket.id} offering ${data.id}`)
                    socket.to(data.id).emit(EVENT_OFFER, {
                        id: socket.id,
                        offer: data.offer // esse evento carrega a conexão para p2p
                    })
                })

                socket.on(EVENT_ANSWER, (data) => { // quem recebeu o offer vai responder com um answer
                    console.log(`${socket.id} answering ${data.id}`)
                    socket.to(data.id).emit(EVENT_ANSWER, {
                        id: socket.id,
                        answer: data.answer // e daí os 2 pares ja estão trocando dados um com o outro
                    })
                })

                socket.on(EVENT_CANDIDATE, (data) => { // evento de candidate para quando os pares trocam os ices candidates
                    console.log(`${socket.id} sending a candidate to ${data.id}`)
                    socket.to(data.id).emit(EVENT_CANDIDATE, { //  Esse protocolo permite que dois pares encontrem e estabeleçam uma conexão entre si
                        id: socket.id,
                        candidate: data.candidate
                    })
                })

                socket.on(EVENT_DISCONNECT, () => { // evento de deconectar
                    console.log(`${socket.id} disconnected`)
                    this.io.emit(EVENT_DISCONNECT_USER, {
                        id: socket.id
                    })
                })
            }
        })
    }
}

module.exports = (http) => {
    return new SocketService(http)
}
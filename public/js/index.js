//Script principal

var getUserMedia
var myStream
var socket
const users = new Map()

document.addEventListener('DOMContentLoaded', function() { 
    // Quando a pagina acabar de carregar, vamos atribuir as funções dos nossos 3 butões
    document.getElementById('roomForm').addEventListener('submit', enterInRoom)
    document.getElementById('chatForm').addEventListener('submit', broadcastChatMessage)
    document.getElementById('leave').addEventListener('click', leave)

    navigator.mediaDevices.getUserMedia({ video: { // Em seguida solicitar a permissão da camera e do microfone, logo aqui podemos configurar ambos
        height: 480,
        width: 640
    }, audio: true })
    .then(function (stream) { // Se a permissão for consedida vai ser exibida o form de rooms
        myStream = stream
        setLocalPlayerStream()
        showForm()
    }).catch(function (err) { // senão será exibida a div de erros
        console.log(err)
        showFail()
    })
}, false)

function initServerConnection(room) {
    var socket = io({ // Essa função é responsavel por começar a conexão com o Backend e em seguida configura todos os eventos que podemos receber do Backend
        query : {
            room: room
        }
    })

    socket.on('disconnect-user', function (data) { //Evento de disconnect
        var user = users.get(data.id) // map de usuarios
        if(user) { // Verificar se usuarios está na nossa lista 
            users.delete(data.id) // Se tiver, ele eh apagado do map
            user.selfDestroy() // depois destroi qq conexão com ele 
        }
    })
    
    socket.on('call',  function (data) { // Quando ja estamos na sala, e um novo usuario entra, recebemos evento de call
        let user = new User(data.id)
        user.pc = createPeer(user) //Cria a peer
        users.set(data.id, user)

        createOffer(user, socket) // Cria a oferta e envia para esse usuarios
    })

    socket.on('offer',  function (data) { // Quando a gente recebe um evento de offer para podermos realizar a p2p
        var user = users.get(data.id)
        if (user) { //Verifica se usuario está na nossa lista
            answerPeer(user, data.offer, socket)
        } else { // Senão Cria a p2p e adicionar usuario na lista e envia a resposta
            let user = new User(data.id)
            user.pc = createPeer(user)
            users.set(data.id, user)
            answerPeer(user, data.offer, socket)
        }
    })

    socket.on('answer',  function (data) { // Quando o peer aceitar a sua oferta e manda a resposta para começar o p2p
        var user = users.get(data.id)
        if(user) {
            user.pc.setRemoteDescription(data.answer)
        }
    })

    socket.on('candidate', function (data) { // trocar os ices candidates
        var user = users.get(data.id)
        if (user) {
            user.pc.addIceCandidate(data.candidate)
        } else {
            let user = new User(data.id)
            user.pc = createPeer(user)
            user.pc.addIceCandidate(data.candidate)
            users.set(data.id, user)
        }
    })
    
    socket.on('connect', function () { // Quando o front-end establece a conexão com o back-end e se estiver tudo certo
        showPlayers() // Abre a div de Player e chat
    })

    socket.on('connect_error', function(error) { // Quando perdemos a conexão com back-end, força um leave
        console.log('Connection ERROR!')
        console.log(error)
        leave()
    })
    
    return socket
}

function enterInRoom (e) { 
    e.preventDefault()
    room = document.getElementById('inputRoom').value // Pega a room que adicionamos la no input

    if (room) {
        socket = initServerConnection(room) // Arranca a conexão com o socket
    }
}

function broadcastChatMessage(e) { // Faz um loop de todos os usuarios conectados e envia a mensagem que colocamos no chat
    e.preventDefault()

    var message = document.getElementById('inputChatMessage').value // começa procurando a mensagem

    addMessage(message) // adicionar ela na nossa propria div

    for(var user of users.values()) { //envia para todos os usuarios
        user.sendMessage(message)
    }

    document.getElementById('inputChatMessage').value = '' // e limpa o input
}

function leave() { // Fecha a conexão com o Backend 
    socket.close()
    for(var user of users.values()) {
        user.selfDestroy() // destroi as conexões p2p
    }
    users.clear() // limpa os usuarios
    removeAllMessages() // apaga todas as mensagens
    showForm() // exibe o div de room
}
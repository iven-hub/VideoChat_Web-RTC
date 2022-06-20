const { RTCPeerConnection } = window;

function createPeer (user) { // Aqui temos tudo para criar a conexão p2p
    const rtcConfiguration = {
        iceServers: [{
          urls: 'stun:stun.l.google.com:19302'
        }]
    }
    var pc = new RTCPeerConnection(rtcConfiguration)
    pc.onicecandidate = function (event) {
        if(!event.candidate) {
            return
        }

        socket.emit('candidate', {
            id: user.id,
            candidate: event.candidate
        })
    }

    for (const track of myStream.getTracks()) {
        pc.addTrack(track, myStream);
    }

    pc.ontrack = function (event) {
        if (user.player) {
            return
        }
        user.player = addVideoPlayer(event.streams[0])
    }

    pc.ondatachannel = function (event) {
        user.dc = event.channel
        setupDataChannel(user.dc)
    }
    
    return pc
}

function createOffer(user, socket) { // Criar a oferta
    user.dc = user.pc.createDataChannel('chat')
    setupDataChannel(user.dc)
    
    user.pc.createOffer().then(function (offer) {
        user.pc.setLocalDescription(offer).then(function () {
            socket.emit('offer', {
                id: user.id,
                offer: offer
            })
        })
    })
}

function answerPeer (user, offer, socket) { // Criar a answer
    user.pc.setRemoteDescription(offer).then(function () {
        user.pc.createAnswer().then(function(answer) {
            user.pc.setLocalDescription(answer).then(function() {
                socket.emit('answer', {
                    id: user.id,
                    answer: answer
                })
            })
        })
    })
}

function setupDataChannel(dataChannel) { // Criar date channel para trocar mensagem
    dataChannel.onopen = checkDataChannelState
    dataChannel.onclose = checkDataChannelState
    dataChannel.onmessage = function(e) {
        addMessage(e.data)
    }
}

function checkDataChannelState(dataChannel) {
    console.log('WebRTC channel state is:', dataChannel.type)
}
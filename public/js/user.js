// Classe de usuário que foi criado para ficar mais facil

class User {
    constructor(id) {
        this.id = id;
    }
    
    selfDestroy() { // Destruir a conexão p2p
        if(this.player) {
            this.player.remove()
        }

        if(this.pc) {
            this.pc.close()
            this.pc.onicecandidate = null
            this.pc.ontrack = null
            this.pc = null
        }
    }

    sendMessage(message) { // Enviar mensagens
        if(this.dc) {
            this.dc.send(message)
        }
    }
}
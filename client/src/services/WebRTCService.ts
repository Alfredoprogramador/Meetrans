import { Socket } from 'socket.io-client';
import { ICE_SERVERS, PeerConnection } from '../types';

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private socket: Socket | null = null;

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.localStream;
    } catch (error) {
      console.error('Erro ao acessar mídia:', error);
      throw error;
    }
  }

  async createPeerConnection(
    socketId: string,
    onTrack: (stream: MediaStream) => void
  ): Promise<RTCPeerConnection> {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Adicionar tracks locais
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
          peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    // Lidar com ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: socketId
        });
      }
    };

    // Lidar com tracks recebidos
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onTrack(event.streams[0]);
      }
    };

    // Lidar com mudança de estado da conexão
    peerConnection.onconnectionstatechange = () => {
      console.log(`Conexão com ${socketId}: ${peerConnection.connectionState}`);

      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'closed') {
        this.removePeerConnection(socketId);
      }
    };

    this.peerConnections.set(socketId, {
      socketId,
      connection: peerConnection
    });

    return peerConnection;
  }

  async createOffer(socketId: string, onTrack: (stream: MediaStream) => void): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(socketId, onTrack);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await peerConnection.setLocalDescription(offer);

      if (this.socket) {
        this.socket.emit('offer', {
          offer,
          to: socketId
        });
      }
    } catch (error) {
      console.error('Erro ao criar offer:', error);
    }
  }

  async handleOffer(
    offer: RTCSessionDescriptionInit,
    fromSocketId: string,
    onTrack: (stream: MediaStream) => void
  ): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(fromSocketId, onTrack);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (this.socket) {
        this.socket.emit('answer', {
          answer,
          to: fromSocketId
        });
      }
    } catch (error) {
      console.error('Erro ao lidar com offer:', error);
    }
  }

  async handleAnswer(
    answer: RTCSessionDescriptionInit,
    fromSocketId: string
  ): Promise<void> {
    try {
      const peer = this.peerConnections.get(fromSocketId);
      if (peer) {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Erro ao lidar com answer:', error);
    }
  }

  async handleIceCandidate(
    candidate: RTCIceCandidateInit,
    fromSocketId: string
  ): Promise<void> {
    try {
      const peer = this.peerConnections.get(fromSocketId);
      if (peer) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Erro ao adicionar ICE candidate:', error);
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async replaceVideoTrack(stream: MediaStream): Promise<void> {
    const videoTrack = stream.getVideoTracks()[0];

    this.peerConnections.forEach(({ connection }) => {
      const sender = connection.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      } as any);

      await this.replaceVideoTrack(screenStream);

      // Detectar quando o usuário parar o compartilhamento
      screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error('Erro ao compartilhar tela:', error);
      throw error;
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.localStream) {
      await this.replaceVideoTrack(this.localStream);
    }
  }

  removePeerConnection(socketId: string): void {
    const peer = this.peerConnections.get(socketId);
    if (peer) {
      peer.connection.close();
      this.peerConnections.delete(socketId);
    }
  }

  closeAllConnections(): void {
    this.peerConnections.forEach(({ connection }) => {
      connection.close();
    });
    this.peerConnections.clear();
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  cleanup(): void {
    this.closeAllConnections();
    this.stopLocalStream();
    this.socket = null;
  }
}

export default new WebRTCService();

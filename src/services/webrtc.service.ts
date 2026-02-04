import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, MediaStream } from 'react-native-webrtc';
import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const SOCKET_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private userId: number | null = null;
  private isInitiator: boolean = false;

  // Callbacks
  public onLocalStream?: (stream: MediaStream) => void;
  public onRemoteStream?: (stream: MediaStream) => void;
  public onDisconnect?: () => void;
  public onError?: (error: any) => void;

  constructor() {}

  async initialize(userId: number, roomId: string, isVideo: boolean = true) {
    try {
      this.userId = userId;
      this.roomId = roomId;

      // Connect to signaling server
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
      });

      // Set up socket event handlers
      this.setupSocketHandlers();

      // Get local media stream
      this.localStream = await this.getLocalStream(isVideo);
      
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      // Join room
      this.socket.emit('join-room', { roomId, userId });

      return true;
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      if (this.onError) this.onError(error);
      return false;
    }
  }

  private async getLocalStream(isVideo: boolean): Promise<MediaStream> {
    const constraints = {
      audio: true,
      video: isVideo ? {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      } : false,
    };

    const stream = await mediaDevices.getUserMedia(constraints);
    return stream;
  }

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('room-created', async () => {
      console.log('Room created - I am the initiator');
      this.isInitiator = true;
    });

    this.socket.on('room-joined', async () => {
      console.log('Room joined - Creating offer');
      this.isInitiator = false;
      await this.createPeerConnection();
      await this.createOffer();
    });

    this.socket.on('offer', async (offer: any) => {
      console.log('Received offer');
      await this.createPeerConnection();
      await this.handleOffer(offer);
    });

    this.socket.on('answer', async (answer: any) => {
      console.log('Received answer');
      await this.handleAnswer(answer);
    });

    this.socket.on('ice-candidate', async (candidate: any) => {
      console.log('Received ICE candidate');
      await this.handleIceCandidate(candidate);
    });

    this.socket.on('user-disconnected', () => {
      console.log('User disconnected');
      if (this.onDisconnect) this.onDisconnect();
      this.cleanup();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (this.onError) this.onError(error);
    });
  }

  private async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    (this.peerConnection as any).onicecandidate = (event: any) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    (this.peerConnection as any).ontrack = (event: any) => {
      console.log('Received remote track');
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream && this.remoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      }
    };

    // Handle connection state changes
    (this.peerConnection as any).onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'failed' || 
          this.peerConnection?.connectionState === 'disconnected') {
        if (this.onDisconnect) this.onDisconnect();
      }
    };
  }

  private async createOffer() {
    if (!this.peerConnection || !this.socket) return;

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('offer', {
        roomId: this.roomId,
        offer: offer,
      });
    } catch (error) {
      console.error('Create offer error:', error);
      if (this.onError) this.onError(error);
    }
  }

  private async handleOffer(offer: RTCSessionDescription) {
    if (!this.peerConnection || !this.socket) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.socket.emit('answer', {
        roomId: this.roomId,
        answer: answer,
      });
    } catch (error) {
      console.error('Handle offer error:', error);
      if (this.onError) this.onError(error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescription) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Handle answer error:', error);
      if (this.onError) this.onError(error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidate) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Add ICE candidate error:', error);
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore
        videoTrack._switchCamera();
      }
    }
  }

  cleanup() {
    console.log('Cleaning up WebRTC resources');

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.socket) {
      this.socket.emit('leave-room', { roomId: this.roomId, userId: this.userId });
      this.socket.disconnect();
      this.socket = null;
    }

    this.remoteStream = null;
    this.roomId = null;
    this.userId = null;
  }

  endCall() {
    this.cleanup();
  }
}

export const webRTCService = new WebRTCService();

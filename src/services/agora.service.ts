import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcConnection,
  RtcStats,
  UserOfflineReasonType,
} from 'react-native-agora';
import { AGORA_CONFIG, generateChannelName, generateUserId } from '../config/agora.config';

export class AgoraService {
  private engine: IRtcEngine | null = null;
  private isInitialized = false;
  private currentChannel: string | null = null;
  private currentUserId: number = 0;

  // Callbacks
  onUserJoined?: (uid: number) => void;
  onUserOffline?: (uid: number, reason: UserOfflineReasonType) => void;
  onJoinChannelSuccess?: (connection: RtcConnection, elapsed: number) => void;
  onLeaveChannel?: (connection: RtcConnection, stats: RtcStats) => void;
  onError?: (err: number, msg: string) => void;

  async initialize(appId: string = AGORA_CONFIG.appId): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('Agora already initialized');
        return true;
      }

      // Create engine instance
      this.engine = createAgoraRtcEngine();
      
      // Initialize engine
      this.engine.initialize({ appId });

      // Register event handlers
      this.engine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('Join channel success:', connection.channelId);
          this.onJoinChannelSuccess?.(connection, elapsed);
        },
        onUserJoined: (connection, remoteUid, elapsed) => {
          console.log('User joined:', remoteUid);
          this.onUserJoined?.(remoteUid);
        },
        onUserOffline: (connection, remoteUid, reason) => {
          console.log('User offline:', remoteUid);
          this.onUserOffline?.(remoteUid, reason);
        },
        onLeaveChannel: (connection, stats) => {
          console.log('Left channel:', connection.channelId);
          this.onLeaveChannel?.(connection, stats);
        },
        onError: (err, msg) => {
          console.error('Agora error:', err, msg);
          this.onError?.(err, msg);
        },
      });

      this.isInitialized = true;
      console.log('Agora initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      return false;
    }
  }

  async joinVideoChannel(groupId: number, userId: number): Promise<boolean> {
    try {
      if (!this.engine || !this.isInitialized) {
        console.error('Agora not initialized');
        return false;
      }

      const channelName = generateChannelName(groupId);
      this.currentChannel = channelName;
      this.currentUserId = generateUserId(userId);

      // Enable video module
      await this.engine.enableVideo();
      
      // Set channel profile to communication
      await this.engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      
      // Set client role to broadcaster
      await this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Start preview
      await this.engine.startPreview();

      // Join channel
      await this.engine.joinChannel(
        AGORA_CONFIG.token || '',
        channelName,
        this.currentUserId,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        }
      );

      console.log(`Joined video channel: ${channelName}`);
      return true;
    } catch (error) {
      console.error('Failed to join video channel:', error);
      return false;
    }
  }

  async joinAudioChannel(groupId: number, userId: number): Promise<boolean> {
    try {
      if (!this.engine || !this.isInitialized) {
        console.error('Agora not initialized');
        return false;
      }

      const channelName = generateChannelName(groupId);
      this.currentChannel = channelName;
      this.currentUserId = generateUserId(userId);

      // Enable audio
      await this.engine.enableAudio();
      
      // Disable video for audio-only call
      await this.engine.disableVideo();
      
      // Set channel profile to communication
      await this.engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      
      // Set client role to broadcaster
      await this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Join channel
      await this.engine.joinChannel(
        AGORA_CONFIG.token || '',
        channelName,
        this.currentUserId,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        }
      );

      console.log(`Joined audio channel: ${channelName}`);
      return true;
    } catch (error) {
      console.error('Failed to join audio channel:', error);
      return false;
    }
  }

  async leaveChannel(): Promise<void> {
    try {
      if (this.engine) {
        await this.engine.leaveChannel();
        await this.engine.stopPreview();
        this.currentChannel = null;
        console.log('Left channel successfully');
      }
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  }

  async toggleLocalAudio(muted: boolean): Promise<void> {
    try {
      if (this.engine) {
        await this.engine.muteLocalAudioStream(muted);
      }
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  }

  async toggleLocalVideo(enabled: boolean): Promise<void> {
    try {
      if (this.engine) {
        await this.engine.muteLocalVideoStream(!enabled);
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  }

  async switchCamera(): Promise<void> {
    try {
      if (this.engine) {
        await this.engine.switchCamera();
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }

  async enableSpeakerphone(enabled: boolean): Promise<void> {
    try {
      if (this.engine) {
        await this.engine.setEnableSpeakerphone(enabled);
      }
    } catch (error) {
      console.error('Failed to enable speakerphone:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      if (this.engine) {
        await this.leaveChannel();
        this.engine.release();
        this.engine = null;
        this.isInitialized = false;
        console.log('Agora engine destroyed');
      }
    } catch (error) {
      console.error('Failed to destroy Agora engine:', error);
    }
  }

  getEngine(): IRtcEngine | null {
    return this.engine;
  }

  isEngineInitialized(): boolean {
    return this.isInitialized;
  }

  getCurrentChannel(): string | null {
    return this.currentChannel;
  }
}

// Singleton instance
export const agoraService = new AgoraService();

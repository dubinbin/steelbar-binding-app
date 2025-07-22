/* eslint-disable no-case-declarations */
import TcpSocket from 'react-native-tcp-socket';

import { ConnectDeviceInfo } from './connectDeviceInfo';
import eventBus from './eventBus';
import {
  ElectricEvent,
  IdEvent,
  ErrorEvent,
  StatusEvent,
  OverageEvent,
  OrbitEvent,
  NodeEvent,
  OrbitChangeEvent,
  NodeChangeEvent,
  ChangeEvent,
  RebootEvent,
  DownEvent,
  WifiEvent,
  GunErrorEvent,
  BackBoardEvent,
  FrontBoardEvent,
  MksEvent,
} from './events';
import { showNotifier } from './notifier';

import { GlobalActivityIndicatorManager } from '@/components/activity-indicator-global';
import { GlobalConst, TyingState } from '@/constants';
import { Command } from '@/constants/command';
import i18n from '@/i18n/i18n';
import useStore from '@/store';

export class SocketManage {
  private static instance: SocketManage;
  private ip: string;
  private port: number;
  private socket!: TcpSocket.Socket | null;

  // 心跳相关属性
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatMessage = `${GlobalConst.forwardCmd}:heartbeat:${Date.now()}\n`;
  private heartbeatIntervalMs = 15000; // 15秒发送一次心跳
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeoutMs = 5000; // 5秒心跳超时
  private heartbeatMissedCount = 0;
  private maxHeartbeatMissed = Number.MAX_SAFE_INTEGER; // 允许连续3次心跳未响应
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3秒后重试

  // 添加一个缓冲区属性
  private dataBuffer: string = '';

  private constructor() {
    this.ip = '';
    this.port = 8080;
  }

  // 获取单例实例的静态方法
  public static getInstance(): SocketManage {
    if (!SocketManage.instance) {
      SocketManage.instance = new SocketManage();
    }
    return SocketManage.instance;
  }

  setWifi(ip: string, port: number) {
    this.ip = ip;
    this.port = port;
  }

  async connectSocket() {
    if (!this.ip || !this.port) {
      console.error('ip or port is not set');
      return;
    }

    try {
      // 创建TCP Socket连接，而不是WebSocket
      const options = {
        host: this.ip,
        port: this.port,
      };

      // 在创建新连接前，确保移除旧的事件监听器
      if (this.socket) {
        this.socket.removeAllListeners('data');
        this.socket.removeAllListeners('error');
        this.socket.removeAllListeners('close');
      }

      const socket = TcpSocket.createConnection(options, () => {
        ConnectDeviceInfo.setWifiIp(this.ip);
        ConnectDeviceInfo.connectStatus = true;
        this.resetReconnectCount();

        // 启动心跳
        this.startHeartbeat();

        // 发送登录成功命令
        this.writeData(`${GlobalConst.forwardCmd}:${Command.loginSuccess}`);

        // 发布WiFi连接成功事件
        eventBus.publish(new WifiEvent(true).eventName, new WifiEvent(true).data);
        GlobalActivityIndicatorManager.current?.show(i18n.t('wifi.connectSuccess'));
      });
      this.socket = socket;

      // 绑定事件监听器
      this.socket?.on('data', (data) => {
        try {
          // 将新数据添加到缓冲区
          this.dataBuffer += data.toString();

          // 处理缓冲区中的完整消息
          this.processBuffer();
        } catch (error) {
          console.error('onData error', error);
        }
      });

      this.socket?.on('error', (error) => {
        console.error('socket error', error);
      });

      this.socket?.on('close', () => {
        console.log('socket closed');
        this.onDone();
      });
    } catch (error) {
      console.error('Unable to connect:', error);
      GlobalActivityIndicatorManager.current?.show(i18n.t('wifi.wificonnectfailed'));
      ConnectDeviceInfo.disConnect();
    }
  }

  onDone() {
    // 停止心跳
    this.stopHeartbeat();

    ConnectDeviceInfo.disConnect();
    eventBus.publish(new WifiEvent(false).eventName, new WifiEvent(false).eventName);
    GlobalActivityIndicatorManager.current?.show(i18n.t('wifi.wifiDisconnected'));
  }

  onData(event: string) {
    try {
      const eventData = event;

      // 处理心跳响应
      if (eventData.includes('heartbeat_response')) {
        this.handleHeartbeatResponse();
        return;
      }

      // 处理业务消息
      const listStr = eventData.split(':');
      const commandPrefix = listStr[0];
      const commandName = listStr[1];

      if (commandPrefix === GlobalConst.forwardUp) {
        // 正确使用 store 写入调试日志
        const { setDebugLog } = useStore.getState();
        setDebugLog({
          time: new Date().toISOString(),
          msg: `收到命令: ${eventData}`,
        });
        switch (commandName) {
          case GlobalConst.id:
            ConnectDeviceInfo.id = listStr?.[2];
            eventBus.publish(new IdEvent(listStr?.[2]).eventName, new IdEvent(listStr?.[2]).data);
            break;
          case GlobalConst.gunErrorEvent:
            eventBus.publish(new GunErrorEvent(1).eventName, new GunErrorEvent(1).data);
            break;
          case GlobalConst.electric:
            const temp = parseFloat(listStr?.[2]);
            ConnectDeviceInfo.electric = temp;
            eventBus.publish(new ElectricEvent(temp).eventName, new ElectricEvent(temp).data);
            break;
          case GlobalConst.status:
            let temp2;
            if (listStr[2] === `2,${GlobalConst.error}`) {
              temp2 = TyingState.error;
              const faultId = parseInt(listStr?.[3], 10);
              eventBus.publish(new ErrorEvent(faultId).eventName, new ErrorEvent(faultId).data);
            } else {
              temp2 = parseInt(listStr[2], 10);
            }
            ConnectDeviceInfo.workStatus = temp2;
            eventBus.publish(new StatusEvent(temp2).eventName, new StatusEvent(temp2).data);
            break;
          case GlobalConst.overage:
            const temp3 = parseFloat(listStr?.[2]);
            eventBus.publish(new OverageEvent(temp3).eventName, new OverageEvent(temp3).data);
            break;
          case GlobalConst.orbitLaser:
            const temp4 = parseFloat(listStr?.[2]);
            eventBus.publish(new OrbitEvent(temp4).eventName, new OrbitEvent(temp4).data);
            break;
          case GlobalConst.nodeLaser:
            const temp5 = parseFloat(listStr?.[2]);
            eventBus.publish(new NodeEvent(temp5).eventName, new NodeEvent(temp5).data);
            break;
          case GlobalConst.orbitChangeLaser:
            const temp6 = parseFloat(listStr?.[2]);
            eventBus.publish(
              new OrbitChangeEvent(temp6).eventName,
              new OrbitChangeEvent(temp6).data
            );
            break;
          case GlobalConst.nodeChangeLaser:
            const temp7 = parseFloat(listStr?.[2]);
            eventBus.publish(new NodeChangeEvent(temp7).eventName, new NodeChangeEvent(temp7).data);
            break;
          case GlobalConst.changeStatus:
            const temp8 = parseInt(listStr?.[2], 10);
            eventBus.publish(new ChangeEvent(temp8).eventName, new ChangeEvent(temp8).data);
            break;
          case GlobalConst.rebootStatus:
            const temp9 = parseInt(listStr?.[2], 10);
            eventBus.publish(new RebootEvent(temp9).eventName, new RebootEvent(temp9).data);
            break;
          case GlobalConst.downStatus:
            const temp10 = parseInt(listStr?.[2], 10);
            eventBus.publish(new DownEvent(temp10).eventName, new DownEvent(temp10).data);
            break;
          case GlobalConst.backBoard:
            const temp11 = String(listStr?.[2]);
            eventBus.publish(
              new BackBoardEvent(temp11).eventName,
              new BackBoardEvent(eventData).data
            );
            break;
          case GlobalConst.frontBoard:
            const temp12 = String(listStr?.[2]);
            eventBus.publish(
              new FrontBoardEvent(temp12).eventName,
              new FrontBoardEvent(eventData).data
            );
            break;
          case GlobalConst.mks:
            const temp13 = String(listStr?.[2]);
            eventBus.publish(new MksEvent(temp13).eventName, new MksEvent(eventData).data);
            break;
          default:
        }
      }
    } catch (error) {
      console.error('onData error', error);
    }
  }

  writeData(fd: string) {
    try {
      if (ConnectDeviceInfo.connectStatus && this.socket) {
        this.socket.write(fd);
      } else {
        showNotifier({
          title: i18n.t('wifi.socketNotConnected'),
          message: i18n.t('wifi.checkNetworkConnection'),
          type: 'error',
          duration: 3000,
          onPress: () => {},
        });
      }
    } catch (error) {
      showNotifier({
        title: `writeData error ${error}`,
        message: i18n.t('wifi.checkNetworkConnection'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  }

  isConnected() {
    if (!this.socket) {
      return false;
    }

    // 如果socket已被销毁，则表示未连接
    if (this.socket.destroyed) {
      return false;
    }

    // 对于react-native-tcp-socket，可以检查这些属性
    // connecting为true表示正在连接
    // 只有当!destroyed && !connecting && !closing时才是真正已连接状态
    return !this.socket.connecting;
  }

  // 启动心跳
  private startHeartbeat() {
    // 清除可能存在的旧心跳
    this.stopHeartbeat();

    // 设置新的心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        try {
          // 发送心跳包
          this.writeData(this.heartbeatMessage);
          console.log('心跳包已发送');

          // 设置心跳超时
          this.setHeartbeatTimeout();
        } catch (error) {
          console.error('发送心跳包失败:', error);
          // 不立即处理连接丢失，而是增加心跳未响应计数
          this.handleHeartbeatMissed();
        }
      }
    }, this.heartbeatIntervalMs);
  }

  // 设置心跳超时
  private setHeartbeatTimeout() {
    // 清除可能存在的旧超时
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    // 设置新的超时
    this.heartbeatTimeout = setTimeout(() => {
      console.log('心跳超时，未收到响应');
      this.handleHeartbeatMissed();
    }, this.heartbeatTimeoutMs);
  }

  // 处理心跳未响应
  private handleHeartbeatMissed() {
    this.heartbeatMissedCount++;
    console.log(`心跳未响应次数: ${this.heartbeatMissedCount}/${this.maxHeartbeatMissed}`);

    // 只有当连续多次心跳未响应时，才考虑重连
    if (this.heartbeatMissedCount >= this.maxHeartbeatMissed) {
      console.log('心跳连续多次未响应，尝试重连');
      this.handleConnectionLost();
    }
  }

  // 处理心跳响应
  private handleHeartbeatResponse() {
    // 重置心跳未响应计数
    this.heartbeatMissedCount = 0;

    // 清除心跳超时
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    // 重置心跳未响应计数
    this.heartbeatMissedCount = 0;
  }

  // 处理连接丢失
  private handleConnectionLost() {
    console.log('检测到连接丢失，尝试重连');
    this.stopHeartbeat();

    // 更新连接状态
    ConnectDeviceInfo.disConnect();

    // 如果重连次数未超过最大尝试次数，则尝试重连
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      // 通知用户正在重连
      showNotifier({
        title: `${i18n.t('wifi.networkDisconnected')} (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        message: '',
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });

      // 延迟重连，避免立即重连可能导致的问题
      setTimeout(() => {
        this.connectSocket();
      }, this.reconnectDelay);
    } else {
      console.error('重连失败，已达到最大尝试次数');
      // 通知用户连接已断开
      showNotifier({
        title: i18n.t('wifi.wifiDisconnected'),
        message: i18n.t('wifi.wifiDisconnected'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });

      // 发布WiFi断开事件
      eventBus.publish(new WifiEvent(false).eventName, new WifiEvent(false).data);
    }
  }

  private resetReconnectCount() {
    this.reconnectAttempts = 0;
  }

  // 断开连接方法
  disconnectSocket() {
    // 停止心跳
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.destroy();
    }
  }

  // 添加处理缓冲区的方法
  private processBuffer() {
    // 假设消息以换行符结束，根据实际情况调整
    const messages = this.dataBuffer.split('\n');

    // 保留最后一个可能不完整的消息
    this.dataBuffer = messages.pop() || '';

    // 处理完整的消息
    for (const message of messages) {
      if (message.trim()) {
        this.onData(message);
      }
    }
  }
}

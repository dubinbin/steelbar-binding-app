import { NetworkInfo } from 'react-native-network-info';
import WifiManager from 'react-native-wifi-reborn';

import { ConnectDeviceInfo } from './connectDeviceInfo';
import eventBus from './eventBus';
import { SocketManage } from './socketManage';

import { GlobalSnackbarManager } from '@/components/snackbar-global';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';

export const delayed = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const globalGetConnect = async () => {
  try {
    const connectedWifiSSID = await WifiManager.getCurrentWifiSSID();
    if (connectedWifiSSID !== '') {
      const getGatewayIp = await NetworkInfo.getGatewayIPAddress();
      if (
        connectedWifiSSID !== '' &&
        getGatewayIp !== null
        //  &&
        // connectedWifiSSID.indexOf(GlobalConst.wifiName) > -1
      ) {
        ConnectDeviceInfo.setWifiIp(getGatewayIp);
        const socket = SocketManage.getInstance();
        const ip = getGatewayIp;
        const port = ConnectDeviceInfo.wifiPort;

        if (ip !== '' && port !== 0) {
          // 设置WiFi IP 和 port
          socket.setWifi(ip, port);
          // 连接socket
          socket.connectSocket();
        } else {
          GlobalSnackbarManager.current?.show({
            content: '缺少WiFi IP 或 port',
          });
        }
      }
    } else {
      GlobalSnackbarManager.current?.show({
        content: '没有连接到WiFi',
      });
    }
  } catch (error) {
    console.error('error', error);
    GlobalSnackbarManager.current?.show({
      content: '获取网络状态失败',
    });
  }
};

export const sendCmdDispatch = (cmd: Command) => {
  eventBus.publish(eventBusKey.SendCmdEvent, cmd);
};

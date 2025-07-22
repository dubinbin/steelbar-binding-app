
import { NetworkInfo } from 'react-native-network-info';
import WifiManager from 'react-native-wifi-reborn';

import { ConnectDeviceInfo } from './connectDeviceInfo';
import eventBus from './eventBus';
import { showNotifier } from './notifier';
import { SocketManage } from './socketManage';

import { GlobalConst } from '@/constants';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import i18n from '@/i18n/i18n';
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
        getGatewayIp !== null &&
        connectedWifiSSID.indexOf(GlobalConst.wifiName) > -1
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
          showNotifier({
            title: i18n.t('wifi.missingIpOrPort'),
            message: '',
            type: 'error',
            duration: 3000,
            onPress: () => {},
          });
        }
      }
    } else {
      showNotifier({
        title: i18n.t('wifi.noWifiConnected'),
        message: '',
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  } catch (error) {
    showNotifier({
      title: i18n.t('wifi.networkStatusFailed'),
      message: '',
      type: 'error',
      duration: 3000,
      onPress: () => {},
    });
  }
};

export const sendCmdDispatch = (cmd: Command) => {
  eventBus.publish(eventBusKey.SendCmdEvent, cmd);
};
export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};
